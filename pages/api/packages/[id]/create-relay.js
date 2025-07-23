import prisma, { ensureConnected } from '../../../../lib/prisma';

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

const { method } = req;
  const { id } = req.query;

  try {
    switch (method) {
      case "POST":
        return handlePost(req, res, id);
      default:
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("Package Relay API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handlePost(req, res, packageId) {
  try {
    const userId = req.headers["x-user-id"];
    const { 
      dropoffLocation, 
      nextCarrierId, 
      notes, 
      transferCode, 
      estimatedArrival 
    } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (!dropoffLocation || !nextCarrierId) {
      return res.status(400).json({ error: "Dropoff location and next carrier are required" });
    }
    
    // Verify the user is the current carrier for this package
    const currentMatch = await prisma.match.findFirst({
      where: {
        packageId: packageId,
        ride: {
          userId: userId
        },
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS', 'ACCEPTED_BY_SENDER', 'ACCEPTED_BY_CARRIER']
        }
      },
      include: {
        package: {
          include: {
            user: true
          }
        },
        ride: true
      }
    });
    
    if (!currentMatch) {
      return res.status(403).json({ error: "Unauthorized: Only the current carrier can create relays" });
    }

    // Verify the next carrier exists and is available
    const nextCarrier = await prisma.user.findUnique({
      where: {
        id: nextCarrierId,
        role: 'CARRIER'
      }
    });

    if (!nextCarrier) {
      return res.status(404).json({ error: "Next carrier not found" });
    }

    // Update current match to partial delivery
    await prisma.match.update({
      where: { id: currentMatch.id },
      data: {
        status: 'AWAITING_TRANSFER',
        isPartialDelivery: true,
        dropoffLocation: dropoffLocation,
        notes: notes || ''
      }
    });

    // Create a new ride for the next carrier (pickup from dropoff location)
    const newRide = await prisma.ride.create({
      data: {
        userId: nextCarrierId,
        origin: dropoffLocation,
        destination: currentMatch.package.finalDestination || currentMatch.package.recipientAddress,
        departureTime: estimatedArrival ? new Date(estimatedArrival) : new Date(),
        pricePerKg: currentMatch.ride.pricePerKg || 2.0,
        availableSpace: 'MEDIUM',
        status: 'PENDING',
        allowsRelayPickup: true,
        description: `Relais depuis ${dropoffLocation} vers ${currentMatch.package.finalDestination || currentMatch.package.recipientAddress}`
      }
    });

    // Create a new match for the next segment
    const newMatch = await prisma.match.create({
      data: {
        packageId: packageId,
        rideId: newRide.id,
        status: 'PENDING',
        isRelaySegment: true,
        segmentOrder: (currentMatch.segmentOrder || 1) + 1,
        notes: `Relais depuis ${dropoffLocation}. Code de transfert: ${transferCode || 'N/A'}`
      }
    });

    // Update package to relay status
    await prisma.package.update({
      where: { id: packageId },
      data: {
        status: 'AWAITING_RELAY',
        currentLocation: dropoffLocation,
        isMultiSegment: true,
        segmentNumber: (currentMatch.segmentOrder || 1) + 1
      }
    });

    // Create tracking event for the transfer
    await prisma.trackingEvent.create({
      data: {
        packageId: packageId,
        carrierId: userId,
        location: dropoffLocation,
        notes: notes || `Colis prêt pour transfert vers ${nextCarrier.firstName} ${nextCarrier.lastName}`,
        status: 'TRANSFER',
        eventType: 'TRANSFER',
        nextCarrierId: nextCarrierId,
        transferCode: transferCode || null
      }
    });

    // Create notifications
    await Promise.all([
      // Notify package owner
      prisma.notification.create({
        data: {
          userId: currentMatch.package.userId,
          type: 'PACKAGE_UPDATE',
          title: 'Relais créé',
          message: `Votre colis sera transféré à ${dropoffLocation} vers un nouveau transporteur`,
          data: {
            packageId: packageId,
            dropoffLocation: dropoffLocation,
            nextCarrierId: nextCarrierId
          }
        }
      }),
      // Notify next carrier
      prisma.notification.create({
        data: {
          userId: nextCarrierId,
          type: 'NEW_RELAY_PROPOSAL',
          title: 'Nouveau relais proposé',
          message: `Un relais vous a été proposé pour récupérer un colis à ${dropoffLocation}`,
          data: {
            packageId: packageId,
            dropoffLocation: dropoffLocation,
            transferCode: transferCode,
            matchId: newMatch.id
          }
        }
      })
    ]);

    // Return the created relay info
    const relayInfo = {
      id: newMatch.id,
      dropoffLocation: dropoffLocation,
      nextCarrier: {
        id: nextCarrier.id,
        firstName: nextCarrier.firstName,
        lastName: nextCarrier.lastName,
        companyName: nextCarrier.companyName
      },
      transferCode: transferCode,
      estimatedArrival: estimatedArrival,
      notes: notes,
      status: 'PENDING',
      createdAt: new Date()
    };

    return res.status(201).json(relayInfo);
  } catch (error) {
    console.error("Error creating relay:", error);
    return res.status(500).json({ error: "Failed to create relay" });
  }
} 