/**
 * API endpoint pour nettoyer la session d'authentification
 * Utilise pour resoudre les problemes de redirection
 */
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Effacer le cookie auth_token
    res.setHeader('Set-Cookie', [
      'auth_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ]);
    
    console.log('Session cleared successfully');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Session d\'authentification effacee avec succes' 
    });
  } catch (error) {
    console.error('Error clearing session:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de l\'effacement de la session' 
    });
  }
} 