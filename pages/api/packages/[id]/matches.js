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
    console.error("Package Matches API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req, res, packageId) {
  try {
    const userId = req.headers["x-user-id"];
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Verify the package belongs to the user
    const package_ = await prisma.package.findFirst({
      where: {
        id: packageId,
        userId: userId
      }
    });
    
    if (!package_) {
      return res.status(404).json({ error: "Package not found or unauthorized" });
    }
    
    const matches = await prisma.match.findMany({
      where: {
        packageId: packageId
      },
      include: {
        package: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true }
            }
          }
        },
        ride: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, role: true }
            }
          }
        },
        payment: true,
        carrierReview: {
          include: {
            customer: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return res.status(200).json(matches);
  } catch (error) {
    console.error("Error fetching package matches:", error);
    return res.status(500).json({ error: "Failed to fetch package matches" });
  }
} 