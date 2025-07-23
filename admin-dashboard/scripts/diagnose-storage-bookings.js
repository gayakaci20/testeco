#!/usr/bin/env node

/**
 * Script de diagnostic pour identifier les réservations de boîtes de stockage
 * qui pourraient être incorrectement stockées dans la table bookings
 * au lieu de la table box_rentals.
 * 
 * Usage: node scripts/diagnose-storage-bookings.js
 */

const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function diagnoseStorageBookings() {
  console.log('🔍 Diagnostic des réservations de boîtes de stockage...\n');

  try {
    // 1. Récupérer tous les bookings
    const allBookings = await prisma.booking.findMany({
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
          }
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    console.log(`📊 Total des bookings trouvés: ${allBookings.length}`);

    // 2. Identifier les bookings suspects (qui pourraient être des locations de boîtes)
    const suspiciousBookings = allBookings.filter(booking => {
      const serviceName = booking.service?.name?.toLowerCase() || '';
      return serviceName.includes('boîte') || 
             serviceName.includes('box') || 
             serviceName.includes('stockage') ||
             serviceName.includes('storage') ||
             booking.service?.category === 'STORAGE';
    });

    console.log(`🚨 Bookings suspects (possibles boîtes de stockage): ${suspiciousBookings.length}`);

    if (suspiciousBookings.length > 0) {
      console.log('\n📋 Détails des bookings suspects:');
      suspiciousBookings.forEach((booking, index) => {
        console.log(`\n${index + 1}. ID: ${booking.id}`);
        console.log(`   Service: ${booking.service?.name || 'N/A'}`);
        console.log(`   Catégorie: ${booking.service?.category || 'N/A'}`);
        console.log(`   Client: ${booking.customer?.firstName} ${booking.customer?.lastName}`);
        console.log(`   Date: ${booking.scheduledAt}`);
        console.log(`   Montant: ${booking.totalAmount}€`);
        console.log(`   Statut: ${booking.status}`);
      });
    }

    // 3. Récupérer tous les box rentals
    const allBoxRentals = await prisma.boxRental.findMany({
      include: {
        box: {
          select: {
            code: true,
            location: true,
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    console.log(`\n📦 Total des locations de boîtes (box_rentals): ${allBoxRentals.length}`);

    if (allBoxRentals.length > 0) {
      console.log('\n📋 Locations de boîtes récentes:');
      allBoxRentals.slice(0, 5).forEach((rental, index) => {
        console.log(`\n${index + 1}. ID: ${rental.id}`);
        console.log(`   Boîte: ${rental.box?.code || 'N/A'}`);
        console.log(`   Lieu: ${rental.box?.location || 'N/A'}`);
        console.log(`   Client: ${rental.user?.firstName} ${rental.user?.lastName}`);
        console.log(`   Début: ${rental.startDate}`);
        console.log(`   Fin: ${rental.endDate || 'En cours'}`);
        console.log(`   Coût: ${rental.totalCost}€`);
        console.log(`   Actif: ${rental.isActive ? 'Oui' : 'Non'}`);
      });
    }

    // 4. Récupérer les services pour voir s'il y a des services de type "stockage"
    const storageServices = await prisma.service.findMany({
      where: {
        OR: [
          { name: { contains: 'boîte', mode: 'insensitive' } },
          { name: { contains: 'box', mode: 'insensitive' } },
          { name: { contains: 'stockage', mode: 'insensitive' } },
          { name: { contains: 'storage', mode: 'insensitive' } },
          { category: 'STORAGE' }
        ]
      },
      include: {
        provider: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    console.log(`\n🏪 Services de type stockage trouvés: ${storageServices.length}`);

    if (storageServices.length > 0) {
      console.log('\n📋 Détails des services de stockage:');
      storageServices.forEach((service, index) => {
        console.log(`\n${index + 1}. ID: ${service.id}`);
        console.log(`   Nom: ${service.name}`);
        console.log(`   Catégorie: ${service.category}`);
        console.log(`   Prix: ${service.price}€`);
        console.log(`   Prestataire: ${service.provider?.firstName} ${service.provider?.lastName}`);
        console.log(`   Actif: ${service.isActive ? 'Oui' : 'Non'}`);
      });
    }

    // 5. Statistiques générales
    console.log('\n📈 Résumé du diagnostic:');
    console.log(`- Bookings de services normaux: ${allBookings.length - suspiciousBookings.length}`);
    console.log(`- Bookings suspects (possibles boîtes): ${suspiciousBookings.length}`);
    console.log(`- Locations de boîtes légitimes: ${allBoxRentals.length}`);
    console.log(`- Services de stockage: ${storageServices.length}`);

    if (suspiciousBookings.length > 0) {
      console.log('\n⚠️  RECOMMANDATIONS:');
      console.log('1. Vérifiez si les bookings suspects devraient être des box_rentals');
      console.log('2. Migrez les données si nécessaire');
      console.log('3. Mettez à jour le processus de création pour éviter cette confusion');
    } else {
      console.log('\n✅ Aucun problème détecté dans la séparation des données');
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le diagnostic
diagnoseStorageBookings()
  .then(() => {
    console.log('\n🎯 Diagnostic terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }); 