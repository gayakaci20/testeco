import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token de vérification requis' },
        { status: 400 }
      );
    }

    // Vérifier et décoder le token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (error) {
      return NextResponse.json(
        { error: 'Token de vérification invalide ou expiré' },
        { status: 400 }
      );
    }

    // Vérifier que c'est bien un token de vérification d'email
    if (decoded.type !== 'email_verification') {
      return NextResponse.json(
        { error: 'Type de token invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur n'est pas déjà vérifié
    if (user.isVerified) {
      return NextResponse.json(
        { 
          success: true,
          message: 'Email déjà vérifié',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isVerified: user.isVerified
          }
        }
      );
    }

    // Marquer l'utilisateur comme vérifié
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { 
        isVerified: true,
        emailVerified: new Date() // Si vous avez ce champ
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Email vérifié avec succès',
      user: updatedUser
    });

  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// Route GET pour vérifier via URL (optionnel)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de vérification requis' },
        { status: 400 }
      );
    }

    // Utiliser la même logique que POST
    const postRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    return await POST(postRequest);

  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email (GET):', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
} 