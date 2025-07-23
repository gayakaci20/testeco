import prisma, { ensureConnected } from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure database connection is established
    await ensureConnected();

    const { orderId, type } = req.body;

    if (!orderId || type !== 'merchant_delivery') {
      return res.status(400).json({ error: 'orderId and type=merchant_delivery are required' });
    }

    // Get user from auth token
    let carrierId = null;
    const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = await verifyToken(token);
        carrierId = decoded?.id;
        
        // Verify user is a professional carrier
        const carrier = await prisma.user.findUnique({
          where: { id: carrierId }
        });

        if (!carrier || carrier.role !== 'CARRIER' || carrier.userType !== 'PROFESSIONAL') {
          return res.status(403).json({ error: 'Only professional carriers can propose merchant deliveries' });
        }
      } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    } else {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify the order exists and requires delivery
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.hasDelivery || !order.deliveryAddress) {
      return res.status(400).json({ error: 'This order does not require delivery' });
    }

    if (order.status !== 'CONFIRMED' && order.status !== 'PROCESSING' && order.status !== 'SHIPPED') {
      return res.status(400).json({ error: 'This order is not ready for delivery' });
    }

    // For now, we'll create a notification to the merchant about the delivery interest
    // This could be extended later with a proper delivery proposal system
    
    // Get carrier details for the notification
    const carrier = await prisma.user.findUnique({
      where: { id: carrierId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        companyName: true
      }
    });

    const carrierName = carrier.companyName || `${carrier.firstName} ${carrier.lastName}`;

    // Create notification for merchant about carrier interest  
    const proposalNotification = await prisma.notification.create({
      data: {
        userId: order.merchantId,
        type: 'DELIVERY_ACCEPTED',
        title: 'Proposition de livraison',
        message: `${carrierName} souhaite livrer votre commande #${order.id.substring(0, 8)} (${order.customerName}) à ${order.deliveryAddress}. CarrierID:${carrierId}`,
        relatedEntityId: order.id
      }
    });

    // Also create notification for carrier confirming their interest was sent
    await prisma.notification.create({
      data: {
        userId: carrierId,
        type: 'GENERAL',
        title: 'Intérêt de livraison envoyé',
        message: `Votre intérêt pour livrer la commande #${order.id.substring(0, 8)} a été transmis au marchand`,
        relatedEntityId: order.id
      }
    });

    console.log('📦 Merchant delivery interest sent:', {
      notificationId: proposalNotification.id,
      orderId: orderId,
      carrierId: carrierId,
      proposedPrice: order.deliveryFee || 5.99
    });

    res.status(201).json({
      success: true,
      notification: proposalNotification,
      message: 'Intérêt de livraison transmis au marchand avec succès'
    });

  } catch (error) {
    console.error('❌ Error creating merchant delivery proposal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 