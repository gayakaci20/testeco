import prisma, { ensureConnected } from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Ensure database connection is established
      await ensureConnected();
      
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

      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const {
        serviceId,
        date,
        time,
        address,
        notes,
        paymentMethod
      } = req.body;

      // Validation
      if (!serviceId || !date || !time || !address) {
        return res.status(400).json({ error: 'Service ID, date, time, and address are required' });
      }

      // Get service details
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          provider: true
        }
      });

      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      // Create booking
      const scheduledAt = new Date(`${date}T${time}`);
      
      const booking = await prisma.booking.create({
        data: {
          serviceId: serviceId,
          customerId: decoded.id,
          providerId: service.providerId,
          scheduledAt: scheduledAt,
          duration: service.duration,
          totalAmount: service.price,
          status: 'PENDING',
          address: address.trim(),
          notes: notes?.trim() || null
        },
        include: {
          service: {
            select: {
              name: true,
              price: true
            }
          },
          provider: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Réservation créée avec succès',
        booking
      });

    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'GET') {
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

      const bookings = await prisma.booking.findMany({
        where: {
          customerId: decoded.id
        },
        include: {
          service: {
            select: {
              name: true,
              category: true
            }
          },
          provider: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: {
          scheduledAt: 'desc'
        }
      });

      res.status(200).json(bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, status } = req.body;

      if (!id || !status) {
        return res.status(400).json({ error: 'ID et statut sont requis' });
      }

      // Vérifier que le statut est valide
      const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Statut invalide' });
      }

      // Mettre à jour la réservation
      const booking = await prisma.booking.update({
        where: { id },
        data: { 
          status,
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
          },
          provider: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Créer une notification pour le client
      let notificationTitle = '';
      let notificationMessage = '';
      
      switch (status) {
        case 'CONFIRMED':
          notificationTitle = 'Réservation confirmée';
          notificationMessage = `Votre réservation pour "${booking.service.name}" a été confirmée par le prestataire. Vous pouvez maintenant échanger avec lui via la messagerie.`;
          break;
        case 'CANCELLED':
          notificationTitle = 'Réservation annulée';
          notificationMessage = `Votre réservation pour "${booking.service.name}" a été annulée.`;
          break;
        case 'IN_PROGRESS':
          notificationTitle = 'Service en cours';
          notificationMessage = `Le service "${booking.service.name}" est maintenant en cours.`;
          break;
        case 'COMPLETED':
          notificationTitle = 'Service terminé';
          notificationMessage = `Le service "${booking.service.name}" a été terminé. Vous pouvez maintenant laisser un avis.`;
          break;
      }

      if (notificationTitle) {
        try {
          await prisma.notification.create({
            data: {
              userId: booking.customerId,
              type: 'BOOKING_UPDATE',
              title: notificationTitle,
              message: notificationMessage,
              relatedEntityId: booking.id
            }
          });

          // Si la réservation est confirmée, créer également une notification pour le prestataire
          if (status === 'CONFIRMED') {
            await prisma.notification.create({
              data: {
                userId: booking.providerId,
                type: 'BOOKING_UPDATE',
                title: 'Réservation confirmée',
                message: `Vous avez confirmé la réservation de ${booking.customer.firstName} ${booking.customer.lastName} pour "${booking.service.name}". Vous pouvez maintenant échanger avec le client via la messagerie.`,
                relatedEntityId: booking.id
              }
            });

            // Créer une notification de paiement pour le client
            await prisma.notification.create({
              data: {
                userId: booking.customerId,
                type: 'PAYMENT_REQUIRED',
                title: 'Paiement requis',
                message: `Votre réservation pour "${booking.service.name}" a été acceptée ! Veuillez procéder au paiement pour confirmer votre réservation.`,
                relatedEntityId: booking.id
              }
            });
          }
        } catch (notificationError) {
          console.error('Erreur lors de la création de la notification:', notificationError);
          // On continue même si la notification échoue
        }
      }

      res.status(200).json({
        success: true,
        message: 'Statut de la réservation mis à jour avec succès',
        booking
      });

    } catch (error) {
      console.error('Error updating booking:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET', 'PUT']);
    res.status(405).json({ error: 'Method not allowed' });
  }
} 