import Stripe from 'stripe';
import prisma, { ensureConnected } from '../../lib/prisma';
import { verifyToken } from '../../lib/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await ensureConnected();
  try {
    const {
      merchantId,
      customerInfo,
      items,
      delivery,
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

    // Create Payment Intent
    const paymentIntentData = {
      amount: Math.round(calculatedTotal * 100), // Convert to cents
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        merchantId: merchantId,
        customerId: customerId || 'guest',
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        orderType: 'CUSTOMER_ORDER',
        itemCount: items.length.toString(),
        hasDelivery: delivery?.wantsDelivery ? 'true' : 'false',
        deliveryAddress: delivery?.address || '',
        deliveryTimeSlot: delivery?.timeSlot || '',
      },
      description: `Commande ${merchant.companyName || merchant.firstName + ' ' + merchant.lastName}`,
      receipt_email: customerInfo.email,
    };

    // Only add shipping if delivery is requested
    if (delivery?.wantsDelivery && delivery.address && customerInfo.name && customerInfo.phone) {
      paymentIntentData.shipping = {
        name: customerInfo.name,
        phone: customerInfo.phone,
        address: {
          line1: delivery.address,
          city: 'Paris', // You might want to parse the address
          country: 'FR',
        },
      };
    }
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    // Store order data temporarily (you might want to use Redis or a temporary table)
    // For now, we'll include it in the payment intent metadata
    const orderData = {
      merchantId,
      customerInfo,
      items: verifiedItems,
      delivery,
      subtotal: calculatedSubtotal,
      deliveryFee: calculatedDeliveryFee,
      total: calculatedTotal,
      paymentIntentId: paymentIntent.id
    };

    // Store order data in a temporary table or cache
    // For simplicity, we'll pass it back to the frontend to send with confirmation
    
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      orderData,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Payment Intent creation error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
    } finally {
      // Using shared prisma instance, no need to disconnect
    }
  } catch (connectionError) {
    console.error('Database connection error:', connectionError);
    res.status(500).json({ error: 'Database connection failed' });
  }
}
