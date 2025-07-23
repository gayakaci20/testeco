import prisma from './prisma';

/**
 * Test database connection with detailed error reporting
 * @returns {Promise<Object>} Connection status and info
 */
export async function testDatabaseConnection() {
  const result = {
    connected: false,
    error: null,
    version: null,
    databaseName: null,
    timestamp: new Date().toISOString()
  };

  try {
    // Test basic connection
    const response = await prisma.$queryRaw`SELECT version(), current_database()`;
    
    if (response && response.length > 0) {
      result.connected = true;
      result.version = response[0].version;
      result.databaseName = response[0].current_database;
      console.log('✅ Database connection successful:', {
        version: result.version,
        database: result.databaseName
      });
    }
  } catch (error) {
    result.error = error.message;
    console.error('❌ Database connection failed:', error);
  }

  return result;
}

/**
 * Get database connection information
 * @returns {Promise<Object>} Connection info
 */
export async function getDatabaseInfo() {
  try {
    const [dbInfo] = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        inet_server_addr() as server_addr,
        inet_server_port() as server_port,
        version() as version
    `;
    
    return {
      success: true,
      info: dbInfo
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if specific tables exist
 * @param {string[]} tableNames - Array of table names to check
 * @returns {Promise<Object>} Table existence status
 */
export async function checkTablesExist(tableNames = ['User', 'Package', 'Ride']) {
  try {
    const results = {};
    
    for (const tableName of tableNames) {
      const [result] = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        )
      `;
      results[tableName] = result.exists;
    }
    
    return {
      success: true,
      tables: results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get basic statistics about the database
 * @returns {Promise<Object>} Database statistics
 */
export async function getDatabaseStats() {
  try {
    const userCount = await prisma.user.count();
    const packageCount = await prisma.package.count();
    const rideCount = await prisma.ride.count();
    
    return {
      success: true,
      stats: {
        users: userCount,
        packages: packageCount,
        rides: rideCount
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
} 