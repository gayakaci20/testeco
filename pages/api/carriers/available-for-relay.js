import prisma, { ensureConnected } from '../../../lib/prisma';

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

const { method } = req;

  try {
    switch (method) {
      case "GET":
        return handleGet(req, res);
      default:
        res.setHeader("Allow", ["GET"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("Available Carriers API error:", error);
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
    
    // Get available carriers (excluding the current user)
    const availableCarriers = await prisma.user.findMany({
      where: {
        role: 'CARRIER',
        isVerified: true,
        id: {
          not: userId // Exclude current user
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        phoneNumber: true,
        email: true,
        createdAt: true,
        rides: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED']
            },
            departureTime: {
              gte: new Date()
            }
          },
          select: {
            id: true,
            origin: true,
            destination: true,
            departureTime: true,
            allowsRelayPickup: true,
            allowsRelayDropoff: true,
            vehicleType: true,
            maxWeight: true,
            availableSpace: true
          },
          orderBy: {
            departureTime: 'asc'
          },
          take: 3 // Show only next 3 rides
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    // Calculate carrier statistics
    const carriersWithStats = await Promise.all(
      availableCarriers.map(async (carrier) => {
        // Get completion stats
        const completedMatches = await prisma.match.count({
          where: {
            ride: {
              userId: carrier.id
            },
            status: 'COMPLETED'
          }
        });

        const totalMatches = await prisma.match.count({
          where: {
            ride: {
              userId: carrier.id
            }
          }
        });

        const successRate = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

        // Get recent relay history
        const relayHistory = await prisma.trackingEvent.count({
          where: {
            nextCarrierId: carrier.id,
            eventType: 'TRANSFER'
          }
        });

        return {
          ...carrier,
          stats: {
            completedDeliveries: completedMatches,
            totalDeliveries: totalMatches,
            successRate: successRate,
            relayExperience: relayHistory
          },
          upcomingRides: carrier.rides
        };
      })
    );

    // Filter carriers with relevant rides or good stats
    const qualifiedCarriers = carriersWithStats.filter(carrier => {
      // Include carriers with upcoming rides or good delivery history
      return carrier.upcomingRides.length > 0 || 
             carrier.stats.completedDeliveries >= 5 || 
             carrier.stats.relayExperience > 0;
    });

    return res.status(200).json(qualifiedCarriers);
  } catch (error) {
    console.error("Error fetching available carriers:", error);
    return res.status(500).json({ error: "Failed to fetch available carriers" });
  }
} 