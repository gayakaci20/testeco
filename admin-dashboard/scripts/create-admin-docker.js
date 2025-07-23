#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    console.log('🔐 Création d\'un utilisateur administrateur...')
    console.log('Node.js version:', process.version)
    
    const email = 'admin@ecodeli.com'
    const password = 'admin123!' // Changez ce mot de passe en production
    const firstName = 'Admin'
    const lastName = 'EcoDeli'
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingAdmin) {
      console.log('⚠️  Un utilisateur admin existe déjà avec cet email')
      console.log('👤 Admin existant:', {
        id: existingAdmin.id,
        email: existingAdmin.email,
        firstName: existingAdmin.firstName,
        lastName: existingAdmin.lastName,
        role: existingAdmin.role
      })
      return
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Créer l'utilisateur admin
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'ADMIN',
        userType: 'PROFESSIONAL',
        isVerified: true,
      }
    })
    
    console.log('✅ Utilisateur administrateur créé avec succès!')
    console.log('📧 Email:', email)
    console.log('🔑 Mot de passe:', password)
    console.log('👤 ID:', admin.id)
    console.log('⚠️  IMPORTANT: Changez ce mot de passe après la première connexion!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser() 