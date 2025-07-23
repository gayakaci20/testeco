import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to verify JWT token
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    return null;
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token d\'authentification requis' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingId, action, rating, review } = body;

    // Validation
    if (!bookingId || !action) {
      return NextResponse.json(
        { error: 'ID de réservation et action requis' },
        { status: 400 }
      );
    }

    const userId = decoded.userId;

    // Verify the booking belongs to the user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: {
          include: {
            provider: true
          }
        },
        customer: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    if (booking.customerId !== userId) {
      return NextResponse.json(
        { error: 'Accès non autorisé à cette réservation' },
        { status: 403 }
      );
    }

    let updatedBooking;

    switch (action) {
      case 'complete':
        // Mark service as completed
        if (booking.status !== 'IN_PROGRESS') {
          return NextResponse.json(
            { error: 'Seuls les services en cours peuvent être marqués comme terminés' },
            { status: 400 }
          );
        }

        updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'COMPLETED',
            updatedAt: new Date()
          },
          include: {
            service: {
              include: {
                provider: true
              }
            }
          }
        });

        // Create notification for provider
        await prisma.notification.create({
          data: {
            userId: booking.service.providerId,
            type: 'BOOKING_CONFIRMED',
            title: 'Service terminé',
            message: `Le service "${booking.service.name}" a été marqué comme terminé par le client.`,
            relatedEntityId: bookingId
          }
        });

        break;

      case 'rate':
        // Add rating and review
        if (!rating || rating < 1 || rating > 5) {
          return NextResponse.json(
            { error: 'Note invalide (1-5)' },
            { status: 400 }
          );
        }

        updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: {
            rating: rating,
            review: review || null,
            updatedAt: new Date()
          },
          include: {
            service: {
              include: {
                provider: true
              }
            }
          }
        });

        // Update service average rating
        const allRatings = await prisma.booking.findMany({
          where: {
            serviceId: booking.serviceId,
            rating: { not: null }
          },
          select: {
            rating: true
          }
        });

        const totalRatings = allRatings.length;
        const averageRating = totalRatings > 0 
          ? allRatings.reduce((sum, b) => sum + (b.rating || 0), 0) / totalRatings 
          : 0;

        await prisma.service.update({
          where: { id: booking.serviceId },
          data: {
            rating: averageRating,
            totalRatings: totalRatings
          }
        });

        break;

      case 'cancel':
        // Cancel booking
        if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
          return NextResponse.json(
            { error: 'Seules les réservations en attente ou confirmées peuvent être annulées' },
            { status: 400 }
          );
        }

        updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date()
          },
          include: {
            service: {
              include: {
                provider: true
              }
            }
          }
        });

        // Create notification for provider
        await prisma.notification.create({
          data: {
            userId: booking.service.providerId,
            type: 'BOOKING_CONFIRMED',
            title: 'Réservation annulée',
            message: `La réservation pour "${booking.service.name}" a été annulée par le client.`,
            relatedEntityId: bookingId
          }
        });

        break;

      default:
        return NextResponse.json(
          { error: 'Action non reconnue' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Action "${action}" effectuée avec succès`,
      data: {
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        rating: updatedBooking.rating,
        review: updatedBooking.review,
        service: {
          id: updatedBooking.service.id,
          name: updatedBooking.service.name,
          category: updatedBooking.service.category,
          provider: {
            id: updatedBooking.service.provider.id,
            firstName: updatedBooking.service.provider.firstName,
            lastName: updatedBooking.service.provider.lastName,
            email: updatedBooking.service.provider.email
          }
        }
      }
    });

  } catch (error) {
    console.error('Service booking error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
} 