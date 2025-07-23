import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createApiLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const logger = createApiLogger('AUTH_LOGIN');
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      logger.warn('Tentative de connexion sans email ou mot de passe', {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Unknown'
      });
      
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Chercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        password: true,
        isVerified: true,
        emailVerified: true
      }
    });

    if (!user) {
      logger.warn('Tentative de connexion avec email inexistant', {
        email,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Unknown'
      });
      
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    if (!user.password) {
      logger.warn('Utilisateur sans mot de passe', {
        email,
        userId: user.id,
        username: user.name || `${user.firstName} ${user.lastName}`,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Unknown'
      });
      
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      logger.warn('Tentative de connexion avec mot de passe incorrect', {
        email,
        userId: user.id,
        username: user.name || `${user.firstName} ${user.lastName}`,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Unknown'
      });
      
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Générer un token simple
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      timestamp: Date.now()
    })).toString('base64');

    // Créer une session
    const sessionId = Math.random().toString(36).substring(2, 15);
    
    const duration = Date.now() - startTime;
    
    // Logger la connexion réussie
    logger.authEvent('login', user.id, {
      email: user.email,
      username: user.name || `${user.firstName} ${user.lastName}`,
      role: user.role,
      sessionId,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'Unknown',
      duration,
      status: 'Réussie',
      details: `Connexion réussie via ${request.headers.get('user-agent')?.includes('Mobile') ? 'API mobile' : 'interface web'}`
    });

    // Créer la réponse avec le cookie de session
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    });

    // Définir le cookie de session
    response.cookies.set('session-id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 heures
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 heures
    });

    return response;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Erreur lors de la connexion', {
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