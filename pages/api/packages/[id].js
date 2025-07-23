import { prisma } from '../../../src/lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  
  console.log(`Handling ${req.method} request to /api/packages/${id}`);
  
  try {
    if (req.method === 'GET') {
      const packageData = await prisma.package.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
      
      if (!packageData) {
        return res.status(404).json({ error: 'Package not found' });
      }
      
      return res.status(200).json(packageData);
    } 
    else if (req.method === 'DELETE') {
      // Check if package exists
      const existingPackage = await prisma.package.findUnique({
        where: { id },
        include: {
          matches: true,
        },
      });

      if (!existingPackage) {
        return res.status(404).json({ error: 'Package not found' });
      }

      // Delete the package and all related matches
      await prisma.$transaction([
        prisma.match.deleteMany({
          where: { packageId: id },
        }),
        prisma.package.delete({
          where: { id },
        }),
      ]);

      return res.status(200).json({ message: 'Package deleted successfully' });
    }
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`Error handling ${req.method} for package ${id}:`, error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
} 