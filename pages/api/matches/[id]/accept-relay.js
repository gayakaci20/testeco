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
    console.error("Accept Relay API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handlePost(req, res, matchId) {
  try {
    const userId = req.headers["x-user-id"];
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Verify the user is a carrier
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!currentUser || currentUser.role !== 'CARRIER') {
      return res.status(403).json({ error: "Access denied. Carrier role required." });
    }
    
    // Find the match and verify it's a relay segment for this carrier
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        ride: {
          userId: userId
        },
        isRelaySegment: true,
        status: 'PENDING'
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
    
    if (!match) {
      return res.status(404).json({ error: "Match not found or not authorized" });
    }
    
    // Update the match status to confirmed
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'CONFIRMED',
        acceptedAt: new Date()
      }
    });
    
    // Update the package status
    await prisma.package.update({
      where: { id: match.package.id },
      data: {
        status: 'RELAY_IN_PROGRESS'
      }
    });
    
    // Create tracking event for relay acceptance
    await prisma.trackingEvent.create({
      data: {
        packageId: match.package.id,
        carrierId: userId,
        location: match.ride.origin,
        notes: `Relais accepté par ${currentUser.firstName} ${currentUser.lastName}`,
        status: 'RELAY_ACCEPTED',
        eventType: 'PICKUP'
      }
    });
    
    // Create notifications
    await Promise.all([
      // Notify package owner
      prisma.notification.create({
        data: {
          userId: match.package.userId,
          type: 'PACKAGE_UPDATE',
          title: 'Relais accepté',
          message: `Votre colis sera pris en charge par ${currentUser.firstName} ${currentUser.lastName} à ${match.ride.origin}`,
          data: {
            packageId: match.package.id,
            carrierId: userId,
            pickupLocation: match.ride.origin
          }
        }
      }),
      
      // Notify previous carrier if there's a transfer event
      (async () => {
        const transferEvent = await prisma.trackingEvent.findFirst({
          where: {
            packageId: match.package.id,
            eventType: 'TRANSFER',
            nextCarrierId: userId
          },
          include: {
            carrier: true
          }
        });
        
        if (transferEvent?.carrier) {
          return prisma.notification.create({
            data: {
              userId: transferEvent.carrier.id,
              type: 'RELAY_CONFIRMED',
              title: 'Relais confirmé',
              message: `${currentUser.firstName} ${currentUser.lastName} a accepté de prendre le relais pour le colis à ${match.ride.origin}`,
              data: {
                packageId: match.package.id,
                newCarrierId: userId,
                pickupLocation: match.ride.origin
              }
            }
          });
        }
      })()
    ]);
    
    return res.status(200).json({ 
      message: "Relay proposal accepted successfully",
      match: {
        id: match.id,
        status: 'CONFIRMED',
        packageId: match.package.id,
        acceptedAt: new Date()
      }
    });
  } catch (error) {
    console.error("Error accepting relay proposal:", error);
    return res.status(500).json({ error: "Failed to accept relay proposal" });
  }
} 