import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PackageStatus } from '@/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting deliveries API request...');
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    console.log('Search params:', { search, status });

    // Construct the where clause based on filters
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { senderName: { contains: search } },
        { recipientName: { contains: search } },
        { senderAddress: { contains: search } },
        { recipientAddress: { contains: search } },
        { trackingNumber: { contains: search } },
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      where.status = status as PackageStatus;
    }

    console.log('Where clause:', JSON.stringify(where, null, 2));

    console.log('Executing prisma.package.findMany...');
    const packages = await prisma.package.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        matches: {
          include: {
            ride: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Query successful, found', packages.length, 'packages');

    // Transform the data to match the expected Delivery interface
    const deliveries = packages.map(pkg => {
      // Get the active match (if any)
      const activeMatch = pkg.matches.find(m => m.status === 'CONFIRMED' || m.status === 'IN_PROGRESS') 
                         || pkg.matches[0];
      
      return {
        id: pkg.id,
        status: pkg.status,
        price: pkg.price || 0,
        createdAt: pkg.createdAt.toISOString(),
        updatedAt: pkg.updatedAt.toISOString(),
        package: {
          id: pkg.id,
          description: pkg.description,
          senderAddress: pkg.senderAddress,
          recipientAddress: pkg.recipientAddress,
          weight: pkg.weight,
          sender: {
            firstName: pkg.senderName?.split(' ')[0] || '',
            lastName: pkg.senderName?.split(' ').slice(1).join(' ') || '',
            phoneNumber: pkg.senderPhone || '',
          },
          user: pkg.user ? {
            firstName: pkg.user.firstName || '',
            lastName: pkg.user.lastName || '',
            phoneNumber: pkg.user.phoneNumber || '',
          } : null,
          recipient: {
            name: pkg.recipientName || '',
            phone: pkg.recipientPhone || '',
          },
        },
        ride: activeMatch?.ride ? {
          id: activeMatch.ride.id,
          carrier: activeMatch.ride.user ? {
            id: activeMatch.ride.user.id,
            firstName: activeMatch.ride.user.firstName || '',
            lastName: activeMatch.ride.user.lastName || '',
            phoneNumber: activeMatch.ride.user.phoneNumber || '',
            isOnline: true, // Default to true since we don't have this field in the current schema
          } : null,
          user: activeMatch.ride.user ? {
            id: activeMatch.ride.user.id,
            firstName: activeMatch.ride.user.firstName || '',
            lastName: activeMatch.ride.user.lastName || '',
            phoneNumber: activeMatch.ride.user.phoneNumber || '',
          } : null,
          startLocation: activeMatch.ride.origin,
          endLocation: activeMatch.ride.destination,
          departureTime: activeMatch.ride.departureTime.toISOString(),
        } : {
          id: '',
          carrier: null,
          user: null,
          startLocation: pkg.senderAddress,
          endLocation: pkg.recipientAddress,
          departureTime: pkg.createdAt.toISOString(),
        },
        trackingEvents: [], // Empty array since we don't have tracking events in current schema
      };
    });

    return NextResponse.json(deliveries);
  } catch (error) {
    console.error('Deliveries fetch error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
    });
    return NextResponse.json(
      { error: 'Failed to fetch deliveries', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 