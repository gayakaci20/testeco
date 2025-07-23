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

// Simple connection configuration
const prismaConfig = {
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  errorFormat: 'minimal',
};

// Global variable for the Prisma client
let prisma = null;
let connectionPromise = null;
let isConnected = false;

// Create or get existing Prisma client instance
function getPrismaClient() {
  if (!prisma) {
    console.log('🔄 Creating new Prisma client...');
    prisma = new PrismaClient(prismaConfig);
    isConnected = false;
  }
  return prisma;
}

// Simplified connection function with better error handling
async function ensureConnected() {
  try {
    const client = getPrismaClient();
    
    // Si déjà connecté et fonctionne, retourner le client
    if (isConnected) {
      try {
        // Test rapide de la connexion
        await client.$queryRaw`SELECT 1`;
        return client;
      } catch (testError) {
        console.log('⚠️ Connexion perdue, reconnexion nécessaire');
        isConnected = false;
        connectionPromise = null;
      }
    }
    
    // Éviter les connexions simultanées
    if (connectionPromise) {
      console.log('⏳ Attente de la connexion en cours...');
      await connectionPromise;
      return client;
    }
    
    console.log('🔌 Établissement de la connexion à la base de données...');
    
    // Créer une nouvelle promesse de connexion
    connectionPromise = (async () => {
      try {
        // Assurer la connexion
        await client.$connect();
        
        // Test de la connexion
        await client.$queryRaw`SELECT 1`;
        
        isConnected = true;
        console.log('✅ Database connection verified');
        return client;
      } catch (error) {
        console.error('❌ Connection failed:', error.message);
        isConnected = false;
        connectionPromise = null;
        throw error;
      }
    })();
    
    await connectionPromise;
    return client;
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Reset everything on failure
    connectionPromise = null;
    isConnected = false;
    
    // Clean up failed client
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        console.error('Error disconnecting failed client:', disconnectError.message);
      }
      prisma = null;
    }
    
    // Try one more time with a fresh client
    try {
      console.log('🔄 Tentative de reconnexion avec un nouveau client...');
      prisma = new PrismaClient(prismaConfig);
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      isConnected = true;
      console.log('✅ Database reconnection successful');
      return prisma;
    } catch (reconnectError) {
      console.error('❌ Database reconnection failed:', reconnectError.message);
      isConnected = false;
      throw new Error(`Database connection failed: ${reconnectError.message}`);
    }
  }
}

// Graceful shutdown
const gracefulShutdown = async () => {
  if (prisma) {
    try {
      await prisma.$disconnect();
      console.log('📦 Prisma client disconnected');
    } catch (error) {
      console.error('Error during graceful shutdown:', error.message);
    }
    prisma = null;
    isConnected = false;
    connectionPromise = null;
  }
};

// Handle process termination
process.on('beforeExit', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Initialize the client
const prismaClient = getPrismaClient();

// Auto-connect on module load
if (process.env.NODE_ENV === 'production') {
  // In production, connect immediately
  ensureConnected().catch(err => {
    console.error('❌ Failed to connect to database on startup:', err.message);
  });
} else {
  // In development, connect on first use
  console.log('🔄 Prisma client initialized (will connect on first use)');
}

export default prismaClient;
export { ensureConnected };
export { prismaClient as prisma };

// Function to get current prisma instance (for compatibility)
export function getPrismaInstance() {
  return getPrismaClient();
}