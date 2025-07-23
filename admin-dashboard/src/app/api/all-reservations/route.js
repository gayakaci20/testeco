import { PrismaClient } from '@/generated/prisma';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch service bookings
    const bookings = await prisma.booking.findMany({
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
          }
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          }
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch storage box rentals
    const boxRentals = await prisma.boxRental.findMany({
      include: {
        box: {
          select: {
            id: true,
            code: true,
            location: true,
            size: true,
            pricePerDay: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform bookings to unified format
    const unifiedBookings = bookings.map(booking => ({
      id: booking.id,
      type: 'service',
      serviceId: booking.serviceId,
      customerId: booking.customerId,
      providerId: booking.providerId,
      scheduledAt: booking.scheduledAt,
      duration: booking.duration,
      totalAmount: booking.totalAmount,
      status: booking.status,
      notes: booking.notes,
      address: booking.address,
      rating: booking.rating,
      review: booking.review,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      // Service-specific data
      service: {
        id: booking.service.id,
        name: booking.service.name,
        category: booking.service.category,
        price: booking.service.price,
      },
      customer: booking.customer,
      provider: booking.provider,
      // Unified display fields
      itemName: booking.service.name,
      itemType: 'Service',
      customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
      providerName: `${booking.provider.firstName} ${booking.provider.lastName}`,
      price: booking.totalAmount,
      statusLabel: getBookingStatusLabel(booking.status),
      dateTime: booking.scheduledAt
    }));

    // Transform box rentals to unified format
    const unifiedRentals = boxRentals.map(rental => ({
      id: rental.id,
      type: 'storage',
      boxId: rental.boxId,
      userId: rental.userId,
      startDate: rental.startDate,
      endDate: rental.endDate,
      totalCost: rental.totalCost,
      accessCode: rental.accessCode,
      isActive: rental.isActive,
      createdAt: rental.createdAt,
      updatedAt: rental.updatedAt,
      // Storage-specific data
      box: rental.box,
      user: rental.user,
      // Unified display fields
      itemName: `Boîte ${rental.box.code}`,
      itemType: 'Boîte de stockage',
      customerName: `${rental.user.firstName} ${rental.user.lastName}`,
      providerName: rental.box.owner ? 
        `${rental.box.owner.firstName} ${rental.box.owner.lastName}` : 
        'ecodeli', // Fallback to platform name if no owner
      price: rental.totalCost,
      statusLabel: rental.isActive ? 'Active' : 'Terminée',
      dateTime: rental.startDate,
      // Map to booking-like structure
      serviceId: null,
      customerId: rental.userId,
      providerId: rental.box.owner?.id || null,
      scheduledAt: rental.startDate,
      duration: rental.endDate ? Math.ceil((new Date(rental.endDate) - new Date(rental.startDate)) / (1000 * 60 * 60 * 24)) * 24 * 60 : null, // in minutes
      totalAmount: rental.totalCost,
      status: rental.isActive ? 'IN_PROGRESS' : 'COMPLETED',
      notes: `Location de boîte de stockage ${rental.box.code} à ${rental.box.location}`,
      address: rental.box.location,
      rating: null,
      review: null,
      customer: rental.user,
      provider: rental.box.owner || null,
      service: {
        id: rental.box.id,
        name: `Boîte ${rental.box.code}`,
        category: 'STORAGE',
        price: rental.box.pricePerDay,
      }
    }));

    // Combine and sort by creation date
    const allReservations = [...unifiedBookings, ...unifiedRentals]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({
      total: allReservations.length,
      bookings: unifiedBookings.length,
      rentals: unifiedRentals.length,
      data: allReservations
    });

  } catch (error) {
    console.error('Error fetching all reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}

function getBookingStatusLabel(status) {
  const statusLabels = {
    'PENDING': 'En Attente',
    'CONFIRMED': 'Confirmé',
    'IN_PROGRESS': 'En Cours',
    'COMPLETED': 'Terminé',
    'CANCELLED': 'Annulé',
    'REFUNDED': 'Remboursé',
  };
  return statusLabels[status] || status;
} 