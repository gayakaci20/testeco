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
    
    if (!userId) {
      console.error('No userId found in decoded token:', decodedToken);
      return res.status(401).json({ error: 'Unauthorized - No user ID in token' });
    }

    // Get user info with complete package details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        packages: {
          include: {
            matches: {
              include: {
                ride: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true, email: true, phoneNumber: true }
                    }
                  }
                },
                payment: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`Found user: ${user.email}, packages count: ${user.packages?.length || 0}`);
    
    // Log des packages pour débugger
    if (user.packages && user.packages.length > 0) {
      console.log('User packages:', user.packages.map(pkg => ({
        id: pkg.id,
        title: pkg.description,
        status: pkg.status,
        createdAt: pkg.createdAt
      })));
    } else {
      console.log('No packages found for user');
    }

    // Get available services
    const availableServices = await prisma.service.findMany({
      where: {
        isActive: true
      },
      include: {
        provider: {
          select: { firstName: true, lastName: true, email: true }
        },
        bookings: {
          select: { rating: true },
          where: { rating: { not: null } }
        }
      },
      orderBy: { rating: 'desc' },
      take: 6
    });

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: {
        customerId: userId
      },
      include: {
        service: {
          include: {
            provider: {
              select: { firstName: true, lastName: true, email: true, phoneNumber: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get customer's box rentals
    const boxRentals = await prisma.boxRental.findMany({
      where: {
        userId: userId
      },
      include: {
        box: {
          include: {
            owner: {
              select: { firstName: true, lastName: true, email: true, phoneNumber: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get all payments with complete details
    const allPayments = await prisma.payment.findMany({
      where: {
        userId: userId
      },
      include: {
        match: {
          include: {
            package: {
              select: { description: true, id: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate spending from completed payments
    const completedPayments = allPayments.filter(p => p.status === 'COMPLETED');
    const totalSpent = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate today's spending
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySpent = completedPayments
      .filter(payment => new Date(payment.createdAt) >= today)
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate this month's spending
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthSpent = completedPayments
      .filter(payment => new Date(payment.createdAt) >= monthStart)
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Get available storage boxes
    const storageBoxes = await prisma.storageBox.findMany({
      where: {
        isOccupied: false
      },
      include: {
        rentals: {
          where: {
            isActive: true
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      },
      orderBy: {
        pricePerDay: 'asc'
      },
      take: 6
    });

    // Get package statistics with proper status mapping
    const activePackages = user.packages.filter(pkg => {
      return pkg.matches.some(match => 
        match.status === 'ACCEPTED_BY_SENDER' || 
        match.status === 'IN_TRANSIT' ||
        match.status === 'CONFIRMED'
      );
    }).length;

    const deliveredPackages = user.packages.filter(pkg => {
      return pkg.matches.some(match => match.status === 'DELIVERED');
    }).length;

    const pendingPackages = user.packages.filter(pkg => {
      return pkg.matches.length === 0 || 
             pkg.matches.every(match => match.status === 'PENDING');
    }).length;

    // Get booking statistics (including both services and box rentals)
    const allBookingsAndRentals = [
      ...recentBookings.map(b => ({ ...b, type: 'service' })),
      ...boxRentals.map(r => ({ 
        ...r, 
        type: 'box_rental',
        status: r.isActive ? 'CONFIRMED' : (r.totalCost ? 'PAID' : 'PENDING')
      }))
    ];

    const activeBookings = allBookingsAndRentals.filter(item => 
      item.status === 'CONFIRMED' || item.status === 'IN_PROGRESS' || item.status === 'PAID'
    ).length;

    const completedBookings = allBookingsAndRentals.filter(item => 
      item.status === 'COMPLETED' || (item.type === 'box_rental' && !item.isActive && item.totalCost)
    ).length;

    const dashboardData = {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phoneNumber,
        isVerified: user.isVerified
      },
      packages: user.packages.map(pkg => ({
        id: pkg.id,
        title: pkg.description,
        description: pkg.description,
        status: pkg.status,
        fromAddress: pkg.senderAddress,
        toAddress: pkg.recipientAddress,
        price: pkg.price,
        weight: pkg.weight,
        dimensions: pkg.dimensions,
        sizeLabel: pkg.sizeLabel,
        isFragile: pkg.isFragile,
        requiresRefrigeration: pkg.requiresRefrigeration,
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
        matches: pkg.matches.map(match => ({
          id: match.id,
          status: match.status,
          proposedPrice: match.proposedPrice,
          carrier: match.ride?.user ? {
            firstName: match.ride.user.firstName,
            lastName: match.ride.user.lastName,
            email: match.ride.user.email,
            phoneNumber: match.ride.user.phoneNumber
          } : null,
          payment: match.payment
        }))
      })),
      availableServices: availableServices.map(service => {
        const ratings = service.bookings.map(b => b.rating).filter(r => r !== null);
        const averageRating = ratings.length > 0 ? 
          (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) : null;
        
        return {
          id: service.id,
          name: service.name,
          description: service.description,
          category: service.category,
          price: service.price,
          duration: service.duration,
          rating: service.rating,
          averageRating: averageRating,
          totalRatings: ratings.length,
          provider: service.provider
        };
      }),
      recentBookings: [
        // Service bookings
        ...recentBookings.map(booking => ({
          id: booking.id,
          type: 'service',
          scheduledAt: booking.scheduledAt,
          status: booking.status,
          totalPrice: booking.totalAmount || booking.price,
          notes: booking.notes,
          address: booking.address,
          serviceName: booking.service.name,
          service: {
            name: booking.service.name,
            category: booking.service.category,
            provider: booking.service.provider
          },
          rating: booking.rating,
          review: booking.review,
          createdAt: booking.createdAt
        })),
        // Box rentals
        ...boxRentals.map(rental => ({
          id: rental.id,
          type: 'box_rental',
          scheduledAt: rental.startDate,
          status: rental.isActive ? 'CONFIRMED' : (rental.totalCost ? 'PAID' : 'PENDING'),
          totalPrice: rental.totalCost || 0,
          notes: `Location de ${rental.startDate ? new Date(rental.startDate).toLocaleDateString() : ''} à ${rental.endDate ? new Date(rental.endDate).toLocaleDateString() : 'durée indéterminée'}`,
          address: rental.box.location,
          serviceName: `Location boîte ${rental.box.code}`,
          service: {
            name: `Location boîte ${rental.box.code}`,
            category: 'STORAGE',
            provider: rental.box.owner
          },
          box: {
            code: rental.box.code,
            location: rental.box.location,
            size: rental.box.size,
            pricePerDay: rental.box.pricePerDay,
            accessCode: rental.accessCode
          },
          startDate: rental.startDate,
          endDate: rental.endDate,
          isActive: rental.isActive,
          rating: null,
          review: null,
          createdAt: rental.createdAt
        }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      payments: allPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
                        serviceName: payment.match?.package?.description ? `Livraison - ${payment.match.package.description}` : 'Service de livraison',
        type: 'delivery' // Tous les paiements sont pour des livraisons (packages)
      })),
      spending: {
        today: todaySpent,
        month: monthSpent,
        total: totalSpent
      },
      storageBoxes: storageBoxes.map(box => ({
        id: box.id,
        title: `Boîte ${box.code}`,
        description: `Boîte de stockage ${box.size.toLowerCase()} disponible`,
        location: box.location,
        size: box.size,
        pricePerDay: box.pricePerDay,
        isOccupied: box.isOccupied,
        code: box.code
      })),
      stats: {
        totalPackages: user.packages.length,
        activePackages,
        deliveredPackages,
        pendingPackages,
        totalBookings: recentBookings.length + boxRentals.length,
        totalBoxRentals: boxRentals.length,
        activeBoxRentals: boxRentals.filter(r => r.isActive).length,
        activeBookings,
        completedBookings,
        totalSpent
      }
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Customer dashboard API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 