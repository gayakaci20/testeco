/**
 * API endpoint pour la session (compatible NextAuth.js)
 * Retourne les informations de session ou null si non connecté
 */
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  // Assurer que la réponse est toujours du JSON
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from cookies (essayer les deux noms de cookies)
    const token = req.cookies.token || req.cookies.auth_token;

    if (!token) {
      // Pas de token = pas de session
      return res.status(200).json(null);
    }
    
    // Verify token using the same method as generateToken
    const decoded = await verifyToken(token);
    
    if (!decoded || !decoded.id) {
      // Token invalide = pas de session
      return res.status(200).json(null);
    }
    
    // Retourner les données de session dans le format attendu par NextAuth.js
    return res.status(200).json({
      user: {
        id: decoded.id,
        email: decoded.email,
        name: `${decoded.firstName} ${decoded.lastName}`,
        role: decoded.role,
        userType: decoded.userType
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
    });
    
  } catch (error) {
    console.error('❌ Error in /api/auth/session:', error);
    // En cas d'erreur, retourner null (pas de session)
    return res.status(200).json(null);
  }
} 