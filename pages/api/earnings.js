import prisma, { ensureConnected } from '../../lib/prisma';

export default async function handler(req, res) {
      // Ensure database connection before any queries
    await ensureConnected();

if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
    const { role } = req.query;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has access to earnings
    const allowedRoles = ['CARRIER', 'MERCHANT', 'PROVIDER', 'SERVICE_PROVIDER'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let earningsData = {};

    // Calculate earnings based on user role
    switch (user.role) {
      case 'CARRIER':
        earningsData = await getCarrierEarnings(userId);
        break;
      case 'MERCHANT':
        earningsData = await getMerchantEarnings(userId);
        break;
      case 'PROVIDER':
      case 'SERVICE_PROVIDER':
        earningsData = await getProviderEarnings(userId);
        break;
      default:
        return res.status(400).json({ error: 'Invalid user role' });
    }

    res.status(200).json(earningsData);
  } catch (error) {
    console.error('Earnings API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getCarrierEarnings(userId) {
  // Get all completed payments for carrier
  const completedPayments = await prisma.payment.findMany({
    where: {
      status: 'COMPLETED',
      match: {
        ride: {
          userId: userId
        }
      }
    },
    include: {
      match: {
        include: {
          package: true,
          ride: true
        }
      }
    },
    orderBy: { completedAt: 'desc' }
  });

  // Get pending payments
  const pendingPayments = await prisma.payment.findMany({
    where: {
      status: { in: ['PENDING', 'PROCESSING'] },
      match: {
        ride: {
          userId: userId
        }
      }
    },
    include: {
      match: {
        include: {
          package: true,
          ride: true
        }
      }
    }
  });

  const totalEarnings = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const pendingEarnings = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate monthly earnings
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  const monthlyEarnings = completedPayments
    .filter(payment => new Date(payment.completedAt) >= currentMonth)
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Get recent earnings (last 10)
  const recentEarnings = completedPayments.slice(0, 10).map(payment => ({
    description: `Livraison ${payment.match.package.trackingNumber}`,
    amount: payment.amount,
    date: new Date(payment.completedAt).toLocaleDateString('fr-FR'),
    status: 'Payé'
  }));

  // Calculate next payment date (next Friday)
  const nextPaymentDate = getNextFriday();

  // Get upcoming payments (pending ones that will be paid next Friday)
  const upcomingPayments = pendingPayments.length > 0 ? [{
    date: nextPaymentDate,
    description: `${pendingPayments.length} livraison(s) en attente`,
    amount: pendingEarnings
  }] : [];

  return {
    totalEarnings,
    monthlyEarnings,
    pendingEarnings,
    nextPaymentDate,
    recentEarnings,
    upcomingPayments
  };
}

async function getMerchantEarnings(userId) {
  // Get all completed orders for merchant
  const completedOrders = await prisma.order.findMany({
    where: {
      merchantId: userId,
      status: 'DELIVERED'
    },
    include: {
      items: true,
      payments: true
    },
    orderBy: { updatedAt: 'desc' }
  });

  // Get pending orders
  const pendingOrders = await prisma.order.findMany({
    where: {
      merchantId: userId,
      status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED'] }
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  const totalEarnings = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingEarnings = pendingOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  // Calculate monthly earnings
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  const monthlyEarnings = completedOrders
    .filter(order => new Date(order.updatedAt) >= currentMonth)
    .reduce((sum, order) => sum + order.totalAmount, 0);

  // Get recent earnings
  const recentEarnings = completedOrders.slice(0, 10).map(order => ({
    description: `Commande #${order.id.substring(0, 8)}`,
    amount: order.totalAmount,
    date: new Date(order.updatedAt).toLocaleDateString('fr-FR'),
    status: 'Livré'
  }));

  // Calculate next payment dates (15th and 30th of month)
  const nextPaymentDate = getNextMerchantPaymentDate();

  // Get upcoming payments
  const upcomingPayments = pendingEarnings > 0 ? [{
    date: nextPaymentDate,
    description: `${pendingOrders.length} commande(s) en cours`,
    amount: pendingEarnings
  }] : [];

  return {
    totalEarnings,
    monthlyEarnings,
    pendingEarnings,
    nextPaymentDate,
    recentEarnings,
    upcomingPayments
  };
}

async function getProviderEarnings(userId) {
  // Get all completed bookings for provider
  const completedBookings = await prisma.booking.findMany({
    where: {
      providerId: userId,
      status: 'COMPLETED'
    },
    include: {
      service: true,
      customer: {
        select: { firstName: true, lastName: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  // Get pending bookings
  const pendingBookings = await prisma.booking.findMany({
    where: {
      providerId: userId,
      status: { in: ['CONFIRMED', 'IN_PROGRESS'] }
    },
    include: {
      service: true,
      customer: {
        select: { firstName: true, lastName: true }
      }
    }
  });

  const totalEarnings = completedBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
  const pendingEarnings = pendingBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

  // Calculate monthly earnings
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  const monthlyEarnings = completedBookings
    .filter(booking => new Date(booking.updatedAt) >= currentMonth)
    .reduce((sum, booking) => sum + booking.totalAmount, 0);

  // Get recent earnings
  const recentEarnings = completedBookings.slice(0, 10).map(booking => ({
    description: `Service ${booking.service.name}`,
    amount: booking.totalAmount,
    date: new Date(booking.updatedAt).toLocaleDateString('fr-FR'),
    status: 'Terminé'
  }));

  // Calculate next payment date (5 business days after service completion)
  const nextPaymentDate = getNextBusinessDay(5);

  // Get upcoming payments
  const upcomingPayments = pendingEarnings > 0 ? [{
    date: nextPaymentDate,
    description: `${pendingBookings.length} service(s) en cours`,
    amount: pendingEarnings
  }] : [];

  return {
    totalEarnings,
    monthlyEarnings,
    pendingEarnings,
    nextPaymentDate,
    recentEarnings,
    upcomingPayments
  };
}

function getNextFriday() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  const nextFriday = new Date(today);
  nextFriday.setDate(today.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
  return nextFriday.toLocaleDateString('fr-FR');
}

function getNextMerchantPaymentDate() {
  const today = new Date();
  const currentDay = today.getDate();
  
  if (currentDay < 15) {
    return new Date(today.getFullYear(), today.getMonth(), 15).toLocaleDateString('fr-FR');
  } else if (currentDay < 30) {
    return new Date(today.getFullYear(), today.getMonth(), 30).toLocaleDateString('fr-FR');
  } else {
    return new Date(today.getFullYear(), today.getMonth() + 1, 15).toLocaleDateString('fr-FR');
  }
}

function getNextBusinessDay(daysToAdd) {
  const today = new Date();
  let businessDays = 0;
  let currentDate = new Date(today);
  
  while (businessDays < daysToAdd) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
  }
  
  return currentDate.toLocaleDateString('fr-FR');
} 