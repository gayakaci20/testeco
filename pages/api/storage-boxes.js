import prisma, { ensureConnected } from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

if (req.method === 'GET') {
    try {
      // Get user ID from auth token if available
      let currentUserId = null;
      try {
        const token = req.cookies.auth_token;
        if (token) {
          const decoded = await verifyToken(token);
          if (decoded && decoded.id) {
            currentUserId = decoded.id;
          }
        }
      } catch (error) {
        console.log('No valid token found, showing all storage boxes');
      }

      const storageBoxes = await prisma.storageBox.findMany({
        include: {
          rentals: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          pricePerDay: 'asc'
        }
      });

      // Format data for frontend and filter out already rented boxes for current user
      const formattedBoxes = storageBoxes.map(box => {
        const activeRentals = box.rentals.filter(rental => rental.isActive);
        
        // Check if current user has already rented this box (active or pending rental)
        const userHasRented = currentUserId && box.rentals.some(rental => 
          rental.user.id === currentUserId && rental.isActive
        );

        return {
          id: box.id,
          title: `Boîte ${box.code}`,
          description: `Boîte de stockage ${box.size.toLowerCase()} disponible`,
          location: box.location,
          size: box.size,
          pricePerDay: box.pricePerDay,
          isOccupied: box.isOccupied,
          available: !box.isOccupied && box.isActive,
          code: box.code,
          createdAt: box.createdAt,
          updatedAt: box.updatedAt,
          activeRentals: activeRentals,
          features: [],
          userHasRented: userHasRented
        };
      });

      // Filter out boxes that the current user has already rented
      const filteredBoxes = currentUserId ? 
        formattedBoxes.filter(box => !box.userHasRented) : 
        formattedBoxes;

      res.status(200).json(filteredBoxes);
    } catch (error) {
      console.error('Error fetching storage boxes:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'POST') {
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

      if (!user || !['PROVIDER', 'SERVICE_PROVIDER'].includes(user.role)) {
        return res.status(403).json({ error: 'Access denied. Must be a service provider.' });
      }

      const {
        title,
        location,
        size,
        pricePerDay,
        description
      } = req.body;

      // Validation
      if (!title || !location || !size || !pricePerDay) {
        return res.status(400).json({ error: 'Title, location, size, and price per day are required' });
      }

      if (pricePerDay <= 0) {
        return res.status(400).json({ error: 'Price per day must be greater than 0' });
      }

      // Generate unique code with owner ID (temporary solution)
      const code = `BOX-${decoded.id.substring(0, 8)}-${Date.now()}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

      const storageBox = await prisma.storageBox.create({
        data: {
          code,
          location: location.trim(),
          size: size.trim(),
          pricePerDay: parseFloat(pricePerDay),
          isOccupied: false,
          isActive: true,
          ownerId: decoded.id  // Ajouter l'ID du propriétaire
        }
      });

      res.status(201).json({
        success: true,
        message: 'Boîte de stockage créée avec succès',
        storageBox: {
          ...storageBox,
          title: `Boîte ${storageBox.code}`,
          description: description || `Boîte de stockage ${storageBox.size.toLowerCase()} disponible`,
          available: true,
          activeRentals: [],
          features: []
        }
      });

    } catch (error) {
      console.error('Error creating storage box:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 