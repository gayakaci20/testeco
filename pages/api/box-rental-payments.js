import prisma, { ensureConnected } from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10'
});

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

    const { rentalId, paymentIntentId, confirmPayment } = req.body;

    if (!rentalId) {
      return res.status(400).json({ error: 'Rental ID is required' });
    }

    // Get rental details
    const rental = await prisma.boxRental.findUnique({
      where: { id: rentalId },
      include: {
        box: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
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

    // Verify the user is the renter
    if (rental.userId !== decoded.id) {
      return res.status(403).json({ error: 'Not authorized to pay for this rental' });
    }

    // Check if already paid
    const existingPayment = await prisma.payment.findFirst({
      where: {
        metadata: {
          path: ['rentalId'],
          equals: rentalId
        },
        status: 'COMPLETED'
      }
    });

    if (existingPayment) {
      return res.status(400).json({ error: 'This rental is already paid for' });
    }

    const amount = rental.totalCost || 0;
    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid rental amount' });
    }

    // If confirmPayment is true, we're confirming an existing payment intent
    if (confirmPayment && paymentIntentId) {
      try {
        // Retrieve the payment intent to check its status
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
          // Create payment record
          const payment = await prisma.payment.create({
            data: {
              userId: decoded.id,
              amount: amount,
              currency: 'EUR',
              status: 'COMPLETED',
              paymentMethod: 'CARD',
              transactionId: paymentIntent.id,
              paymentIntentId: paymentIntent.id,
              completedAt: new Date(),
              metadata: {
                rentalId: rentalId,
                boxId: rental.boxId,
                boxCode: rental.box.code,
                paymentType: 'storage_rental'
              }
            }
          });

          // Activate the rental
          await prisma.boxRental.update({
            where: { id: rentalId },
            data: { 
              isActive: true
            }
          });

          // Update storage box status if rental starts today or has started
          const today = new Date();
          const rentalStartDate = new Date(rental.startDate);
          if (rentalStartDate <= today) {
            await prisma.storageBox.update({
              where: { id: rental.boxId },
              data: { isOccupied: true }
            });
          }

          // Create notification for the owner
          if (rental.box.owner) {
            await prisma.notification.create({
              data: {
                userId: rental.box.owner.id,
                type: 'RENTAL_CONFIRMED',
                title: 'Paiement reçu pour votre boîte',
                message: `${rental.user.firstName} ${rental.user.lastName} a payé pour la location de votre boîte ${rental.box.code}. Location confirmée.`,
                relatedEntityId: rentalId
              }
            });
          }

          // Create notification for the renter
          await prisma.notification.create({
            data: {
              userId: decoded.id,
              type: 'PAYMENT_SUCCESS',
              title: 'Paiement effectué avec succès',
              message: `Votre paiement de ${amount}€ pour la location de la boîte ${rental.box.code} a été effectué. Votre location est confirmée.`,
              relatedEntityId: rentalId
            }
          });

          return res.status(200).json({
            success: true,
            payment: payment,
            rental: {
              id: rental.id,
              isActive: true,
              box: rental.box
            },
            message: 'Payment successful and rental confirmed'
          });
        } else {
          return res.status(400).json({
            success: false,
            error: 'Payment not completed',
            paymentStatus: paymentIntent.status
          });
        }
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        return res.status(400).json({ 
          error: 'Payment confirmation failed', 
          details: stripeError.message 
        });
      }
    } else {
      // Create a payment intent for the rental
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'eur',
          description: `Location boîte ${rental.box.code} - ${rental.box.location}`,
          metadata: {
            rentalId: rentalId,
            userId: decoded.id,
            boxId: rental.boxId,
            ownerId: rental.box.ownerId
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        return res.status(200).json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: amount,
          rental: {
            id: rental.id,
            box: rental.box
          }
        });
      } catch (stripeError) {
        console.error('Stripe payment intent creation error:', stripeError);
        return res.status(400).json({ 
          error: 'Failed to create payment intent', 
          details: stripeError.message 
        });
      }
    }

  } catch (error) {
    console.error('Error processing box rental payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 