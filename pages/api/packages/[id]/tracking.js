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
    console.error("Package Tracking API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req, res, packageId) {
  try {
    const userId = req.headers["x-user-id"];
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Verify the package belongs to the user or user is the carrier
    const package_ = await prisma.package.findFirst({
      where: {
        id: packageId,
        OR: [
          { userId: userId }, // Package owner
          { 
            matches: {
              some: {
                ride: {
                  userId: userId // Carrier
                }
              }
            }
          }
        ]
      },
      include: {
        trackingEvents: {
          include: {
            carrier: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            timestamp: 'asc'
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
                    phoneNumber: true
                  }
                }
              }
            },
            payment: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    if (!package_) {
      return res.status(404).json({ error: "Package not found or unauthorized" });
    }
    
    // Get the active match (if any)
    const activeMatch = package_.matches.find(match => 
      ['CONFIRMED', 'IN_PROGRESS', 'ACCEPTED_BY_SENDER', 'ACCEPTED_BY_CARRIER'].includes(match.status)
    );
    
    // Create tracking timeline
    const timeline = [
      {
        status: 'CREATED',
        label: 'Colis créé',
        timestamp: package_.createdAt,
        completed: true,
        location: package_.senderAddress
      },
      {
        status: 'CONFIRMED',
        label: 'Pris en charge',
        timestamp: package_.status === 'CONFIRMED' ? package_.updatedAt : null,
        completed: ['CONFIRMED', 'IN_TRANSIT', 'DELIVERED'].includes(package_.status),
        location: package_.senderAddress,
        carrier: activeMatch?.ride?.user
      },
      {
        status: 'IN_TRANSIT',
        label: 'En transit',
        timestamp: package_.status === 'IN_TRANSIT' ? package_.updatedAt : null,
        completed: ['IN_TRANSIT', 'DELIVERED'].includes(package_.status),
        carrier: activeMatch?.ride?.user
      },
      {
        status: 'DELIVERED',
        label: 'Livré',
        timestamp: package_.status === 'DELIVERED' ? package_.updatedAt : null,
        completed: package_.status === 'DELIVERED',
        location: package_.recipientAddress,
        carrier: activeMatch?.ride?.user
      }
    ];
    
    // Add checkpoints to timeline
    package_.trackingEvents.forEach(event => {
      timeline.push({
        status: 'CHECKPOINT',
        label: event.location,
        timestamp: event.timestamp,
        completed: true,
        location: event.location,
        notes: event.notes,
        carrier: event.carrier,
        lat: event.lat,
        lng: event.lng
      });
    });
    
    // Sort timeline by timestamp
    timeline.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    return res.status(200).json({
      package: package_,
      timeline: timeline,
      activeMatch: activeMatch,
      checkpointsCount: package_.trackingEvents.length,
      estimatedDelivery: getEstimatedDelivery(package_, activeMatch)
    });
  } catch (error) {
    console.error("Error fetching tracking data:", error);
    return res.status(500).json({ error: "Failed to fetch tracking data" });
  }
}

function getEstimatedDelivery(package_, activeMatch) {
  if (package_.status === 'DELIVERED') return null;
  
  const baseDate = new Date();
  
  // Add estimated delivery time based on status
  switch (package_.status) {
    case 'PENDING':
      baseDate.setHours(baseDate.getHours() + 24); // 24 hours for pickup
      break;
    case 'CONFIRMED':
      baseDate.setHours(baseDate.getHours() + 6); // 6 hours for departure
      break;
    case 'IN_TRANSIT':
      baseDate.setHours(baseDate.getHours() + 2); // 2 hours for delivery
      break;
    default:
      return null;
  }
  
  return baseDate.toISOString();
} 