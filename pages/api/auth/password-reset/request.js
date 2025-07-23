import prisma, { ensureConnected } from '../../../../lib/prisma';
import { randomBytes } from 'crypto';
import EmailSMSNotificationService from '../../../../lib/email-sms-notifications.js';

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email requis.' });
  }

  try {
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Ne pas révéler que l'utilisateur n'existe pas
      return res.status(200).json({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
    }

    // Générer un token
    const resetToken = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

    // Stocker le token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: resetToken,
        expires,
      },
    });

    // Envoyer email
    const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.VERCEL_URL || req.headers.origin || 'http://localhost:3000';
    const resetUrl = `${origin}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    await EmailSMSNotificationService.sendEmail(email, 'PASSWORD_RESET', {
      firstName: user.firstName || user.companyFirstName || '',
      resetUrl,
    });

    return res.status(200).json({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
  } catch (error) {
    console.error('Erreur demande réinitialisation mot de passe:', error);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  } finally {
    await prisma.$disconnect();
  }
} 