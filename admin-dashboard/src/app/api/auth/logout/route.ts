import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const logger = createApiLogger('AUTH_LOGOUT');
  const startTime = Date.now();
  
  try {
    // Récupérer les informations de session depuis les cookies
    const sessionId = request.cookies.get('session-id')?.value;
    const authToken = request.cookies.get('auth-token')?.value;
    
    let userId = 'unknown';
    let username = 'Utilisateur inconnu';
    let email = 'N/A';
    
    // Décoder le token pour récupérer les infos utilisateur
    if (authToken) {
      try {
        const decoded = JSON.parse(Buffer.from(authToken, 'base64').toString());
        userId = decoded.userId || 'unknown';
        email = decoded.email || 'N/A';
        username = decoded.username || userId;
      } catch (error) {
        // Token invalide, continuer avec les valeurs par défaut
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Logger la déconnexion
    logger.authEvent('logout', userId, {
      email,
      username,
      sessionId,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      duration,
      status: 'Réussie',
      details: `Déconnexion réussie via ${request.headers.get('user-agent')?.includes('Mobile') ? 'API mobile' : 'interface web'}`
    });

    // Créer la réponse
    const response = NextResponse.json({
      success: true,
      message: 'Déconnexion réussie'
    });

    // Supprimer les cookies de session
    response.cookies.set('session-id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    return response;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Erreur lors de la déconnexion', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      duration
    });

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 