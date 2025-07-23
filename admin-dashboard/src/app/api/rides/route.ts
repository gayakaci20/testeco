import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';



export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (userId) {
      where.userId = userId;
    }

    const rides = await prisma.ride.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            name: true,
            role: true
          }
        },
        matches: {
          select: {
            id: true,
            status: true,
            package: {
              select: {
                id: true,
                description: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit ? parseInt(limit) : undefined
    });

    // Map the rides to match the expected frontend format
    const mappedRides = rides.map(ride => ({
      ...ride,
      startLocation: ride.origin,
      endLocation: ride.destination,
      estimatedArrivalTime: ride.arrivalTime,
      availableSeats: ride.availableSpace === 'SMALL' ? 1 : 
                      ride.availableSpace === 'MEDIUM' ? 3 : 
                      ride.availableSpace === 'LARGE' ? 5 : 3,
      maxPackageWeight: ride.maxWeight,
      maxPackageSize: ride.availableSpace,
      pricePerSeat: ride.pricePerKg * 5, // Approximation
      notes: ride.description,
      matches: ride.matches.map(match => ({
        ...match,
        package: {
          ...match.package,
          title: match.package.description
        }
      }))
    }));

    return NextResponse.json(mappedRides);
  } catch (error) {
    console.error('Error fetching rides:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rides' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Ride ID is required' },
        { status: 400 }
      );
    }

    const ride = await prisma.ride.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            name: true,
            role: true
          }
        },
        matches: {
          select: {
            id: true,
            status: true,
            package: {
              select: {
                id: true,
                description: true
              }
            }
          }
        }
      }
    });

    // Map the response to match frontend format
    const mappedRide = {
      ...ride,
      startLocation: ride.origin,
      endLocation: ride.destination,
      estimatedArrivalTime: ride.arrivalTime,
      availableSeats: ride.availableSpace === 'SMALL' ? 1 : 
                      ride.availableSpace === 'MEDIUM' ? 3 : 
                      ride.availableSpace === 'LARGE' ? 5 : 3,
      maxPackageWeight: ride.maxWeight,
      maxPackageSize: ride.availableSpace,
      pricePerSeat: ride.pricePerKg * 5,
      notes: ride.description,
      matches: ride.matches.map(match => ({
        ...match,
        package: {
          ...match.package,
          title: match.package.description
        }
      }))
    };

    return NextResponse.json(mappedRide);
  } catch (error) {
    console.error('Error updating ride:', error);
    return NextResponse.json(
      { error: 'Failed to update ride' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      origin, 
      destination, 
      departureTime, 
      arrivalTime,
      availableSpace,
      pricePerKg,
      vehicleType,
      maxWeight,
      description,
      status = 'AVAILABLE'
    } = body;

    if (!userId || !origin || !destination || !departureTime || !pricePerKg) {
      return NextResponse.json(
        { error: 'userId, origin, destination, departureTime, and pricePerKg are required' },
        { status: 400 }
      );
    }

    // Verify user exists and is a carrier
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const ride = await prisma.ride.create({
      data: {
        userId,
        origin,
        destination,
        departureTime: new Date(departureTime),
        arrivalTime: arrivalTime ? new Date(arrivalTime) : null,
        availableSpace: availableSpace || 'MEDIUM',
        pricePerKg: parseFloat(pricePerKg),
        vehicleType,
        maxWeight: maxWeight ? parseFloat(maxWeight) : null,
        description,
        status
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            name: true,
            role: true
          }
        },
        matches: {
          select: {
            id: true,
            status: true,
            package: {
              select: {
                id: true,
                description: true
              }
            }
          }
        }
      }
    });

    // Map the response to match frontend format
    const mappedRide = {
      ...ride,
      startLocation: ride.origin,
      endLocation: ride.destination,
      estimatedArrivalTime: ride.arrivalTime,
      availableSeats: ride.availableSpace === 'SMALL' ? 1 : 
                      ride.availableSpace === 'MEDIUM' ? 3 : 
                      ride.availableSpace === 'LARGE' ? 5 : 3,
      maxPackageWeight: ride.maxWeight,
      maxPackageSize: ride.availableSpace,
      pricePerSeat: ride.pricePerKg * 5,
      notes: ride.description,
      matches: ride.matches.map(match => ({
        ...match,
        package: {
          ...match.package,
          title: match.package.description
        }
      }))
    };

    return NextResponse.json(mappedRide, { status: 201 });
  } catch (error) {
    console.error('Error creating ride:', error);
    return NextResponse.json(
      { error: 'Failed to create ride' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Ride ID is required' },
        { status: 400 }
      );
    }

    // Check if ride exists
    const existingRide = await prisma.ride.findUnique({
      where: { id },
      include: {
        matches: true
      }
    });

    if (!existingRide) {
      return NextResponse.json(
        { error: 'Ride not found' },
        { status: 404 }
      );
    }

    // Check if ride has active matches
    const activeMatches = existingRide.matches.filter(match => 
      ['CONFIRMED', 'IN_PROGRESS', 'ACCEPTED_BY_SENDER', 'ACCEPTED_BY_CARRIER'].includes(match.status)
    );

    if (activeMatches.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete ride with active matches' },
        { status: 400 }
      );
    }

    // Delete the ride
    await prisma.ride.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Ride deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting ride:', error);
    return NextResponse.json(
      { error: 'Failed to delete ride' },
      { status: 500 }
    );
  }
} 