import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { carrierId } = req.query;

  try {
    // Si carrierId est fourni, récupérer les évaluations pour ce livreur spécifique
    if (carrierId) {
      const reviews = await prisma.carrierReview.findMany({
        where: { carrierId },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          match: {
            include: {
              package: {
                select: {
                  id: true,
                  description: true,
                  trackingNumber: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Calculer les statistiques
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;

      const ratingDistribution = {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      };

      return res.status(200).json({
        reviews,
        stats: {
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingDistribution
        }
      });
    }

    // Sinon, récupérer toutes les évaluations récentes
    const allReviews = await prisma.carrierReview.findMany({
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        carrier: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        match: {
          include: {
            package: {
              select: {
                id: true,
                description: true,
                trackingNumber: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limiter à 50 évaluations récentes
    });

    return res.status(200).json(allReviews);

  } catch (error) {
    console.error('Error fetching carrier reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 