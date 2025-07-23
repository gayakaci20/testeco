import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function POST(request: NextRequest, { params: paramsPromise }: RouteContext) {
  try {
    const params = await paramsPromise;
    const { userId } = params;

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        role: true
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
        { error: 'Utilisateur déjà vérifié' },
        { status: 400 }
      );
    }

    // Générer un token de vérification
    const verificationToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'email_verification'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Construire l'URL de vérification
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    // Simuler l'envoi d'email (vous devrez implémenter votre service d'email)
    // Pour l'instant, on va juste logger l'URL
    console.log('🔗 Lien de vérification pour', user.email, ':', verificationUrl);

    // Ici vous pourriez intégrer votre service d'email
    // Par exemple avec le service Gmail SMTP que vous utilisez
    try {
      // Simuler l'envoi d'email
      const emailSent = await sendVerificationEmail(user, verificationUrl);
      
      if (!emailSent) {
        throw new Error('Échec de l\'envoi de l\'email');
      }

      return NextResponse.json({
        success: true,
        message: 'Email de vérification envoyé avec succès',
        email: user.email
      });

    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      
      // Retourner quand même le succès avec les détails pour le debug
      return NextResponse.json({
        success: true,
        message: 'Email de vérification généré (voir les logs pour le lien)',
        email: user.email,
        debug: {
          verificationUrl: verificationUrl,
          note: 'Configurez votre service d\'email pour l\'envoi automatique'
        }
      });
    }

  } catch (error) {
    console.error('Erreur lors de la génération du token de vérification:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// Fonction d'envoi d'email utilisant le service Gmail SMTP existant du frontend
async function sendVerificationEmail(user: any, verificationUrl: string): Promise<boolean> {
  try {

    // Template email de vérification
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#f9fafb; border-radius:8px; overflow:hidden;">
        <div style="background: linear-gradient(90deg,#38bdf8,#2563eb); padding: 30px 20px; text-align:center;">
          <h1 style="color:#ffffff; margin:0; font-size:24px;">Confirmez votre adresse email ✅</h1>
        </div>
        <div style="padding: 30px; color:#1f2937;">
          <h2 style="margin-top:0;">Bonjour ${user.firstName || 'utilisateur'} !</h2>
          <p>Merci de vous être inscrit sur EcoDeli. Cliquez sur le bouton ci-dessous pour activer votre compte :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background:#38bdf8;color:white;padding:12px 24px;text-decoration:none;border-radius:6px; font-weight:bold;">Vérifier mon compte</a>
          </div>
          <p style="font-size:14px;color:#6b7280;">Si vous n'avez pas créé de compte, ignorez simplement cet email.</p>
        </div>
      </div>`;

    // Appel au service d'email du frontend (port 3000)
    const response = await fetch('http://localhost:3000/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.email,
        subject: 'Vérifiez votre compte - EcoDeli',
        html: emailHtml
      })
    });

    const result = await response.json();
    console.log('📧 Email de vérification envoyé:', result);
    
    return result.success;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de vérification:', error);
    return false;
  }
} 