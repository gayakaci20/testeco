import { PrismaClient } from '@prisma/client';

// Configuration simple et stable pour Prisma
let prisma = null;
let isConnecting = false;

// Créer une instance Prisma avec configuration optimisée
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    errorFormat: 'minimal',
  });
}

// Obtenir ou créer le client Prisma
function getPrisma() {
  if (!prisma) {
    console.log('🔄 Creating new Prisma client...');
    prisma = createPrismaClient();
  }
  return prisma;
}

// Fonction de connexion robuste avec retry
async function ensureConnected() {
  const client = getPrisma();
  
  // Éviter les connexions simultanées
  if (isConnecting) {
    console.log('⏳ Connection already in progress, waiting...');
    // Attendre un peu et réessayer
    await new Promise(resolve => setTimeout(resolve, 1000));
    return client;
  }
  
  isConnecting = true;
  
  try {
    // Test simple de connexion
    await client.$connect();
    
    // Vérifier avec une requête basique
    await client.$queryRaw`SELECT 1 as test`;
    
    console.log('✅ Prisma connection successful');
    return client;
    
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message);
    
    // Réinitialiser le client en cas d'erreur
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        console.error('Error disconnecting:', disconnectError.message);
      }
      prisma = null;
    }
    
    // Créer un nouveau client et réessayer une fois
    try {
      console.log('🔄 Retrying with new client...');
      prisma = createPrismaClient();
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Prisma reconnection successful');
      return prisma;
    } catch (retryError) {
      console.error('❌ Prisma retry failed:', retryError.message);
      throw new Error(`Database connection failed: ${retryError.message}`);
    }
  } finally {
    isConnecting = false;
  }
}

// Client par défaut
const prismaClient = getPrisma();

// Gestion gracieuse de l'arrêt
process.on('beforeExit', async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

export default prismaClient;
export { ensureConnected, getPrisma }; 