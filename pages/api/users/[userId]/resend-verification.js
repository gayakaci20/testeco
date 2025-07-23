import prisma, { ensureConnected } from '../../../../lib/prisma';
import { randomBytes } from 'crypto';
import EmailSMSNotificationService from '../../../../lib/email-sms-notifications.js';

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    query: { userId },
  } = req;

  if (!userId) {
    return res.status(400).json({ message: 'User ID requis.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Le compte est déjà vérifié.' });
    }

    // Générer token
    const verificationToken = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Stocker token (supprimer anciens)
    await prisma.verificationToken.deleteMany({ where: { identifier: user.email } });
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: verificationToken,
        expires,
      },
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.VERCEL_URL || req.headers.origin || 'http://localhost:3000';
    const verificationUrl = `${origin}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;

    await EmailSMSNotificationService.sendEmail(user.email, 'EMAIL_VERIFICATION', {
      firstName: user.firstName || user.companyFirstName || '',
      verificationUrl,
    });

    return res.status(200).json({ message: 'Email de vérification envoyé.' });
  } catch (error) {
    console.error('Erreur resend verification:', error);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  } finally {
    await prisma.$disconnect();
  }
} 