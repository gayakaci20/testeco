#!/usr/bin/env node

// Script optimisé pour fonctionner dans le conteneur Docker

async function createAdmin() {
    let PrismaClient, bcrypt;
    
    try {
        // Essayer plusieurs chemins pour trouver le client Prisma
        try {
            PrismaClient = require('@prisma/client').PrismaClient;
            console.log('✅ Found @prisma/client');
        } catch (e) {
            try {
                PrismaClient = require('../src/generated/prisma').PrismaClient;
                console.log('✅ Found generated Prisma client');
            } catch (e2) {
                PrismaClient = require('../node_modules/.prisma/client').PrismaClient;
                console.log('✅ Found .prisma/client');
            }
        }
        
        // Essayer de charger bcryptjs
        try {
            bcrypt = require('bcryptjs');
            console.log('✅ Found bcryptjs');
        } catch (e) {
            console.error('❌ bcryptjs not found');
            process.exit(1);
        }
        
        const prisma = new PrismaClient();
        
        console.log('🔐 Creating admin user...');
        console.log('Node.js version:', process.version);
        console.log('Working directory:', process.cwd());
        
        const email = 'admin@ecodeli.com';
        const password = 'admin123!';
        
        // Vérifier si l'admin existe déjà
        const existing = await prisma.user.findUnique({
            where: { email }
        });
        
        if (existing) {
            console.log('⚠️  Admin user already exists');
            console.log('👤 Existing admin:', {
                id: existing.id,
                email: existing.email,
                firstName: existing.firstName,
                lastName: existing.lastName,
                role: existing.role
            });
            return;
        }
        
        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Créer l'admin
        const admin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'EcoDeli',
                role: 'ADMIN',
                userType: 'PROFESSIONAL',
                isVerified: true,
            }
        });
        
        console.log('✅ Admin user created successfully!');
        console.log('👤 Admin details:', {
            id: admin.id,
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName,
            role: admin.role
        });
        
        await prisma.$disconnect();
        
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

createAdmin(); 