/**
 * Point d'entrée API pour effacer tous les cookies d'authentification
 * Utilisé pour résoudre les problèmes de tokens invalides
 */
export default function handler(req, res) {
  // Effacer explicitement le cookie auth_token
  res.setHeader(
    'Set-Cookie',
    'auth_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  );
  
  return res.status(200).json({ 
    success: true, 
    message: 'Cookies d\'authentification effacés' 
  });
} 