import prisma, { ensureConnected } from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

if (req.method === 'GET') {
    try {
      // Récupérer tous les utilisateurs avec le rôle MERCHANT
      const merchants = await prisma.user.findMany({
        where: {
          role: 'MERCHANT'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          companyName: true,
          address: true,
          phoneNumber: true,
          image: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Formatter les données pour le frontend
      const formattedMerchants = merchants.map(merchant => ({
        id: merchant.id,
        name: merchant.companyName || `${merchant.firstName} ${merchant.lastName}`,
        firstName: merchant.firstName,
        lastName: merchant.lastName,
        companyName: merchant.companyName,
        email: merchant.email,
        address: merchant.address,
        phone: merchant.phoneNumber,
        image: merchant.image || null,
        joinedAt: merchant.createdAt,
        // Simuler le nombre de produits (vous devrez adapter selon votre schema)
        productCount: Math.floor(Math.random() * 50) + 1, // Temporaire
        rating: 4.8, // Temporaire
        isOpen: true // Temporaire
      }));

      res.status(200).json(formattedMerchants);
    } catch (error) {
      console.error('Error fetching merchants:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des marchands' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée' });
  }
} 