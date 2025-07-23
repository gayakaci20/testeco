import prisma, { ensureConnected } from '../../../lib/prisma';

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
    console.error("Match API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGet(req, res, matchId) {
  try {
    const userId = req.headers["x-user-id"];
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { package: { userId: userId } },
          { ride: { userId: userId } }
        ]
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
        payment: true
      }
    });
    
    if (!match) {
      return res.status(404).json({ error: "Match not found or unauthorized" });
    }
    
    return res.status(200).json(match);
  } catch (error) {
    console.error("Error fetching match:", error);
    return res.status(500).json({ error: "Failed to fetch match" });
  }
} 