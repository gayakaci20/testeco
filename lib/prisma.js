import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { join } from 'path';

// Explicitly load environment variables from .env.local and .env files
config({ path: join(process.cwd(), '.env.local') });
config({ path: join(process.cwd(), '.env') });

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  throw new Error('DATABASE_URL environment variable is required');
}

console.log('✅ DATABASE_URL loaded successfully');

// Enhanced connection configuration with timeout and pool management
const prismaConfig = {
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  errorFormat: 'minimal',
  // Add connection pool and timeout configuration
  __internal: {
    engine: {
      connectTimeout: 60000, // 60 seconds
      queryTimeout: 30000,   // 30 seconds
      pool: {
        timeout: 30000,      // 30 seconds
        idleTimeout: 600000, // 10 minutes
        maxLifetime: 1800000, // 30 minutes
        size: 5,             // Pool size
      },
    },
  },
};

// Global variables for the Prisma client
let prisma = null;
let connectionPromise = null;
let isConnected = false;
let lastHealthCheck = 0;
let heartbeatInterval = null;
let reconnectAttempts = 0;

// Constants for connection management
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000; // 5 seconds

// Health check function to verify database connectivity
async function performHealthCheck() {
  if (!prisma) return false;
  
  try {
    await prisma.$queryRaw`SELECT 1 as health_check`;
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

// Start heartbeat to maintain connection alive
function startHeartbeat() {
  if (heartbeatInterval) return; // Already running
  
  heartbeatInterval = setInterval(async () => {
    if (isConnected && prisma) {
      const isHealthy = await performHealthCheck();
      if (!isHealthy) {
        console.log('💔 Heartbeat failed - connection lost');
        isConnected = false;
        connectionPromise = null;
      } else {
        lastHealthCheck = Date.now();
        console.log('💓 Heartbeat successful');
      }
    }
  }, HEALTH_CHECK_INTERVAL);
}

// Stop heartbeat
function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Create or get existing Prisma client instance
function getPrismaClient() {
  if (!prisma) {
    console.log('🔄 Creating new Prisma client...');
    prisma = new PrismaClient(prismaConfig);
    isConnected = false;
    reconnectAttempts = 0;
  }
  return prisma;
}

// Enhanced connection function with retry logic and heartbeat
async function ensureConnected() {
  const client = getPrismaClient();
  
  // Check if connection is still alive with recent health check
  if (isConnected && (Date.now() - lastHealthCheck) < HEALTH_CHECK_INTERVAL) {
    return client;
  }
  
  // Quick connection test if we think we're connected
  if (isConnected) {
    try {
      await client.$queryRaw`SELECT 1 as test`;
      lastHealthCheck = Date.now();
      return client;
    } catch (testError) {
      console.log('⚠️ Connection lost, reconnection needed');
      isConnected = false;
      connectionPromise = null;
      stopHeartbeat();
    }
  }
  
  // Prevent concurrent connections
  if (connectionPromise) {
    console.log('⏳ Waiting for existing connection attempt...');
    return await connectionPromise;
  }
  
  // Create new connection promise with retry logic
  connectionPromise = attemptConnection();
  
  try {
    const result = await connectionPromise;
    return result;
  } finally {
    connectionPromise = null;
  }
}

// Connection attempt with exponential backoff retry
async function attemptConnection() {
  let lastError = null;
  
  for (let attempt = 1; attempt <= MAX_RECONNECT_ATTEMPTS; attempt++) {
    try {
      console.log(`🔌 Database connection attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}...`);
      
      // Clean up any existing connection
      if (prisma && !isConnected) {
        try {
          await prisma.$disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
        prisma = null;
      }
      
      // Create fresh client if needed
      const client = getPrismaClient();
      
      // Set connection timeout
      const connectPromise = Promise.race([
        (async () => {
          await client.$connect();
          await client.$queryRaw`SELECT 1 as connection_test`;
          return client;
        })(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 30000)
        )
      ]);
      
      const result = await connectPromise;
      
      // Connection successful
      isConnected = true;
      reconnectAttempts = 0;
      lastHealthCheck = Date.now();
      
      // Start heartbeat to maintain connection
      startHeartbeat();
      
      console.log('✅ Database connection established successfully');
      return result;
      
    } catch (error) {
      lastError = error;
      isConnected = false;
      
      console.error(`❌ Connection attempt ${attempt} failed:`, error.message);
      
      // If it's the last attempt, don't wait
      if (attempt === MAX_RECONNECT_ATTEMPTS) {
        break;
      }
      
      // Exponential backoff delay
      const delay = RECONNECT_DELAY * Math.pow(2, attempt - 1);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Clean up failed client
      if (prisma) {
        try {
          await prisma.$disconnect();
        } catch (e) {
          // Ignore cleanup errors
        }
        prisma = null;
      }
    }
  }
  
  // All attempts failed
  reconnectAttempts = MAX_RECONNECT_ATTEMPTS;
  const errorMessage = `Database connection failed after ${MAX_RECONNECT_ATTEMPTS} attempts. Last error: ${lastError?.message}`;
  console.error('💀', errorMessage);
  throw new Error(errorMessage);
}

// Graceful shutdown with heartbeat cleanup
const gracefulShutdown = async () => {
  console.log('🔄 Initiating graceful shutdown...');
  
  // Stop heartbeat first
  stopHeartbeat();
  
  if (prisma) {
    try {
      await prisma.$disconnect();
      console.log('📦 Prisma client disconnected successfully');
    } catch (error) {
      console.error('Error during graceful shutdown:', error.message);
    }
  }
  
  // Reset all connection state
  prisma = null;
  isConnected = false;
  connectionPromise = null;
  lastHealthCheck = 0;
  reconnectAttempts = 0;
  
  console.log('✅ Graceful shutdown completed');
};

// Handle process termination
process.on('beforeExit', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Initialize the client
const prismaClient = getPrismaClient();

// Connection status and diagnostic functions
function getConnectionStatus() {
  return {
    isConnected,
    lastHealthCheck: new Date(lastHealthCheck).toISOString(),
    reconnectAttempts,
    hasHeartbeat: !!heartbeatInterval,
    timeSinceLastCheck: Date.now() - lastHealthCheck,
  };
}

// Auto-connect on module load with heartbeat
if (process.env.NODE_ENV === 'production') {
  // In production, connect immediately and start monitoring
  console.log('🚀 Production mode: Connecting to database and starting heartbeat...');
  ensureConnected()
    .then(() => {
      console.log('✅ Initial database connection successful');
    })
    .catch(err => {
      console.error('❌ Failed to connect to database on startup:', err.message);
      // Try again after a delay
      setTimeout(() => {
        ensureConnected().catch(retryErr => {
          console.error('❌ Database retry connection failed:', retryErr.message);
        });
      }, 10000); // Retry after 10 seconds
    });
} else {
  // In development, connect on first use
  console.log('🔄 Development mode: Prisma client initialized (will connect on first use)');
}

export default prismaClient;
export { ensureConnected, getConnectionStatus };
export { prismaClient as prisma };

// Function to get current prisma instance (for compatibility)
export function getPrismaInstance() {
  return getPrismaClient();
}