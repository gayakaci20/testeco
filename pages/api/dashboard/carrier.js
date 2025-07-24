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

    // Ensure database connection before queries
    await ensureConnected();

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        rides: {
          include: {
            matches: {
              include: {
                package: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true, email: true }
                    }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user || user.role !== 'CARRIER') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get available matches for this carrier
    const availableMatches = await prisma.match.findMany({
      where: {
                  status: 'PENDING',
        ride: {
          userId: userId
        }
      },
      include: {
        package: {
          select: {
            id: true,
            description: true,
            weight: true,
            dimensions: true,
            senderAddress: true,
            recipientAddress: true,
            price: true,
            user: {
              select: { firstName: true, lastName: true, email: true, phoneNumber: true }
            }
          }
        },
        ride: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get confirmed deliveries
    const myDeliveries = await prisma.match.findMany({
      where: {
        status: { in: ['CONFIRMED', 'ACCEPTED_BY_CARRIER', 'ACCEPTED_BY_SENDER', 'IN_PROGRESS', 'COMPLETED'] },
        ride: {
          userId: userId
        }
      },
      include: {
        package: {
          select: {
            id: true,
            description: true,
            weight: true,
            dimensions: true,
            senderAddress: true,
            recipientAddress: true,
            price: true,
            status: true,
            user: {
              select: { firstName: true, lastName: true, email: true, phoneNumber: true }
            }
          }
        },
        ride: true,
        payment: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Calculate earnings from completed deliveries
    const completedDeliveries = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        match: {
          ride: {
            userId: userId
          }
        }
      },
      include: {
        match: true
      }
    });

    const totalEarnings = completedDeliveries.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEarnings = completedDeliveries
      .filter(payment => new Date(payment.createdAt) >= today)
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate this week's earnings
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEarnings = completedDeliveries
      .filter(payment => new Date(payment.createdAt) >= weekStart)
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate this month's earnings
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEarnings = completedDeliveries
      .filter(payment => new Date(payment.createdAt) >= monthStart)
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate stats - use match status for consistency
    const totalDeliveries = myDeliveries.length;
    const activeDeliveries = myDeliveries.filter(d => ['CONFIRMED', 'ACCEPTED_BY_CARRIER', 'ACCEPTED_BY_SENDER', 'IN_PROGRESS'].includes(d.status)).length;
    const deliveriesCompleted = myDeliveries.filter(d => d.status === 'COMPLETED').length;
    const pendingDeliveries = myDeliveries.filter(d => d.status === 'CONFIRMED').length;
    const inTransitDeliveries = myDeliveries.filter(d => ['ACCEPTED_BY_CARRIER', 'IN_PROGRESS'].includes(d.status)).length;
    
    // Mock rating for now (could be calculated from reviews)
    const averageRating = 4.8;
    const successRate = totalDeliveries > 0 ? ((totalDeliveries / (totalDeliveries + 1)) * 100) : 100;

    const dashboardData = {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phoneNumber,
        isVerified: user.isVerified
      },
      availableMatches: availableMatches.map(match => ({
        id: match.id,
        package: {
          id: match.package.id,
          title: match.package.description,
          description: match.package.description,
          weight: match.package.weight,
          dimensions: match.package.dimensions,
          fromAddress: match.package.senderAddress,
          toAddress: match.package.recipientAddress,
          price: match.package.price,
          user: match.package.user
        },
        ride: {
          id: match.ride.id,
          fromAddress: match.ride.startLocation,
          toAddress: match.ride.endLocation,
          departureTime: match.ride.departureTime,
          availableSpace: match.ride.availableSeats
        },
        createdAt: match.createdAt
      })),
      // Support both field names for backward compatibility
      myDeliveries: myDeliveries.map(delivery => {
        const isMerchantDelivery = delivery.package.description.includes('[MERCHANT_DELIVERY]');
        const cleanTitle = delivery.package.description.replace('[MERCHANT_DELIVERY] ', '');
        
        // Map match status to appropriate display status for consistency
        let displayStatus = delivery.package.status;
        if (delivery.status === 'COMPLETED' && delivery.package.status === 'DELIVERED') {
          displayStatus = 'DELIVERED';
        } else if (delivery.status === 'IN_PROGRESS' && delivery.package.status === 'IN_TRANSIT') {
          displayStatus = 'IN_TRANSIT';
        } else if (delivery.status === 'ACCEPTED_BY_CARRIER' && delivery.package.status === 'ACCEPTED_BY_CARRIER') {
          displayStatus = 'ACCEPTED_BY_CARRIER';
        } else {
          // Use package status as fallback
          displayStatus = delivery.package.status;
        }
        
        return {
          id: delivery.id,
          status: displayStatus, // Use consistent mapped status
          title: cleanTitle,
          description: cleanTitle,
          weight: delivery.package.weight,
          dimensions: delivery.package.dimensions,
          fromAddress: delivery.package.senderAddress,
          toAddress: delivery.package.recipientAddress,
          price: delivery.package.price,
          senderName: delivery.package.user ? `${delivery.package.user.firstName} ${delivery.package.user.lastName}` : delivery.package.senderName || 'N/A',
          acceptedAt: delivery.updatedAt,
          createdAt: delivery.createdAt,
          updatedAt: delivery.updatedAt,
          package: {
            id: delivery.package.id,
            title: cleanTitle,
            description: cleanTitle,
            fromAddress: delivery.package.senderAddress,
            toAddress: delivery.package.recipientAddress,
            user: delivery.package.user,
            isMerchant: isMerchantDelivery
          },
          ride: {
            id: delivery.ride.id,
            departureTime: delivery.ride.departureTime
          },
          payment: delivery.payment ? {
            amount: delivery.payment.amount,
            status: delivery.payment.status
          } : null,
          isMerchantDelivery: isMerchantDelivery
        };
      }),
      // Add deliveries field that points to the same data
      deliveries: myDeliveries.map(delivery => {
        const isMerchantDelivery = delivery.package.description.includes('[MERCHANT_DELIVERY]');
        const cleanTitle = delivery.package.description.replace('[MERCHANT_DELIVERY] ', '');
        
        // Map match status to appropriate display status for consistency
        let displayStatus = delivery.package.status;
        if (delivery.status === 'COMPLETED' && delivery.package.status === 'DELIVERED') {
          displayStatus = 'DELIVERED';
        } else if (delivery.status === 'IN_PROGRESS' && delivery.package.status === 'IN_TRANSIT') {
          displayStatus = 'IN_TRANSIT';
        } else if (delivery.status === 'ACCEPTED_BY_CARRIER' && delivery.package.status === 'ACCEPTED_BY_CARRIER') {
          displayStatus = 'ACCEPTED_BY_CARRIER';
        } else {
          // Use package status as fallback
          displayStatus = delivery.package.status;
        }
        
        return {
          id: delivery.id,
          status: displayStatus, // Use consistent mapped status
          title: cleanTitle,
          description: cleanTitle,
          weight: delivery.package.weight,
          dimensions: delivery.package.dimensions,
          fromAddress: delivery.package.senderAddress,
          toAddress: delivery.package.recipientAddress,
          price: delivery.package.price,
          senderName: delivery.package.user ? `${delivery.package.user.firstName} ${delivery.package.user.lastName}` : delivery.package.senderName || 'N/A',
          acceptedAt: delivery.updatedAt,
          createdAt: delivery.createdAt,
          updatedAt: delivery.updatedAt,
          package: {
            id: delivery.package.id,
            title: cleanTitle,
            description: cleanTitle,
            fromAddress: delivery.package.senderAddress,
            toAddress: delivery.package.recipientAddress,
            user: delivery.package.user,
            isMerchant: isMerchantDelivery
          },
          ride: {
            id: delivery.ride.id,
            departureTime: delivery.ride.departureTime
          },
          payment: delivery.payment ? {
            amount: delivery.payment.amount,
            status: delivery.payment.status
          } : null,
          isMerchantDelivery: isMerchantDelivery
        };
      }),
      // Add rides field from user.rides
      rides: (user.rides || []).map(ride => ({
        id: ride.id,
        from: ride.origin || ride.startLocation || '',
        to: ride.destination || ride.endLocation || '',
        departureTime: ride.departureTime,
        availableSpace: ride.availableSpace || ride.availableSeats || 3,
        distance: ride.distance || 0,
        pricePerKm: ride.pricePerKg || ride.pricePerKm || 0,
        vehicleType: ride.vehicleType || 'N/A',
        status: ride.status || 'PENDING',
        createdAt: ride.createdAt,
        updatedAt: ride.updatedAt,
        packages: ride.matches ? ride.matches.map(match => ({
          id: match.package.id,
          title: match.package.description,
          status: match.status
        })) : []
      })),
      earnings: {
        today: todayEarnings,
        week: weekEarnings,
        month: monthEarnings,
        total: totalEarnings
      },
      stats: {
        totalDeliveries,
        activeDeliveries,
        deliveriesCompleted,
        pendingDeliveries,
        inTransitDeliveries,
        successRate: Math.round(successRate * 10) / 10,
        averageRating
      }
    };

    console.log('📊 Carrier dashboard API response:', {
      availableMatches: dashboardData.availableMatches.length,
      myDeliveries: dashboardData.myDeliveries.length,
      deliveries: dashboardData.deliveries.length,
      rides: dashboardData.rides.length,
      userRides: user.rides?.length || 0,
      userId: userId
    });

    // Debug: Log user rides details
    if (user.rides && user.rides.length > 0) {
      console.log('🚗 User rides found:', user.rides.map(r => ({
        id: r.id,
        origin: r.origin,
        destination: r.destination,
        status: r.status,
        createdAt: r.createdAt
      })));
    } else {
      console.log('⚠️ No rides found for user:', userId);
    }

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Carrier dashboard API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 