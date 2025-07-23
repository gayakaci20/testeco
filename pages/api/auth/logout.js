import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Récupérer le token depuis les cookies
    const token = req.cookies.auth_token;
    
    // Optionnel: Vérifier le token pour des informations de log
    let userInfo = null;
    if (token) {
      try {
        userInfo = await verifyToken(token);
      } catch (error) {
        // Token invalide, continuer avec la déconnexion
        console.log('Token invalide lors de la déconnexion:', error.message);
      }
    }
    
    // Log simple pour debugging
    console.log('Déconnexion:', userInfo ? `Utilisateur ${userInfo.email}` : 'Utilisateur inconnu');

    // Supprimer tous les cookies d'authentification possibles
    const cookiesToClear = [
      `auth_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Secure=${process.env.NODE_ENV === 'production'}`,
      `token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Secure=${process.env.NODE_ENV === 'production'}`,
      `session-id=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Secure=${process.env.NODE_ENV === 'production'}`,
      `auth-token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Secure=${process.env.NODE_ENV === 'production'}`
    ];
    
    res.setHeader('Set-Cookie', cookiesToClear);

    return res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
}