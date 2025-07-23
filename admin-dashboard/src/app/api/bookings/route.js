import { PrismaClient } from '@/generated/prisma';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
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

    // Filter to ensure we only get real service bookings
    // (not any potential storage box bookings that might have been created by mistake)
    const serviceBookings = bookings.filter(booking => 
      booking.service && 
      booking.service.name && 
      !booking.service.name.toLowerCase().includes('boîte') &&
      !booking.service.name.toLowerCase().includes('box') &&
      !booking.service.name.toLowerCase().includes('stockage')
    );

    return NextResponse.json(serviceBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    const booking = await prisma.booking.create({
      data: {
        ...data,
        scheduledDate: new Date(data.scheduledDate),
      },
      include: {
        service: {
          select: {
            name: true,
            category: true,
          }
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        provider: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
} 