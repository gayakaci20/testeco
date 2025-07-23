import prisma, { ensureConnected } from '../../lib/prisma';

export default async function handler(req, res) {
  try {
        // Ensure database connection before any queries
    await ensureConnected();

// Get user from auth token
    const { verifyToken } = await import('../../lib/auth');
    const token = req.cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token' });
    }
    
    const decodedToken = await verifyToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    const userId = decodedToken.id;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has access to banking info
    const allowedRoles = ['CARRIER', 'MERCHANT', 'PROVIDER', 'SERVICE_PROVIDER'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.method === 'GET') {
      // Get banking information
      const bankingInfo = await prisma.bankingInfo.findUnique({
        where: { userId: userId }
      });

      return res.status(200).json(bankingInfo);
    } 
    
    else if (req.method === 'POST') {
      // Create or update banking information
      const { accountHolder, iban, bic, bankName, address } = req.body;

      // Validate required fields
      if (!accountHolder || !iban || !bic || !bankName) {
        return res.status(400).json({ 
          error: 'Missing required fields: accountHolder, iban, bic, bankName' 
        });
      }

      // Validate IBAN format (basic validation)
      const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
      if (!ibanRegex.test(iban.replace(/\s/g, ''))) {
        return res.status(400).json({ error: 'Invalid IBAN format' });
      }

      // Validate BIC format (basic validation)
      const bicRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
      if (!bicRegex.test(bic.replace(/\s/g, ''))) {
        return res.status(400).json({ error: 'Invalid BIC format' });
      }

      const bankingInfo = await prisma.bankingInfo.upsert({
        where: { userId: userId },
        update: {
          accountHolder,
          iban: iban.replace(/\s/g, ''), // Remove spaces
          bic: bic.replace(/\s/g, ''), // Remove spaces
          bankName,
          address,
          updatedAt: new Date()
        },
        create: {
          userId,
          accountHolder,
          iban: iban.replace(/\s/g, ''), // Remove spaces
          bic: bic.replace(/\s/g, ''), // Remove spaces
          bankName,
          address
        }
      });

      return res.status(200).json(bankingInfo);
    } 
    
    else if (req.method === 'DELETE') {
      // Delete banking information
      await prisma.bankingInfo.delete({
        where: { userId: userId }
      });

      return res.status(200).json({ message: 'Banking information deleted successfully' });
    } 
    
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Banking info API error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Banking information not found' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
} 