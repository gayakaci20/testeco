import prisma, { ensureConnected } from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

if (req.method === 'POST') {
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

      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const {
        storageBoxId,
        startDate,
        endDate,
        paymentMethod,
        totalAmount
      } = req.body;

      // Validation
      if (!storageBoxId || !startDate || !endDate) {
        return res.status(400).json({ error: 'Storage box ID, start date, and end date are required' });
      }

      // Validate totalAmount is a valid number
      if (totalAmount && (isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) < 0)) {
        return res.status(400).json({ error: 'Total amount must be a valid positive number' });
      }

      // Get storage box details
      const storageBox = await prisma.storageBox.findUnique({
        where: { id: storageBoxId }
      });

      if (!storageBox) {
        return res.status(404).json({ error: 'Storage box not found' });
      }

      if (storageBox.isOccupied || !storageBox.isActive) {
        return res.status(400).json({ error: 'Storage box is not available' });
      }

      // Check for overlapping rentals
      const overlappingRentals = await prisma.boxRental.findMany({
        where: {
          boxId: storageBoxId,
          isActive: true,
          OR: [
            {
              startDate: {
                lte: new Date(endDate)
              },
              endDate: {
                gte: new Date(startDate)
              }
            }
          ]
        }
      });

      if (overlappingRentals.length > 0) {
        return res.status(400).json({ error: 'Storage box is already rented for this period' });
      }

      // Generate access code
      const accessCode = Math.random().toString(36).substr(2, 8).toUpperCase();

      // Create rental (pending provider approval)
      const rental = await prisma.boxRental.create({
        data: {
          boxId: storageBoxId,
          userId: decoded.id,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          totalCost: parseFloat(totalAmount),
          accessCode: accessCode,
          isActive: false  // Pending provider approval
        },
        include: {
          box: {
            select: {
              code: true,
              location: true,
              size: true,
              pricePerDay: true
            }
          }
        }
      });

      // Don't update storage box status yet - wait for provider approval
      // The box will be marked as occupied when provider accepts the rental

      res.status(201).json({
        success: true,
        message: 'Réservation créée avec succès',
        rental,
        requiresPayment: true,
        redirectTo: `/payments/process?rentalId=${rental.id}&type=storage_rental`
      });

    } catch (error) {
      console.error('Error creating box rental:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'GET') {
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

      const rentals = await prisma.boxRental.findMany({
        where: {
          userId: decoded.id
        },
        include: {
          box: {
            select: {
              code: true,
              location: true,
              size: true,
              pricePerDay: true
            }
          }
        },
        orderBy: {
          startDate: 'desc'
        }
      });

      res.status(200).json(rentals);
    } catch (error) {
      console.error('Error fetching box rentals:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 