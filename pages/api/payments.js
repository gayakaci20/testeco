import prisma, { ensureConnected } from '../../lib/prisma';
import Stripe from 'stripe';

// Initialise Stripe avec la clé secrète (assurez-vous dʼavoir STRIPE_SECRET_KEY dans votre env)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

    const { method } = req;
  
  try {
    // Ensure database connection is established
    await ensureConnected();
    
    switch (method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      case 'PUT':
        return handlePut(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Payments API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req, res) {
  try {
    const { status, admin } = req.query;
    const userId = req.headers['x-user-id'];

    let where = {};
    if (!admin) {
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      where = {
        OR: [
          {
            match: {
              package: { userId }
            }
          },
          {
            match: {
              ride: { userId }
            }
          }
        ]
      };
    }

    if (status && status !== 'all') {
      where = { ...where, status };
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        match: {
          include: {
            package: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, email: true }
                }
              }
            },
            ride: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, email: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add description field based on match data
    const paymentsWithDescription = payments.map(payment => ({
      ...payment,
      description: payment.match ? 
        `Transport ${payment.match.package?.title || 'Colis'} - ${payment.match.ride?.startLocation || ''} → ${payment.match.ride?.endLocation || ''}` 
        : 'Paiement'
    }));

    return res.status(200).json(paymentsWithDescription);
  } catch (error) {
    console.error('Error fetching payments:', error);
    console.error('Full error details:', error.message, error.stack);
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
}

async function handlePost(req, res) {
  try {
    const { matchId, amount, currency = 'EUR', paymentMethod, paymentData = {} } = req.body;
    const userId = req.headers['x-user-id']; // Placeholder - implement proper auth
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!matchId || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'matchId, amount, and paymentMethod are required' });
    }

    // Verify the match exists and user is involved
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { package: { userId: userId } },
          { ride: { userId: userId } }
        ]
      },
      include: {
        package: { include: { user: true } },
        ride: { include: { user: true } }
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found or unauthorized' });
    }

    let stripeCharge = null;
    let paymentStatus = 'PENDING';
    let transactionId = undefined;

    // === Intégration Stripe ===
    if (paymentMethod === 'CARD') {
      try {
        const { cardNumber, expiryDate, cvv, cardholderName, billingAddress } = paymentData;

        if (!cardNumber || !expiryDate || !cvv) {
          return res.status(400).json({ error: 'Invalid card data' });
        }

        const [exp_monthStr, exp_yearStr] = expiryDate.split('/');
        const exp_month = parseInt(exp_monthStr);
        // Gestion année sur 2 chiffres – on préfixe 20 (ex: 24 => 2024)
        const exp_year = parseInt(`20${exp_yearStr}`);

        // Créer un token Stripe à partir des infos carte
        const token = await stripe.tokens.create({
          card: {
            number: cardNumber.replace(/\s/g, ''),
            exp_month,
            exp_year,
            cvc: cvv,
            name: cardholderName,
            address_line1: billingAddress?.street,
            address_city: billingAddress?.city,
            address_zip: billingAddress?.postalCode,
            address_country: billingAddress?.country,
          },
        });

        // Créer le débit/charge Stripe
        stripeCharge = await stripe.charges.create({
          amount: Math.round(parseFloat(amount) * 100), // montant en centimes
          currency,
          source: token.id,
          description: `Ecodeli payment for match ${matchId}`,
          metadata: {
            matchId,
            userId,
          },
        });

        paymentStatus = stripeCharge.status === 'succeeded' ? 'COMPLETED' : 'FAILED';
        transactionId = stripeCharge.id;
      } catch (stripeError) {
        console.error('Stripe payment error:', stripeError);
        paymentStatus = 'FAILED';
      }
    }

    // Créer l'entrée Payment dans la base
    const payment = await prisma.payment.create({
      data: {
        userId: userId,
        matchId: matchId,
        amount: parseFloat(amount),
        currency: currency,
        status: paymentStatus,
        paymentMethod: paymentMethod,
        transactionId: transactionId || `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      },
      include: {
        match: {
          include: {
            package: {
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
        }
      }
    });

    // Create notifications with automatic emails for both parties
    try {
      const { createMultipleNotificationsWithEmail } = await import('../../lib/notification-helper.js');
      
      const packageOwnerId = match.package.userId;
      const rideOwnerId = match.ride.userId;
      
      const notificationsData = [
        {
          userId: packageOwnerId,
          type: 'PAYMENT_SUCCESS',
          title: 'Paiement initié',
          message: `Paiement de €${amount} initié pour votre colis`,
          isRead: false,
          relatedEntityId: payment.id,
          data: {
            amount: amount,
            transactionId: payment.transactionId,
            description: `Transport de colis - ${match.package.description}`,
            packageDescription: match.package.description
          }
        },
        {
          userId: rideOwnerId,
          type: 'PAYMENT_SUCCESS',
          title: 'Paiement initié',
          message: `Paiement de €${amount} initié pour votre trajet`,
          isRead: false,
          relatedEntityId: payment.id,
          data: {
            amount: amount,
            transactionId: payment.transactionId,
            description: `Paiement transport - trajet`,
            route: `${match.ride.origin || 'Départ'} → ${match.ride.destination || 'Arrivée'}`
          }
        }
      ];
      
      await createMultipleNotificationsWithEmail(notificationsData);
    } catch (notificationError) {
      console.error('Error creating payment notifications with email:', notificationError);
    }

    return res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({ error: 'Failed to create payment' });
  }
}

async function handlePut(req, res) {
  try {
    console.log('PUT /api/payments - Request body:', req.body);
    console.log('PUT /api/payments - Headers:', req.headers);
    
    const { id, status, refundAmount, refundReason, userId: bodyUserId } = req.body;
    const userIdHeader = req.headers['x-user-id'];
    const isAdmin = userIdHeader === 'admin' || req.query.admin === 'true';

    console.log('PUT /api/payments - Parsed data:', {
      id,
      status,
      refundAmount,
      refundReason,
      bodyUserId,
      userIdHeader,
      isAdmin
    });

    if (!id || !status) {
      console.error('PUT /api/payments - Missing required fields');
      return res.status(400).json({ error: 'id and status are required' });
    }

    // For admin requests, skip user verification
    if (!isAdmin && !userIdHeader) {
      console.error('PUT /api/payments - Unauthorized: no user ID provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the existing payment first
    const existingPayment = await prisma.payment.findUnique({ 
      where: { id },
      include: {
        match: {
          include: {
            package: { include: { user: true } },
            ride: { include: { user: true } }
          }
        }
      }
    });

    if (!existingPayment) {
      console.error('PUT /api/payments - Payment not found:', id);
      return res.status(404).json({ error: 'Payment not found' });
    }

    console.log('PUT /api/payments - Found payment:', {
      id: existingPayment.id,
      status: existingPayment.status,
      amount: existingPayment.amount,
      userId: existingPayment.userId
    });

    // Verify the payment belongs to the user unless admin
    if (!isAdmin) {
      const packageUserId = existingPayment.match?.package?.userId;
      const rideUserId = existingPayment.match?.ride?.userId;
      
      if (existingPayment.userId !== userIdHeader && 
          packageUserId !== userIdHeader && 
          rideUserId !== userIdHeader) {
        console.error('PUT /api/payments - Unauthorized access to payment');
        return res.status(404).json({ error: 'Payment not found or unauthorized' });
      }
    }

    // Handle Stripe refund if needed
    if (status === 'REFUNDED') {
      console.log('PUT /api/payments - Processing refund for payment:', id);
      
      // Check if payment is already refunded
      if (existingPayment.status === 'REFUNDED') {
        console.log('PUT /api/payments - Payment already refunded, skipping Stripe refund');
      } else if (existingPayment.paymentMethod === 'CARD' && 
                 existingPayment.transactionId && 
                 !existingPayment.refundAmount) {
        
        console.log('PUT /api/payments - Creating Stripe refund for transaction:', existingPayment.transactionId);
        
        try {
          const stripeRefund = await stripe.refunds.create({
            charge: existingPayment.transactionId,
            amount: refundAmount ? Math.round(refundAmount * 100) : undefined,
          });
          
          console.log('PUT /api/payments - Stripe refund successful:', stripeRefund.id);
        } catch (stripeRefundError) {
          console.error('PUT /api/payments - Stripe refund error:', stripeRefundError);
          
          // If it's already refunded in Stripe, we can continue with DB update
          if (stripeRefundError.code === 'charge_already_refunded') {
            console.log('PUT /api/payments - Charge already refunded in Stripe, continuing with DB update');
          } else {
            return res.status(500).json({ 
              error: 'Stripe refund failed', 
              details: stripeRefundError.message 
            });
          }
        }
      } else {
        console.log('PUT /api/payments - Skipping Stripe refund:', {
          paymentMethod: existingPayment.paymentMethod,
          hasTransactionId: !!existingPayment.transactionId,
          alreadyRefunded: !!existingPayment.refundAmount,
          currentStatus: existingPayment.status
        });
      }
    }

    // Update the payment
    console.log('PUT /api/payments - Updating payment with data:', {
      status,
      refundAmount,
      refundReason
    });

    const updateData = { status };
    if (refundAmount !== undefined && refundAmount !== null) {
      updateData.refundAmount = parseFloat(refundAmount);
    }
    if (refundReason) {
      updateData.refundReason = refundReason;
    }

    console.log('PUT /api/payments - Final update data:', updateData);

    const payment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        match: {
          include: {
            package: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, email: true }
                }
              }
            },
            ride: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    console.log('PUT /api/payments - Payment updated successfully:', payment.id);
    return res.status(200).json(payment);
    
  } catch (error) {
    console.error('PUT /api/payments - Error updating payment:', error);
    return res.status(500).json({ 
      error: 'Failed to update payment',
      details: error.message 
    });
  }
} 