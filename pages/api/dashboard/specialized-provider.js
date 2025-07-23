import prisma, { ensureConnected } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure database connection is established first
    await ensureConnected();

    // Get user from auth token
    const { verifyToken } = await import('../../../lib/auth');
    const token = req.cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token' });
    }
    
    const decodedToken = await verifyToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    const userId = decodedToken.id;

    // Get user info with services and bookings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        services: {
          include: {
            bookings: {
              include: {
                customer: {
                  select: { firstName: true, lastName: true, email: true, phoneNumber: true }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all bookings for this provider
    const allBookings = await prisma.booking.findMany({
      where: {
        service: {
          providerId: userId
        }
      },
      include: {
        service: true,
        customer: {
          select: { firstName: true, lastName: true, email: true, phoneNumber: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate earnings from completed bookings
    const completedBookings = allBookings.filter(booking => booking.status === 'COMPLETED');
    const serviceEarnings = completedBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    // Calculate today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEarnings = completedBookings
      .filter(booking => new Date(booking.createdAt) >= today)
      .reduce((sum, booking) => sum + booking.totalAmount, 0);

    // Calculate this week's earnings
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEarnings = completedBookings
      .filter(booking => new Date(booking.createdAt) >= weekStart)
      .reduce((sum, booking) => sum + booking.totalAmount, 0);

    // Calculate this month's earnings
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEarnings = completedBookings
      .filter(booking => new Date(booking.createdAt) >= monthStart)
      .reduce((sum, booking) => sum + booking.totalAmount, 0);

    // Get upcoming appointments (bookings with CONFIRMED status)
    const appointments = allBookings
      .filter(booking => booking.status === 'CONFIRMED')
      .map(booking => ({
        id: booking.id,
        serviceName: booking.service.name,
        clientName: `${booking.customer.firstName} ${booking.customer.lastName}`,
        clientEmail: booking.customer.email,
        clientPhone: booking.customer.phoneNumber,
        scheduledAt: booking.scheduledAt,
        status: booking.status,
        totalPrice: booking.totalAmount,
        notes: booking.notes
      }));

    // Get unique clients from bookings
    const uniqueClients = [];
    const clientMap = new Map();
    
    allBookings.forEach(booking => {
      if (!clientMap.has(booking.customer.email)) {
        clientMap.set(booking.customer.email, {
          id: booking.customer.id,
          name: `${booking.customer.firstName} ${booking.customer.lastName}`,
          email: booking.customer.email,
          phone: booking.customer.phoneNumber,
          memberSince: new Date(booking.createdAt).toLocaleDateString('fr-FR'),
          lastVisit: new Date(booking.scheduledAt).toLocaleDateString('fr-FR'),
          totalSpent: allBookings
            .filter(b => b.customer.email === booking.customer.email && b.status === 'COMPLETED')
            .reduce((sum, b) => sum + b.totalAmount, 0)
        });
        uniqueClients.push(clientMap.get(booking.customer.email));
      }
    });

    // Format services for professional interface
    const formattedServices = user.services.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      isActive: service.isActive,
      bookingsCount: service.bookings.length,
      createdAt: service.createdAt,
      rating: service.averageRating || 0
    }));

    // Generate mock invoices for professional interface
    const invoices = completedBookings.map(booking => ({
      id: `INV-${booking.id}`,
      number: `INV-${booking.id.substring(0, 8)}`,
      clientName: `${booking.customer.firstName} ${booking.customer.lastName}`,
      serviceName: booking.service.name,
      amount: booking.totalAmount,
      status: 'PAID',
      createdAt: booking.createdAt
    }));

    // Professional dashboard data structure
    const dashboardData = {
      appointments,
      services: formattedServices,
      clients: uniqueClients,
      earnings: {
        today: todayEarnings,
        week: weekEarnings,
        month: monthEarnings,
        total: serviceEarnings
      },
      invoices,
      availability: {
        // Mock availability settings - can be expanded later
        workingHours: {
          start: '09:00',
          end: '17:00'
        },
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      }
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Specialized provider dashboard API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 