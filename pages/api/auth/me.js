/**
 * API endpoint pour récupérer les informations de l'utilisateur connecté
 * Utilise le token JWT pour authentifier l'utilisateur
 */
import { verifyToken } from '../../../lib/auth';
import prisma, { ensureConnected } from '../../../lib/prisma-stable';

export default async function handler(req, res) {
  // Assurer que la réponse est toujours du JSON
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔍 API /auth/me - Début');
    
    // Ensure database connection is established first
    console.log('🔌 Établissement de la connexion à la base de données...');
    await ensureConnected();
    console.log('✅ Connexion base de données confirmée');

    // Get token from cookies (essayer les deux noms de cookies)
    const token = req.cookies.token || req.cookies.auth_token;

    if (!token) {
      console.log('❌ No auth token found in cookies');
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('🔍 Token found, verifying...');
    
    // Verify token using the same method as generateToken
    const decoded = await verifyToken(token);
    
    if (!decoded || !decoded.id) {
      console.log('❌ Token verification failed');
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    console.log('✅ Token verified for user:', decoded.id);
    
    // Get user from database with better error handling
    console.log('🔍 Récupération utilisateur depuis la base de données...');
    
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          role: true,
          userType: true,
          companyName: true,
          companyFirstName: true,
          companyLastName: true,
          phoneNumber: true,
          vehicleType: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (dbError) {
      console.error('❌ Erreur base de données lors de la récupération utilisateur:', {
        error: dbError.message,
        code: dbError.code,
        userId: decoded.id
      });
      
      // Essayer de reconnecter et réessayer
      try {
        console.log('🔄 Tentative de reconnexion...');
        await ensureConnected();
        user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            role: true,
            userType: true,
            companyName: true,
            companyFirstName: true,
            companyLastName: true,
            phoneNumber: true,
            vehicleType: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        console.log('✅ Reconnexion et récupération utilisateur réussies');
      } catch (retryError) {
        console.error('❌ Échec de la reconnexion:', retryError.message);
        return res.status(500).json({ message: 'Database connection error' });
      }
    }

    if (!user) {
      console.log('❌ User not found in database for ID:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('✅ User found:', user.email);
    
    // Return user data
    return res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      userType: user.userType,
      companyName: user.companyName,
      companyFirstName: user.companyFirstName,
      companyLastName: user.companyLastName,
      phoneNumber: user.phoneNumber,
      vehicleType: user.vehicleType,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

  } catch (error) {
    console.error('❌ Error in /api/auth/me:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}