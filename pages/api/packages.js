import { prisma } from '../../src/lib/prisma';
import { calculateFullPackagePrice, calculatePackageSize } from '../../lib/priceCalculator';

export default async function handler(req, res) {
  try {
    console.log(`Handling ${req.method} request to /api/packages`);
    
    if (req.method === 'GET') {
      try {
        console.log('Fetching packages');
        const { status, available } = req.query;
        const userId = req.headers['x-user-id'];
        
        // Build where clause
        const where = {};
        
        // Filter by user if x-user-id is provided
        if (userId) {
          where.userId = userId;
          console.log(`Filtering packages for user: ${userId}`);
        }
        
        if (status) {
          where.status = status;
        }
        
        // If available=true, only show packages that don't have accepted matches
        if (available === 'true') {
          where.status = 'PENDING';
          where.matches = {
            none: {
              status: {
                in: ['ACCEPTED_BY_SENDER', 'CONFIRMED']
              }
            }
          };
        }
        
        const packages = await prisma.package.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            matches: {
              select: {
                id: true,
                status: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        console.log(`Found ${packages.length} packages`);
        return res.status(200).json(packages);
      } catch (error) {
        console.error('Packages fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch packages', details: error.message });
      }
    } else if (req.method === 'POST') {
      try {
        const data = req.body;
        console.log('Received package data:', JSON.stringify(data, null, 2));
        
        // Validate user ID is provided
        if (!data.userId) {
          console.error('Missing userId in package creation request');
          return res.status(400).json({ 
            error: 'userId is required', 
            details: 'A valid user ID must be provided'
          });
        }
        
        // Validate user ID format - reject IDs with user_ prefix
        if (typeof data.userId === 'string' && data.userId.startsWith('user_')) {
          console.error(`Invalid user ID format: ${data.userId}`);
          return res.status(400).json({
            error: 'Invalid userId format',
            details: 'The user ID format is invalid - cannot start with "user_" prefix'
          });
        }
        
        console.log(`Looking up user with ID: ${data.userId}`);
        // Validate that the user exists
        try {
          const userExists = await prisma.user.findUnique({
            where: { id: data.userId }
          });
          
          // If user doesn't exist, return error
          if (!userExists) {
            console.error(`User with ID ${data.userId} not found`);
            return res.status(400).json({ 
              error: 'Invalid userId', 
              details: `No user found with ID: ${data.userId}`
            });
          }
          
          console.log(`User found: ${userExists.email}`);
        } catch (userLookupError) {
          console.error('Error looking up user:', userLookupError);
          return res.status(500).json({ 
            error: 'User lookup failed', 
            details: userLookupError.message 
          });
        }

        // Calculer le prix automatiquement si les adresses sont fournies
        let calculatedPrice = null;
        let calculatedSizeLabel = null;
        
        if (data.pickupAddress && data.deliveryAddress) {
          try {
            console.log('Calculating package price...');
            const priceCalculation = await calculateFullPackagePrice({
              pickupAddress: data.pickupAddress,
              deliveryAddress: data.deliveryAddress,
              weight: data.weight ? parseFloat(data.weight) : undefined,
              dimensions: data.dimensions
            });
            
            calculatedPrice = priceCalculation.price;
            calculatedSizeLabel = priceCalculation.details.packageSize;
            
            console.log(`Calculated price: ${calculatedPrice}€, size: ${calculatedSizeLabel}`);
          } catch (priceError) {
            console.error('Error calculating price:', priceError);
            // Continue without price calculation if it fails
          }
        }

        // Si pas de calcul automatique mais dimensions fournies, calculer au moins la taille
        if (!calculatedSizeLabel && data.dimensions) {
          calculatedSizeLabel = calculatePackageSize(data.dimensions);
        }

        // Generate a unique tracking number
        const trackingNumber = `PKG-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

        // Prepare the data object with correct field names for the current schema
        const packageData = {
          userId: data.userId,
          description: data.description || data.title || 'Package description',
          weight: data.weight ? parseFloat(data.weight) : null,
          dimensions: data.dimensions || null,
          price: calculatedPrice, // Prix calculé automatiquement
          size: calculatedSizeLabel, // Taille calculée automatiquement
          imageUrl: data.imageUrl || null,
          status: 'PENDING',
          trackingNumber: trackingNumber,
          fragile: data.fragile || false,
          urgent: data.urgent || false,
          // Map pickup/delivery addresses to sender/recipient addresses
          senderAddress: data.pickupAddress || '',
          recipientAddress: data.deliveryAddress || '',
          // Use provided names and phones or defaults
          senderName: data.senderName || 'Sender',
          senderPhone: data.senderPhone || '',
          recipientName: data.recipientName || 'Recipient',
          recipientPhone: data.recipientPhone || '',
        };
        
        console.log('Creating package with prepared data:', JSON.stringify(packageData, null, 2));

        // Create the package
        try {
          const newPackage = await prisma.package.create({
            data: packageData,
          });

          console.log('Package created successfully:', JSON.stringify(newPackage, null, 2));
          return res.status(201).json(newPackage);
        } catch (createError) {
          console.error('Package creation database error:', createError);
          return res.status(500).json({ 
            error: 'Failed to create package in database', 
            details: createError.message
          });
        }
      } catch (processError) {
        console.error('Error processing package data:', processError);
        return res.status(500).json({ 
          error: 'Failed to process package data', 
          details: processError.message
        });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (topLevelError) {
    console.error('Top-level error in packages API:', topLevelError);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: topLevelError.message 
    });
  }
} 