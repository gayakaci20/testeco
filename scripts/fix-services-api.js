#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction de l\'API Services');
console.log('===============================\n');

function fixServicesAPI() {
  const servicesPath = path.join(process.cwd(), 'pages/api/services.js');
  
  if (!fs.existsSync(servicesPath)) {
    console.log('❌ Fichier services.js non trouvé');
    process.exit(1);
  }
  
  // Backup du fichier original
  const backupPath = `${servicesPath}.backup-${Date.now()}`;
  fs.copyFileSync(servicesPath, backupPath);
  console.log(`📦 Backup créé : ${backupPath}`);
  
  // Lire le contenu actuel
  let content = fs.readFileSync(servicesPath, 'utf8');
  
  console.log('🔍 Analyse du code actuel...');
  
  // Vérifier si le problème existe
  const postSection = content.split('} else if (req.method === \'POST\') {')[1];
  const hasEnsureConnected = postSection && postSection.includes('await ensureConnected();');
  
  if (hasEnsureConnected) {
    console.log('✅ ensureConnected() déjà présent dans POST');
    return;
  }
  
  console.log('❌ ensureConnected() manquant dans POST - Correction en cours...');
  
  // Correction : Ajouter ensureConnected() après le try { dans POST
  const newContent = content.replace(
    /(\} else if \(req\.method === 'POST'\) \{\s*try \{)/,
    `$1
      // Ensure database connection is established
      await ensureConnected();`
  );
  
  // Vérifier si la correction a été appliquée
  if (newContent === content) {
    console.log('⚠️  Pattern de correction non trouvé - Tentative alternative...');
    
    // Tentative alternative : chercher le début du bloc POST
    const alternativePattern = /(\} else if \(req\.method === 'POST'\) \{\s*)(try \{)/;
    const alternativeReplacement = `$1// Ensure database connection is established
      await ensureConnected();
      
      $2`;
    
    const alternativeContent = content.replace(alternativePattern, alternativeReplacement);
    
    if (alternativeContent === content) {
      console.log('❌ Impossible de trouver le pattern pour la correction automatique');
      console.log('🔧 Correction manuelle requise :');
      console.log('   Ajoutez cette ligne au début du bloc POST :');
      console.log('   await ensureConnected();');
      return;
    }
    
    content = alternativeContent;
  } else {
    content = newContent;
  }
  
  // Amélioration supplémentaire : Ajouter des logs détaillés
  const improvedContent = content.replace(
    /(console\.error\('Error creating service:', error\);)/,
    `console.error('❌ Error creating service:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        userId: decoded?.id,
        requestBody: req.body
      });`
  );
  
  // Écrire le fichier corrigé
  fs.writeFileSync(servicesPath, improvedContent);
  
  console.log('✅ Fichier services.js corrigé avec succès !');
  console.log('');
  console.log('📝 Modifications apportées :');
  console.log('   ✅ Ajout de await ensureConnected() dans POST');
  console.log('   ✅ Amélioration des logs d\'erreur');
  console.log('');
  console.log('🚀 Prochaines étapes :');
  console.log('   1. Redéployer l\'application :');
  console.log('      docker-compose restart eco-front');
  console.log('   2. Tester l\'API :');
  console.log('      ./scripts/test-api-services.sh');
  console.log('');
  
  // Afficher un aperçu de la correction
  console.log('👀 Aperçu de la correction :');
  console.log('============================');
  const lines = improvedContent.split('\n');
  const postLineIndex = lines.findIndex(line => line.includes('} else if (req.method === \'POST\') {'));
  
  if (postLineIndex !== -1) {
    console.log('...');
    for (let i = Math.max(0, postLineIndex - 1); i < Math.min(lines.length, postLineIndex + 8); i++) {
      const prefix = i === postLineIndex ? '>>>' : '   ';
      console.log(`${prefix} ${i + 1}: ${lines[i]}`);
    }
    console.log('...');
  }
}

function createTestServicesScript() {
  const testScript = `#!/bin/bash

echo "🧪 Test spécifique de l'API Services après correction"
echo "====================================================="

# Test 1: GET /api/services
echo "1️⃣ Test GET /api/services..."
curl -s -w "\\nSTATUS: %{http_code}\\n" "http://localhost:3000/api/services" | head -20

echo ""

# Test 2: POST /api/services sans token (doit retourner 401)
echo "2️⃣ Test POST /api/services sans token..."
curl -s -w "\\nSTATUS: %{http_code}\\n" \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Test Service","price":50}' \\
  "http://localhost:3000/api/services"

echo ""

# Test 3: Vérifier les logs Docker
echo "3️⃣ Logs récents de l'application..."
docker logs eco-front-app --tail=20 | grep -E "(services|error|Error)" || echo "Aucun log trouvé"

echo ""
echo "✅ Tests terminés"
`;

  const testScriptPath = path.join(process.cwd(), 'scripts/test-services-fix.sh');
  fs.writeFileSync(testScriptPath, testScript);
  fs.chmodSync(testScriptPath, '755');
  
  console.log(`📋 Script de test créé : ${testScriptPath}`);
}

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur inattendue:', error.message);
  process.exit(1);
});

// Exécuter la correction
console.log('🚀 Début de la correction...');
fixServicesAPI();
createTestServicesScript();

console.log('🎉 Correction terminée !');
console.log('');
console.log('⚠️  IMPORTANT : N\'oubliez pas de redéployer :');
console.log('   docker-compose restart eco-front'); 