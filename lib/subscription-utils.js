import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Check if user has active subscription
export async function hasActiveSubscription(userId) {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: 'ACTIVE',
        currentPeriodEnd: {
          gt: new Date() // subscription end date is in the future
        }
      }
    });

    return !!subscription;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

// Get user's subscription details
export async function getUserSubscription(userId) {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!subscription) {
      return { hasSubscription: false, subscription: null };
    }

    const isActive = subscription.status === 'ACTIVE' && 
      subscription.currentPeriodEnd && 
      new Date() < new Date(subscription.currentPeriodEnd);

    return {
      hasSubscription: true,
      isActive,
      subscription,
      needsPayment: !isActive
    };
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return { hasSubscription: false, subscription: null, error: error.message };
  }
}

// Check if user role requires subscription
export function requiresSubscription(userRole) {
  return ['PROVIDER', 'SERVICE_PROVIDER', 'CARRIER'].includes(userRole);
}

// Get subscription-restricted features
export function getRestrictedFeatures() {
  return [
    'create_service',
    'create_storage_box',
    'create_ride',
    'post_delivery',
    'accept_bookings',
    'manage_listings',
    'premium_messaging',
    'advanced_analytics'
  ];
}

// Check if feature is available for user
export async function canAccessFeature(userId, userRole, feature) {
  // Customers don't need subscriptions
  if (!requiresSubscription(userRole)) {
    return { canAccess: true, reason: 'customer_access' };
  }

  // Check if feature requires subscription
  const restrictedFeatures = getRestrictedFeatures();
  if (!restrictedFeatures.includes(feature)) {
    return { canAccess: true, reason: 'free_feature' };
  }

  // Check subscription status
  const hasSubscription = await hasActiveSubscription(userId);
  
  if (!hasSubscription) {
    return { 
      canAccess: false, 
      reason: 'subscription_required',
      message: 'Un abonnement professionnel est requis pour accéder à cette fonctionnalité.'
    };
  }

  return { canAccess: true, reason: 'subscription_active' };
}

// Middleware function for API routes
export async function checkSubscriptionAccess(req, res, next, userId, userRole, feature = null) {
  // Skip check for customers
  if (!requiresSubscription(userRole)) {
    return next();
  }

  // Check specific feature if provided
  if (feature) {
    const access = await canAccessFeature(userId, userRole, feature);
    if (!access.canAccess) {
      return res.status(403).json({ 
        error: 'Abonnement requis', 
        message: access.message,
        subscriptionRequired: true
      });
    }
  } else {
    // General subscription check
    const hasSubscription = await hasActiveSubscription(userId);
    if (!hasSubscription) {
      return res.status(403).json({ 
        error: 'Abonnement requis', 
        message: 'Un abonnement professionnel est requis pour accéder à cette fonctionnalité.',
        subscriptionRequired: true
      });
    }
  }

  return next();
}

// Get days until subscription expires
export function getDaysUntilExpiration(subscription) {
  if (!subscription || !subscription.currentPeriodEnd) {
    return null;
  }

  const now = new Date();
  const endDate = new Date(subscription.currentPeriodEnd);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

// Check if subscription is expiring soon (within 7 days)
export function isSubscriptionExpiringSoon(subscription) {
  const daysUntilExpiration = getDaysUntilExpiration(subscription);
  return daysUntilExpiration !== null && daysUntilExpiration <= 7 && daysUntilExpiration > 0;
} 