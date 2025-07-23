import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const sender = await prisma.user.create({
    data: {
      email: 'sender@test.com',
      name: 'Test Sender',
      role: 'SENDER',
      isVerified: true,
    },
  });

  const carrier = await prisma.user.create({
    data: {
      email: 'carrier@test.com',
      name: 'Test Carrier',
      role: 'CARRIER',
      isVerified: true,
    },
  });

  // Create test packages
  const package1 = await prisma.package.create({
    data: {
      title: 'Test Package 1',
      description: 'A test package',
      weight: 2.5,
      dimensions: '30x20x10',
      pickupAddress: '123 Pickup St',
      deliveryAddress: '456 Delivery Ave',
      pickupLat: 48.8566,
      pickupLng: 2.3522,
      deliveryLat: 48.8584,
      deliveryLng: 2.2945,
      status: 'PENDING',
      userId: sender.id,
    },
  });

  const package2 = await prisma.package.create({
    data: {
      title: 'Test Package 2',
      description: 'Another test package',
      weight: 1.5,
      dimensions: '20x15x10',
      pickupAddress: '789 Pickup Rd',
      deliveryAddress: '321 Delivery Blvd',
      pickupLat: 48.8566,
      pickupLng: 2.3522,
      deliveryLat: 48.8584,
      deliveryLng: 2.2945,
      status: 'PENDING',
      userId: sender.id,
    },
  });

  // Create test rides
  const ride1 = await prisma.ride.create({
    data: {
      startLocation: '123 Start St',
      endLocation: '456 End Ave',
      startLat: 48.8566,
      startLng: 2.3522,
      endLat: 48.8584,
      endLng: 2.2945,
      departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      vehicleType: 'Car',
      availableSeats: 3,
      maxPackageWeight: 10,
      status: 'AVAILABLE',
      userId: carrier.id,
    },
  });

  const ride2 = await prisma.ride.create({
    data: {
      startLocation: '789 Start Rd',
      endLocation: '321 End Blvd',
      startLat: 48.8566,
      startLng: 2.3522,
      endLat: 48.8584,
      endLng: 2.2945,
      departureTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
      vehicleType: 'Van',
      availableSeats: 2,
      maxPackageWeight: 20,
      status: 'AVAILABLE',
      userId: carrier.id,
    },
  });

  // Create a test match
  const match = await prisma.match.create({
    data: {
      packageId: package1.id,
      rideId: ride1.id,
      status: 'PROPOSED',
      price: 25.0,
    },
  });

  // Create a test payment
  await prisma.payment.create({
    data: {
      userId: sender.id,
      matchId: match.id,
      amount: 25.0,
      currency: 'EUR',
      status: 'PENDING',
      paymentMethod: 'card',
    },
  });

  console.log('Test data has been added to the database');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 