import jwt from 'jsonwebtoken';
import prisma, { ensureConnected } from '../../../../lib/prisma';

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const userId = decoded.userId;

    // Verify user is a carrier
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'CARRIER') {
      return res.status(403).json({ error: 'Access denied. Carrier role required.' });
    }

    const { id: matchId } = req.query;

    // Find the match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        package: true,
        ride: true
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status !== 'PENDING') {
      return res.status(400).json({ error: 'Match is not available for acceptance' });
    }

    // Update match status to CONFIRMED
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'CONFIRMED',
        acceptedAt: new Date()
      },
      include: {
        package: {
          include: {
            sender: true
          }
        },
        ride: {
          include: {
            carrier: true
          }
        }
      }
    });

    // Create notification for package sender
    await prisma.notification.create({
      data: {
        userId: match.package.senderId,
        type: 'MATCH_ACCEPTED',
        title: 'Proposition acceptée !',
        message: `Votre colis a été accepté par ${user.firstName} ${user.lastName}. Veuillez procéder au paiement pour confirmer la livraison.`,
        relatedEntityId: matchId
      }
    });

    // Create payment notification for the client
    await prisma.notification.create({
      data: {
        userId: match.package.senderId,
        type: 'PAYMENT_REQUIRED',
        title: 'Paiement requis',
        message: `Votre livraison a été acceptée ! Veuillez procéder au paiement pour confirmer votre commande.`,
        isRead: false,
        relatedEntityId: matchId
      }
    });

    // Update package status
    await prisma.package.update({
      where: { id: match.packageId },
      data: {
        status: 'CONFIRMED'
      }
    });

    res.status(200).json({
      success: true,
      match: updatedMatch,
      message: 'Match accepted successfully'
    });

  } catch (error) {
    console.error('Error accepting match:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
} 