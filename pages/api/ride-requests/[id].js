import prisma, { ensureConnected } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    await ensureConnected();
    
    // Authentification obligatoire
    const token = req.cookies.token || req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'ID de demande de trajet requis' });
    }

    // Récupérer les détails du ride request
    const rideRequest = await prisma.rideRequest.findUnique({
      where: { id: id },
      include: {
        passenger: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        carrier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        ride: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!rideRequest) {
      return res.status(404).json({ error: 'Demande de trajet non trouvée' });
    }

    // Vérifier que l'utilisateur est soit le passager soit le transporteur
    if (rideRequest.passengerId !== user.id && rideRequest.carrierId !== user.id) {
      return res.status(403).json({ error: 'Non autorisé - vous n\'êtes pas impliqué dans cette demande' });
    }

    // Vérifier si déjà payé
    const existingPayment = await prisma.payment.findFirst({
      where: {
        metadata: {
          path: ['rideRequestId'],
          equals: id
        },
        status: 'COMPLETED'
      }
    });

    const response = {
      id: rideRequest.id,
      rideId: rideRequest.rideId,
      passengerId: rideRequest.passengerId,
      carrierId: rideRequest.carrierId,
      pickupLocation: rideRequest.pickupLocation,
      dropoffLocation: rideRequest.dropoffLocation,
      requestedSeats: rideRequest.requestedSeats,
      message: rideRequest.message,
      status: rideRequest.status,
      price: rideRequest.price,
      isPaid: !!existingPayment,
      createdAt: rideRequest.createdAt,
      acceptedAt: rideRequest.acceptedAt,
      rejectedAt: rideRequest.rejectedAt,
      passenger: rideRequest.passenger,
      carrier: rideRequest.carrier,
      ride: {
        id: rideRequest.ride.id,
        origin: rideRequest.ride.origin,
        destination: rideRequest.ride.destination,
        departureTime: rideRequest.ride.departureTime,
        arrivalTime: rideRequest.ride.arrivalTime,
        totalSeats: rideRequest.ride.totalSeats,
        availableSpace: rideRequest.ride.availableSpace,
        pricePerSeat: rideRequest.ride.pricePerSeat,
        description: rideRequest.ride.description,
        user: rideRequest.ride.user
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Erreur dans /api/ride-requests/[id]:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
} 