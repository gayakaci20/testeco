import prisma, { ensureConnected } from '../../../lib/prisma';

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Service ID is required' });
    }

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: id },
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

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Format response
    const formattedService = {
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category,
      price: service.price,
      duration: service.duration,
      location: service.location,
      requirements: service.requirements,
      isActive: service.isActive,
      totalBookings: 0,
      averageRating: 0,
      provider: {
        id: service.provider.id,
        firstName: service.provider.firstName,
        lastName: service.provider.lastName,
        email: service.provider.email,
        phone: service.provider.phone || service.provider.phoneNumber
      },
      createdAt: service.createdAt,
      updatedAt: service.updatedAt
    };

    res.status(200).json(formattedService);

  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 