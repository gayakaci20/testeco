import jwt from 'jsonwebtoken';
import prisma, { ensureConnected } from '../../../../lib/prisma';

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const userId = decoded.userId;

    // Verify user is a carrier
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'CARRIER') {
      return res.status(403).json({ error: 'Access denied. Carrier role required.' });
    }

    const { id: matchId } = req.query;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Find the match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        package: {
          include: {
            sender: true
          }
        },
        ride: {
          include: {
            carrier: true
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Verify carrier owns this match
    if (match.ride.carrierId !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only update your own deliveries.' });
    }

    // Update match status
    const updateData = {
      status: status,
      updatedAt: new Date()
    };

    // Add specific timestamps based on status
    if (status === 'IN_TRANSIT') {
      updateData.startedAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: updateData,
      include: {
        package: {
          include: {
            sender: true
          }
        },
        ride: {
          include: {
            carrier: true
          }
        }
      }
    });

    // Update package status accordingly
    let packageStatus = 'CONFIRMED';
    if (status === 'IN_TRANSIT') {
      packageStatus = 'IN_TRANSIT';
    } else if (status === 'DELIVERED') {
      packageStatus = 'DELIVERED';
    } else if (status === 'CANCELLED') {
      packageStatus = 'PENDING';
    }

    await prisma.package.update({
      where: { id: match.packageId },
      data: {
        status: packageStatus
      }
    });

    // Create appropriate notifications
    let notificationData = {
      userId: match.package.senderId,
      data: {
        matchId: matchId,
        carrierId: userId,
        packageId: match.packageId
      }
    };

    switch (status) {
      case 'IN_TRANSIT':
        notificationData = {
          ...notificationData,
          type: 'DELIVERY_STARTED',
          title: 'Delivery Started',
          message: `Your package is now in transit with ${user.firstName} ${user.lastName}.`
        };
        break;
      case 'DELIVERED':
        notificationData = {
          ...notificationData,
          type: 'DELIVERY_COMPLETED',
          title: 'Package Delivered!',
          message: `Your package has been successfully delivered by ${user.firstName} ${user.lastName}.`
        };
        break;
      case 'CANCELLED':
        notificationData = {
          ...notificationData,
          type: 'DELIVERY_CANCELLED',
          title: 'Delivery Cancelled',
          message: `Your delivery has been cancelled. We'll help you find another carrier.`
        };
        break;
    }

    if (notificationData.type) {
      await prisma.notification.create({
        data: notificationData
      });
    }

    // If delivered, create/update payment
    if (status === 'DELIVERED') {
      await prisma.payment.upsert({
        where: {
          matchId: matchId
        },
        update: {
          status: 'COMPLETED',
          completedAt: new Date()
        },
        create: {
          matchId: matchId,
          amount: match.price,
          currency: 'EUR',
          status: 'COMPLETED',
          paymentMethod: 'PLATFORM',
          completedAt: new Date()
        }
      });
    }

    res.status(200).json({
      success: true,
      match: updatedMatch,
      message: `Delivery status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating delivery status:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
} 