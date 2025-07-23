import prisma, { ensureConnected } from '../../../lib/prisma-stable';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure database connection is established first
    await ensureConnected();

    // Get user from auth token
    const { verifyToken } = await import('../../../lib/auth');
    const token = req.cookies.auth_token;
    const headerUserId = req.headers['x-user-id'];
    
    console.log('🔍 Debug API Dashboard Merchant:', {
      hasToken: !!token,
      headerUserId: headerUserId,
      cookies: Object.keys(req.cookies),
      headers: Object.keys(req.headers)
    });
    
    if (!token) {
      console.error('❌ No auth token found');
      return res.status(401).json({ error: 'Unauthorized - No token' });
    }
    
    const decodedToken = await verifyToken(token);
    if (!decodedToken) {
      console.error('❌ Invalid token');
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
    
    const userId = decodedToken.id;
    
    console.log('🔑 Token decoded:', {
      tokenUserId: userId,
      headerUserId: headerUserId,
      match: userId === headerUserId
    });
    
    if (!userId) {
      console.error('No userId found in decoded token:', decodedToken);
      return res.status(401).json({ error: 'Unauthorized - No user ID in token' });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'MERCHANT') {
      console.error('❌ User not found or not merchant:', {
        userFound: !!user,
        userRole: user?.role,
        userId: userId
      });
      return res.status(403).json({ error: 'Access forbidden - User is not a merchant' });
    }

    console.log(`📊 Fetching merchant dashboard data for: ${user.email} (ID: ${userId})`);

    // Get merchant's orders with all related data
    const orders = await prisma.order.findMany({
      where: {
        merchantId: userId
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
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            createdAt: true
          }
        },
        package: {
          select: {
            id: true,
            trackingNumber: true,
            status: true,
            matches: {
              include: {
                ride: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true
                      }
                    }
                  }
                },
                carrierReview: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📦 Found ${orders.length} orders for merchant`);

    // Get merchant's payments from orders
    const payments = await prisma.payment.findMany({
      where: {
        order: {
          merchantId: userId
        }
      },
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            total: true,
            status: true
          }
        },
        user: {
          select: {
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

    console.log(`💳 Found ${payments.length} payments for merchant`);

    // Get merchant's contracts
    const contracts = await prisma.contract.findMany({
      where: {
        merchantId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📋 Found ${contracts.length} contracts for merchant`);

    // Get packages/shipments from merchant's orders (not by isMerchant field)
    const shipments = await prisma.package.findMany({
      where: {
        order: {
          merchantId: userId
        }
      },
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            customerEmail: true,
            deliveryAddress: true,
            status: true
          }
        },
        matches: {
          include: {
            ride: {
              include: {
                user: {
                  select: { 
                    firstName: true, 
                    lastName: true, 
                    email: true, 
                    phoneNumber: true 
                  }
                }
              }
            },
            payment: {
              select: {
                id: true,
                amount: true,
                status: true
              }
            },
            carrierReview: true
          }
        },
        trackingEvents: {
          select: {
            id: true,
            status: true,
            location: true,
            timestamp: true,
            notes: true
          },
          orderBy: {
            timestamp: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`🚚 Found ${shipments.length} shipments for merchant`);

    // Calculate stats
    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'PENDING').length,
      confirmedOrders: orders.filter(o => o.status === 'CONFIRMED').length,
      completedOrders: orders.filter(o => o.status === 'DELIVERED').length,
      totalRevenue: payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0),
      monthlyRevenue: payments
        .filter(p => p.status === 'COMPLETED' && new Date(p.createdAt).getMonth() === new Date().getMonth())
        .reduce((sum, p) => sum + p.amount, 0),
      totalPayments: payments.length,
      completedPayments: payments.filter(p => p.status === 'COMPLETED').length,
      totalContracts: contracts.length,
      activeContracts: contracts.filter(c => c.status === 'SIGNED').length,
      totalShipments: shipments.length,
      activeShipments: shipments.filter(s => s.status === 'CONFIRMED' || s.status === 'IN_TRANSIT').length
    };

    const response = {
      orders: orders,
      payments: payments,
      contracts: contracts,
      shipments: shipments,
      stats: stats
    };

    console.log('📊 Merchant dashboard data summary:', {
      merchantId: userId,
      merchantEmail: user.email,
      ordersCount: orders.length,
      paymentsCount: payments.length,
      contractsCount: contracts.length,
      shipmentsCount: shipments.length,
      totalRevenue: stats.totalRevenue,
      completedPayments: payments.filter(p => p.status === 'COMPLETED').length
    });

    // Log sample orders and payments for debugging
    if (orders.length > 0) {
      console.log('📦 Sample orders:', orders.slice(0, 2).map(o => ({
        id: o.id,
        total: o.total,
        status: o.status,
        customerName: o.customerName,
        hasPackage: !!o.package,
        paymentsCount: o.payments?.length || 0
      })));
    }

    if (payments.length > 0) {
      console.log('💳 Sample payments:', payments.slice(0, 2).map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        orderId: p.order?.id
      })));
    }

    if (shipments.length > 0) {
      console.log('🚚 Sample shipments:', shipments.slice(0, 2).map(s => ({
        id: s.id,
        status: s.status,
        trackingNumber: s.trackingNumber,
        orderId: s.order?.id,
        matchesCount: s.matches?.length || 0
      })));
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error fetching merchant dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 