/**
 * API endpoint to test database connectivity
 * Useful for debugging connection issues
 */
import { testDatabaseConnection, getDatabaseInfo, checkTablesExist, getDatabaseStats } from '../../lib/db-utils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const connectionTest = await testDatabaseConnection();
    
    if (!connectionTest.connected) {
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: connectionTest.error,
        timestamp: connectionTest.timestamp
      });
    }

    // Get detailed database info
    const dbInfo = await getDatabaseInfo();
    
    // Check if main tables exist
    const tablesCheck = await checkTablesExist();
    
    // Get database statistics
    const stats = await getDatabaseStats();

    const response = {
      success: true,
      message: 'Database connection successful',
      connection: {
        connected: connectionTest.connected,
        version: connectionTest.version,
        database: connectionTest.databaseName,
        timestamp: connectionTest.timestamp
      },
      info: dbInfo.success ? dbInfo.info : { error: dbInfo.error },
      tables: tablesCheck.success ? tablesCheck.tables : { error: tablesCheck.error },
      stats: stats.success ? stats.stats : { error: stats.error },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? '***CONFIGURED***' : 'NOT SET',
        directUrl: process.env.DIRECT_URL ? '***CONFIGURED***' : 'NOT SET'
      }
    };

    console.log('✅ Database test completed successfully');
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 