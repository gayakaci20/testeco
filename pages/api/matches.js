import prisma, { ensureConnected } from '../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;
  try {
    // Ensure database connection is established
    await ensureConnected();
    
    switch (method) {
      case "GET":
        return handleGet(req, res);
      case "PUT":
        return handlePut(req, res);
      case "POST":
        return handlePost(req, res);
      default:
        res.setHeader("Allow", ["GET", "PUT", "POST"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("Matches API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req, res) {
  try {
    const { status } = req.query;
    const userId = req.headers["x-user-id"];
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const where = {
      OR: [
        { package: { userId: userId } },
        { ride: { userId: userId } }
      ],
      ...(status && status !== "all" && { status })
    };
    
    const matches = await prisma.match.findMany({
      where,
      include: {
        package: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        },
        ride: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    
    return res.status(200).json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return res.status(500).json({ error: "Failed to fetch matches" });
  }
}

async function handlePut(req, res) {
  try {
    const { id, status } = req.body;
    const userId = req.headers["x-user-id"];
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (!id || !status) {
      return res.status(400).json({ error: "id and status are required" });
    }
    
    const existingMatch = await prisma.match.findFirst({
      where: {
        id: id,
        OR: [
          { package: { userId: userId } },
          { ride: { userId: userId } }
        ]
      },
      include: {
        package: { include: { user: true } },
        ride: { include: { user: true } }
      }
    });
    
    if (!existingMatch) {
      return res.status(404).json({ error: "Match not found or unauthorized" });
    }
    
    const match = await prisma.match.update({
      where: { id: id },
      data: { status: status },
      include: {
        package: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        },
        ride: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        }
      }
    });
    
    return res.status(200).json(match);
  } catch (error) {
    console.error("Error updating match:", error);
    return res.status(500).json({ error: "Failed to update match" });
  }
}

async function handlePost(req, res) {
  try {
    const { packageId, rideId: providedRideId, price } = req.body || {};
    
    // Validate input
    if (!packageId) {
      return res.status(400).json({ error: "packageId is required" });
    }
    
    // Authenticate carrier via JWT cookie
    const authModule = await import("../../lib/auth.js");
    const { verifyToken } = authModule;
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No token" });
    }
    
    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Unauthorized - Invalid token" });
    }
    
    const carrierId = decoded.userId || decoded.id;
    
    // Ensure user is a carrier
    const carrier = await prisma.user.findUnique({ where: { id: carrierId } });
    if (!carrier || carrier.role !== "CARRIER") {
      return res.status(403).json({ error: "Access denied. Carrier role required." });
    }
    
    // Fetch package
    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return res.status(404).json({ error: "Package not found" });
    }
    
    // Determine ride
    let rideId = providedRideId;
    if (rideId) {
      // Verify ride belongs to carrier
      const ride = await prisma.ride.findFirst({ where: { id: rideId, userId: carrierId } });
      if (!ride) {
        return res.status(404).json({ error: "Ride not found or unauthorized" });
      }
    } else {
      // Create a minimal ride automatically
      const newRide = await prisma.ride.create({
        data: {
          userId: carrierId,
          origin: pkg.pickupAddress || "",
          destination: pkg.deliveryAddress || "",
          departureTime: new Date(),
          pricePerKg: 5.0, // Prix par défaut de 5€ par kg
          status: "PENDING",
          availableSpace: "50kg", // Espace disponible par défaut
        },
      });
      rideId = newRide.id;
    }
    
    // Create match (status PENDING)
    const match = await prisma.match.create({
      data: {
        packageId,
        rideId,
        status: "PENDING",
        price: price || pkg.price || null,
      },
      include: {
        package: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        },
        ride: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        },
      },
    });
    
    // 🚨 NOUVEAU: Créer une notification avec email pour le propriétaire du colis
    try {
      const { createNotificationWithEmail } = await import('../../lib/notification-helper.js');
      
      await createNotificationWithEmail({
        userId: pkg.userId, // Le propriétaire du colis
        type: 'MATCH_UPDATE',
        title: 'Nouvelle proposition de transport !',
        message: `${carrier.firstName} ${carrier.lastName} a proposé de transporter votre colis "${pkg.description}"${price ? ` pour ${price}€` : ''}.`,
        relatedEntityId: match.id,
        isRead: false,
        data: {
          carrierName: `${carrier.firstName} ${carrier.lastName}`,
          packageDescription: pkg.description,
          price: price || 0,
          packageId: pkg.id,
          route: `${pkg.pickupAddress} → ${pkg.deliveryAddress}`,
          carrierId: carrier.id
        }
      });
      
      console.log(`📧 Notification avec email créée pour le client ${pkg.userId} - Nouvelle proposition de ${carrier.firstName} ${carrier.lastName}`);
    } catch (notificationError) {
      console.error('Erreur lors de la création de la notification avec email:', notificationError);
      // Ne pas faire échouer la création du match si la notification échoue
    }
    
    return res.status(201).json({ success: true, match });
  } catch (error) {
    console.error("Error creating match:", error);
    return res.status(500).json({ error: "Failed to create match" });
  } finally {
    // Note: connection disconnected in global handler elsewhere if needed
  }
}
