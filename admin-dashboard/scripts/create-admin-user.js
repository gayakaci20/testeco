#!/usr/bin/env node

// Script pour créer un utilisateur admin dans la base de données admin-dashboard

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔐 Création d\'un utilisateur administrateur...');
    
    const email = process.env.ADMIN_EMAIL || 'admin@ecodeli.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123!';
    const firstName = 'Admin';
    const lastName = 'EcoDeli';
    
    console.log('📧 Email admin:', email);
    console.log('🔑 Mot de passe:', password);
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: email }
    });
    
    if (existingAdmin) {
      console.log('⚠️  Un utilisateur admin existe déjà avec cet email');
      console.log('👤 Admin existant:', {
        id: existingAdmin.id,
        email: existingAdmin.email,
        firstName: existingAdmin.firstName,
        lastName: existingAdmin.lastName,
        role: existingAdmin.role,
        userType: existingAdmin.userType
      });
      
      // Vérifier si le mot de passe est correct
      if (existingAdmin.password) {
        const passwordMatch = await bcrypt.compare(password, existingAdmin.password);
        if (passwordMatch) {
          console.log('✅ Le mot de passe de l\'admin existant est correct');
        } else {
          console.log('❌ Le mot de passe de l\'admin existant ne correspond pas');
          console.log('🔧 Mise à jour du mot de passe...');
          
          const hashedPassword = await bcrypt.hash(password, 12);
          await prisma.user.update({
            where: { id: existingAdmin.id },
            data: { password: hashedPassword }
          });
          
          console.log('✅ Mot de passe mis à jour avec succès');
        }
      } else {
        console.log('❌ L\'admin existant n\'a pas de mot de passe');
        console.log('🔧 Ajout du mot de passe...');
        
        const hashedPassword = await bcrypt.hash(password, 12);
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { password: hashedPassword }
        });
        
        console.log('✅ Mot de passe ajouté avec succès');
      }
      
      return existingAdmin;
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Créer l'utilisateur admin
    const admin = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        firstName: firstName,
        lastName: lastName,
        name: `${firstName} ${lastName}`,
        role: 'ADMIN',
        userType: 'PROFESSIONAL',
        isVerified: true,
        emailVerified: new Date()
      }
    });
    
    console.log('✅ Utilisateur administrateur créé avec succès!');
    console.log('👤 Détails admin:', {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      userType: admin.userType
    });
    console.log('⚠️  IMPORTANT: Changez ce mot de passe après la première connexion!');
    
    return admin;
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
    throw error;
  }
}

// Test de connexion avec l'admin créé
async function testAdminLogin(email, password) {
  try {
    console.log('🧪 Test de connexion admin...');
    
    const user = await prisma.user.findUnique({
      where: { 
        email: email,
        role: 'ADMIN'
      }
    });
    
    if (!user) {
      console.log('❌ Utilisateur admin non trouvé');
      return false;
    }
    
    if (!user.password) {
      console.log('❌ Utilisateur admin sans mot de passe');
      return false;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      console.log('✅ Test de connexion réussi');
      return true;
    } else {
      console.log('❌ Test de connexion échoué - mot de passe incorrect');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test de connexion:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Démarrage du script de création d\'admin...');
    
    // Créer ou vérifier l'admin
    const admin = await createAdminUser();
    
    // Tester la connexion
    const email = process.env.ADMIN_EMAIL || 'admin@ecodeli.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123!';
    
    await testAdminLogin(email, password);
    
    console.log('🎉 Script terminé avec succès!');
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { createAdminUser, testAdminLogin }; 