#!/usr/bin/env node

console.log('🔍 Diagnostic des erreurs de production - API Services');
console.log('========================================================\n');

// 1. Vérification des variables d'environnement
console.log('1️⃣ Variables d\'environnement :');
console.log('----------------------------');

const envVars = {
  'NODE_ENV': process.env.NODE_ENV,
  'DATABASE_URL': process.env.DATABASE_URL ? 
    `${process.env.DATABASE_URL.substring(0, 20)}...` : 'NON DÉFINIE',
  'JWT_SECRET': process.env.JWT_SECRET ? 
    (process.env.JWT_SECRET === 'your_jwt_secret_key_here_change_in_production' ? 
      '❌ VALEUR PAR DÉFAUT' : `✅ Définie (${process.env.JWT_SECRET.length} chars)`) : 
    '❌ NON DÉFINIE',
  'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET ? 
    (process.env.NEXTAUTH_SECRET === 'your-super-secret-key-change-in-production' ? 
      '❌ VALEUR PAR DÉFAUT' : '✅ Définie') : 
    '❌ NON DÉFINIE',
  'NEXT_PUBLIC_BASE_URL': process.env.NEXT_PUBLIC_BASE_URL || '❌ NON DÉFINIE'
};

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`   ${key}: ${value}`);
});

console.log('');

// 2. Test de connexion Prisma
console.log('2️⃣ Test de connexion Prisma :');
console.log('-----------------------------');

async function testPrismaConnection() {
  try {
    // Import dynamique pour éviter les erreurs de module
    const { ensureConnected } = await import('../lib/prisma.js');
    const prisma = await ensureConnected();
    
    console.log('   ✅ Import Prisma réussi');
    
    // Test de requête simple
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Connexion base de données réussie');
    console.log('   ✅ Requête test réussie:', result);
    
    await prisma.$disconnect();
    console.log('   ✅ Déconnexion réussie');
    
  } catch (error) {
    console.log('   ❌ Erreur Prisma:', error.message);
    console.log('   🔧 Stack trace:', error.stack);
  }
}

// 3. Test de vérification JWT
console.log('3️⃣ Test JWT :');
console.log('-------------');

async function testJWT() {
  try {
    const { verifyToken, generateToken } = await import('../lib/auth.js');
    
    // Test user mock
    const testUser = {
      id: 'test-id',
      email: 'test@example.com',
      role: 'PROVIDER',
      firstName: 'Test',
      lastName: 'User'
    };
    
    // Générer un token
    const token = await generateToken(testUser);
    console.log('   ✅ Génération token réussie');
    console.log('   📝 Token preview:', token.substring(0, 50) + '...');
    
    // Vérifier le token
    const decoded = await verifyToken(token);
    console.log('   ✅ Vérification token réussie');
    console.log('   📝 Decoded user:', decoded.email);
    
  } catch (error) {
    console.log('   ❌ Erreur JWT:', error.message);
    console.log('   🔧 Vérifiez JWT_SECRET dans les variables d\'environnement');
  }
}

// 4. Simulation de l'API services
console.log('4️⃣ Simulation API Services :');
console.log('-----------------------------');

async function simulateServicesAPI() {
  try {
    // Simuler une requête POST comme dans le code original
    const mockReq = {
      method: 'POST',
      cookies: {},
      body: {
        name: 'Service Test',
        description: 'Test service',
        category: 'OTHER',
        price: 50,
        duration: 60,
        location: 'Test Location'
      }
    };
    
    console.log('   🧪 Simulation des étapes de l\'API...');
    
    // 1. Test connexion DB
    const { ensureConnected } = await import('../lib/prisma.js');
    await ensureConnected();
    console.log('   ✅ Étape 1: Connexion DB réussie');
    
    // 2. Test verification token (sans token -> doit échouer avec 401)
    const { verifyToken } = await import('../lib/auth.js');
    const noToken = await verifyToken(null);
    console.log('   ✅ Étape 2: Vérification token (sans token) - comportement attendu:', !noToken);
    
    // 3. Test avec token valide
    const { generateToken } = await import('../lib/auth.js');
    const testUser = {
      id: 'test-provider-id',
      email: 'provider@test.com',
      role: 'PROVIDER',
      firstName: 'Test',
      lastName: 'Provider'
    };
    
    const validToken = await generateToken(testUser);
    const decodedToken = await verifyToken(validToken);
    console.log('   ✅ Étape 3: Token valide décodé pour:', decodedToken.email);
    
    console.log('   ✅ Simulation API complétée - Aucun problème détecté dans la logique');
    
  } catch (error) {
    console.log('   ❌ Erreur lors de la simulation:', error.message);
    console.log('   📍 Ceci est probablement la cause de l\'erreur 500');
    console.log('   🔧 Stack trace:', error.stack);
  }
}

// 5. Recommandations de débogage
function showDebuggingRecommendations() {
  console.log('5️⃣ Recommandations de débogage :');
  console.log('--------------------------------');
  
  console.log('   🔧 Pour résoudre les erreurs 500 en production :');
  console.log('');
  console.log('   1. Variables d\'environnement manquantes :');
  console.log('      - Vérifiez que JWT_SECRET n\'est pas la valeur par défaut');
  console.log('      - Assurez-vous que DATABASE_URL pointe vers la bonne DB');
  console.log('      - Mettez à jour NEXT_PUBLIC_BASE_URL avec votre domaine');
  console.log('');
  console.log('   2. Commandes de débogage en production :');
  console.log('      docker logs eco-front-app --tail=100');
  console.log('      docker exec -it eco-front-app env | grep -E "(JWT|DATABASE|NEXT)"');
  console.log('');
  console.log('   3. Test manuel de l\'API :');
  console.log('      curl -X POST https://ecodeli.pro/api/services \\');
  console.log('           -H "Content-Type: application/json" \\');
  console.log('           -d \'{"name":"Test","price":10}\'');
  console.log('');
  console.log('   4. Mise à jour des variables d\'environnement :');
  console.log('      - Modifiez docker-compose.yml avec les vraies valeurs');
  console.log('      - Relancez: docker-compose down && docker-compose up -d');
}

// Exécution séquentielle des tests
async function runDiagnostics() {
  try {
    await testPrismaConnection();
    console.log('');
    
    await testJWT();
    console.log('');
    
    await simulateServicesAPI();
    console.log('');
    
    showDebuggingRecommendations();
    
  } catch (error) {
    console.log('❌ Erreur critique lors du diagnostic:', error.message);
    console.log('🔧 Vérifiez votre installation Node.js et les dépendances');
  }
}

// Lancer le diagnostic
runDiagnostics(); 