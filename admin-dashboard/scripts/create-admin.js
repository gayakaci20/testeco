#!/usr/bin/env node

// Use Prisma client with fallback strategy
let PrismaClient;

// Try multiple approaches to load Prisma client
function loadPrismaClient() {
  // Approach 1: Try standard @prisma/client
  try {
    console.log('🔧 Tentative 1: Chargement depuis @prisma/client...');
    const { PrismaClient: Client } = require('@prisma/client');
    // Test instantiation to catch stub errors
    const testClient = new Client();
    testClient.$disconnect();
    console.log('✅ @prisma/client fonctionne');
    return Client;
  } catch (err) {
    console.log('⚠️  @prisma/client non disponible:', err.message);
  }

  // Approach 2: Try generated client
  try {
    console.log('🔧 Tentative 2: Chargement depuis src/generated/prisma...');
    const { PrismaClient: Client } = require('../src/generated/prisma');
    console.log('✅ Client généré chargé avec succès');
    return Client;
  } catch (err) {
    console.log('⚠️  Client généré non disponible:', err.message);
  }

  // Approach 3: Try node_modules/.prisma/client
  try {
    console.log('🔧 Tentative 3: Chargement depuis node_modules/.prisma/client...');
    const { PrismaClient: Client } = require('../node_modules/.prisma/client');
    console.log('✅ Client .prisma chargé avec succès');
    return Client;
  } catch (err) {
    console.log('⚠️  Client .prisma non disponible:', err.message);
  }

  console.error('❌ Impossible de charger le client Prisma');
  console.error('💡 Solutions possibles:');
  console.error('   1. Exécutez: npx prisma generate');
  console.error('   2. Vérifiez la version de Node.js (recommandé: 18+)');
  console.error('   3. Réinstallez les dépendances: npm install');
  process.exit(1);
}

PrismaClient = loadPrismaClient();

const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Création d\'un administrateur...');
    
    // Vérifier si un admin existe déjà
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('⚠️  Un administrateur existe déjà:', existingAdmin.email);
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 ID:', existingAdmin.id);
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      return new Promise((resolve) => {
        rl.question('Voulez-vous créer un nouvel admin quand même ? (y/N): ', (answer) => {
          rl.close();
          if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            console.log('❌ Création annulée');
            resolve();
            return;
          }
          createNewAdmin().then(resolve);
        });
      });
    }

    await createNewAdmin();

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createNewAdmin() {
  try {
    // Paramètres par défaut
    const defaultEmail = 'admin@ecodeli.pro';
    const defaultPassword = 'admin123';
    const defaultName = 'Admin Ecodeli';

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Créer l'utilisateur admin
    const admin = await prisma.user.create({
      data: {
        email: defaultEmail,
        password: hashedPassword,
        name: defaultName,
        firstName: 'Admin',
        lastName: 'Ecodeli',
        role: 'ADMIN',
        isVerified: true,
        emailVerified: new Date(),
        userType: 'PROFESSIONAL'
      }
    });

    console.log('✅ Administrateur créé avec succès !');
    console.log('📧 Email:', defaultEmail);
    console.log('🔑 Mot de passe:', defaultPassword);
    console.log('👤 ID:', admin.id);
    console.log('🌐 Vous pouvez maintenant vous connecter au dashboard admin');

  } catch (error) {
    if (error.code === 'P2002') {
      console.error('❌ Un utilisateur avec cet email existe déjà');
    } else {
      console.error('❌ Erreur lors de la création:', error.message);
    }
  }
}

// Fonction pour réinitialiser le mot de passe d'un admin
async function resetAdminPassword() {
  try {
    const adminEmail = process.argv[3] || 'admin@ecodeli.pro';
    const newPassword = process.argv[4] || 'admin123';
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const updatedAdmin = await prisma.user.update({
      where: { email: adminEmail },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Mot de passe réinitialisé !');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Nouveau mot de passe:', newPassword);
    
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error.message);
  }
}

// Fonction pour lister les admins
async function listAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        createdAt: true
      }
    });
    
    console.log('📋 Liste des administrateurs:');
    console.log('==========================');
    
    if (admins.length === 0) {
      console.log('❌ Aucun administrateur trouvé');
    } else {
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.name} (${admin.email})`);
        console.log(`   ID: ${admin.id}`);
        console.log(`   Vérifié: ${admin.isVerified ? '✅' : '❌'}`);
        console.log(`   Créé le: ${admin.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des admins:', error.message);
  }
}

// Gestion des arguments de ligne de commande
const command = process.argv[2];

switch (command) {
  case 'reset':
    resetAdminPassword();
    break;
  case 'list':
    listAdmins();
    break;
  case 'create':
  default:
    createAdmin();
    break;
} 