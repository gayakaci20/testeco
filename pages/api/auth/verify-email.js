import { prisma, ensureConnected } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { token, email } = req.query;
  
  console.log('🔍 Verify Email Debug:', {
    token: token ? `${token.substring(0, 10)}...` : 'null',
    email: email || 'null',
    query: req.query
  });

  if (!token) {
    console.log('❌ Missing token');
    return res.status(400).json({ message: 'Token requis.' });
  }

  try {
    console.log('🔄 Connecting to database...');
    await ensureConnected();
    console.log('✅ Database connected');

    let userEmail = email;
    let searchCriteria;

    if (token.startsWith('eyJ')) {
      console.log('🔍 JWT token detected, decoding...');
      
      if (!process.env.JWT_SECRET) {
        console.log('❌ JWT_SECRET not configured');
        return res.status(500).json({ message: 'Configuration serveur manquante.' });
      }
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ JWT decoded:', {
          userId: decoded.userId,
          email: decoded.email,
          type: decoded.type
        });
        
        if (decoded.type !== 'email_verification') {
          return res.status(400).json({ message: 'Type de token invalide.' });
        }
        
        userEmail = decoded.email;
        searchCriteria = { 
          id: decoded.userId,
          email: decoded.email 
        };
      } catch (jwtError) {
        console.log('❌ JWT verification failed:', jwtError.message);
        return res.status(400).json({ message: 'Token JWT invalide ou expiré.' });
      }
    } else {
      console.log('🔍 Hex token detected');
      if (!email) {
        console.log('❌ Missing email for hex token');
        return res.status(400).json({ message: 'Email requis pour ce type de token.' });
      }
      searchCriteria = {
        email: email,
        verificationToken: token
      };
    }

    console.log('🔍 Searching for user with criteria:', searchCriteria);

    const user = await prisma.user.findFirst({
      where: searchCriteria,
      select: {
        id: true,
        email: true,
        isVerified: true,
        verificationToken: true,
        firstName: true,
        lastName: true
      }
    });

    console.log('👤 User found:', {
      found: !!user,
      email: user?.email,
      isVerified: user?.isVerified,
      hasToken: !!user?.verificationToken
    });

    if (!user) {
      const userWithEmail = await prisma.user.findUnique({
        where: { email: userEmail },
        select: {
          id: true,
          email: true,
          isVerified: true,
          verificationToken: true
        }
      });
      
      console.log('🔍 User with email exists:', {
        found: !!userWithEmail,
        isVerified: userWithEmail?.isVerified,
        hasToken: !!userWithEmail?.verificationToken,
        email: userEmail
      });
      
      if (userWithEmail && userWithEmail.isVerified) {
        return res.status(200).json({ message: 'Compte déjà vérifié.' });
      }
      
      return res.status(400).json({ 
        message: 'Token invalide ou utilisateur non trouvé.',
        debug: {
          userExists: !!userWithEmail,
          tokenProvided: !!token,
          emailProvided: !!userEmail,
          tokenType: token?.startsWith('eyJ') ? 'JWT' : 'hex'
        }
      });
    }

    if (user.isVerified) {
      console.log('✅ User already verified');
      return res.status(200).json({ message: 'Compte déjà vérifié.' });
    }

    console.log('🔄 Updating user verification status...');
    const updatedUser = await prisma.user.update({
      where: { email: user.email },
      data: { 
        isVerified: true,
        verificationToken: null,
        emailVerified: new Date()
      },
      select: {
        id: true,
        email: true,
        isVerified: true,
        firstName: true,
        lastName: true
      }
    });

    console.log('✅ User verification updated successfully');

    return res.status(200).json({ 
      message: 'Compte vérifié avec succès.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        isVerified: updatedUser.isVerified,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName
      }
    });

  } catch (error) {
    console.error('❌ Error verifying email:', {
      message: error.message,
      stack: error.stack,
      token: token ? `${token.substring(0, 10)}...` : 'null',
      email: email || 'null'
    });
    
    return res.status(500).json({ 
      message: 'Erreur interne du serveur.',
      debug: process.env.NODE_ENV === 'development' ? {
        error: error.message,
        token: token ? `${token.substring(0, 10)}...` : 'null',
        email: email || 'null'
      } : undefined
    });
  }
} 