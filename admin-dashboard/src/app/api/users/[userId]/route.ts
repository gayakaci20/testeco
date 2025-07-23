import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Role } from '@/generated/prisma'; // Assuming Role might be part of update

interface RouteContext {
  params: Promise<{ // Changed to reflect that params is a Promise
    userId: string;
  }>;
}

// PUT request to update a user
export async function PUT(request: NextRequest, { params: paramsPromise }: RouteContext) { // Destructure as paramsPromise
  const params = await paramsPromise; // Await the promise
  const { userId } = params;
  try {
    const body = await request.json();
    // Add validation for body content here (e.g., using Zod)
    // For example, ensure role is a valid Role enum if passed
    
    const { firstName, lastName, email, role, isVerified, phoneNumber, address } = body;

    // Ensure role is valid if provided
    if (role && !Object.values(Role).includes(role as Role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        role: role as Role, // Cast role to Role type
        isVerified,
        phoneNumber,
        address,
        // Add any other fields that can be updated
      },
    });
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error(`Error updating user ${userId}:`, error);
    if (error.code === 'P2025') { // Prisma error code for record not found
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update user', details: error.message }, { status: 500 });
  }
}

// DELETE request to delete a user
export async function DELETE(request: NextRequest, { params: paramsPromise }: RouteContext) { // Destructure as paramsPromise
  const params = await paramsPromise; // Await the promise
  const { userId } = params;
  
  // Check if this is a force delete
  const url = new URL(request.url);
  const forceDelete = url.searchParams.get('force') === 'true';
  
  console.log(`DELETE request for user ${userId}, force: ${forceDelete}`);
  
  try {
    // First check if user exists
    console.log('Checking if user exists...');
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        packages: true,
        rides: true,
        sentMessages: true,
        receivedMessages: true,
        payments: true,
        notifications: true,
        services: true,
        providedBookings: true,
        customerBookings: true,
        contracts: true,
        documents: true,
        boxRentals: true,
      }
    });

    if (!existingUser) {
      console.log('User not found');
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    console.log('User found, checking relations...');
    console.log('Relations:', {
      packages: existingUser.packages.length,
      rides: existingUser.rides.length,
      payments: existingUser.payments.length,
      contracts: existingUser.contracts.length,
      providedBookings: existingUser.providedBookings.length,
      customerBookings: existingUser.customerBookings.length
    });

    // Check if user has critical relations that prevent deletion
    const hasActiveRelations = 
      existingUser.packages.length > 0 ||
      existingUser.rides.length > 0 ||
      existingUser.payments.length > 0 ||
      existingUser.contracts.length > 0 ||
      existingUser.providedBookings.length > 0 ||
      existingUser.customerBookings.length > 0;

    // If has active relations and not force delete, return error
    if (hasActiveRelations && !forceDelete) {
      return NextResponse.json({ 
        error: 'Impossible de supprimer cet utilisateur car il a des données associées (colis, trajets, paiements, etc.). Veuillez d\'abord supprimer ou transférer ces données.',
        details: {
          packages: existingUser.packages.length,
          rides: existingUser.rides.length,
          payments: existingUser.payments.length,
          contracts: existingUser.contracts.length,
          bookings: existingUser.providedBookings.length + existingUser.customerBookings.length
        }
      }, { status: 400 });
    }

    // Proceed with deletion (either no relations or force delete)
    // Delete in transaction to ensure data consistency
    console.log('Starting deletion transaction...');
    await prisma.$transaction(async (tx) => {
      // If force delete, delete all associated data first
      if (forceDelete) {
        console.log('Force delete: removing critical business data...');
        
        // Identify matches linked to the user's packages or rides (needed to remove related payments first)
        console.log('Deleting payments and matches related to user packages and rides...');
        const userPackageIds = existingUser.packages.map(p => p.id);
        const userRideIds = existingUser.rides.map(r => r.id);

        // Build dynamic filter conditions for matches (avoid empty arrays)
        const matchFilterConditions: any[] = [];
        if (userPackageIds.length > 0) {
          matchFilterConditions.push({ packageId: { in: userPackageIds } });
        }
        if (userRideIds.length > 0) {
          matchFilterConditions.push({ rideId: { in: userRideIds } });
        }

        // Collect match IDs so we can delete their payments first
        let matchIds: string[] = [];
        if (matchFilterConditions.length > 0) {
          const matchesToDelete = await tx.match.findMany({
            where: { OR: matchFilterConditions },
            select: { id: true },
          });
          matchIds = matchesToDelete.map(m => m.id);
        }

        // Delete payments either belonging to the user OR referencing the matches we will delete
        console.log('Deleting payments...');
        await tx.payment.deleteMany({
            where: {
              OR: [
              { userId },
              ...(matchIds.length > 0 ? [{ matchId: { in: matchIds } }] : []),
              ],
            },
          });

        // Now delete the matches themselves
        if (matchIds.length > 0) {
          console.log('Deleting matches...');
          await tx.match.deleteMany({ where: { id: { in: matchIds } } });
        }

        // Continue with deleting packages
        console.log('Deleting packages...');
        await tx.package.deleteMany({ where: { userId } });
        console.log('Deleting rides...');
        await tx.ride.deleteMany({ where: { userId } });
        
        // Delete critical business data
        console.log('Deleting contracts...');
        await tx.contract.deleteMany({ where: { merchantId: userId } });
        console.log('Deleting bookings...');
        await tx.booking.deleteMany({ where: { OR: [{ providerId: userId }, { customerId: userId }] } });
      }
      
      // Delete non-critical relations
      console.log('Deleting non-critical relations...');
      await tx.notification.deleteMany({ where: { userId } });
      await tx.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } });
      await tx.document.deleteMany({ where: { userId } });
      await tx.service.deleteMany({ where: { providerId: userId } });
      await tx.boxRental.deleteMany({ where: { userId } });
      
      // Delete OAuth accounts and sessions
      console.log('Deleting OAuth accounts and sessions...');
      await tx.account.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      
      // Finally delete the user
      console.log('Deleting user...');
      await tx.user.delete({ where: { id: userId } });
    });
    
    console.log('Deletion completed successfully');

    const message = forceDelete 
      ? 'Utilisateur et toutes ses données supprimés avec succès' 
      : 'Utilisateur supprimé avec succès';
    
    return NextResponse.json({ message }, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting user ${userId}:`, error);
    
    if (error.code === 'P2025') { // Prisma error code for record not found
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    
    if (error.code === 'P2003') { // Foreign key constraint violation
      return NextResponse.json({ 
        error: 'Impossible de supprimer cet utilisateur en raison de contraintes de données. Il a probablement des données associées qui doivent être supprimées en premier.',
        details: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression de l\'utilisateur', 
      details: error.message 
    }, { status: 500 });
  }
} 