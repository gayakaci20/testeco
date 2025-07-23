/**
 * Debug endpoint to check user role information
 * Helps diagnose role-based routing issues
 */
import { verifyToken } from '../../lib/auth';
import prisma, { ensureConnected } from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Ensure database connection is established first
    await ensureConnected();

    // Get token from cookies
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided',
        debug: {
          cookiesReceived: Object.keys(req.cookies),
          headers: req.headers.cookie || 'No cookie header'
        }
      });
    }

    console.log('🔍 Token found for role debug:', token.substring(0, 20) + '...');
    
    // Verify token
    const decoded = await verifyToken(token);
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({ 
        message: 'Invalid token',
        debug: {
          tokenExists: !!token,
          tokenDecoded: !!decoded,
          decodedContent: decoded ? 'Valid structure' : 'Invalid structure'
        }
      });
    }
    
    console.log('✅ Token verified for user:', decoded.id);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        userType: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        debug: {
          decodedUserId: decoded.id,
          tokenEmail: decoded.email
        }
      });
    }

    // Debug information
    const roleAnalysis = {
      // From token
      token: {
        role: decoded.role,
        userType: decoded.userType,
        email: decoded.email,
        iat: decoded.iat,
        exp: decoded.exp
      },
      
      // From database
      database: {
        role: user.role,
        userType: user.userType,
        email: user.email,
        id: user.id
      },
      
      // Role resolution (matching RoleBasedNavigation logic)
      resolved: {
        roleFirst: user.role || user.userType || 'CUSTOMER',
        userTypeFirst: user.userType || user.role || 'CUSTOMER',
        middlewareLogic: decoded.role || decoded.userType || 'CUSTOMER',
        originalMiddleware: decoded.userType || decoded.role || 'CUSTOMER'
      },
      
      // Dashboard URLs for each resolution
      dashboardUrls: {
        current: getRoleSpecificDashboardUrl(user),
        byRole: `/dashboard/${(user.role || 'customer').toLowerCase()}`,
        byUserType: `/dashboard/${(user.userType || 'customer').toLowerCase()}`
      }
    };

    console.log('📊 Role analysis for user:', user.email, roleAnalysis);

    return res.status(200).json({
      success: true,
      message: 'User role analysis completed',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        userType: user.userType
      },
      roleAnalysis,
      recommendations: {
        currentIssue: roleAnalysis.resolved.roleFirst !== roleAnalysis.resolved.middlewareLogic ? 
          'Role resolution mismatch between components' : 'No role resolution issues detected',
        suggestedDashboard: roleAnalysis.dashboardUrls.current,
        action: 'Check console logs for redirect behavior'
      }
    });
    
  } catch (error) {
    console.error('❌ Debug user role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Helper function to get role-specific dashboard URL
function getRoleSpecificDashboardUrl(user) {
  const userRole = user.role || user.userType || 'CUSTOMER';
  
  const dashboardUrls = {
    CUSTOMER: '/dashboard/customer',
    CARRIER: '/dashboard/carrier',
    MERCHANT: '/dashboard/merchant',
    PROVIDER: '/dashboard/provider',
    SERVICE_PROVIDER: '/dashboard/provider',
    SPECIALIZED_PROVIDER: '/dashboard/specialized-provider',
    ADMIN: '/admin-dashboard'
  };
  
  // Vérifier si c'est un transporteur professionnel
  if (userRole === 'CARRIER' && user.userType === 'PROFESSIONAL') {
    return '/dashboard/procarrier';
  }

  // Vérifier si c'est un prestataire professionnel
  if (userRole === 'PROVIDER' && user.userType === 'PROFESSIONAL') {
    return '/dashboard/proprovider';
  }
  
  return dashboardUrls[userRole] || '/dashboard/customer';
} 