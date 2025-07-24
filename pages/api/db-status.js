import prisma, { ensureConnected, getConnectionStatus } from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const startTime = Date.now();
    
    // Get connection status
    const connectionStatus = getConnectionStatus();
    
    // Test database connection
    let dbTest = { success: false, responseTime: null, error: null };
    try {
      await ensureConnected();
      const testStartTime = Date.now();
      await prisma.$queryRaw`SELECT 1 as test, NOW() as server_time`;
      const responseTime = Date.now() - testStartTime;
      
      dbTest = {
        success: true,
        responseTime: `${responseTime}ms`,
        error: null
      };
    } catch (error) {
      dbTest = {
        success: false,
        responseTime: null,
        error: error.message
      };
    }

    // Get database info if connection is successful
    let dbInfo = null;
    if (dbTest.success) {
      try {
        const [versionResult, userCountResult] = await Promise.all([
          prisma.$queryRaw`SELECT version() as version`,
          prisma.user.count()
        ]);
        
        dbInfo = {
          version: versionResult[0]?.version || 'Unknown',
          userCount: userCountResult,
          connectionUrl: process.env.DATABASE_URL ? 'Configured' : 'Missing'
        };
      } catch (infoError) {
        dbInfo = { error: infoError.message };
      }
    }

    const totalTime = Date.now() - startTime;

    return res.status(200).json({
      status: dbTest.success ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      totalResponseTime: `${totalTime}ms`,
      connection: {
        ...connectionStatus,
        test: dbTest
      },
      database: dbInfo,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseConfigured: !!process.env.DATABASE_URL,
        redisConfigured: !!process.env.REDIS_URL
      }
    });

  } catch (error) {
    console.error('DB Status endpoint error:', error);
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      connection: getConnectionStatus()
    });
  }
} 