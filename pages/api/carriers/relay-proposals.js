import prisma, { ensureConnected } from '../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  try {
    // Ensure database connection is established
    await ensureConnected();
    
    switch (method) {
      case "GET":
        return handleGet(req, res);
      default:
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("Relay Proposals API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req, res) {
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
    
    // Ensure database connection before queries
    await ensureConnected();
    
    // Get relay proposals for this carrier
    const relayProposals = await prisma.match.findMany({
      where: {
        ride: {
          userId: userId
        },
        isRelaySegment: true,
        status: 'PENDING'
      },
      include: {
        package: {
          select: {
            id: true,
            title: true,
            description: true,
            finalDestination: true,
            recipientAddress: true,
            currentLocation: true,
            trackingNumber: true
          }
        },
        ride: {
          select: {
            id: true,
            origin: true,
            destination: true,
            departureTime: true,
            description: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get transfer codes and current carrier info from tracking events
    const proposalsWithDetails = await Promise.all(
      relayProposals.map(async (proposal) => {
        // Get the transfer tracking event for this package
        const transferEvent = await prisma.trackingEvent.findFirst({
          where: {
            packageId: proposal.package.id,
            eventType: 'TRANSFER',
            nextCarrierId: userId
          },
          include: {
            carrier: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          }
        });

        return {
          id: proposal.id,
          packageId: proposal.package.id,
          packageTitle: proposal.package.title,
          packageDescription: proposal.package.description,
          trackingNumber: proposal.package.trackingNumber,
          dropoffLocation: proposal.ride.origin,
          finalDestination: proposal.package.finalDestination || proposal.package.recipientAddress,
          currentLocation: proposal.package.currentLocation,
          transferCode: transferEvent?.transferCode || null,
          currentCarrier: transferEvent?.carrier ? 
            `${transferEvent.carrier.firstName} ${transferEvent.carrier.lastName}` : 
            'Transporteur inconnu',
          estimatedPickupTime: proposal.ride.departureTime,
          notes: proposal.notes,
          createdAt: proposal.createdAt,
          status: proposal.status
        };
      })
    );

    return res.status(200).json(proposalsWithDetails);
  } catch (error) {
    console.error("Error fetching relay proposals:", error);
    return res.status(500).json({ error: "Failed to fetch relay proposals" });
  }
} 