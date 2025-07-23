import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('✅ API subscriptions: Starting request');

    // Get all subscriptions with user details
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Found ${subscriptions.length} subscriptions`);

    // Calculate stats
    const activeSubscriptions = subscriptions.filter((s: any) => s.status === 'ACTIVE');
    const pendingSubscriptions = subscriptions.filter((s: any) => s.status === 'PENDING');
    const canceledSubscriptions = subscriptions.filter((s: any) => s.status === 'CANCELED');
    
    const totalRevenue = subscriptions
      .filter((s: any) => s.status === 'ACTIVE')
      .reduce((sum: number, s: any) => sum + Number(s.amount), 0);

    // Get monthly stats
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const monthlySubscriptions = subscriptions.filter((s: any) => 
      s.createdAt && s.createdAt >= currentMonth
    );

    const stats = {
      total: subscriptions.length,
      active: activeSubscriptions.length,
      pending: pendingSubscriptions.length,
      canceled: canceledSubscriptions.length,
      totalRevenue,
      monthlyNew: monthlySubscriptions.length,
      averageRevenue: activeSubscriptions.length > 0 ? totalRevenue / activeSubscriptions.length : 0
    };

    return NextResponse.json({
      success: true,
      subscriptions,
      stats
    });

  } catch (error: any) {
    console.error('❌ Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des abonnements', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 