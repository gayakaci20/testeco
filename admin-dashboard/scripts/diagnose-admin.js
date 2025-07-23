const bcrypt = require('bcryptjs');

async function diagnoseAndFixAdmin() {
    let prisma;
    
    try {
        // Essayer de charger le client Prisma utilisé par le dashboard admin
        console.log('🔧 Chargement du client Prisma du dashboard admin...');
        const { PrismaClient } = require('../src/generated/prisma');
        prisma = new PrismaClient();
        
        await prisma.$connect();
        console.log('✅ Client Prisma connecté');

        // Vérifier si l'admin existe
        console.log('🔍 Recherche de l\'admin existant...');
        const existingAdmin = await prisma.user.findMany({
            where: {
                OR: [
                    { email: 'admin@ecodeli.pro' },
                    { role: 'ADMIN' }
                ]
            }
        });

        console.log('👥 Utilisateurs trouvés:', existingAdmin.length);
        
        if (existingAdmin.length > 0) {
            console.log('📋 Détails des utilisateurs admin/potentiels:');
            existingAdmin.forEach((user, index) => {
                console.log(`  ${index + 1}. ID: ${user.id}`);
                console.log(`     Email: ${user.email}`);
                console.log(`     Role: ${user.role}`);
                console.log(`     UserType: ${user.userType}`);
                console.log(`     Nom: ${user.firstName} ${user.lastName}`);
                console.log(`     Vérifié: ${user.isVerified}`);
                console.log(`     Mot de passe défini: ${user.password ? 'Oui' : 'Non'}`);
                console.log('');
            });
        }

        // Vérifier s'il y a un admin avec le bon email
        const admin = existingAdmin.find(user => user.email === 'admin@ecodeli.pro');
        
        if (admin) {
            console.log('✅ Admin trouvé avec email admin@ecodeli.pro');
            
            // Tester le mot de passe
            if (admin.password) {
                const testPassword = await bcrypt.compare('admin123', admin.password);
                console.log(`🔐 Test du mot de passe 'admin123': ${testPassword ? 'SUCCÈS' : 'ÉCHEC'}`);
                
                if (!testPassword) {
                    console.log('🔧 Mise à jour du mot de passe...');
                    const hashedPassword = await bcrypt.hash('admin123', 12);
                    
                    await prisma.user.update({
                        where: { id: admin.id },
                        data: { 
                            password: hashedPassword,
                            isVerified: true,
                            emailVerified: new Date()
                        }
                    });
                    
                    console.log('✅ Mot de passe mis à jour !');
                }
            } else {
                console.log('⚠️  Pas de mot de passe défini, création...');
                const hashedPassword = await bcrypt.hash('admin123', 12);
                
                await prisma.user.update({
                    where: { id: admin.id },
                    data: { 
                        password: hashedPassword,
                        isVerified: true,
                        emailVerified: new Date()
                    }
                });
                
                console.log('✅ Mot de passe créé !');
            }
        } else {
            console.log('❌ Aucun admin trouvé avec email admin@ecodeli.pro');
            console.log('🔧 Création de l\'admin...');
            
            // Créer l'admin
            const hashedPassword = await bcrypt.hash('admin123', 12);
            
            const newAdmin = await prisma.user.create({
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
            console.log('🆔 ID:', newAdmin.id);
        }

        // Vérification finale
        console.log('\n🔍 Vérification finale...');
        const finalAdmin = await prisma.user.findUnique({
            where: { email: 'admin@ecodeli.pro' }
        });

        if (finalAdmin) {
            console.log('✅ Admin final trouvé:');
            console.log(`  Email: ${finalAdmin.email}`);
            console.log(`  Role: ${finalAdmin.role}`);
            console.log(`  UserType: ${finalAdmin.userType}`);
            console.log(`  Vérifié: ${finalAdmin.isVerified}`);
            console.log(`  Mot de passe: ${finalAdmin.password ? 'Défini' : 'Non défini'}`);
            
            // Test final du mot de passe
            if (finalAdmin.password) {
                const finalTest = await bcrypt.compare('admin123', finalAdmin.password);
                console.log(`  Test mot de passe: ${finalTest ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
            }
        }

        console.log('\n🎉 Diagnostic terminé !');
        
    } catch (error) {
        console.error('❌ Erreur lors du diagnostic:', error);
        console.error('Stack trace:', error.stack);
        throw error;
    } finally {
        if (prisma) {
            await prisma.$disconnect();
        }
    }
}

diagnoseAndFixAdmin().catch(console.error); 