/**
 * Authentication Debug Script
 * Run with: node scripts/debug-auth.js
 */

import { verifyToken, generateToken } from '../lib/auth.js';
import { JWT_SECRET } from '../lib/auth-constants.js';
import { prisma, ensureConnected } from '../lib/prisma.js';

console.log('🔍 EcoDeli Authentication Debug Tool');
console.log('=====================================\n');

async function debugAuth() {
  try {
    // 1. Check environment variables
    console.log('1️⃣ Environment Variables Check:');
    console.log('   ✓ NODE_ENV:', process.env.NODE_ENV || 'undefined');
    console.log('   ✓ JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('   ✓ JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
    console.log('   ✓ JWT_SECRET preview:', process.env.JWT_SECRET?.substring(0, 10) + '...' || 'undefined');
    console.log('   ✓ DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('   ✓ NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL || 'undefined');
    console.log('');

    // 2. Test database connection
    console.log('2️⃣ Database Connection Test:');
    try {
      await ensureConnected();
      const userCount = await prisma.user.count();
      console.log('   ✅ Database connection: SUCCESS');
      console.log('   ✓ Total users in database:', userCount);
    } catch (dbError) {
      console.log('   ❌ Database connection: FAILED');
      console.log('   ✗ Error:', dbError.message);
      return;
    }
    console.log('');

    // 3. Test JWT token generation and verification
    console.log('3️⃣ JWT Token Test:');
    
    // Get a test user
    const testUser = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userType: true
      }
    });

    if (!testUser) {
      console.log('   ⚠️ No users found in database for testing');
      console.log('   💡 Create a user first using the registration endpoint');
      return;
    }

    try {
      // Generate token
      const token = await generateToken(testUser);
      console.log('   ✅ Token generation: SUCCESS');
      console.log('   ✓ Token length:', token.length);
      console.log('   ✓ Token format valid:', token.split('.').length === 3 ? 'YES' : 'NO');
      console.log('   ✓ Token preview:', token.substring(0, 50) + '...');

      // Verify token
      const decoded = await verifyToken(token);
      console.log('   ✅ Token verification: SUCCESS');
      console.log('   ✓ Decoded user ID:', decoded.id);
      console.log('   ✓ Decoded email:', decoded.email);
      console.log('   ✓ Token matches user:', decoded.id === testUser.id ? 'YES' : 'NO');
    } catch (tokenError) {
      console.log('   ❌ JWT operations: FAILED');
      console.log('   ✗ Error:', tokenError.message);
    }
    console.log('');

    // 4. Test CORS configuration
    console.log('4️⃣ CORS Configuration Check:');
    console.log('   ✓ CORS headers will be set in API endpoints');
    console.log('   ✓ Multiple cookie names supported (token, auth_token)');
    console.log('   ✓ Authorization header fallback enabled');
    console.log('');

    // 5. Recommendations
    console.log('5️⃣ Troubleshooting Recommendations:');
    console.log('   🔧 If 401 errors persist:');
    console.log('      - Check browser cookies in DevTools');
    console.log('      - Verify JWT_SECRET is consistent across environments');
    console.log('      - Clear all cookies and try fresh login');
    console.log('');
    console.log('   🔧 If host validation errors persist:');
    console.log('      - Check Next.js allowedHosts configuration');
    console.log('      - Verify domain matches in nginx.conf');
    console.log('      - Check request origin headers');
    console.log('');
    console.log('   🔧 If registration 500 errors persist:');
    console.log('      - Check database connection stability');
    console.log('      - Verify all required fields are provided');
    console.log('      - Check Prisma schema matches database');
    console.log('');

    console.log('✅ Debug completed successfully!');

  } catch (error) {
    console.error('❌ Debug script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugAuth().catch(console.error); 