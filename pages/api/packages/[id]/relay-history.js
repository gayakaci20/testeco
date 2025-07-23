import prisma, { ensureConnected } from '../../../../lib/prisma';

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

const { method } = req;
  const { id } = req.query;

  try {
    switch (method) {
      case "GET":
        return handleGet(req, res, id);
      default:
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("Package Relay History API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req, res, packageId) {
  try {
    const userId = req.headers["x-user-id"];
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Verify the package belongs to the user or user is involved in the relay chain
    const package_ = await prisma.package.findFirst({
      where: {
        id: packageId,
        OR: [
          { userId: userId }, // Package owner
          { 
            matches: {
              some: {
                ride: {
                  userId: userId // Current or past carrier
                }
              }
            }
          }
        ]
      }
    });
    
    if (!package_) {
      return res.status(404).json({ error: "Package not found or unauthorized" });
    }
    
    // Get relay history from tracking events
    const relayEvents = await prisma.trackingEvent.findMany({
      where: {
        packageId: packageId,
        eventType: 'TRANSFER'
      },
      include: {
        carrier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true
          }
        },
        nextCarrier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    // Get relay matches for additional info
    const relayMatches = await prisma.match.findMany({
      where: {
        packageId: packageId,
        isRelaySegment: true
      },
      include: {
        ride: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true
              }
            }
          }
        }
      },
      orderBy: {
        segmentOrder: 'asc'
      }
    });

    // Combine tracking events and match data
    const relayHistory = relayEvents.map(event => {
      const matchingMatch = relayMatches.find(match => 
        match.ride.userId === event.nextCarrierId
      );

      return {
        id: event.id,
        dropoffLocation: event.location,
        transferCode: event.transferCode,
        notes: event.notes,
        status: matchingMatch ? matchingMatch.status : 'PENDING',
        createdAt: event.timestamp,
        estimatedArrival: matchingMatch?.ride.departureTime || null,
        carrier: event.carrier,
        nextCarrier: event.nextCarrier,
        matchId: matchingMatch?.id || null
      };
    });
    
    return res.status(200).json(relayHistory);
  } catch (error) {
    console.error("Error fetching relay history:", error);
    return res.status(500).json({ error: "Failed to fetch relay history" });
  }
} 