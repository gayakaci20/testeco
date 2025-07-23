import prisma, { ensureConnected } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await ensureConnected();

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

    const userIdPrefix = userId.substring(0, 8);
    const storageBoxes = await prisma.storageBox.findMany({
      where: {
        code: {
          startsWith: `BOX-${userIdPrefix}-`
        }
      },
      include: {
        rentals: {
          where: {
            isActive: true
          },
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const boxRentals = await prisma.boxRental.findMany({
      where: {
        box: {
          code: {
            startsWith: `BOX-${userIdPrefix}-`
          }
        }
      },
      include: {
        box: true,
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const completedBookings = allBookings.filter(booking => booking.status === 'COMPLETED');
    const serviceEarnings = completedBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    const completedRentals = boxRentals.filter(rental => rental.totalCost > 0);
    const storageEarnings = completedRentals.reduce((sum, rental) => sum + rental.totalCost, 0);
    
    const totalEarnings = serviceEarnings + storageEarnings;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayServiceEarnings = completedBookings
      .filter(booking => new Date(booking.createdAt) >= today)
      .reduce((sum, booking) => sum + booking.totalAmount, 0);
    const todayStorageEarnings = completedRentals
      .filter(rental => new Date(rental.createdAt) >= today)
      .reduce((sum, rental) => sum + rental.totalCost, 0);
    const todayEarnings = todayServiceEarnings + todayStorageEarnings;

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekServiceEarnings = completedBookings
      .filter(booking => new Date(booking.createdAt) >= weekStart)
      .reduce((sum, booking) => sum + booking.totalAmount, 0);
    const weekStorageEarnings = completedRentals
      .filter(rental => new Date(rental.createdAt) >= weekStart)
      .reduce((sum, rental) => sum + rental.totalCost, 0);
    const weekEarnings = weekServiceEarnings + weekStorageEarnings;

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthServiceEarnings = completedBookings
      .filter(booking => new Date(booking.createdAt) >= monthStart)
      .reduce((sum, booking) => sum + booking.totalAmount, 0);
    const monthStorageEarnings = completedRentals
      .filter(rental => new Date(rental.createdAt) >= monthStart)
      .reduce((sum, rental) => sum + rental.totalCost, 0);
    const monthEarnings = monthServiceEarnings + monthStorageEarnings;

    const upcomingBookings = allBookings.filter(booking => 
      booking.status === 'CONFIRMED' && 
      new Date(booking.scheduledAt) > new Date()
    ).slice(0, 5);

    const recentBookings = allBookings.slice(0, 10);

    const pendingBookings = allBookings.filter(booking => booking.status === 'PENDING').length;
    const confirmedBookings = allBookings.filter(booking => booking.status === 'CONFIRMED').length;
    const inProgressBookings = allBookings.filter(booking => booking.status === 'IN_PROGRESS').length;
    
    const ratedBookings = completedBookings.filter(booking => booking.rating > 0);
    const averageRating = ratedBookings.length > 0 
      ? ratedBookings.reduce((sum, booking) => sum + booking.rating, 0) / ratedBookings.length 
      : 0;

    const serviceStats = user.services.map(service => {
      const serviceBookings = service.bookings;
      const serviceCompleted = serviceBookings.filter(b => b.status === 'COMPLETED');
      const serviceEarnings = serviceCompleted.reduce((sum, b) => sum + b.totalAmount, 0);
      const serviceRated = serviceCompleted.filter(b => b.rating > 0);
      const serviceRating = serviceRated.length > 0 
        ? serviceRated.reduce((sum, b) => sum + b.rating, 0) / serviceRated.length 
        : 0;

      return {
        id: service.id,
        name: service.name,
        category: service.category,
        price: service.price,
        isActive: service.isActive,
        totalBookings: serviceBookings.length,
        completedBookings: serviceCompleted.length,
        earnings: serviceEarnings,
        rating: Math.round(serviceRating * 10) / 10,
        totalRatings: serviceRated.length
      };
    });

    const dashboardData = {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        rating: user.rating || averageRating
      },
      services: serviceStats,
      storageBoxes: storageBoxes.map(box => {
        const sizeToCapacity = {
          'XS': 0.3,
          'S': 0.8,
          'M': 1.5,
          'L': 3,
          'XL': 5
        };
        
        const activeRentals = box.rentals.filter(rental => rental.isActive);
        const accessCode = activeRentals.length > 0 ? activeRentals[0].accessCode : null;
        
        return {
          id: box.id,
          title: `Boîte ${box.code}`,
          code: box.code,
          location: box.location,
          size: box.size,
          capacity: sizeToCapacity[box.size] || 1,  
          type: 'Standard',
          pricePerDay: box.pricePerDay,
          isOccupied: box.isOccupied,
          isAvailable: !box.isOccupied && box.isActive,
          isActive: box.isActive,
          accessCode: accessCode,
          createdAt: box.createdAt,
          updatedAt: box.updatedAt,
          activeRentals: activeRentals,
          totalRentals: box.rentals.length,
          averageRating: 4.5,
          totalEarnings: box.rentals
            .filter(rental => !rental.isActive && rental.totalCost)
            .reduce((sum, rental) => sum + rental.totalCost, 0)
        };
      }),
      boxRentals: boxRentals.map(rental => ({
        id: rental.id,
        boxId: rental.boxId,
        startDate: rental.startDate,
        endDate: rental.endDate,
        totalCost: rental.totalCost,
        isActive: rental.isActive,
        status: rental.isActive ? 'ACTIVE' : 'ENDED',
        storageBoxTitle: `Boîte ${rental.box.code}`,
        dailyPrice: rental.box.pricePerDay,
        customerName: `${rental.user.firstName} ${rental.user.lastName}`,
        customerEmail: rental.user.email,
        duration: rental.endDate ? Math.ceil((new Date(rental.endDate) - new Date(rental.startDate)) / (1000 * 60 * 60 * 24)) : null,
        box: {
          code: rental.box.code,
          location: rental.box.location,
          size: rental.box.size,
          pricePerDay: rental.box.pricePerDay
        },
        createdAt: rental.createdAt
      })),
      bookings: allBookings.map(booking => ({
        id: booking.id,
        scheduledAt: booking.scheduledAt,
        status: booking.status,
        totalAmount: booking.totalAmount,
        totalPrice: booking.totalAmount,
        notes: booking.notes,
        address: booking.address,
        serviceName: booking.service.name,
        customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
        customerEmail: booking.customer.email,
        duration: booking.service.duration || 'Non spécifiée',
        service: {
          name: booking.service.name,
          category: booking.service.category
        },
        customer: booking.customer,
        rating: booking.rating,
        review: booking.review,
        createdAt: booking.createdAt
      })),
      upcomingBookings: upcomingBookings.map(booking => ({
        id: booking.id,
        scheduledAt: booking.scheduledAt,
        status: booking.status,
        totalAmount: booking.totalAmount,
        notes: booking.notes,
        address: booking.address,
        service: {
          name: booking.service.name,
          category: booking.service.category
        },
        customer: booking.customer
      })),
      recentBookings: recentBookings.map(booking => ({
        id: booking.id,
        scheduledAt: booking.scheduledAt,
        status: booking.status,
        totalAmount: booking.totalAmount,
        totalPrice: booking.totalAmount,
        notes: booking.notes,
        address: booking.address,
        serviceName: booking.service.name,
        customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
        customerEmail: booking.customer.email,
        duration: booking.service.duration || 'Non spécifiée',
        service: {
          name: booking.service.name,
          category: booking.service.category
        },
        customer: booking.customer,
        rating: booking.rating,
        review: booking.review,
        createdAt: booking.createdAt
      })),
      payments: [
        ...completedBookings.map(booking => ({
          id: booking.id,
          amount: booking.totalAmount,
          status: 'COMPLETED',
          serviceName: booking.service.name,
          customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
          type: 'service',
          createdAt: booking.createdAt
        })),
        ...completedRentals.map(rental => ({
          id: rental.id,
          amount: rental.totalCost,
          status: 'COMPLETED',
          storageBoxName: `Boîte ${rental.box.code}`,
          customerName: `${rental.user.firstName} ${rental.user.lastName}`,
          type: 'storage',
          createdAt: rental.createdAt
        }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      reviews: [
        ...completedBookings.filter(booking => booking.rating > 0).map(booking => ({
          id: booking.id,
          rating: booking.rating,
          comment: booking.review || 'Aucun commentaire',
          customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
          serviceName: booking.service.name,
          type: 'service',
          createdAt: booking.createdAt,
          isRead: true
        }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      notifications: [
        ...allBookings.filter(booking => booking.status === 'PENDING').map(booking => ({
          id: `booking-${booking.id}`,
          type: 'BOOKING_REQUEST',
          title: 'Nouvelle demande de réservation',
          message: `${booking.customer.firstName} ${booking.customer.lastName} souhaite réserver votre service "${booking.service.name}"`,
          isRead: false,
          createdAt: booking.createdAt
        })),
        ...boxRentals.filter(rental => rental.isActive).map(rental => ({
          id: `rental-${rental.id}`,
          type: 'STORAGE_RENTAL',
          title: 'Nouvelle location de boîte',
          message: `${rental.user.firstName} ${rental.user.lastName} a loué votre boîte ${rental.box.code}`,
          isRead: false,
          createdAt: rental.createdAt
        }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      earnings: {
        today: todayEarnings,
        week: weekEarnings,
        month: monthEarnings,
        total: totalEarnings
      },
      stats: {
        totalServices: user.services.length,
        activeServices: user.services.filter(s => s.isActive).length,
        totalStorageBoxes: storageBoxes.length,
        availableStorageBoxes: storageBoxes.filter(box => !box.isOccupied && box.isActive).length,
        occupiedStorageBoxes: storageBoxes.filter(box => box.isOccupied).length,
        totalBookings: allBookings.length,
        totalBoxRentals: boxRentals.length,
        activeBoxRentals: boxRentals.filter(rental => rental.isActive).length,
        pendingBookings,
        confirmedBookings,
        inProgressBookings,
        completedBookings: completedBookings.length,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: ratedBookings.length
      }
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Service provider dashboard API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 