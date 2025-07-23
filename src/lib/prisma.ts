import { PrismaClient } from '@prisma/client';

// Configuration d'un client Prisma standard sans Accelerate
// Cela résout les problèmes d'API key invalide

// PrismaClient est attaché à l'objet `global` en développement
// pour éviter d'épuiser votre limite de connexions à la base de données
// Learn more: https://pris.ly/d/help/next-js-best-practices

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // En développement, utiliser une variable globale
  const globalForPrisma = global as unknown as { prisma?: PrismaClient };
  
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  
  prisma = globalForPrisma.prisma;
}

export { prisma };
export default prisma; 