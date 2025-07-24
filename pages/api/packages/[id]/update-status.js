import prisma, { ensureConnected } from '../../../../lib/prisma';

export default async function handler(req, res) {
  // Ensure database connection before any queries
  await ensureConnected();

  const { id } = req.query;
  
  console.log('🔄 API /api/packages/[id]/update-status called:', { id, method: req.method, body: req.body });
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication - get user from token
    const { verifyToken } = await import('../../../../lib/auth');
    const token = req.cookies.auth_token || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token' });
    }
    
    const decodedToken = await verifyToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    const userId = decodedToken.id;
    
    // Verify user is a carrier
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'CARRIER') {
      return res.status(403).json({ error: 'Access denied. Carrier role required.' });
    }

    const { status } = req.body;
    
    console.log('📦 Updating package status:', { packageId: id, newStatus: status, carrierId: userId });
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Find the match for this package and verify the carrier is assigned to it
    const match = await prisma.match.findFirst({
      where: {
        package: { id: id },
        ride: {
          userId: userId // Ensure the match belongs to the authenticated carrier
        }
      },
      include: {
        package: true,
        ride: {
          include: {
            user: true
          }
        }
      }
    });
    
    console.log('🔍 Found match for carrier:', match ? `Match ID: ${match.id}, Status: ${match.status}, Carrier: ${match.ride.user.firstName}` : 'No match found for this carrier');

    if (!match) {
      return res.status(404).json({ error: 'Match not found for this package and carrier. You can only update packages assigned to you.' });
    }

    // Verify the match status allows this update
    const allowedStatuses = ['PENDING', 'CONFIRMED', 'ACCEPTED_BY_SENDER', 'ACCEPTED_BY_CARRIER', 'IN_PROGRESS'];
    if (!allowedStatuses.includes(match.status)) {
      return res.status(400).json({ error: `Cannot update package status. Current match status: ${match.status}` });
    }

    // Update the match status based on the requested status
    let matchStatus = match.status;
    if (status === 'ACCEPTED_BY_CARRIER') {
      matchStatus = 'ACCEPTED_BY_CARRIER';
    } else if (status === 'IN_TRANSIT') {
      matchStatus = 'IN_PROGRESS';
    } else if (status === 'DELIVERED') {
      matchStatus = 'COMPLETED';
    }

    // Update the match status
    console.log('🔄 Updating match status from', match.status, 'to', matchStatus);
    await prisma.match.update({
      where: { id: match.id },
      data: { 
        status: matchStatus,
        updatedAt: new Date()
      }
    });

    // Update the package status
    console.log('🔄 Updating package status to', status);
    const updatedPackage = await prisma.package.update({
      where: { id: id },
      data: { 
        status: status,
        updatedAt: new Date()
      }
    });

    // Create notifications based on status
    if (status === 'ACCEPTED_BY_CARRIER') {
      // Notify the customer that carrier has accepted the package
      await prisma.notification.create({
        data: {
          userId: match.package.userId,
          type: 'DELIVERY_ACCEPTED',
          title: 'Colis pris en charge',
          message: `Le transporteur ${match.ride.user.firstName} ${match.ride.user.lastName} a pris en charge votre colis "${match.package.description}".`,
          relatedEntityId: match.id
        }
      });
    } else if (status === 'IN_TRANSIT') {
      // Notify the customer that delivery has started
      await prisma.notification.create({
        data: {
          userId: match.package.userId,
          type: 'DELIVERY_STARTED',
          title: 'Livraison démarrée',
          message: `Le transporteur ${match.ride.user.firstName} ${match.ride.user.lastName} a démarré la livraison de votre colis "${match.package.description}".`,
          relatedEntityId: match.id
        }
      });
    } else if (status === 'DELIVERED') {
      // Notify the customer that delivery is completed
      await prisma.notification.create({
        data: {
          userId: match.package.userId,
          type: 'DELIVERY_COMPLETED',
          title: 'Livraison terminée',
          message: `Votre colis "${match.package.description}" a été livré avec succès. Merci d'avoir utilisé nos services !`,
          relatedEntityId: match.id
        }
      });
    }

    console.log(`✅ Package ${id} status updated to ${status} by carrier ${userId}`);
    res.status(200).json({ 
      success: true, 
      package: updatedPackage,
      match: {
        id: match.id,
        status: matchStatus
      },
      message: `Status updated to ${status}` 
    });

  } catch (error) {
    console.error('Error updating package status:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
} 