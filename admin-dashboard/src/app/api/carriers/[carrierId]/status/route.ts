import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';



export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ carrierId: string }> }
) {
  try {
    const { carrierId } = await params;
    const { isOnline } = await request.json();

    // For now, we'll just return success since we don't have isOnline field in schema
    // In a real implementation, you might want to add these fields to the User model
    const carrier = await prisma.user.findUnique({
      where: {
        id: carrierId,
        role: 'CARRIER'
      }
    });

    if (!carrier) {
      return NextResponse.json(
        { success: false, error: 'Carrier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Carrier status would be updated to ${isOnline ? 'online' : 'offline'}`,
      data: {
        id: carrier.id,
        isOnline: isOnline, // Simulated value
        lastActiveAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating carrier status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update carrier status' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ carrierId: string }> }
) {
  try {
    const { carrierId } = await params;

    const carrier = await prisma.user.findUnique({
      where: {
        id: carrierId,
        role: 'CARRIER'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        isVerified: true,
        createdAt: true,
        rides: {
          select: {
            id: true
          }
        }
      }
    });

    if (!carrier) {
      return NextResponse.json(
        { success: false, error: 'Carrier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...carrier,
        isOnline: Math.random() > 0.5, // Simulated online status
        lastActiveAt: new Date().toISOString(),
        ridesCount: carrier.rides.length
      }
    });

  } catch (error) {
    console.error('Error fetching carrier:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch carrier' },
      { status: 500 }
    );
  }
} 