import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PackageStatus } from '@/generated/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting packages API request...');
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status') as PackageStatus | null;

    console.log('Search params:', { search, status });

    // Construct the where clause based on filters
    const where = {
      AND: [
        // Search filter
        search ? {
          OR: [
            { description: { contains: search } },
            { senderName: { contains: search } },
            { recipientName: { contains: search } },
            { senderAddress: { contains: search } },
            { recipientAddress: { contains: search } },
            { trackingNumber: { contains: search } },
          ],
        } : {},
        // Status filter
        status ? { status } : {},
      ],
    };

    console.log('Where clause:', JSON.stringify(where, null, 2));

    console.log('Executing prisma.package.findMany...');
    const packages = await prisma.package.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        matches: {
          // Temporairement on enlève le filtre pour voir tous les matches
          include: {
            ride: {
              include: {
                user: {
                  select: {
                    name: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Query successful, found', packages.length, 'packages');
    return NextResponse.json(packages);
  } catch (error) {
    console.error('Packages fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to fetch packages', details: errorMessage },
      { status: 500 }
    );
  }
} 