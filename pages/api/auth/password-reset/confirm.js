import prisma, { ensureConnected } from '../../../../lib/prisma';
import bcryptjs from 'bcryptjs';

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ message: 'Email, token et nouveau mot de passe requis.' });
  }

  try {
    const storedToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: token,
        expires: {
          gte: new Date(),
        },
      },
    });

    if (!storedToken) {
      return res.status(400).json({ message: 'Token invalide ou expiré.' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });

    // Delete tokens for user
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    return res.status(200).json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur confirmation mot de passe:', error);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  } finally {
    await prisma.$disconnect();
  }
} 