import prisma, { ensureConnected } from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure database connection is established
    await ensureConnected();

    const { proposalId, action, orderId } = req.body;

    if (!proposalId || !action || !orderId) {
      return res.status(400).json({ error: 'proposalId, action, and orderId are required' });
    }

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be either "accept" or "reject"' });
    }

    // Get user from auth token
    const token = req.cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token' });
    }
    
    const decodedToken = await verifyToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    const userId = decodedToken.id;

    // Verify user is a merchant
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'MERCHANT') {
      return res.status(403).json({ error: 'Access forbidden - User is not a merchant' });
    }

    // Verify the proposal notification belongs to this merchant
    const proposal = await prisma.notification.findUnique({
      where: { id: proposalId }
    });

    if (!proposal || proposal.userId !== userId) {
      return res.status(404).json({ error: 'Proposal not found or access denied' });
    }

    // Verify the order belongs to this merchant
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        merchant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            companyName: true,
            address: true
          }
        }
      }
    });

    if (!order || order.merchantId !== userId) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }

    // Extract carrier ID from the proposal message
    const carrierIdMatch = proposal.message.match(/CarrierID:([a-zA-Z0-9]+)/);
    if (!carrierIdMatch) {
      return res.status(400).json({ error: 'Carrier ID not found in proposal' });
    }

    const carrierId = carrierIdMatch[1];

    // Get carrier information
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

    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' });
    }

    const carrierName = carrier.companyName || `${carrier.firstName} ${carrier.lastName}`;

    if (action === 'accept') {
      // Accept the proposal
      console.log(`✅ Merchant ${user.email} accepts delivery proposal for order ${order.id}`);

      // Mark proposal as read
      await prisma.notification.update({
        where: { id: proposalId },
        data: { isRead: true }
      });

      // Update order status to SHIPPED (ready for carrier pickup)
      await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: 'SHIPPED',
          shippedAt: new Date()
        }
      });

      // Create a package for this merchant delivery
      const merchantPackage = await prisma.package.create({
        data: {
          userId: userId, // Merchant is the sender
          description: `[MERCHANT_DELIVERY] Commande #${order.id.substring(0, 8)} - ${order.customerName}`,
          weight: 2.0, // Default weight - could be calculated from items
          dimensions: '30x20x15', // Default dimensions
          senderAddress: order.merchant.address || 'Adresse marchand non définie',
          senderName: user.companyName || `${user.firstName} ${user.lastName}`,
          senderPhone: user.phoneNumber || '',
          recipientAddress: order.deliveryAddress,
          recipientName: order.customerName,
          recipientPhone: order.customerPhone || '',
          status: 'CONFIRMED',
          price: order.deliveryFee || 5.99,
          trackingNumber: `MD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      });

      // Find or create a ride for the carrier
      let carrierRide = await prisma.ride.findFirst({
        where: {
          userId: carrierId,
          status: { in: ['ACTIVE', 'PENDING'] },
          // Add conditions to find a suitable ride if needed
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!carrierRide) {
        // Create a ride for this specific delivery
        carrierRide = await prisma.ride.create({
          data: {
            userId: carrierId,
            origin: order.merchant.address || 'Adresse marchand non définie',
            destination: order.deliveryAddress,
            departureTime: new Date(),
            availableSpace: 1,
            maxWeight: 10,
            pricePerKg: 2.5,
            status: 'ACTIVE',
            vehicleType: 'VAN',
            description: `Livraison marchande pour commande #${order.id.substring(0, 8)}`,
            allowsRelay: true
          }
        });
      }

      // Create a match between package and ride
      const match = await prisma.match.create({
        data: {
          packageId: merchantPackage.id,
          rideId: carrierRide.id,
          status: 'CONFIRMED',
          price: order.deliveryFee || 5.99,
          notes: `Livraison marchande acceptée - Commande #${order.id.substring(0, 8)}`,
          acceptedAt: new Date()
        }
      });

      console.log(`📦 Created merchant delivery package ${merchantPackage.id} and match ${match.id}`);

      // Create notification for carrier
      await prisma.notification.create({
        data: {
          userId: carrierId,
          type: 'DELIVERY_ACCEPTED',
          title: 'Proposition acceptée !',
          message: `Votre proposition de livraison pour la commande #${order.id.substring(0, 8)} a été acceptée par le marchand. Vous pouvez maintenant récupérer la commande.`,
          relatedEntityId: orderId
        }
      });

      // Create notification for customer
      if (order.customerId) {
        await prisma.notification.create({
          data: {
            userId: order.customerId,
            type: 'DELIVERY_STARTED',
            title: 'Votre commande est en cours de livraison',
            message: `Votre commande #${order.id.substring(0, 8)} est maintenant prise en charge par ${carrierName} pour la livraison.`,
            relatedEntityId: orderId
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Proposition acceptée avec succès',
        action: 'accepted',
        orderId: orderId,
        carrierName: carrierName
      });

    } else if (action === 'reject') {
      // Reject the proposal
      console.log(`❌ Merchant ${user.email} rejects delivery proposal for order ${order.id}`);

      // Mark proposal as read
      await prisma.notification.update({
        where: { id: proposalId },
        data: { isRead: true }
      });

      // Create notification for carrier
      await prisma.notification.create({
        data: {
          userId: carrierId,
          type: 'GENERAL',
          title: 'Proposition déclinée',
          message: `Votre proposition de livraison pour la commande #${order.id.substring(0, 8)} a été déclinée par le marchand.`,
          relatedEntityId: orderId
        }
      });

      res.status(200).json({
        success: true,
        message: 'Proposition refusée',
        action: 'rejected',
        orderId: orderId
      });
    }

  } catch (error) {
    console.error('❌ Error handling merchant proposal response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 