#!/usr/bin/env node

console.log('🧪 Test du client Prisma...');

// Test du client Prisma généré
let PrismaClient;
try {
  console.log('🔧 Tentative de chargement depuis src/generated/prisma...');
  PrismaClient = require('../src/generated/prisma').PrismaClient;
  console.log('✅ Client Prisma chargé avec succès depuis src/generated/prisma');
} catch (err) {
  console.error('❌ Erreur lors du chargement depuis src/generated/prisma:', err.message);
  
  // Fallback vers @prisma/client standard
  try {
    console.log('🔧 Tentative de chargement depuis @prisma/client...');
    PrismaClient = require('@prisma/client').PrismaClient;
    console.log('✅ Client Prisma chargé avec succès depuis @prisma/client');
  } catch (err2) {
    console.error('❌ Erreur lors du chargement depuis @prisma/client:', err2.message);
    console.error('💡 Exécutez "npx prisma generate" dans le répertoire admin-dashboard');
    process.exit(1);
  }
}

// Test de connexion
async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔌 Test de connexion à la base de données...');
    
    // Test simple de connexion
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');
    
    // Test d'une requête simple
    const userCount = await prisma.user.count();
    console.log(`📊 Nombre d'utilisateurs dans la base: ${userCount}`);
    
    // Test spécifique pour les admins
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    console.log(`👑 Nombre d'administrateurs: ${adminCount}`);
    
    console.log('🎉 Tous les tests sont passés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('💡 Vérifiez que la base de données est accessible et que les migrations sont appliquées');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection(); 