import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createApiLogger } from '@/lib/logger';

export async function GET() {
  const logger = createApiLogger('DASHBOARD');
  const startTime = Date.now();
  
  try {
    logger.info('Début du chargement des données du dashboard');
    
    const dbStartTime = Date.now();
    const [
      users,
      packages,
      rides,
      matches,
      payments,
      messages,
      notifications
    ] = await Promise.all([
      // Users - tous les champs pertinents
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          address: true,
          role: true,
          isVerified: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          image: true,
        },
      }),
      // Packages - tous les détails
      prisma.package.findMany({
        orderBy: { createdAt: 'desc' },
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
      }),
      // Rides - informations complètes
      prisma.ride.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          matches: {
            include: {
              package: true,
            },
          },
        },
      }),
      // Matches - relations complètes
      prisma.match.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          package: {
            include: {
              user: true,
            },
          },
          ride: {
            include: {
              user: true,
            },
          },
          payment: true,
        },
      }),
      // Payments - détails complets
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          match: {
            include: {
              package: true,
              ride: true,
            },
          },
        },
      }),
      // Messages - avec détails expéditeur et destinataire
      prisma.message.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      // Notifications - informations complètes
      prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const dbDuration = Date.now() - dbStartTime;
    logger.databaseQuery('Dashboard data fetch', dbDuration, {
      tablesQueried: ['users', 'packages', 'rides', 'matches', 'payments', 'messages', 'notifications'],
      recordsCounts: {
        users: users.length,
        packages: packages.length,
        rides: rides.length,
        matches: matches.length,
        payments: payments.length,
        messages: messages.length,
        notifications: notifications.length
      }
    });

    const totalDuration = Date.now() - startTime;
    logger.info('Dashboard data loaded successfully', {
      duration: totalDuration,
      dbDuration,
      totalRecords: users.length + packages.length + rides.length + matches.length + payments.length + messages.length + notifications.length
    });

    return NextResponse.json({
      users,
      packages,
      rides,
      matches,
      payments,
      messages,
      notifications,
    });
  } catch (error) {
    const errorDuration = Date.now() - startTime;
    logger.error('Dashboard data fetch error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: errorDuration
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 