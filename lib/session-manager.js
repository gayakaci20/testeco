import { generateToken, verifyToken } from './auth.js';
import Cookies from 'js-cookie';

/**
 * Gestionnaire de sessions multiples pour éviter les conflits
 * entre différents comptes connectés simultanément
 */

// Générer un ID de session unique
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Obtenir l'ID de session actuel
export const getCurrentSessionId = () => {
  return Cookies.get('session_id') || null;
};

// Créer une nouvelle session isolée
export const createIsolatedSession = async (user) => {
  const sessionId = generateSessionId();
  const token = await generateToken(user);
  
  // Stocker le token avec l'ID de session
  const sessionKey = `auth_token_${sessionId}`;
  
  // Cookies avec préfixes de session pour éviter les conflits
  Cookies.set('session_id', sessionId, { 
    expires: 7, 
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  Cookies.set(sessionKey, token, { 
    expires: 7, 
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  // Nettoyer les anciens tokens pour éviter les conflits
  cleanupOldTokens();
  
  console.log('🆔 Session créée:', {
    sessionId,
    userId: user.id,
    email: user.email,
    role: user.role
  });
  
  return { sessionId, token };
};

// Récupérer le token pour la session actuelle
export const getSessionToken = () => {
  const sessionId = getCurrentSessionId();
  if (!sessionId) {
    // Fallback vers l'ancien système
    return Cookies.get('auth_token') || Cookies.get('token') || null;
  }
  
  const sessionKey = `auth_token_${sessionId}`;
  return Cookies.get(sessionKey) || null;
};

// Vérifier le token de la session actuelle
export const verifySessionToken = async () => {
  const token = getSessionToken();
  const sessionId = getCurrentSessionId();
  
  if (!token) {
    return null;
  }
  
  const decoded = await verifyToken(token);
  if (!decoded) {
    // Token invalide, nettoyer la session
    if (sessionId) {
      clearSession(sessionId);
    }
    return null;
  }
  
  // Ajouter l'ID de session aux données décodées
  return {
    ...decoded,
    sessionId
  };
};

// Nettoyer une session spécifique
export const clearSession = (sessionId = null) => {
  const targetSessionId = sessionId || getCurrentSessionId();
  
  if (targetSessionId) {
    const sessionKey = `auth_token_${targetSessionId}`;
    Cookies.remove(sessionKey, { path: '/' });
    
    // Si c'est la session actuelle, supprimer aussi l'ID de session
    if (!sessionId || sessionId === getCurrentSessionId()) {
      Cookies.remove('session_id', { path: '/' });
    }
    
    console.log('🗑️ Session nettoyée:', targetSessionId);
  }
  
  // Nettoyer aussi les anciens cookies
  Cookies.remove('auth_token', { path: '/' });
  Cookies.remove('token', { path: '/' });
};

// Nettoyer les anciens tokens pour éviter les conflits
export const cleanupOldTokens = () => {
  // Supprimer les anciens cookies sans session ID
  Cookies.remove('auth_token', { path: '/' });
  Cookies.remove('token', { path: '/' });
  
  // Nettoyer les tokens de session expirés (plus de 7 jours)
  const allCookies = Cookies.get();
  Object.keys(allCookies).forEach(cookieName => {
    if (cookieName.startsWith('auth_token_session_')) {
      const timestamp = cookieName.split('_')[2];
      const sessionDate = new Date(parseInt(timestamp));
      const now = new Date();
      const daysDiff = (now - sessionDate) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 7) {
        Cookies.remove(cookieName, { path: '/' });
        console.log('🧹 Token de session expiré supprimé:', cookieName);
      }
    }
  });
};

// Détecter les conflits de sessions multiples
export const detectSessionConflicts = () => {
  const allCookies = Cookies.get();
  const authTokens = Object.keys(allCookies).filter(name => 
    name.startsWith('auth_token_') || name === 'auth_token' || name === 'token'
  );
  
  if (authTokens.length > 1) {
    console.warn('⚠️ Conflit de sessions détecté:', authTokens);
    return {
      hasConflict: true,
      tokens: authTokens,
      currentSession: getCurrentSessionId()
    };
  }
  
  return { hasConflict: false };
};

// Résoudre les conflits de sessions
export const resolveSessionConflicts = async () => {
  const conflicts = detectSessionConflicts();
  
  if (conflicts.hasConflict) {
    console.log('🔧 Résolution des conflits de sessions...');
    
    // Garder seulement la session actuelle
    const currentSessionId = getCurrentSessionId();
    const allCookies = Cookies.get();
    
    Object.keys(allCookies).forEach(cookieName => {
      if (cookieName.startsWith('auth_token_') && !cookieName.includes(currentSessionId)) {
        Cookies.remove(cookieName, { path: '/' });
        console.log('🗑️ Token conflictuel supprimé:', cookieName);
      }
    });
    
    // Supprimer les anciens tokens
    Cookies.remove('auth_token', { path: '/' });
    Cookies.remove('token', { path: '/' });
    
    return true;
  }
  
  return false;
};

// Obtenir les informations de toutes les sessions actives
export const getActiveSessions = () => {
  const allCookies = Cookies.get();
  const sessions = [];
  
  Object.keys(allCookies).forEach(cookieName => {
    if (cookieName.startsWith('auth_token_session_')) {
      const sessionId = cookieName.replace('auth_token_', '');
      const token = allCookies[cookieName];
      
      sessions.push({
        sessionId,
        cookieName,
        hasToken: !!token,
        tokenPreview: token?.substring(0, 20) + '...'
      });
    }
  });
  
  return sessions;
};

// Middleware pour vérifier l'isolement des sessions
export const sessionIsolationMiddleware = async (req, res, next) => {
  const sessionId = req.cookies.session_id;
  const conflicts = detectSessionConflicts();
  
  if (conflicts.hasConflict) {
    console.warn('⚠️ API: Conflit de sessions détecté', {
      sessionId,
      conflicts: conflicts.tokens,
      url: req.url
    });
    
    // Optionnel: forcer la résolution des conflits
    // resolveSessionConflicts();
  }
  
  // Ajouter l'ID de session aux headers pour le debug
  if (sessionId) {
    res.setHeader('X-Session-ID', sessionId);
  }
  
  return next();
}; 