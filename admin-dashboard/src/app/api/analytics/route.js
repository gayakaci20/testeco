import { PrismaClient } from '@/generated/prisma';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Fetch all data
    const [
      users,
      services,
      bookings,
      packages,
      storageBoxes,
      boxRentals,
      payments
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.service.findMany(),
      prisma.booking.findMany({
        include: {
          service: true
        }
      }),
      prisma.package.findMany(),
      prisma.storageBox.findMany(),
      prisma.boxRental.findMany({
        where: {
          isActive: true
        }
      }),
      prisma.payment.findMany({
        where: {
          status: 'COMPLETED'
        }
      })
    ]);

    // Calculate user metrics
    const usersByRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    const newUsersThisMonth = users.filter(user => 
      new Date(user.createdAt) >= startDate
    ).length;

    // Calculate service metrics
    const servicesByCategory = services.reduce((acc, service) => {
      acc[service.category] = (acc[service.category] || 0) + 1;
      return acc;
    }, {});

    const averageRating = services.length > 0 
      ? services.reduce((sum, service) => sum + (service.rating || 0), 0) / services.length
      : 0;

    // Calculate booking metrics
    const bookingsByStatus = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    const bookingsThisMonth = bookings.filter(booking => 
      new Date(booking.createdAt) >= startDate
    ).length;

    const bookingRevenue = bookings
      .filter(booking => booking.status === 'COMPLETED')
      .reduce((sum, booking) => sum + booking.totalPrice, 0);

    // Calculate package metrics
    const packagesByStatus = packages.reduce((acc, pkg) => {
      acc[pkg.status] = (acc[pkg.status] || 0) + 1;
      return acc;
    }, {});

    // Calculate storage box metrics
    const occupiedBoxes = storageBoxes.filter(box => box.isOccupied).length;
    const occupancyRate = storageBoxes.length > 0 
      ? (occupiedBoxes / storageBoxes.length) * 100 
      : 0;

    const storageRevenue = boxRentals.reduce((sum, rental) => 
      sum + (rental.totalCost || 0), 0
    );

    // Calculate revenue metrics
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    const revenueThisMonth = payments
      .filter(payment => new Date(payment.createdAt) >= startDate)
      .reduce((sum, payment) => sum + payment.amount, 0);

    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const revenueLastMonth = payments
      .filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate >= lastMonthStart && paymentDate < startDate;
      })
      .reduce((sum, payment) => sum + payment.amount, 0);

    const revenueGrowth = revenueLastMonth > 0 
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 
      : 0;

    const revenueBySource = {
      bookings: bookingRevenue,
      storage: storageRevenue,
      packages: payments
        .filter(p => p.matchId)
        .reduce((sum, p) => sum + p.amount, 0)
    };

    const analytics = {
      users: {
        total: users.length,
        byRole: usersByRole,
        newThisMonth: newUsersThisMonth,
        growthRate: 0 // Could calculate based on previous period
      },
      services: {
        total: services.length,
        active: services.filter(s => s.isActive).length,
        byCategory: servicesByCategory,
        averageRating
      },
      bookings: {
        total: bookings.length,
        completed: bookingsByStatus.COMPLETED || 0,
        pending: bookingsByStatus.PENDING || 0,
        cancelled: bookingsByStatus.CANCELLED || 0,
        thisMonth: bookingsThisMonth,
        revenue: bookingRevenue
      },
      packages: {
        total: packages.length,
        delivered: packagesByStatus.DELIVERED || 0,
        inTransit: packagesByStatus.IN_TRANSIT || 0,
        pending: packagesByStatus.PENDING || 0
      },
      storageBoxes: {
        total: storageBoxes.length,
        occupied: occupiedBoxes,
        revenue: storageRevenue,
        occupancyRate
      },
      revenue: {
        total: totalRevenue,
        thisMonth: revenueThisMonth,
        lastMonth: revenueLastMonth,
        growth: revenueGrowth,
        bySource: revenueBySource
      }
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
} 