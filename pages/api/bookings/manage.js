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

    const { bookingId, action, reason } = req.body;

    // Validation
    if (!bookingId || !action) {
      return res.status(400).json({ error: 'Booking ID and action are required' });
    }

    if (!['ACCEPT', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: 'Action must be ACCEPT or REJECT' });
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
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

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user is the provider of this service
    if (booking.service.providerId !== decoded.id) {
      return res.status(403).json({ error: 'Not authorized to manage this booking' });
    }

    // Check if booking is in pending status
    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Booking is not in pending status' });
    }

    // Update booking status
    const newStatus = action === 'ACCEPT' ? 'CONFIRMED' : 'CANCELLED';
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: newStatus,
        rejectionReason: action === 'REJECT' ? reason : null,
        updatedAt: new Date()
      },
      include: {
        service: {
          select: {
            name: true,
            price: true
          }
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create notification with automatic email for customer
    try {
      const { createNotificationWithEmail } = await import('../../lib/notification-helper.js');
      
      if (action === 'ACCEPT') {
        // Create confirmed notification
        await createNotificationWithEmail({
          userId: booking.customer.id,
          type: 'BOOKING_CONFIRMED',
          title: 'Réservation confirmée',
          message: `Votre réservation pour "${booking.service.name}" a été confirmée`,
          isRead: false,
          data: {
            serviceName: booking.service.name,
            customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
            date: new Date(booking.scheduledAt).toLocaleDateString('fr-FR'),
            time: new Date(booking.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            price: booking.service.price,
            address: booking.address,
            bookingId: booking.id
          }
        });

        // Create payment required notification
        await createNotificationWithEmail({
          userId: booking.customer.id,
          type: 'PAYMENT_REQUIRED',
          title: 'Paiement requis',
          message: `Veuillez procéder au paiement pour "${booking.service.name}"`,
          isRead: false,
          relatedEntityId: booking.id,
          data: {
            serviceName: booking.service.name,
            amount: booking.service.price,
            deadline: 'Dans les 24 heures',
            paymentId: booking.id
          }
        });
      } else {
        // Create rejection notification
        await createNotificationWithEmail({
          userId: booking.customer.id,
          type: 'GENERAL',
          title: 'Réservation refusée',
          message: `Votre réservation pour "${booking.service.name}" a été refusée${reason ? `: ${reason}` : ''}`,
          isRead: false,
          data: {
            serviceName: booking.service.name,
            customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
            reason: reason || 'Aucune raison spécifiée'
          }
        });
      }
    } catch (notificationError) {
      console.error('Error creating notification with email:', notificationError);
      // Continue even if notification fails
    }

    res.status(200).json({
      success: true,
      message: action === 'ACCEPT' ? 'Réservation acceptée avec succès' : 'Réservation refusée',
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Error managing booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 