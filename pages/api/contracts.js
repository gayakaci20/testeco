import prisma, { ensureConnected } from '../../lib/prisma';
import { verifyToken } from '../../lib/auth.js';

// Utilitaire pour extraire proprement le token d'authentification depuis la requête HTTP
function getAuthToken(req) {
  // Next.js expose req.cookies mais restons compatibles avec toutes les versions
  if (req.cookies && req.cookies.auth_token) {
    return req.cookies.auth_token;
  }
  // Fallback : parser manuellement l'en-tête Cookie si nécessaire
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return null;
  const tokenMatch = cookieHeader.match(/auth_token=([^;]+)/);
  return tokenMatch ? tokenMatch[1] : null;
}

export default async function handler(req, res) {
  try {
        // Ensure database connection before any queries
    await ensureConnected();

// Récupérer et vérifier le token JWT
    const token = getAuthToken(req);
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const { page = 1, limit = 10, status, search, merchantId, carrierId } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause based on user role
      let whereClause = {};

      if (merchantId) {
        // Allow filtering by specific merchant ID
        whereClause.merchantId = merchantId;
      } else if (carrierId) {
        // Allow filtering by specific carrier ID
        whereClause.carrierId = carrierId;
      } else if (user.role === 'MERCHANT') {
        whereClause.merchantId = user.id;
      } else if (user.role === 'CARRIER') {
        whereClause.carrierId = user.id;
      } else if (user.role === 'SERVICE_PROVIDER') {
        // Les prestataires de services sont traités comme des merchants dans la logique des contrats
        whereClause.merchantId = user.id;
      } else if (user.role === 'ADMIN') {
        // Admin can see all contracts
      } else {
        // For other roles, return empty results
        return res.status(200).json([]);
      }

      // Add filters
      if (status) {
        whereClause.status = status;
      }

      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [contracts, total] = await Promise.all([
        prisma.contract.findMany({
          where: whereClause,
          include: {
            merchant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                name: true,
                companyName: true,
                companyFirstName: true,
                companyLastName: true
              }
            },
            carrier: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                name: true,
                companyName: true,
                companyFirstName: true,
                companyLastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.contract.count({ where: whereClause })
      ]);

      return res.status(200).json(contracts);

    } else if (req.method === 'POST') {
      // Only admins can create contracts for merchants
      if (user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Only admins can create contracts' });
      }

      const {
        merchantId,
        title,
        content,
        terms,
        value,
        currency,
        expiresAt
      } = req.body;

      // Validate required fields
      if (!merchantId || !title || !content) {
        return res.status(400).json({ 
          message: 'Merchant ID, title, and content are required' 
        });
      }

      // Verify merchant exists
      const merchant = await prisma.user.findUnique({
        where: { id: merchantId },
        select: { id: true, role: true }
      });

      if (!merchant || merchant.role !== 'MERCHANT') {
        return res.status(400).json({ 
          message: 'Invalid merchant ID' 
        });
      }

      // Create contract
      const contract = await prisma.contract.create({
        data: {
          merchantId,
          title,
          content,
          terms: terms || null,
          value: value ? parseFloat(value) : null,
          currency: currency || 'EUR',
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          status: 'DRAFT'
        },
        include: {
          merchant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              name: true,
              companyName: true,
              companyFirstName: true,
              companyLastName: true
            }
          }
        }
      });

      return res.status(201).json(contract);

    } else if (req.method === 'PUT') {
      // Update contract - mainly for signing
      const { id, status, signedAt, value, expiresAt } = req.body;

      if (!id) {
        return res.status(400).json({ message: 'Contract ID is required' });
      }

      // Check if contract exists and user has permission
      const existingContract = await prisma.contract.findUnique({
        where: { id },
        select: { merchantId: true, status: true }
      });

      if (!existingContract) {
        return res.status(404).json({ message: 'Contract not found' });
      }

      // Check permissions - merchant and service provider can only update their own contracts
      if (user.role !== 'ADMIN' && existingContract.merchantId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized to update this contract' });
      }

      const updateData = {};
      if (status) updateData.status = status;
      if (signedAt) updateData.signedAt = new Date(signedAt);
      if (value !== undefined) updateData.value = value ? parseFloat(value) : null;
      if (expiresAt) updateData.expiresAt = new Date(expiresAt);

      const updatedContract = await prisma.contract.update({
        where: { id },
        data: updateData,
        include: {
          merchant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              name: true,
              companyName: true,
              companyFirstName: true,
              companyLastName: true
            }
          }
        }
      });

      return res.status(200).json(updatedContract);

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in contracts API:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  } finally {
    await prisma.$disconnect();
  }
} 