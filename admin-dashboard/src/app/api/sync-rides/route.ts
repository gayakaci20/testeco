import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { rides } = await request.json();

    if (!rides || !Array.isArray(rides)) {
      return NextResponse.json(
        { error: 'Rides array is required' },
        { status: 400 }
      );
    }

    const syncedRides = [];

    for (const ride of rides) {
      try {
        // Check if ride already exists
        const existingRide = await prisma.ride.findUnique({
          where: { id: ride.id }
        });

        if (existingRide) {
          // Update existing ride
          const updatedRide = await prisma.ride.update({
            where: { id: ride.id },
            data: {
              userId: ride.userId,
              origin: ride.origin || ride.startLocation,
              destination: ride.destination || ride.endLocation,
              departureTime: new Date(ride.departureTime),
              arrivalTime: ride.arrivalTime ? new Date(ride.arrivalTime) : null,
              availableSpace: ride.availableSpace || 'MEDIUM' || 'SMALL' || 'LARGE',
              pricePerKg: ride.pricePerKg || 2.5,
              vehicleType: ride.vehicleType,
              maxWeight: ride.maxWeight || ride.maxPackageWeight,
              description: ride.description || ride.notes,
              status: ride.status || 'AVAILABLE'
            }
          });
          syncedRides.push(updatedRide);
        } else {
          // Create new ride
          const newRide = await prisma.ride.create({
            data: {
              id: ride.id,
              userId: ride.userId,
              origin: ride.origin || ride.startLocation,
              destination: ride.destination || ride.endLocation,
              departureTime: new Date(ride.departureTime),
              arrivalTime: ride.arrivalTime ? new Date(ride.arrivalTime) : null,
              availableSpace: ride.availableSpace || 'MEDIUM' || 'SMALL' || 'LARGE',
              pricePerKg: ride.pricePerKg || 2.5,
              vehicleType: ride.vehicleType,
              maxWeight: ride.maxWeight || ride.maxPackageWeight,
              description: ride.description || ride.notes,
              status: ride.status || 'AVAILABLE'
            }
          });
          syncedRides.push(newRide);
        }
      } catch (error) {
        console.error('Error syncing ride:', ride.id, error);
        continue;
      }
    }

    return NextResponse.json({ 
      message: 'Rides synced successfully',
      syncedCount: syncedRides.length,
      rides: syncedRides
    });
  } catch (error) {
    console.error('Error syncing rides:', error);
    return NextResponse.json(
      { error: 'Failed to sync rides' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Cette route peut être utilisée pour vérifier l'état de synchronisation
    const adminRides = await prisma.ride.findMany({
      select: {
        id: true,
        userId: true,
        origin: true,
        destination: true,
        departureTime: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      message: 'Admin rides retrieved successfully',
      count: adminRides.length,
      rides: adminRides
    });
  } catch (error) {
    console.error('Error retrieving admin rides:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve admin rides' },
      { status: 500 }
    );
  }
} 