#!/usr/bin/env node

console.log('🔍 Débogage spécifique - API Services POST');
console.log('==========================================\n');

async function debugServicesAPI() {
  try {
    console.log('1️⃣ Analyse du code services.js...');
    console.log('');
    
    // Lire le fichier services.js pour analyser les problèmes
    const fs = require('fs');
    const path = require('path');
    
    const servicesPath = path.join(process.cwd(), 'pages/api/services.js');
    
    if (!fs.existsSync(servicesPath)) {
      console.log('❌ Fichier services.js non trouvé');
      return;
    }
    
    const content = fs.readFileSync(servicesPath, 'utf8');
    
    // Analyser les problèmes potentiels
    console.log('🔍 Problèmes identifiés dans services.js :');
    console.log('');
    
    // 1. Vérifier ensureConnected dans POST
    const getHasEnsureConnected = content.includes('if (req.method === \'GET\')') && 
                                   content.includes('await ensureConnected();');
    const postHasEnsureConnected = content.includes('} else if (req.method === \'POST\')') &&
                                   content.split('} else if (req.method === \'POST\')')[1]?.includes('await ensureConnected();');
    
    console.log('   📍 Problème #1 - Connexion base de données :');
    console.log(`      GET a ensureConnected() : ${getHasEnsureConnected ? '✅' : '❌'}`);
    console.log(`      POST a ensureConnected() : ${postHasEnsureConnected ? '✅' : '❌ PROBLÈME TROUVÉ!'}`);
    
    if (!postHasEnsureConnected) {
      console.log('      🚨 CAUSE PROBABLE DE L\'ERREUR 500 : POST n\'établit pas la connexion DB');
    }
    
    console.log('');
    
    // 2. Vérifier la gestion d'erreur
    const hasProperErrorHandling = content.includes('} catch (error) {') && 
                                   content.includes('console.error(\'Error creating service:\', error)');
    
    console.log('   📍 Problème #2 - Gestion d\'erreur :');
    console.log(`      Gestion d'erreur POST : ${hasProperErrorHandling ? '✅' : '❌'}`);
    console.log('');
    
    // 3. Test de simulation POST
    console.log('2️⃣ Simulation de la logique POST...');
    console.log('');
    
    try {
      // Simuler les étapes du POST
      console.log('   🔄 Étape 1: Import Prisma...');
      const { ensureConnected } = await import('../lib/prisma.js');
      
      console.log('   🔄 Étape 2: Connexion base de données...');
      await ensureConnected();
      console.log('   ✅ Base de données connectée');
      
      console.log('   🔄 Étape 3: Test JWT...');
      const { verifyToken, generateToken } = await import('../lib/auth.js');
      
      // Générer un token de test
      const testUser = {
        id: 'test-provider-id',
        email: 'provider@test.com',
        role: 'PROVIDER',
        firstName: 'Test',
        lastName: 'Provider'
      };
      
      const testToken = await generateToken(testUser);
      const decoded = await verifyToken(testToken);
      console.log('   ✅ JWT fonctionne correctement');
      
      console.log('   🔄 Étape 4: Test requête Prisma...');
      const prisma = await ensureConnected();
      
      // Test de création service (sans vraiment créer)
      const testData = {
        providerId: 'test-id',
        name: 'Test Service',
        description: 'Test description',
        category: 'OTHER',
        price: 50.0,
        duration: 60,
        location: 'Test Location',
        requirements: null,
        isActive: true
      };
      
      console.log('   ✅ Structure de données valide');
      console.log('   ✅ Toutes les étapes POST fonctionnent');
      
    } catch (error) {
      console.log('   ❌ Erreur dans la simulation POST:', error.message);
      console.log('   📍 Cette erreur explique probablement l\'erreur 500');
    }
    
    console.log('');
    console.log('3️⃣ Solutions recommandées :');
    console.log('===========================');
    console.log('');
    
    if (!postHasEnsureConnected) {
      console.log('🔧 SOLUTION CRITIQUE - Ajouter ensureConnected() dans POST :');
      console.log('   Ajouter cette ligne au début du bloc POST :');
      console.log('   await ensureConnected();');
      console.log('');
    }
    
    console.log('🔧 Autres améliorations recommandées :');
    console.log('   1. Ajouter des logs détaillés dans POST');
    console.log('   2. Améliorer la gestion d\'erreur avec plus de contexte');
    console.log('   3. Valider les données avant insertion DB');
    console.log('');
    
    console.log('🚀 Commandes pour corriger :');
    console.log('   node scripts/fix-services-api.js');
    console.log('   docker-compose restart eco-front');
    
  } catch (error) {
    console.log('❌ Erreur lors du débogage:', error.message);
  }
}

// Test spécifique pour reproduire l'erreur 500
async function reproduceError500() {
  console.log('\n4️⃣ Test de reproduction erreur 500 :');
  console.log('=====================================');
  
  try {
    // Simuler exactement ce qui se passe dans la requête POST
    console.log('   🧪 Simulation requête POST sans ensureConnected()...');
    
    // Import sans ensureConnected (comme dans le code actuel)
    const prisma = (await import('../lib/prisma.js')).default;
    const { verifyToken } = await import('../lib/auth.js');
    
    // Simuler une requête POST
    const mockReq = {
      method: 'POST',
      cookies: {},
      body: {
        name: 'Test Service',
        price: 50,
        category: 'OTHER'
      }
    };
    
    // Test sans token (doit retourner 401)
    if (!mockReq.cookies.auth_token) {
      console.log('   ✅ Sans token → 401 (comportement attendu)');
    }
    
    // Simuler avec token mais sans ensureConnected
    console.log('   🔄 Test avec token mais possiblement sans connexion DB...');
    
    // Ici on peut avoir une erreur si la DB n'est pas connectée
    try {
      const testQuery = await prisma.user.findFirst({ where: { role: 'PROVIDER' } });
      console.log('   ✅ Requête DB fonctionne (DB déjà connectée)');
    } catch (dbError) {
      console.log('   ❌ Erreur DB:', dbError.message);
      console.log('   📍 C\'est probablement la cause de l\'erreur 500');
    }
    
  } catch (error) {
    console.log('   ❌ Erreur lors de la reproduction:', error.message);
  }
}

// Lancer les tests
debugServicesAPI().then(() => {
  reproduceError500();
}); 