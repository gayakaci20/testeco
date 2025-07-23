import { PrismaClient } from '@/generated/prisma';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const storageBoxes = await prisma.storageBox.findMany({
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
        createdAt: 'desc'
      }
    });

    return NextResponse.json(storageBoxes);
  } catch (error) {
    console.error('Error fetching storage boxes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage boxes' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    const storageBox = await prisma.storageBox.create({
      data: {
        code: data.code,
        location: data.location,
        size: data.size,
        pricePerDay: data.pricePerDay,
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
      }
    });

    return NextResponse.json(storageBox, { status: 201 });
  } catch (error) {
    console.error('Error creating storage box:', error);
    return NextResponse.json(
      { error: 'Failed to create storage box' },
      { status: 500 }
    );
  }
} 