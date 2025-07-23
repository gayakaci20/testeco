import prisma, { ensureConnected } from '../../lib/prisma';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure database connection is established
    await ensureConnected();

    // Get user from auth token
    const token = req.cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - No token' });
    }
    
    const decodedToken = await verifyToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    const userId = decodedToken.id;

    // Verify user is a merchant
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'MERCHANT') {
      return res.status(403).json({ error: 'Access forbidden - User is not a merchant' });
    }

    console.log(`📦 Fetching delivery proposals for merchant: ${user.email} (ID: ${userId})`);

    // Get delivery proposals (notifications with type DELIVERY_ACCEPTED) for this merchant's orders
    // Only get proposals from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    console.log(`📅 Looking for proposals since: ${sevenDaysAgo.toISOString()}`);
    
    const deliveryProposals = await prisma.notification.findMany({
      where: {
        userId: userId,
        type: 'DELIVERY_ACCEPTED',
        createdAt: {
          gte: sevenDaysAgo
        }
        // Show all proposals from last 7 days (read and unread)
      },
      include: {
        // Get order details through relatedEntityId
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📋 Found ${deliveryProposals.length} delivery proposals`);
    console.log(`📋 Raw proposals:`, deliveryProposals.map(p => ({
      id: p.id,
      message: p.message.substring(0, 100) + '...',
      createdAt: p.createdAt,
      relatedEntityId: p.relatedEntityId
    })));

    // For each proposal, get the order details and carrier info
    const proposalsWithDetails = await Promise.all(
      deliveryProposals.map(async (proposal) => {
        try {
          // Get order details
          const order = await prisma.order.findUnique({
            where: { id: proposal.relatedEntityId },
            include: {
              items: {
                select: {
                  id: true,
                  productName: true,
                  quantity: true,
                  unitPrice: true,
                  totalPrice: true
                }
              },
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phoneNumber: true
                }
              }
            }
          });

          if (!order) {
            console.warn(`⚠️ Order not found for proposal: ${proposal.id}`);
            return null;
          }

                     // Extract carrier ID from the notification message
           let carrierId = null;
           let carrierInfo = null;
           
           // Look for CarrierID in the message
           const carrierIdMatch = proposal.message.match(/CarrierID:([a-zA-Z0-9]+)/);
           if (carrierIdMatch) {
             carrierId = carrierIdMatch[1];
             
             // Get carrier details
             try {
               carrierInfo = await prisma.user.findUnique({
                 where: { id: carrierId },
                 select: {
                   id: true,
                   firstName: true,
                   lastName: true,
                   email: true,
                   phoneNumber: true,
                   companyName: true
                 }
               });
             } catch (error) {
               console.warn(`⚠️ Could not fetch carrier info for ID: ${carrierId}`);
             }
           }

           const carrierName = carrierInfo ? 
             (carrierInfo.companyName || `${carrierInfo.firstName} ${carrierInfo.lastName}`) : 
             'Transporteur professionnel';

           return {
             id: proposal.id,
             orderId: order.id,
             orderShortId: order.id.substring(0, 8),
             customerName: order.customerName,
             customerEmail: order.customerEmail,
             customerPhone: order.customerPhone,
             deliveryAddress: order.deliveryAddress,
             deliveryTimeSlot: order.deliveryTimeSlot,
             deliveryInstructions: order.deliveryInstructions,
             deliveryFee: order.deliveryFee,
             totalAmount: order.total,
             itemsCount: order.items?.length || 0,
             items: order.items || [],
             proposalMessage: proposal.message.replace(/\s*CarrierID:[a-zA-Z0-9]+/, ''), // Remove CarrierID from displayed message
             proposedAt: proposal.createdAt,
             status: 'PENDING', // Default status for proposals
             // Carrier information
             carrierId: carrierId,
             carrierName: carrierName,
             carrierEmail: carrierInfo?.email || null,
             carrierPhone: carrierInfo?.phoneNumber || null
           };
        } catch (error) {
          console.error(`❌ Error processing proposal ${proposal.id}:`, error);
          return null;
        }
      })
    );

    // Filter out null results
    const validProposals = proposalsWithDetails.filter(p => p !== null);

    console.log(`✅ Processed ${validProposals.length} valid delivery proposals`);

    res.status(200).json({
      success: true,
      proposals: validProposals,
      total: validProposals.length
    });

  } catch (error) {
    console.error('❌ Error fetching merchant delivery proposals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 