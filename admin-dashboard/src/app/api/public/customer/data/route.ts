import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to verify JWT token
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token d\'authentification requis' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Get user with all related data
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
                payment: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        customerBookings: {
          include: {
            service: {
              include: {
                provider: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phoneNumber: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          include: {
            match: {
              include: {
                package: {
                  select: { id: true, description: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Check if user is a customer
    if (user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Accès réservé aux clients uniquement' },
        { status: 403 }
      );
    }

    // Calculate statistics
    const totalPackages = user.packages.length;
    const activePackages = user.packages.filter(pkg => 
      pkg.matches.some(match => 
        ['CONFIRMED', 'IN_TRANSIT', 'ACCEPTED_BY_CARRIER'].includes(match.status)
      )
    ).length;
    
    const deliveredPackages = user.packages.filter(pkg => 
      pkg.matches.some(match => match.status === 'COMPLETED')
    ).length;
    
    const pendingPackages = user.packages.filter(pkg => 
      pkg.matches.length === 0 || pkg.matches.every(match => match.status === 'PENDING')
    ).length;

    const totalBookings = user.customerBookings.length;
    const activeBookings = user.customerBookings.filter(booking => 
      ['CONFIRMED', 'IN_PROGRESS'].includes(booking.status)
    ).length;
    
    const completedBookings = user.customerBookings.filter(booking => 
      booking.status === 'COMPLETED'
    ).length;

    // Calculate spending
    const completedPayments = user.payments.filter(p => p.status === 'COMPLETED');
    const totalSpent = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Today's spending
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySpent = completedPayments
      .filter(payment => new Date(payment.createdAt) >= today)
      .reduce((sum, payment) => sum + payment.amount, 0);

    // This month's spending
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthSpent = completedPayments
      .filter(payment => new Date(payment.createdAt) >= monthStart)
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Format response data
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        isVerified: user.isVerified,
        role: user.role,
        userType: user.userType
      },
      
      // Deliveries (packages)
      deliveries: user.packages.map(pkg => ({
        id: pkg.id,
        title: pkg.description,
        description: pkg.description,
        status: pkg.status,
        fromAddress: pkg.senderAddress,
        toAddress: pkg.recipientAddress,
        price: pkg.price,
        weight: pkg.weight,
        dimensions: pkg.dimensions,
                 sizeLabel: pkg.size,
         isFragile: pkg.fragile,
         requiresRefrigeration: pkg.urgent,
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt,
        matches: pkg.matches.map(match => ({
          id: match.id,
          status: match.status,
                     proposedPrice: match.price,
          acceptedAt: match.updatedAt,
          carrier: match.ride?.user ? {
            id: match.ride.user.id,
            firstName: match.ride.user.firstName,
            lastName: match.ride.user.lastName,
            email: match.ride.user.email,
            phoneNumber: match.ride.user.phoneNumber
          } : null,
          payment: match.payment ? {
            id: match.payment.id,
            amount: match.payment.amount,
            status: match.payment.status,
            createdAt: match.payment.createdAt
          } : null
        }))
      })),

      // Services (bookings)
      services: user.customerBookings.map(booking => ({
        id: booking.id,
        serviceName: booking.service.name,
        serviceCategory: booking.service.category,
        status: booking.status,
        scheduledAt: booking.scheduledAt,
                 completedAt: booking.updatedAt,
         totalPrice: booking.totalAmount,
        address: booking.address,
        notes: booking.notes,
        rating: booking.rating,
        review: booking.review,
        provider: booking.service.provider ? {
          id: booking.service.provider.id,
          firstName: booking.service.provider.firstName,
          lastName: booking.service.provider.lastName,
          email: booking.service.provider.email,
          phoneNumber: booking.service.provider.phoneNumber
        } : null,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      })),

      // Payments
      payments: user.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        type: payment.match?.package ? 'delivery' : 'service',
        serviceName: payment.match?.package?.description 
          ? `Livraison - ${payment.match.package.description}` 
          : 'Service',
        createdAt: payment.createdAt
      })),

      // Notifications
      notifications: user.notifications.map(notif => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        isRead: notif.isRead,
        relatedEntityId: notif.relatedEntityId,
        createdAt: notif.createdAt
      })),

      // Statistics
      statistics: {
        packages: {
          total: totalPackages,
          active: activePackages,
          delivered: deliveredPackages,
          pending: pendingPackages
        },
        services: {
          total: totalBookings,
          active: activeBookings,
          completed: completedBookings
        },
        spending: {
          today: todaySpent,
          month: monthSpent,
          total: totalSpent
        }
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Public customer data error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
} 