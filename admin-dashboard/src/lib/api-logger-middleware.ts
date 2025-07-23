import { NextRequest, NextResponse } from 'next/server';
import logger, { createApiLogger } from './logger';

// Générer un ID unique pour chaque requête
const generateRequestId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Middleware pour logger les requêtes API
export function withApiLogger(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async function (req: NextRequest) {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const method = req.method;
    const url = req.url;
    
    // Créer un logger spécifique à cette requête
    const apiLogger = createApiLogger('API')
      .setRequestId(requestId);
    
    try {
      // Logger le début de la requête
      apiLogger.debug(`Début de la requête: ${method} ${url}`, {
        requestId,
        method,
        url,
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      });
      
      // Exécuter le handler
      const response = await handler(req);
      
      // Calculer la durée
      const duration = Date.now() - startTime;
      
      // Logger la réponse
      apiLogger.apiRequest(method, url, response.status, duration, {
        requestId,
        responseSize: response.headers.get('content-length')
      });
      
      return response;
    } catch (error) {
      // Calculer la durée même en cas d'erreur
      const duration = Date.now() - startTime;
      
      // Logger l'erreur
      apiLogger.apiError(method, url, error as Error, {
        requestId,
        duration
      });
      
      // Re-lancer l'erreur
      throw error;
    }
  };
}

// Middleware pour logger les actions utilisateur
export function withUserLogger(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async function (req: NextRequest) {
    const requestId = generateRequestId();
    const method = req.method;
    const url = req.url;
    
    // Créer un logger spécifique à cette requête
    const userLogger = createApiLogger('USER_ACTION')
      .setRequestId(requestId);
    
    try {
      // Extraire l'ID utilisateur si disponible (depuis les headers ou cookies)
      const userId = req.headers.get('x-user-id') || 'anonymous';
      const sessionId = req.headers.get('x-session-id') || req.cookies.get('session-id')?.value;
      
      if (userId !== 'anonymous') {
        userLogger.setUserId(userId);
      }
      
      if (sessionId) {
        userLogger.setSessionId(sessionId);
      }
      
      // Exécuter le handler
      const response = await handler(req);
      
      // Logger l'action utilisateur
      userLogger.userAction(`${method} ${url}`, userId, {
        requestId,
        sessionId,
        status: response.status,
        url
      });
      
      return response;
    } catch (error) {
      // Logger l'erreur d'action utilisateur
      userLogger.error(`Erreur lors de l'action utilisateur: ${error}`, {
        requestId,
        method,
        url,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      
      throw error;
    }
  };
}

// Middleware pour logger les événements d'authentification
export function withAuthLogger(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async function (req: NextRequest) {
    const requestId = generateRequestId();
    const method = req.method;
    const url = req.url;
    
    // Créer un logger spécifique à cette requête
    const authLogger = createApiLogger('AUTH')
      .setRequestId(requestId);
    
    try {
      // Exécuter le handler
      const response = await handler(req);
      
      // Déterminer le type d'événement d'authentification
      let eventType = 'unknown';
      if (url.includes('/signin')) eventType = 'login';
      if (url.includes('/signup')) eventType = 'register';
      if (url.includes('/signout')) eventType = 'logout';
      if (url.includes('/forgot-password')) eventType = 'forgot_password';
      if (url.includes('/reset-password')) eventType = 'reset_password';
      
      // Logger l'événement d'authentification
      authLogger.authEvent(eventType, undefined, {
        requestId,
        method,
        url,
        status: response.status,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent')
      });
      
      return response;
    } catch (error) {
      // Logger l'erreur d'authentification
      authLogger.error(`Erreur d'authentification: ${error}`, {
        requestId,
        method,
        url,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      
      throw error;
    }
  };
}

// Logger global pour l'application
export default logger; 