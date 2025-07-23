import prisma, { ensureConnected } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from cookies
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token
    const decoded = await verifyToken(token);
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { rentalId, action, reason } = req.body;

    // Validation
    if (!rentalId || !action) {
      return res.status(400).json({ error: 'Rental ID and action are required' });
    }

    if (!['ACCEPT', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: 'Action must be ACCEPT or REJECT' });
    }

    // Get rental details
    const rental = await prisma.boxRental.findUnique({
      where: { id: rentalId },
      include: {
        box: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    // Check if user owns this storage box (using code prefix as temporary solution)
    const userIdPrefix = decoded.id.substring(0, 8);
    if (!rental.box.code.startsWith(`BOX-${userIdPrefix}-`)) {
      return res.status(403).json({ error: 'Not authorized to manage this rental' });
    }

    // For now, we'll consider isActive = true as already processed, false as pending
    // Note: We should add a status field to the schema in the future
    if (rental.isActive && action === 'ACCEPT') {
      return res.status(400).json({ error: 'Rental is already active' });
    }

    // Update rental status
    let updateData = {
      updatedAt: new Date()
    };

    if (action === 'ACCEPT') {
      updateData.isActive = true;
      
      // Update storage box status if rental starts today or has started
      const today = new Date();
      const rentalStartDate = new Date(rental.startDate);
      if (rentalStartDate <= today) {
        await prisma.storageBox.update({
          where: { id: rental.boxId },
          data: { isOccupied: true }
        });
      }
    } else {
      // For rejection, we'll delete the rental or mark it as inactive
      updateData.isActive = false;
      // Note: rejectionReason would need to be added to the schema
    }

    const updatedRental = await prisma.boxRental.update({
      where: { id: rentalId },
      data: updateData,
      include: {
        box: {
          select: {
            code: true,
            location: true,
            size: true,
            pricePerDay: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create notification for customer
    try {
      if (action === 'ACCEPT') {
        // Create confirmed notification
        await prisma.notification.create({
          data: {
            userId: rental.user.id,
            type: 'RENTAL_CONFIRMED',
            title: 'Location confirmée',
            message: `Votre location de la boîte ${rental.box.code} a été confirmée`,
            isRead: false
          }
        });

        // Create payment required notification
        await prisma.notification.create({
          data: {
            userId: rental.user.id,
            type: 'PAYMENT_REQUIRED',
            title: 'Paiement requis',
            message: `Veuillez procéder au paiement pour votre location de la boîte ${rental.box.code}`,
            isRead: false,
            relatedEntityId: rental.id
          }
        });
      } else {
        // Create rejection notification
        await prisma.notification.create({
          data: {
            userId: rental.user.id,
            type: 'GENERAL',
            title: 'Location refusée',
            message: `Votre location de la boîte ${rental.box.code} a été refusée${reason ? `: ${reason}` : ''}`,
            isRead: false
          }
        });
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Continue even if notification fails
    }

    res.status(200).json({
      success: true,
      message: action === 'ACCEPT' ? 'Location acceptée avec succès' : 'Location refusée',
      rental: updatedRental
    });

  } catch (error) {
    console.error('Error managing rental:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 