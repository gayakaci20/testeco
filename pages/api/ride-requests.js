import prisma, { ensureConnected } from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';
import { calculateFullRidePrice } from '../../lib/priceCalculator';

export default async function handler(req, res) {
  try {
    await ensureConnected();
    
    // Vérifier l'authentification avec le système JWT existant
    const token = req.cookies.token || req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Token invalide' });
    }
    if (req.method === 'POST') {
      const { 
        rideId, 
        passengerId, 
        pickupLocation, 
        dropoffLocation, 
        requestedSeats, 
        message 
      } = req.body;

      // Vérifier que le trajet existe et est disponible
      const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        include: { user: true }
      });

      if (!ride) {
        return res.status(404).json({ error: 'Trajet non trouvé' });
      }
      if (ride.status !== 'PENDING' && ride.status !== 'CONFIRMED') {
        return res.status(400).json({ error: 'Ce trajet n\'est plus disponible' });
      }
      if (ride.availableSpace < requestedSeats) {
        return res.status(400).json({ error: 'Pas assez de places disponibles' });
      }
      // Vérifier qu'il n'y a pas déjà une demande en cours
      const existingRequest = await prisma.rideRequest.findFirst({
        where: {
          rideId: rideId,
          passengerId: passengerId,
          status: {
            in: ['PENDING', 'ACCEPTED']
          }
        }
      });

      if (existingRequest) {
        return res.status(400).json({ error: 'Vous avez déjà une demande en cours pour ce trajet' });
      }
      // Calculer le prix total de la course pour ce passager
      let totalPrice = 0;
      try {
        const priceCalculation = await calculateFullRidePrice({
          origin: ride.origin,
          destination: ride.destination,
          vehicleType: ride.vehicleType || 'Berline'
        });
        
        // Le prix par passager est le prix total divisé par le nombre de places disponibles
        // puis multiplié par le nombre de sièges demandés
        const pricePerSeat = priceCalculation.price / parseInt(ride.availableSpace);
        totalPrice = pricePerSeat * parseInt(requestedSeats);
        
        console.log('💰 Price calculation:', {
          totalRidePrice: priceCalculation.price,
          availableSeats: ride.availableSpace,
          requestedSeats: requestedSeats,
          pricePerSeat: pricePerSeat,
          totalPriceForPassenger: totalPrice
        });
      } catch (error) {
        console.error('Error calculating ride price:', error);
        // Fallback: utiliser un prix minimum
        totalPrice = 10.00 * parseInt(requestedSeats);
      }
      // Créer la demande de course
      const rideRequest = await prisma.rideRequest.create({
        data: {
          rideId: rideId,
          passengerId: passengerId,
          carrierId: ride.userId,
          pickupLocation,
          dropoffLocation,
          requestedSeats: parseInt(requestedSeats),
          message,
          status: 'PENDING',
          price: Math.round(totalPrice * 100) / 100 // Prix total pour ce passager
        },
        include: {
          passenger: true,
          carrier: true,
          ride: true
        }
      });

      // Créer une notification avec email pour le transporteur
      const { createNotificationWithEmail } = await import('../../lib/notification-helper.js');
      
      await createNotificationWithEmail({
        userId: ride.userId,
        type: 'RIDE_REQUEST',
        title: 'Nouvelle demande de course',
        message: `${rideRequest.passenger.firstName} ${rideRequest.passenger.lastName} souhaite réserver une place sur votre trajet ${ride.origin} → ${ride.destination}`,
        data: {
          rideRequestId: rideRequest.id,
          rideId: ride.id,
          passengerId: passengerId,
          passengerName: `${rideRequest.passenger.firstName} ${rideRequest.passenger.lastName}`,
          route: `${ride.origin} → ${ride.destination}`,
          date: ride.departureTime ? new Date(ride.departureTime).toLocaleDateString('fr-FR') : 'À définir',
          message: rideRequest.message || 'Aucun message spécifique'
        },
        isRead: false
      });

      return res.status(201).json({ 
        success: true, 
        rideRequest,
        message: 'Demande de course envoyée avec succès' 
      });
    }
    if (req.method === 'GET') {
      const userId = user.id;
      
      // Récupérer les demandes selon le rôle
      const rideRequests = await prisma.rideRequest.findMany({
        where: {
          OR: [
            { carrierId: userId }, // Demandes reçues (si transporteur)
            { passengerId: userId } // Demandes envoyées (si passager)
          ]
        },
        include: {
          passenger: true,
          carrier: true,
          ride: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.status(200).json({ rideRequests });
    }
    if (req.method === 'PUT') {
      const { rideRequestId, action } = req.body; // action: 'ACCEPT' ou 'REJECT'
      
      const rideRequest = await prisma.rideRequest.findUnique({
        where: { id: rideRequestId },
        include: {
          passenger: true,
          carrier: true,
          ride: true
        }
      });

      if (!rideRequest) {
        return res.status(404).json({ error: 'Demande non trouvée' });
      }
      // Vérifier les permissions selon l'action
      if (action === 'CANCEL') {
        // Seul le passager peut annuler sa propre demande
        if (rideRequest.passengerId !== user.id) {
          return res.status(403).json({ error: 'Non autorisé - vous ne pouvez annuler que vos propres demandes' });
        }
        // On ne peut annuler que les demandes en attente
        if (rideRequest.status !== 'PENDING') {
          return res.status(400).json({ error: 'Vous ne pouvez annuler que les demandes en attente' });
        }
      } else {
        // Seul le transporteur peut accepter/refuser
        if (rideRequest.carrierId !== user.id) {
          return res.status(403).json({ error: 'Non autorisé' });
        }
      }
      if (action === 'ACCEPT') {
        // Vérifier qu'il y a encore des places disponibles
        const ride = await prisma.ride.findUnique({
          where: { id: rideRequest.rideId }
        });

        const availableSpaces = parseInt(ride.availableSpace);
        if (availableSpaces < rideRequest.requestedSeats) {
          return res.status(400).json({ error: 'Plus assez de places disponibles' });
        }
        // Accepter la demande
        const updatedRequest = await prisma.rideRequest.update({
          where: { id: rideRequestId },
          data: { 
            status: 'ACCEPTED',
            acceptedAt: new Date()
          },
          include: {
            passenger: true,
            carrier: true,
            ride: true
          }
        });

        // Mettre à jour les places disponibles du trajet
        const newSpaces = Math.max(0, availableSpaces - rideRequest.requestedSeats);
        
        await prisma.ride.update({
          where: { id: rideRequest.rideId },
          data: {
            availableSpace: newSpaces.toString(),
            status: 'CONFIRMED'
          }
        });

        // Créer une notification pour le passager
        await prisma.notification.create({
          data: {
            userId: rideRequest.passengerId,
            type: 'RIDE_ACCEPTED',
            title: 'Course acceptée !',
            message: `${rideRequest.carrier.firstName} a accepté votre demande de course. Vous pouvez maintenant communiquer avec lui.`,
            data: {
              rideRequestId: rideRequest.id,
              rideId: rideRequest.rideId,
              carrierId: rideRequest.carrierId
            },
            isRead: false
          }
        });

        // Créer une notification de paiement requis pour le passager
        await prisma.notification.create({
          data: {
            userId: rideRequest.passengerId,
            type: 'PAYMENT_REQUIRED',
            title: 'Paiement requis pour votre course',
            message: `Votre course ${rideRequest.ride.origin} → ${rideRequest.ride.destination} a été acceptée ! Veuillez procéder au paiement de ${rideRequest.price}€ pour confirmer votre réservation.`,
            data: {
              rideRequestId: rideRequest.id,
              rideId: rideRequest.rideId,
              carrierId: rideRequest.carrierId,
              amount: rideRequest.price,
              redirectUrl: `/payments/process?rideRequestId=${rideRequest.id}`
            },
            isRead: false,
            relatedEntityId: rideRequest.id
          }
        });

        // Créer automatiquement une conversation entre passager et transporteur
        const existingConversation = await prisma.conversation.findFirst({
          where: {
            OR: [
              {
                user1Id: rideRequest.passengerId,
                user2Id: rideRequest.carrierId
              },
              {
                user1Id: rideRequest.carrierId,
                user2Id: rideRequest.passengerId
              }
            ]
          }
        });

        if (!existingConversation) {
          await prisma.conversation.create({
            data: {
              user1Id: rideRequest.passengerId,
              user2Id: rideRequest.carrierId
            }
          });

          // Message automatique d'introduction
          await prisma.message.create({
            data: {
              senderId: rideRequest.carrierId,
              receiverId: rideRequest.passengerId,
              content: `Bonjour ! J'ai accepté votre demande de course pour le trajet ${rideRequest.ride.origin} → ${rideRequest.ride.destination}. N'hésitez pas à me contacter si vous avez des questions.`
            }
          });
        }
        return res.status(200).json({ 
          success: true, 
          rideRequest: updatedRequest,
          message: 'Demande acceptée avec succès' 
        });

      } else if (action === 'REJECT') {
        // Refuser la demande
        const updatedRequest = await prisma.rideRequest.update({
          where: { id: rideRequestId },
          data: { 
            status: 'REJECTED',
            rejectedAt: new Date()
          },
          include: {
            passenger: true,
            carrier: true,
            ride: true
          }
        });

        // Créer une notification pour le passager
        await prisma.notification.create({
          data: {
            userId: rideRequest.passengerId,
            type: 'RIDE_REJECTED',
            title: 'Course refusée',
            message: `${rideRequest.carrier.firstName} a décliné votre demande de course.`,
            data: {
              rideRequestId: rideRequest.id,
              rideId: rideRequest.rideId
            },
            isRead: false
          }
        });

        return res.status(200).json({ 
          success: true, 
          rideRequest: updatedRequest,
          message: 'Demande refusée' 
        });

      } else if (action === 'CANCEL') {
        // Annuler la demande (par le passager)
        const updatedRequest = await prisma.rideRequest.update({
          where: { id: rideRequestId },
          data: { 
            status: 'CANCELLED'
          },
          include: {
            passenger: true,
            carrier: true,
            ride: true
          }
        });

        // Créer une notification pour le transporteur
        await prisma.notification.create({
          data: {
            userId: rideRequest.carrierId,
            type: 'RIDE_REQUEST',
            title: 'Demande de course annulée',
            message: `${rideRequest.passenger.firstName} a annulé sa demande de course pour le trajet ${rideRequest.ride.origin} → ${rideRequest.ride.destination}.`,
            data: {
              rideRequestId: rideRequest.id,
              rideId: rideRequest.rideId
            },
            isRead: false
          }
        });

        return res.status(200).json({ 
          success: true, 
          rideRequest: updatedRequest,
          message: 'Demande annulée avec succès' 
        });
      }
    }
    return res.status(405).json({ error: 'Méthode non autorisée' });

  } catch (error) {
    console.error('Erreur dans /api/ride-requests:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    await prisma.$disconnect();
  }
}
