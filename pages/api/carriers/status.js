import jwt from 'jsonwebtoken';
import prisma, { ensureConnected } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure database connection before any queries
    await ensureConnected();
    
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

    const { isOnline } = req.body;

    // Update carrier status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: isOnline,
        lastActiveAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      isOnline: updatedUser.isOnline,
      lastActiveAt: updatedUser.lastActiveAt
    });

  } catch (error) {
    console.error('Error updating carrier status:', error);
    
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