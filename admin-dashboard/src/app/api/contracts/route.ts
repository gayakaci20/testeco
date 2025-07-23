import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const merchantId = searchParams.get('merchantId');
    const carrierId = searchParams.get('carrierId');
    const limit = searchParams.get('limit');

    const where: any = {};
    if (status) where.status = status;
    if (merchantId) where.merchantId = merchantId;
    if (carrierId) where.carrierId = carrierId;

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        merchant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            name: true,
            userType: true,
            companyName: true,
            companyFirstName: true,
            companyLastName: true,
            address: true,
            phoneNumber: true
          }
        },
        carrier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            name: true,
            userType: true,
            companyName: true,
            companyFirstName: true,
            companyLastName: true,
            address: true,
            phoneNumber: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit ? parseInt(limit) : undefined
    });

    // Get related documents separately
    const contractsWithDocuments = await Promise.all(
      contracts.map(async (contract) => {
        const documents = await prisma.document.findMany({
          where: {
            relatedEntityId: contract.id,
            relatedEntityType: 'contract'
          },
          select: {
            id: true,
            type: true,
            title: true,
            fileName: true,
            filePath: true,
            createdAt: true
          }
        });
        return { ...contract, documents };
      })
    );

    return NextResponse.json(contractsWithDocuments);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST /api/contracts - Starting contract creation');
    
    // Get the current session - améliorer la gestion d'authentification
    const session = await getServerSession(authOptions);
    
    console.log('🔐 Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: session?.user?.role
    });

    if (!session?.user?.email) {
      console.error('❌ No session or user email found');
      return NextResponse.json(
        { error: 'Authentication required - Please log in' },
        { status: 401 }
      );
    }

    // Get the session user to check if they are admin - améliorer la gestion d'erreurs
    let sessionUser;
    try {
      sessionUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, firstName: true, lastName: true }
      });
      
      console.log('👤 Session user lookup:', {
        email: session.user.email,
        found: !!sessionUser,
        userId: sessionUser?.id,
        role: sessionUser?.role
      });
    } catch (dbError) {
      console.error('❌ Database error while looking up user:', dbError);
      return NextResponse.json(
        { error: 'Database error during authentication' },
        { status: 500 }
      );
    }

    if (!sessionUser) {
      console.error('❌ Session user not found in database:', {
        sessionEmail: session.user.email,
        sessionUserData: session.user
      });
      
      // Détail plus d'informations pour le debugging
      const allUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, email: true, firstName: true, lastName: true, role: true }
      });
      
      console.log('📊 Available admin users:', allUsers);
      
      return NextResponse.json(
        { 
          error: 'User not found in database',
          details: 'Your session user does not exist in the database. Please contact an administrator.',
          debug: {
            sessionEmail: session.user.email,
            availableAdmins: allUsers.length
          }
        },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (sessionUser.role !== 'ADMIN') {
      console.error('❌ Access denied - user is not admin:', {
        userId: sessionUser.id,
        userRole: sessionUser.role,
        email: session.user.email
      });
      
      return NextResponse.json(
        { error: 'Access denied - Admin privileges required' },
        { status: 403 }
      );
    }

    console.log('✅ Authentication successful - processing contract creation');

    const body = await request.json();
    const { 
      merchantId, 
      carrierId,
      title, 
      content,
      terms, 
      value, 
      currency = 'EUR',
      startDate,
      endDate,
      expiresAt 
    } = body;

    console.log('📋 Contract creation data:', {
      merchantId,
      carrierId,
      title: title?.substring(0, 50) + '...',
      hasContent: !!content,
      hasTerms: !!terms
    });

    if (!title || !content || !terms) {
      return NextResponse.json(
        { error: 'Title, content, and terms are required' },
        { status: 400 }
      );
    }

    // Either merchantId or carrierId is required, but not both
    if ((!merchantId && !carrierId) || (merchantId && carrierId)) {
      return NextResponse.json(
        { error: 'Either merchantId or carrierId is required, but not both' },
        { status: 400 }
      );
    }

    // Verify user exists and is PROFESSIONAL
    const userId = merchantId || carrierId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, userType: true, role: true, email: true, firstName: true, lastName: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('👥 Target user found:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      userType: user.userType
    });

    if (user.userType !== 'PROFESSIONAL') {
      return NextResponse.json(
        { error: 'Contracts can only be created for PROFESSIONAL users' },
        { status: 400 }
      );
    }

    // Verify role matches the contract type (allow admins to create contracts for any user)
    const isAdmin = sessionUser.role === 'ADMIN';
    
    if (merchantId && user.role !== 'MERCHANT' && !isAdmin) {
      return NextResponse.json(
        { error: 'Merchant contracts can only be created for MERCHANT users' },
        { status: 400 }
      );
    }

    if (carrierId && user.role !== 'CARRIER' && !isAdmin) {
      return NextResponse.json(
        { error: 'Carrier contracts can only be created for CARRIER users' },
        { status: 400 }
      );
    }

    const contract = await prisma.contract.create({
      data: {
        merchantId: merchantId || null,
        carrierId: carrierId || null,
        title,
        content,
        terms,
        value: value ? parseFloat(value) : null,
        currency,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: 'PENDING_SIGNATURE'
      },
      include: {
        merchant: merchantId ? {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            name: true,
            userType: true,
            companyName: true,
            companyFirstName: true,
            companyLastName: true,
            address: true,
            phoneNumber: true
          }
        } : false,
        carrier: carrierId ? {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            name: true,
            userType: true,
            companyName: true,
            companyFirstName: true,
            companyLastName: true,
            address: true,
            phoneNumber: true
          }
        } : false
      }
    });

    console.log('✅ Contract created successfully:', {
      contractId: contract.id,
      status: contract.status,
      merchantId: contract.merchantId,
      carrierId: contract.carrierId
    });

    return NextResponse.json({ ...contract, documents: [] }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating contract:', error);
    return NextResponse.json(
      { error: 'Failed to create contract', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, signedAt, value, expiresAt } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (signedAt) updateData.signedAt = new Date(signedAt);
    if (value !== undefined) updateData.value = value ? parseFloat(value) : null;
    if (expiresAt) updateData.expiresAt = new Date(expiresAt);

    const contract = await prisma.contract.update({
      where: { id },
      data: updateData,
      include: {
        merchant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            name: true,
            userType: true,
            companyName: true,
            companyFirstName: true,
            companyLastName: true,
            address: true,
            phoneNumber: true
          }
        }
      }
    });

    // Get related documents
    const documents = await prisma.document.findMany({
      where: {
        relatedEntityId: contract.id,
        relatedEntityType: 'contract'
      },
      select: {
        id: true,
        type: true,
        title: true,
        fileName: true,
        filePath: true,
        createdAt: true
      }
    });

    return NextResponse.json({ ...contract, documents });
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: 'Failed to update contract' },
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
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    // Check if contract can be deleted (only DRAFT contracts)
    const contract = await prisma.contract.findUnique({
      where: { id },
      select: { status: true }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (contract.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only DRAFT contracts can be deleted' },
        { status: 400 }
      );
    }

    // Delete related documents first
    await prisma.document.deleteMany({
      where: {
        relatedEntityId: id,
        relatedEntityType: 'contract'
      }
    });

    // Delete the contract
    await prisma.contract.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
} 