#!/usr/bin/env node

// Compatible version for older Node.js versions
const bcrypt = require('bcryptjs')

// Try to use @prisma/client directly instead of generated version
let PrismaClient;
try {
  PrismaClient = require('@prisma/client').PrismaClient;
} catch (error) {
  console.error('❌ Could not import @prisma/client. Please run: npm install @prisma/client');
  process.exit(1);
}

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    console.log('🔐 Création d\'un utilisateur administrateur...')
    
    const email = 'admin@ecodeli.com'
    const password = 'admin123!' // Changez ce mot de passe en production
    const firstName = 'Admin'
    const lastName = 'EcoDeli'
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: email }
    })
    
    if (existingAdmin) {
      console.log('⚠️  Un utilisateur admin existe déjà avec cet email')
      return
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Créer l'utilisateur admin
    const admin = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        firstName: firstName,
        lastName: lastName,
        role: 'ADMIN',
        userType: 'PROFESSIONAL',
        isVerified: true,
      }
    })
    
    console.log('✅ Utilisateur administrateur créé avec succès!')
    console.log('📧 Email:', email)
    console.log('🔑 Mot de passe:', password)
    console.log('⚠️  IMPORTANT: Changez ce mot de passe après la première connexion!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser() 