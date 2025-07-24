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
    const token = req.cookies.auth_token || req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token
    const user = await verifyToken(token);
    
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { rideRequestId, paymentIntentId, confirmPayment, createPaymentIntent } = req.body;

    if (!rideRequestId) {
      return res.status(400).json({ error: 'Ride request ID is required' });
    }

    // Get ride request details
    const rideRequest = await prisma.rideRequest.findUnique({
      where: { id: rideRequestId },
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
          select: {
            id: true,
            origin: true,
            destination: true,
            departureTime: true
          }
        }
      }
    });

    if (!rideRequest) {
      return res.status(404).json({ error: 'Ride request not found' });
    }

    // Verify the user is the passenger
    if (rideRequest.passengerId !== user.id) {
      return res.status(403).json({ error: 'Not authorized to pay for this ride request' });
    }

    // Verify that the request is accepted
    if (rideRequest.status !== 'ACCEPTED') {
      return res.status(400).json({ error: 'This ride request is not accepted yet' });
    }

    // Check if already paid
    const existingPayment = await prisma.payment.findFirst({
      where: {
        rideRequestId: rideRequestId,
        status: 'COMPLETED'
      }
    });

    if (existingPayment) {
      return res.status(400).json({ error: 'This ride is already paid for' });
    }

    const amount = parseFloat(rideRequest.price) || 0;
    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid ride price' });
    }

    // If createPaymentIntent is true, create a new payment intent
    if (createPaymentIntent) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'eur',
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            rideRequestId: rideRequestId,
            passengerId: user.id,
            carrierId: rideRequest.carrierId,
            rideId: rideRequest.rideId
          },
          description: `Course ${rideRequest.ride.origin} → ${rideRequest.ride.destination} - ${rideRequest.requestedSeats} place(s)`
        });

        return res.status(200).json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        });
      } catch (stripeError) {
        console.error('Stripe payment intent creation error:', stripeError);
        return res.status(400).json({ 
          error: 'Failed to create payment intent', 
          details: stripeError.message 
        });
      }
    }

    // If confirmPayment is true, we're confirming an existing payment intent
    if (confirmPayment && paymentIntentId) {
      try {
        // Retrieve the payment intent to check its status
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
          // Create payment record in database
          const payment = await prisma.payment.create({
            data: {
              userId: user.id,
              rideRequestId: rideRequestId,
              amount: amount,
              currency: 'EUR',
              status: 'COMPLETED',
              paymentMethod: 'CARD',
              transactionId: paymentIntent.id,
              paymentIntentId: paymentIntent.id,
              completedAt: new Date(),
              metadata: {
                rideRequestId: rideRequestId,
                passengerId: user.id,
                carrierId: rideRequest.carrierId,
                rideId: rideRequest.rideId
              }
            }
          });

          // Update ride request status to PAID
          await prisma.rideRequest.update({
            where: { id: rideRequestId },
            data: { 
              status: 'PAID'
            }
          });

          // Create notification for the carrier
          await prisma.notification.create({
            data: {
              userId: rideRequest.carrierId,
              type: 'PAYMENT_SUCCESS',
              title: 'Paiement reçu pour votre course !',
              message: `${rideRequest.passenger.firstName} a payé ${amount}€ pour la course ${rideRequest.ride.origin} → ${rideRequest.ride.destination}. Le trajet est confirmé !`,
              data: {
                rideRequestId: rideRequestId,
                paymentId: payment.id,
                amount: amount
              },
              isRead: false,
              relatedEntityId: rideRequestId
            }
          });

          // Create notification for the passenger
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: 'PAYMENT_SUCCESS',
              title: 'Paiement effectué avec succès',
              message: `Votre paiement de ${amount}€ pour la course ${rideRequest.ride.origin} → ${rideRequest.ride.destination} a été effectué. Bon voyage !`,
              data: {
                rideRequestId: rideRequestId,
                paymentId: payment.id,
                amount: amount
              },
              isRead: false,
              relatedEntityId: rideRequestId
            }
          });

          return res.status(200).json({
            success: true,
            payment,
            message: 'Payment completed successfully'
          });
        } else {
          return res.status(400).json({ 
            error: 'Payment not completed', 
            status: paymentIntent.status 
          });
        }
      } catch (stripeError) {
        console.error('Stripe payment confirmation error:', stripeError);
        return res.status(400).json({ 
          error: 'Failed to confirm payment', 
          details: stripeError.message 
        });
      }
    }

    // If neither createPaymentIntent nor confirmPayment, return error
    return res.status(400).json({ 
      error: 'Invalid request. Use createPaymentIntent=true to create payment intent or confirmPayment=true to confirm payment.' 
    });

  } catch (error) {
    console.error('Error in /api/ride-payments:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
