import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../lib/auth';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetSubscription(req, res);
  } else if (req.method === 'POST') {
    return handleCreateSubscription(req, res);
  } else if (req.method === 'PUT') {
    return handleUpdateSubscription(req, res);
  } else if (req.method === 'DELETE') {
    return handleCancelSubscription(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get user's subscription status
async function handleGetSubscription(req, res) {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: decoded.id,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Check if subscription is still active
    const isActive = subscription && 
      subscription.status === 'ACTIVE' && 
      subscription.currentPeriodEnd && 
      new Date() < new Date(subscription.currentPeriodEnd);

    res.status(200).json({
      hasActiveSubscription: isActive,
      subscription: subscription || null,
      requiresPayment: !isActive
    });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    await prisma.$disconnect();
  }
}

// Create new subscription
async function handleCreateSubscription(req, res) {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    // Check if user is provider or carrier
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || !['PROVIDER', 'SERVICE_PROVIDER', 'CARRIER'].includes(user.role)) {
      return res.status(403).json({ error: 'Seuls les prestataires et transporteurs peuvent s\'abonner' });
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: decoded.id,
        status: 'ACTIVE'
      }
    });

    if (existingSubscription) {
      return res.status(400).json({ error: 'Vous avez déjà un abonnement actif' });
    }

    // Create Stripe customer if doesn't exist
    let stripeCustomer;
    try {
      const existingCustomers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        stripeCustomer = existingCustomers.data[0];
      } else {
        stripeCustomer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user.id
          }
        });
      }
    } catch (stripeError) {
      console.error('Stripe customer error:', stripeError);
      return res.status(400).json({ error: 'Erreur lors de la création du client Stripe' });
    }

    // Create payment intent for subscription
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // 10€ in cents
      currency: 'eur',
      customer: stripeCustomer.id,
      setup_future_usage: 'off_session',
      metadata: {
        type: 'subscription',
        userId: user.id,
        plan: 'PROFESSIONAL'
      }
    });

    // Create subscription record
    const subscription = await prisma.subscription.create({
      data: {
        userId: decoded.id,
        plan: 'PROFESSIONAL',
        status: 'PENDING',
        stripeCustomerId: stripeCustomer.id,
        amount: 10.00,
        currency: 'eur',
        isActive: false,
        autoRenew: true
      }
    });

    res.status(201).json({
      success: true,
      subscription,
      clientSecret: paymentIntent.client_secret,
      message: 'Abonnement créé. Procédez au paiement pour l\'activer.'
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'abonnement' });
  } finally {
    await prisma.$disconnect();
  }
}

// Update subscription (mainly for payment confirmation)
async function handleUpdateSubscription(req, res) {
  try {
    const { paymentIntentId, subscriptionId } = req.body;
    
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Le paiement n\'a pas été confirmé' });
    }

    // Update subscription status
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const subscription = await prisma.subscription.update({
      where: {
        id: subscriptionId || undefined,
        userId: decoded.id
      },
      data: {
        status: 'ACTIVE',
        isActive: true,
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth
      }
    });

    res.status(200).json({
      success: true,
      subscription,
      message: 'Abonnement activé avec succès'
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'abonnement' });
  } finally {
    await prisma.$disconnect();
  }
}

// Cancel subscription
async function handleCancelSubscription(req, res) {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: decoded.id,
        status: 'ACTIVE'
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Aucun abonnement actif trouvé' });
    }

    // Update subscription
    const canceledSubscription = await prisma.subscription.update({
      where: {
        id: subscription.id
      },
      data: {
        status: 'CANCELED',
        isActive: false,
        canceledAt: new Date(),
        autoRenew: false
      }
    });

    res.status(200).json({
      success: true,
      subscription: canceledSubscription,
      message: 'Abonnement annulé avec succès'
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation de l\'abonnement' });
  } finally {
    await prisma.$disconnect();
  }
} 