import prisma, { ensureConnected } from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure database connection is established
    await ensureConnected();

    console.log('📦 Fetching merchant delivery orders for professional carriers');

    // Get all merchant orders that require delivery and are ready for pickup
    const deliveryOrders = await prisma.order.findMany({
      where: {
        hasDelivery: true,
        deliveryAddress: {
          not: null
        },
        status: {
          in: ['CONFIRMED', 'PROCESSING', 'SHIPPED'] // Orders ready for delivery
        }
      },
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
        merchant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phoneNumber: true,
            address: true
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`🚚 Found ${deliveryOrders.length} merchant delivery orders`);

    // Format orders for trajet.jsx display
    const formattedOrders = deliveryOrders.map(order => ({
      id: order.id,
      type: 'merchant_delivery',
      description: `Livraison commande marchand #${order.id.substring(0, 8)}`,
      title: `Livraison chez ${order.customerName}`,
      
      // Pickup information (merchant address)
      senderAddress: order.merchant.address || 'Adresse marchand non définie',
      senderName: order.merchant.companyName || `${order.merchant.firstName} ${order.merchant.lastName}`,
      senderPhone: order.merchant.phoneNumber || '',
      senderEmail: order.merchant.email,
      
      // Delivery information (customer address)
      recipientAddress: order.deliveryAddress,
      recipientName: order.customerName,
      recipientPhone: order.customerPhone || '',
      recipientEmail: order.customerEmail || '',
      
      // Order details
      price: order.deliveryFee || 5.99, // Delivery fee as base price
      total: order.total,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      weight: order.items.reduce((total, item) => total + item.quantity, 0), // Approximate weight by item count
      dimensions: null, // Could be calculated based on items
      
      // Status and timing
      status: order.status,
      urgent: false,
      fragile: false, // Could be determined by product types
      
      // Additional order info
      orderType: 'MERCHANT_DELIVERY',
      deliveryTimeSlot: order.deliveryTimeSlot,
      deliveryInstructions: order.deliveryInstructions,
      itemsCount: order.items.length,
      items: order.items,
      
      // Timestamps
      createdAt: order.createdAt,
      confirmedAt: order.confirmedAt,
      updatedAt: order.updatedAt,
      
      // Related entities
      merchantId: order.merchantId,
      customerId: order.customerId
    }));

    console.log('📊 Sample formatted orders:', formattedOrders.slice(0, 2).map(o => ({
      id: o.id,
      type: o.type,
      description: o.description,
      senderAddress: o.senderAddress,
      recipientAddress: o.recipientAddress,
      price: o.price,
      status: o.status
    })));

    res.status(200).json(formattedOrders);

  } catch (error) {
    console.error('❌ Error fetching merchant delivery orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 