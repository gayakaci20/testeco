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

export async function POST(request: NextRequest) {
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
    const { packageId, matchId, rating, review } = body;

    // Validation
    if (!packageId || !matchId) {
      return NextResponse.json(
        { error: 'ID du colis et du match requis' },
        { status: 400 }
      );
    }

    const userId = decoded.userId;

    // Verify the package belongs to the user
    const package_ = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        user: true,
        matches: {
          where: { id: matchId },
          include: {
            ride: {
              include: {
                user: true
              }
            },
            payment: true
          }
        }
      }
    });

    if (!package_) {
      return NextResponse.json(
        { error: 'Colis non trouvé' },
        { status: 404 }
      );
    }

    if (package_.userId !== userId) {
      return NextResponse.json(
        { error: 'Accès non autorisé à ce colis' },
        { status: 403 }
      );
    }

    const match = package_.matches[0];
    if (!match) {
      return NextResponse.json(
        { error: 'Match non trouvé' },
        { status: 404 }
      );
    }

    // Check if the match is in a state that can be validated
    if (!['CONFIRMED', 'IN_PROGRESS', 'ACCEPTED_BY_CARRIER'].includes(match.status)) {
      return NextResponse.json(
        { error: 'Cette livraison ne peut pas être validée dans son état actuel' },
        { status: 400 }
      );
    }

    // Update match status to COMPLETED
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      },
      include: {
        ride: {
          include: {
            user: true
          }
        },
        payment: true
      }
    });

    // Update package status to DELIVERED
    await prisma.package.update({
      where: { id: packageId },
      data: {
        status: 'DELIVERED'
      }
    });

    // Create or update payment to COMPLETED if it exists
    if (match.payment) {
      await prisma.payment.update({
        where: { id: match.payment.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
    }

    // Create notifications for the carrier
    if (match.ride.user) {
      await prisma.notification.create({
        data: {
          userId: match.ride.user.id,
          type: 'MATCH_UPDATE',
          title: 'Livraison validée',
          message: `La livraison du colis "${package_.description}" a été validée par le client.`,
          relatedEntityId: matchId
        }
      });
    }

    // If rating is provided, create a review (you might want to create a Review model)
    if (rating && (rating >= 1 && rating <= 5)) {
      // For now, we'll store this in the match notes or create a separate review system
      await prisma.match.update({
        where: { id: matchId },
        data: {
          notes: review ? `${match.notes || ''}\n\nÉvaluation client (${rating}/5): ${review}` : match.notes
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Livraison validée avec succès',
      data: {
        matchId: updatedMatch.id,
        status: updatedMatch.status,
        completedAt: updatedMatch.completedAt,
        carrier: {
          id: updatedMatch.ride.user.id,
          firstName: updatedMatch.ride.user.firstName,
          lastName: updatedMatch.ride.user.lastName,
          email: updatedMatch.ride.user.email
        }
      }
    });

  } catch (error) {
    console.error('Validate delivery error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
} 