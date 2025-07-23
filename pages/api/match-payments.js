import prisma, { ensureConnected } from '../../lib/prisma';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        return await handleCreatePayment(req, res);
      case 'PUT':
        return await handleUpdatePayment(req, res);
      case 'GET':
        return await handleGetPayment(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Match Payments API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Créer un paiement quand le CUSTOMER accepte une proposition
async function handleCreatePayment(req, res) {
  try {
    const { matchId, paymentData, acceptMatch = true } = req.body;
    const userId = req.headers['x-user-id'];
    
    if (!userId || !matchId) {
      return res.status(400).json({ error: 'matchId and userId are required' });
    }

    // Vérifier que le match existe et que l'utilisateur est le propriétaire du package
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        package: { userId: userId }
      },
      include: {
        package: { include: { user: true } },
        ride: { include: { user: true } },
        payment: true
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found or unauthorized' });
    }

    // Vérifier que l'utilisateur est bien un CUSTOMER
    if (match.package.user.role !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Only customers can make payments' });
    }

    // Vérifier qu'il n'y a pas déjà un paiement
    if (match.payment) {
      return res.status(400).json({ error: 'Payment already exists for this match' });
    }

    const amount = match.price || match.package.price || 0;
    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    let paymentStatus = 'PENDING';
    let transactionId = null;
    let stripePaymentIntentId = null;

    // Traitement du paiement par carte
    if (paymentData && paymentData.paymentMethod === 'CARD') {
      try {
        const { cardNumber, expiryDate, cvv, cardholderName, billingAddress, stripeToken } = paymentData;

        // Validate card information
        if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
          return res.status(400).json({ error: 'Card information is incomplete' });
        }

        const cleanCardNumber = cardNumber.replace(/\s/g, '');
        
        // For development/testing - simulate payment processing
        // In production, you should use Stripe Payment Intents or Elements
        console.log('Processing simulated payment for development/testing');
        
        // Simulate different card behaviors for testing
        if (cleanCardNumber === '4000000000000002') {
          // Simulate declined card
          paymentStatus = 'FAILED';
          return res.status(400).json({ 
            error: 'Your card was declined',
            details: 'This card was declined. Please try a different card.'
          });
        } else if (cleanCardNumber === '4000000000000341') {
          // Simulate insufficient funds
          paymentStatus = 'FAILED';
          return res.status(400).json({ 
            error: 'Insufficient funds',
            details: 'Your card has insufficient funds. Please try a different card.'
          });
        } else {
          // Simulate successful payment for valid test cards or any other card number
          paymentStatus = 'COMPLETED';
          transactionId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          stripePaymentIntentId = `pi_test_${Math.random().toString(36).substr(2, 9)}`;
          
          console.log(`Simulated successful payment: ${transactionId} for amount: ${amount}€`);
        }

      } catch (error) {
        console.error('Payment processing error:', error);
        paymentStatus = 'FAILED';
        return res.status(400).json({ 
          error: 'Payment processing failed', 
          details: error.message 
        });
      }
    }

    // Créer le paiement dans la base de données
    const payment = await prisma.payment.create({
      data: {
        userId: userId,
        matchId: matchId,
        amount: amount,
        currency: 'EUR',
        status: paymentStatus,
        paymentMethod: paymentData?.paymentMethod || 'CARD',
        transactionId: transactionId,
        paymentIntentId: stripePaymentIntentId
      }
    });

    // Si le paiement est réussi et acceptMatch est true, accepter le match
    if (paymentStatus === 'COMPLETED' && acceptMatch) {
      await prisma.match.update({
        where: { id: matchId },
        data: { 
          status: 'ACCEPTED_BY_SENDER'
        }
      });

      // Mettre à jour le statut du package
      await prisma.package.update({
        where: { id: match.package.id },
        data: { status: 'CONFIRMED' }
      });

      // Créer une notification pour le carrier
      await prisma.notification.create({
        data: {
          userId: match.ride.userId,
          type: 'MATCH_UPDATE',
          title: 'Match accepté et payé !',
          message: `Le client a accepté votre proposition pour "${match.package.description}" et a effectué le paiement. Vous pouvez maintenant récupérer le colis.`,
          relatedEntityId: matchId
        }
      });

      // Créer une notification pour le customer
      await prisma.notification.create({
        data: {
          userId: userId,
          type: 'PAYMENT_SUCCESS',
          title: 'Paiement effectué avec succès',
          message: `Votre paiement de ${amount}€ pour la livraison de "${match.package.description}" a été effectué. Le transporteur va récupérer votre colis.`,
          relatedEntityId: matchId
        }
      });
    }

    return res.status(201).json({
      success: paymentStatus === 'COMPLETED',
      payment,
      match: {
        ...match,
        status: acceptMatch && paymentStatus === 'COMPLETED' ? 'ACCEPTED_BY_SENDER' : match.status
      },
      message: paymentStatus === 'COMPLETED' 
        ? 'Payment completed successfully' 
        : 'Payment created but processing'
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({ error: 'Failed to create payment' });
  }
}

// Gérer les mises à jour de paiement (ex: confirmer la livraison pour payer le carrier)
async function handleUpdatePayment(req, res) {
  try {
    const { matchId, action, deliveryConfirmation } = req.body;
    const userId = req.headers['x-user-id'];
    
    if (!userId || !matchId || !action) {
      return res.status(400).json({ error: 'matchId, action and userId are required' });
    }

    const match = await prisma.match.findFirst({
      where: { id: matchId },
      include: {
        package: { include: { user: true } },
        ride: { include: { user: true } },
        payment: true
      }
    });

    if (!match || !match.payment) {
      return res.status(404).json({ error: 'Match or payment not found' });
    }

    if (action === 'confirm_delivery') {
      // Seul le customer peut confirmer la livraison
      if (userId !== match.package.userId) {
        return res.status(403).json({ error: 'Only the package owner can confirm delivery' });
      }

      if (match.payment.status !== 'COMPLETED') {
        return res.status(400).json({ error: 'Payment must be completed first' });
      }

      // Mettre à jour le statut du match et du package
      await prisma.match.update({
        where: { id: matchId },
        data: { status: 'CONFIRMED' }
      });

      await prisma.package.update({
        where: { id: match.package.id },
        data: { status: 'DELIVERED' }
      });

      // Ici, vous pourriez implémenter un transfert vers le carrier
      // Par exemple, utiliser Stripe Connect pour transférer l'argent
      
      // Créer une notification pour le carrier
      await prisma.notification.create({
        data: {
          userId: match.ride.userId,
          type: 'PACKAGE_DELIVERED',
          title: 'Livraison confirmée - Paiement en cours',
          message: `La livraison de "${match.package.description}" a été confirmée. Votre paiement sera traité sous peu.`,
          relatedEntityId: matchId
        }
      });

      return res.status(200).json({
        message: 'Delivery confirmed successfully',
        match: { ...match, status: 'CONFIRMED' }
      });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('Error updating payment:', error);
    return res.status(500).json({ error: 'Failed to update payment' });
  }
}

// Récupérer les informations de paiement
async function handleGetPayment(req, res) {
  try {
    const { matchId } = req.query;
    const userId = req.headers['x-user-id'];
    
    if (!userId || !matchId) {
      return res.status(400).json({ error: 'matchId and userId are required' });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        matchId: matchId,
        match: {
          OR: [
            { package: { userId: userId } },
            { ride: { userId: userId } }
          ]
        }
      },
      include: {
        match: {
          include: {
            package: { include: { user: true } },
            ride: { include: { user: true } }
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    return res.status(200).json(payment);

  } catch (error) {
    console.error('Error fetching payment:', error);
    return res.status(500).json({ error: 'Failed to fetch payment' });
  }
} 