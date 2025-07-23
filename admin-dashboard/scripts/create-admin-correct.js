const bcrypt = require('bcryptjs');

async function createAdmin() {
    let prisma;
    
    try {
        // Utiliser le bon client Prisma (celui du dashboard admin)
        console.log('🔧 Chargement du client Prisma du dashboard admin...');
        const { PrismaClient } = require('../src/generated/prisma');
        prisma = new PrismaClient();
        
        await prisma.$connect();
        console.log('✅ Client Prisma connecté');

        // Vérifier si l'admin existe déjà
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@ecodeli.pro' }
        });

        if (existingAdmin) {
            console.log('⚠️  Admin déjà existant avec email: admin@ecodeli.pro');
            console.log('🔧 Mise à jour du mot de passe...');
            
            // Mettre à jour le mot de passe
            const hashedPassword = await bcrypt.hash('admin123', 12);
            
            await prisma.user.update({
                where: { id: existingAdmin.id },
                data: {
                    password: hashedPassword,
                    isVerified: true,
                    emailVerified: new Date()
                }
            });
            
            console.log('✅ Mot de passe admin mis à jour !');
            return;
        }

        // Créer l'admin avec le bon client Prisma
        console.log('🔧 Création de l\'admin...');
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        const admin = await prisma.user.create({
            data: {
                email: 'admin@ecodeli.pro',
                password: hashedPassword,
                name: 'Admin Ecodeli',
                firstName: 'Admin',
                lastName: 'Ecodeli',
                role: 'ADMIN',
                userType: 'INDIVIDUAL',
                isVerified: true,
                emailVerified: new Date()
            }
        });

        console.log('✅ Admin créé avec succès!');
        console.log('📧 Email: admin@ecodeli.pro');
        console.log('🔑 Mot de passe: admin123');
        console.log('👤 UserType: INDIVIDUAL');
        console.log('🎯 Role: ADMIN');
        console.log('🆔 ID:', admin.id);
        
    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'admin:', error);
        throw error;
    } finally {
        if (prisma) {
            await prisma.$disconnect();
        }
    }
}

createAdmin().catch(console.error); 