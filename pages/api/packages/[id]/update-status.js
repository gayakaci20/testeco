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
    const { status } = req.body;
    
    console.log('📦 Updating package status:', { packageId: id, newStatus: status });
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Find the match first to update it
    const match = await prisma.match.findFirst({
      where: {
        package: { id: id }
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
    
    console.log('🔍 Found match:', match ? `Match ID: ${match.id}, Status: ${match.status}` : 'No match found');

    if (!match) {
      return res.status(404).json({ error: 'Match not found for this package' });
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
      data: { status: matchStatus }
    });

    // Update the package status
    console.log('🔄 Updating package status to', status);
    const updatedPackage = await prisma.package.update({
      where: { id: id },
      data: { status: status }
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

    console.log(`✅ Package ${id} status updated to ${status}`);
    res.status(200).json({ 
      success: true, 
      package: updatedPackage,
      message: `Status updated to ${status}` 
    });

  } catch (error) {
    console.error('Error updating package status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 