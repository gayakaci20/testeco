import Stripe from 'stripe';
import prisma from '../../lib/prisma.js';
import { verifyToken } from '../../lib/auth.js';
import { NotificationType } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentIntentId, orderData } = req.body;

    if (!paymentIntentId || !orderData) {
      return res.status(400).json({ error: 'Missing payment intent ID or order data' });
    }

    // Retrieve the payment intent from Stripe to verify its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Payment not completed', 
        status: paymentIntent.status 
      });
    }

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

    // Create the order in the database
    const order = await prisma.order.create({
      data: {
        customerId: customerId,
        merchantId: orderData.merchantId,
        customerName: orderData.customerInfo.name,
        customerEmail: orderData.customerInfo.email,
        customerPhone: orderData.customerInfo.phone,
        orderType: 'CUSTOMER_ORDER',
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee,
        total: orderData.total,
        status: 'CONFIRMED',
        hasDelivery: orderData.delivery?.wantsDelivery || false,
        deliveryAddress: orderData.delivery?.address || null,
        deliveryTimeSlot: orderData.delivery?.timeSlot || null,
        deliveryInstructions: orderData.delivery?.instructions || null,
        items: {
          create: orderData.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity
          }))
        }
      },
      include: {
        items: true
      }
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: customerId,
        amount: orderData.total,
        currency: 'EUR',
        status: 'COMPLETED',
        paymentMethod: 'CARD',
        paymentIntentId: paymentIntentId,
        completedAt: new Date(),
        metadata: {
          paymentIntentId,
          stripeStatus: paymentIntent.status,
          paymentMethodTypes: paymentIntent.payment_method_types,
        }
      }
    });

    // Update product stock
    for (const item of orderData.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }

    
    // Create notification for customer
    if (customerId) {
      await prisma.notification.create({
        data: {
          userId: customerId,
          type: NotificationType.PAYMENT_UPDATE,
          title: 'Commande confirmée',
          message: `Votre commande #${order.id} a été confirmée et le paiement accepté.`,
          data: {
            orderId: order.id,
            total: orderData.total,
            hasDelivery: orderData.delivery?.wantsDelivery || false
          }
        }
      });
    }

    await prisma.notification.create({
      data: {
        userId: orderData.merchantId,
        type: NotificationType.GENERAL,
        title: 'Nouvelle commande',
        message: `Nouvelle commande #${order.id} de ${orderData.customerInfo.name} (€${orderData.total.toFixed(2)})`,
        data: {
          orderId: order.id,
          customerName: orderData.customerInfo.name,
          total: orderData.total,
          itemCount: orderData.items.length
        }
      }
    });
    
    

    res.status(201).json({
      success: true,
      orderId: order.id,
      order,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      },
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  } finally {
    // Using shared prisma instance, no need to disconnect
    await prisma.$disconnect();
  }
} 