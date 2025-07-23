import prisma, { ensureConnected } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from cookies
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token
    const decoded = await verifyToken(token);
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Rental ID is required' });
    }

    // Get rental details
    const rental = await prisma.boxRental.findUnique({
      where: { id: id },
      include: {
        box: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    // Verify user is the renter or the owner
    if (rental.userId !== decoded.id && rental.box.ownerId !== decoded.id) {
      return res.status(403).json({ error: 'Not authorized to view this rental' });
    }

    // Check if already paid
    const existingPayment = await prisma.payment.findFirst({
      where: {
        metadata: {
          path: ['rentalId'],
          equals: id
        },
        status: 'COMPLETED'
      }
    });

    const formattedRental = {
      id: rental.id,
      boxId: rental.boxId,
      userId: rental.userId,
      startDate: rental.startDate,
      endDate: rental.endDate,
      totalCost: rental.totalCost,
      accessCode: rental.accessCode,
      isActive: rental.isActive,
      isPaid: !!existingPayment,
      createdAt: rental.createdAt,
      updatedAt: rental.updatedAt,
      box: {
        id: rental.box.id,
        code: rental.box.code,
        title: `Boîte ${rental.box.code}`,
        location: rental.box.location,
        size: rental.box.size,
        pricePerDay: rental.box.pricePerDay,
        owner: rental.box.owner
      },
      user: rental.user,
      // Calculate duration
      duration: rental.endDate 
        ? Math.ceil((new Date(rental.endDate) - new Date(rental.startDate)) / (1000 * 60 * 60 * 24))
        : null
    };

    res.status(200).json(formattedRental);

  } catch (error) {
    console.error('Error fetching rental details:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 