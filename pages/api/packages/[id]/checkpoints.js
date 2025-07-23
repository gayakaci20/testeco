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
      case "POST":
        return handlePost(req, res, id);
      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("Package Checkpoints API error:", error);
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
      }
    });
    
    if (!package_) {
      return res.status(404).json({ error: "Package not found or unauthorized" });
    }
    
    // Get checkpoints from the database
    const checkpoints = await prisma.trackingEvent.findMany({
      where: {
        packageId: packageId
      },
      orderBy: {
        timestamp: 'asc'
      }
    });
    
    return res.status(200).json(checkpoints);
  } catch (error) {
    console.error("Error fetching checkpoints:", error);
    return res.status(500).json({ error: "Failed to fetch checkpoints" });
  }
}

async function handlePost(req, res, packageId) {
  try {
    const userId = req.headers["x-user-id"];
    const { location, notes, lat, lng } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (!location) {
      return res.status(400).json({ error: "Location is required" });
    }
    
    // Verify the user is the carrier for this package
    const match = await prisma.match.findFirst({
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
        }
      }
    });
    
    if (!match) {
      return res.status(403).json({ error: "Unauthorized: Only the assigned carrier can add checkpoints" });
    }
    
    // Create the checkpoint
    const checkpoint = await prisma.trackingEvent.create({
      data: {
        packageId: packageId,
        location: location,
        notes: notes || '',
        lat: lat || null,
        lng: lng || null,
        timestamp: new Date(),
        status: 'CHECKPOINT',
        carrierId: userId
      }
    });
    
    // Create notification for package owner
    await prisma.notification.create({
      data: {
        userId: match.package.userId,
        type: 'PACKAGE_UPDATE',
        title: 'Nouveau point de contrôle',
        message: `Votre colis est maintenant à: ${location}`,
        data: {
          packageId: packageId,
          checkpointId: checkpoint.id,
          location: location
        }
      }
    });
    
    return res.status(201).json(checkpoint);
  } catch (error) {
    console.error("Error creating checkpoint:", error);
    return res.status(500).json({ error: "Failed to create checkpoint" });
  }
} 