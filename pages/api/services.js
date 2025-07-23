import prisma, { ensureConnected } from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Ensure database connection is established
      await ensureConnected();
      
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
        console.log('No valid token found, showing all services');
      }
      
      const services = await prisma.service.findMany({
        include: {
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              image: true
            }
          },
          bookings: {
            select: {
              id: true,
              status: true,
              rating: true,
              review: true,
              customerId: true
            }
          },
          _count: {
            select: {
              bookings: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Calculate average rating for each service and filter out already booked services for current user
      const servicesWithRating = services.map(service => {
        const validRatings = service.bookings.filter(booking => booking.rating !== null);
        const averageRating = validRatings.length > 0 
          ? validRatings.reduce((sum, booking) => sum + booking.rating, 0) / validRatings.length
          : 0;

        // Check if current user has already booked this service (pending or confirmed bookings)
        const userHasBooked = currentUserId && service.bookings.some(booking => 
          booking.customerId === currentUserId && 
          ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status)
        );

        return {
          ...service,
          averageRating: Math.round(averageRating * 10) / 10,
          totalBookings: service._count.bookings,
          completedBookings: service.bookings.filter(b => b.status === 'COMPLETED').length,
          userHasBooked: userHasBooked
        };
      });

      // Filter out services that the current user has already booked
      const filteredServices = currentUserId ? 
        servicesWithRating.filter(service => !service.userHasBooked) : 
        servicesWithRating;

      res.status(200).json(filteredServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: 'Internal server error' });
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
        name,
        description,
        category,
        price,
        duration,
        location,
        requirements
      } = req.body;

      // Validation
      if (!name || !price) {
        return res.status(400).json({ error: 'Name and price are required' });
      }

      if (price <= 0) {
        return res.status(400).json({ error: 'Price must be greater than 0' });
      }

      const service = await prisma.service.create({
        data: {
          providerId: decoded.id,
          name: name.trim(),
          description: description?.trim() || null,
          category: category || 'OTHER',
          price: parseFloat(price),
          duration: duration ? parseInt(duration) : null,
          location: location?.trim() || null,
          requirements: requirements?.trim() || null,
          isActive: true
        },
        include: {
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Service créé avec succès',
        service
      });

    } catch (error) {
      console.error('Error creating service:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 