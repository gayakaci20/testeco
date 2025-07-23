import { Role, UserType } from '@/generated/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API users appelée');
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const role = searchParams.get('role') as Role | null;
    const verified = searchParams.get('verified');
    const userType = searchParams.get('userType') as UserType | null;

    // Construct the where clause based on filters
    const where = {
      AND: [
        // Search filter
        search ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { companyName: { contains: search } },
          ],
        } : {},
        // Role filter
        role ? { role } : {},
        // Verified filter
        verified ? { isVerified: verified === 'true' } : {},
        // UserType filter
        userType ? { userType } : {},
      ],
    };

    console.log('🔍 Tentative de requête Prisma...');
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userType: true,
        companyName: true,
        companyFirstName: true,
        companyLastName: true,
        isVerified: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        image: true,
        phoneNumber: true,
        address: true,
        // Include banking information
        bankingInfo: {
          select: {
            id: true,
            accountHolder: true,
            iban: true,
            bic: true,
            bankName: true,
            address: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      role = Role.CUSTOMER,
      userType = UserType.INDIVIDUAL,
      companyName,
      companyFirstName,
      companyLastName,
      isVerified = false,
      phoneNumber,
      address,
    } = body;

    // Basic validation
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { message: 'firstName, lastName and email are required' },
        { status: 400 }
      );
    }

    // Ensure email is unique
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: 'A user with this email already exists.' },
        { status: 409 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        role,
        userType,
        companyName,
        companyFirstName,
        companyLastName,
        isVerified,
        phoneNumber,
        address,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userType: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { message: 'Failed to create user' },
      { status: 500 }
    );
  }
} 