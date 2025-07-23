import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test simple queries
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    // Test package query with specific fields
    const packages = await prisma.package.findMany({
      take: 1,
      select: {
        id: true,
        description: true,
        senderName: true,
        senderAddress: true,
        recipientName: true,
        recipientAddress: true,
        status: true,
        createdAt: true,
      },
    });
    
    console.log('Package query successful');
    
    return NextResponse.json({
      success: true,
      userCount,
      packageCount: packages.length,
      samplePackage: packages[0] || null,
    });
  } catch (error) {
    console.error('Test DB error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { 
        error: 'Database test failed', 
        details: errorMessage,
        stack: errorStack 
      },
      { status: 500 }
    );
  }
} 