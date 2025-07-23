import prisma, { ensureConnected } from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  try {
    // Ensure database connection before any queries
    await ensureConnected();
    
    switch (method) {
      case "GET":
        return handleGet(req, res, id);
      default:
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("Package Details API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req, res, packageId) {
  try {
    const userId = req.headers["x-user-id"];
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Get package details with current matches
    const packageDetails = await prisma.package.findFirst({
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
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        },
        matches: {
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
        },
        trackingEvents: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1
        }
      }
    });
    
    if (!packageDetails) {
      return res.status(404).json({ error: "Package not found or unauthorized" });
    }

    // Get current location from latest tracking event
    const currentLocation = packageDetails.trackingEvents.length > 0 
      ? packageDetails.trackingEvents[0].location 
      : packageDetails.currentLocation || packageDetails.senderAddress;

    // Determine final destination
    const finalDestination = packageDetails.finalDestination || packageDetails.recipientAddress;

    // Get active matches (current segment)
    const activeMatches = packageDetails.matches.filter(match => 
      ['CONFIRMED', 'IN_PROGRESS', 'ACCEPTED_BY_SENDER', 'ACCEPTED_BY_CARRIER'].includes(match.status)
    );

    // Get relay matches
    const relayMatches = packageDetails.matches.filter(match => match.isRelaySegment);

    const response = {
      id: packageDetails.id,
      title: packageDetails.title,
      description: packageDetails.description,
      weight: packageDetails.weight,
      dimensions: packageDetails.dimensions,
      status: packageDetails.status,
      trackingNumber: packageDetails.trackingNumber,
      senderAddress: packageDetails.senderAddress,
      recipientAddress: packageDetails.recipientAddress,
      finalDestination: finalDestination,
      currentLocation: currentLocation,
      isMultiSegment: packageDetails.isMultiSegment,
      segmentNumber: packageDetails.segmentNumber,
      totalSegments: packageDetails.totalSegments,
      sender: packageDetails.user,
      activeMatches: activeMatches,
      relayMatches: relayMatches,
      createdAt: packageDetails.createdAt,
      updatedAt: packageDetails.updatedAt
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching package details:", error);
    return res.status(500).json({ error: "Failed to fetch package details" });
  }
} 