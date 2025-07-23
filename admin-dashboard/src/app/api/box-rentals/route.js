import { PrismaClient } from '@/generated/prisma';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const boxRentals = await prisma.boxRental.findMany({
      include: {
        box: {
          select: {
            id: true,
            code: true,
            location: true,
            size: true,
            pricePerDay: true,
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

    // Format the data for the frontend
    const formattedRentals = boxRentals.map(rental => ({
      id: rental.id,
      boxId: rental.boxId,
      userId: rental.userId,
      startDate: rental.startDate,
      endDate: rental.endDate,
      totalCost: rental.totalCost,
      accessCode: rental.accessCode,
      isActive: rental.isActive,
      paymentStatus: rental.totalCost ? 'PAID' : 'PENDING', // Approximation
      notes: null,
      createdAt: rental.createdAt,
      updatedAt: rental.updatedAt,
      box: rental.box,
      user: rental.user
    }));

    return NextResponse.json(formattedRentals);
  } catch (error) {
    console.error('Error fetching box rentals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch box rentals' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    const boxRental = await prisma.boxRental.create({
      data: {
        boxId: data.boxId,
        userId: data.userId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        totalCost: data.totalCost,
        accessCode: data.accessCode,
        isActive: data.isActive ?? true,
      },
      include: {
        box: {
          select: {
            id: true,
            code: true,
            location: true,
            size: true,
            pricePerDay: true,
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
      }
    });

    return NextResponse.json(boxRental, { status: 201 });
  } catch (error) {
    console.error('Error creating box rental:', error);
    return NextResponse.json(
      { error: 'Failed to create box rental' },
      { status: 500 }
    );
  }
} 