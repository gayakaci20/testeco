import prisma, { ensureConnected } from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method } = req;

    switch (method) {
      case 'POST':
        return await handleCreateOrder(req, res);
      case 'GET':
        return await handleGetOrders(req, res);
      case 'PUT':
        return await handleUpdateOrder(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Customer Orders API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCreateOrder(req, res) {
  try {
    // Ensure database connection is established
    await ensureConnected();
    
    const {
      merchantId,
      customerInfo,
      items,
      delivery,
      paymentData,
      subtotal,
      deliveryFee,
      total
    } = req.body;

    // Extract user ID from token if available
    let customerId = null;
    const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = await verifyToken(token);
        customerId = decoded?.id;
      } catch (err) {
        // Token invalid or expired, continue as guest
      }
    }

    if (!merchantId || !customerInfo || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify merchant exists
    const merchant = await prisma.user.findFirst({
      where: { id: merchantId, role: 'MERCHANT' }
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    // Verify products exist and calculate total
    let calculatedSubtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { 
          id: item.productId, 
          merchantId: merchantId,
          isActive: true 
        }
      });

      if (!product) {
        return res.status(400).json({ error: `Product ${item.productName} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      const itemTotal = product.price * item.quantity;
      calculatedSubtotal += itemTotal;

      verifiedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal
      });
    }

    const calculatedDeliveryFee = delivery?.wantsDelivery ? (deliveryFee || 5.99) : 0;
    const calculatedTotal = calculatedSubtotal + calculatedDeliveryFee;

    // Payment processing
    let paymentStatus = 'PENDING';
    let transactionId = null;
    let stripePaymentIntentId = null;

    if (paymentData && paymentData.paymentMethod === 'CARD') {
      try {
        const { cardNumber, expiryDate, cvv, cardholderName, billingAddress } = paymentData;

        if (!cardNumber || !expiryDate || !cvv) {
          return res.status(400).json({ error: 'Card information incomplete' });
        }

        // Create Stripe token
        const [exp_month, exp_year] = expiryDate.split('/');
        const token = await stripe.tokens.create({
          card: {
            number: cardNumber.replace(/\s/g, ''),
            exp_month: parseInt(exp_month),
            exp_year: parseInt(`20${exp_year}`),
            cvc: cvv,
            name: cardholderName,
            address_line1: billingAddress?.street,
            address_city: billingAddress?.city,
            address_zip: billingAddress?.postalCode,
            address_country: billingAddress?.country || 'FR',
          },
        });

        // Create payment
        const charge = await stripe.charges.create({
          amount: Math.round(calculatedTotal * 100), // Convert to cents
          currency: 'eur',
          source: token.id,
          description: `Commande ${merchant.companyName || merchant.firstName + ' ' + merchant.lastName}`,
          metadata: {
            merchantId: merchantId,
            customerId: customerId || 'guest',
            customerEmail: customerInfo.email,
            orderType: 'CUSTOMER_ORDER'
          },
        });

        paymentStatus = charge.status === 'succeeded' ? 'COMPLETED' : 'FAILED';
        transactionId = charge.id;
        stripePaymentIntentId = charge.payment_intent;

      } catch (stripeError) {
        console.error('Stripe payment error:', stripeError);
        return res.status(400).json({ 
          error: 'Payment failed', 
          details: stripeError.message 
        });
      }
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        customerId: customerId,
        merchantId: merchantId,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        orderType: 'CUSTOMER_ORDER',
        subtotal: calculatedSubtotal,
        deliveryFee: calculatedDeliveryFee,
        total: calculatedTotal,
        status: paymentStatus === 'COMPLETED' ? 'CONFIRMED' : 'PENDING',
        hasDelivery: delivery?.wantsDelivery || false,
        deliveryAddress: delivery?.address || null,
        deliveryTimeSlot: delivery?.timeSlot || null,
        deliveryInstructions: delivery?.instructions || null,
        items: {
          create: verifiedItems
        }
      },
      include: {
        items: true
      }
    });

    // Create payment record
    if (paymentStatus !== 'PENDING') {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          userId: customerId,
          amount: calculatedTotal,
          currency: 'EUR',
          status: paymentStatus,
          paymentMethod: paymentData?.paymentMethod || 'CARD',
          transactionId: transactionId,
          paymentIntentId: stripePaymentIntentId,
          completedAt: paymentStatus === 'COMPLETED' ? new Date() : null,
          metadata: {
            orderType: 'CUSTOMER_ORDER',
            merchantId: merchantId
          }
        }
      });
    }

    // Update product stock
    if (paymentStatus === 'COMPLETED') {
      for (const item of verifiedItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // Create notification for merchant
      await prisma.notification.create({
        data: {
          userId: merchantId,
          type: 'PACKAGE_UPDATE',
          title: 'Nouvelle commande reçue',
          message: `Nouvelle commande de ${customerInfo.name} pour ${calculatedTotal}€${delivery?.wantsDelivery ? ' avec livraison' : ''}`,
          relatedEntityId: order.id
        }
      });

      // Create notification for customer if logged in
      if (customerId) {
        await prisma.notification.create({
          data: {
            userId: customerId,
            type: 'PAYMENT_UPDATE',
            title: 'Commande confirmée',
            message: `Votre commande #${order.id} a été confirmée et sera préparée par ${merchant.companyName || merchant.firstName + ' ' + merchant.lastName}`,
            relatedEntityId: order.id
          }
        });
      }
    }

    res.status(201).json({
      success: true,
      order: order,
      paymentStatus: paymentStatus,
      message: paymentStatus === 'COMPLETED' 
        ? 'Commande créée et payée avec succès' 
        : 'Commande créée en attente de paiement'
    });

  } catch (error) {
    console.error('Error creating customer order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

async function handleGetOrders(req, res) {
  try {
    const { merchantId, customerId, status } = req.query;
    
    // Ensure database connection is established
    await ensureConnected();
    
    let where = {};
    
    if (merchantId) {
      where.merchantId = merchantId;
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        merchant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            address: true
          }
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json(orders);

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

async function handleUpdateOrder(req, res) {
  try {
    // Ensure database connection is established
    await ensureConnected();
    
    const { orderId, status, deliveryConfirmation } = req.body;
    
    if (!orderId || !status) {
      return res.status(400).json({ error: 'Order ID and status are required' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: true,
        customer: true,
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updateData = { status };
    
    // Add timestamps based on status
    if (status === 'CONFIRMED' && !order.confirmedAt) {
      updateData.confirmedAt = new Date();
    } else if (status === 'SHIPPED' && !order.shippedAt) {
      updateData.shippedAt = new Date();
    } else if (status === 'DELIVERED' && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: true,
        merchant: true,
        customer: true
      }
    });

    // Create appropriate notifications
    let notificationTitle = '';
    let notificationMessage = '';
    let notificationType = 'PACKAGE_UPDATE';

    switch (status) {
      case 'CONFIRMED':
        notificationTitle = 'Commande confirmée';
        notificationMessage = 'Votre commande a été confirmée et est en préparation';
        break;
      case 'SHIPPED':
        notificationTitle = 'Commande expédiée';
        notificationMessage = 'Votre commande a été expédiée';
        break;
      case 'DELIVERED':
        notificationTitle = 'Commande livrée';
        notificationMessage = 'Votre commande a été livrée avec succès';
        notificationType = 'DELIVERY_COMPLETED';
        break;
      case 'CANCELLED':
        notificationTitle = 'Commande annulée';
        notificationMessage = 'Votre commande a été annulée';
        break;
    }

    // Send notification to customer
    if (order.customerId && notificationTitle) {
      await prisma.notification.create({
        data: {
          userId: order.customerId,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          relatedEntityId: orderId
        }
      });
    }

    res.status(200).json({
      success: true,
      order: updatedOrder,
      message: `Order status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
} 