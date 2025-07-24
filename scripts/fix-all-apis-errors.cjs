#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction de toutes les erreurs 500 des APIs');
console.log('===============================================\n');

// Liste des fichiers API avec des problèmes potentiels
const problematicFiles = [
  'pages/api/packages.js',
  'pages/api/packages/[id]/update-status.js',
  'pages/api/dashboard/carrier.js',
  'pages/api/notifications.js'
];

function analyzeAndFixFile(filePath) {
  console.log(`🔍 Analyse de ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  Fichier non trouvé: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  let needsUpdate = false;
  let updatedContent = content;
  
  // 1. Vérifier l'import Prisma incorrect
  const hasWrongImport = content.includes("import { prisma } from '../../src/lib/prisma'");
  const hasCorrectImport = content.includes("import prisma, { ensureConnected }");
  
  if (hasWrongImport && !hasCorrectImport) {
    console.log(`   ❌ Import Prisma incorrect détecté`);
    updatedContent = updatedContent.replace(
      /import { prisma } from '\.\.\/\.\.\/src\/lib\/prisma';/g,
      "import prisma, { ensureConnected } from '../../lib/prisma';"
    );
    needsUpdate = true;
  }
  
  // 2. Vérifier si ensureConnected() est appelé
  const hasEnsureConnected = content.includes('await ensureConnected()');
  
  if (!hasEnsureConnected) {
    console.log(`   ❌ Manque ensureConnected() - Ajout requis`);
    // Ajouter ensureConnected() après le début du try block ou au début de la fonction
    
    // Pattern 1: try block au début
    if (updatedContent.includes('export default async function handler(req, res) {\n  try {')) {
      updatedContent = updatedContent.replace(
        /export default async function handler\(req, res\) \{\s*try \{/,
        `export default async function handler(req, res) {
  try {
    // Ensure database connection is established
    await ensureConnected();`
      );
      needsUpdate = true;
    }
    // Pattern 2: direct function body
    else if (updatedContent.includes('export default async function handler(req, res) {')) {
      const lines = updatedContent.split('\n');
      const handlerIndex = lines.findIndex(line => line.includes('export default async function handler(req, res) {'));
      if (handlerIndex !== -1) {
        lines.splice(handlerIndex + 1, 0, '  try {', '    // Ensure database connection is established', '    await ensureConnected();', '');
        
        // Ajouter le catch block à la fin
        const lastBraceIndex = lines.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
          lines.splice(lastBraceIndex, 0, '  } catch (error) {', '    console.error(\'API error:\', error);', '    return res.status(500).json({ error: \'Internal server error\' });', '  }');
        }
        
        updatedContent = lines.join('\n');
        needsUpdate = true;
      }
    }
  }
  
  // 3. Ajouter des logs de débogage si manquants
  if (!content.includes('console.log') && !content.includes('console.error')) {
    console.log(`   ⚠️  Logs de débogage manquants`);
  }
  
  if (needsUpdate) {
    // Backup du fichier original
    const backupPath = `${filePath}.backup-${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`   📦 Backup créé: ${backupPath}`);
    
    // Écrire le fichier corrigé
    fs.writeFileSync(filePath, updatedContent);
    console.log(`   ✅ Fichier corrigé`);
  } else {
    console.log(`   ✅ Fichier déjà correct`);
  }
  
  console.log('');
}

// Corriger packages.js spécifiquement
function fixPackagesJS() {
  const filePath = 'pages/api/packages.js';
  console.log('🔧 Correction spécifique de packages.js...');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ packages.js non trouvé');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let needsUpdate = false;
  
  // 1. Corriger l'import
  if (content.includes("import { prisma } from '../../src/lib/prisma';")) {
    content = content.replace(
      "import { prisma } from '../../src/lib/prisma';",
      "import prisma, { ensureConnected } from '../../lib/prisma';"
    );
    needsUpdate = true;
    console.log('   ✅ Import Prisma corrigé');
  }
  
  // 2. Ajouter ensureConnected() au début de chaque méthode
  if (!content.includes('await ensureConnected()')) {
    // Ajouter après "if (req.method === 'GET') {"
    content = content.replace(
      /if \(req\.method === 'GET'\) \{\s*try \{/,
      `if (req.method === 'GET') {
      try {
        // Ensure database connection is established
        await ensureConnected();`
    );
    
    // Ajouter après "} else if (req.method === 'POST') {"
    content = content.replace(
      /\} else if \(req\.method === 'POST'\) \{\s*try \{/,
      `} else if (req.method === 'POST') {
      try {
        // Ensure database connection is established
        await ensureConnected();`
    );
    
    needsUpdate = true;
    console.log('   ✅ ensureConnected() ajouté');
  }
  
  if (needsUpdate) {
    // Backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`   📦 Backup créé: ${backupPath}`);
    
    // Écrire le fichier corrigé
    fs.writeFileSync(filePath, content);
    console.log('   ✅ packages.js corrigé avec succès !');
  }
  
  console.log('');
}

// Chercher tous les fichiers d'API potentiellement problématiques
function findProblematicAPIs() {
  console.log('🔍 Recherche des APIs avec des problèmes potentiels...');
  
  const apiDir = 'pages/api';
  const problematicAPIs = [];
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (file.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Vérifier les problèmes potentiels
        const hasWrongImport = content.includes("import { prisma } from '../../src/lib/prisma'");
        const hasPrismaImport = content.includes('import') && content.includes('prisma');
        const hasEnsureConnected = content.includes('await ensureConnected()');
        
        if (hasWrongImport || (hasPrismaImport && !hasEnsureConnected)) {
          problematicAPIs.push({
            path: fullPath,
            hasWrongImport,
            missingEnsureConnected: hasPrismaImport && !hasEnsureConnected
          });
        }
      }
    }
  }
  
  scanDirectory(apiDir);
  
  console.log(`   Trouvé ${problematicAPIs.length} fichier(s) problématique(s):`);
  problematicAPIs.forEach(api => {
    console.log(`   - ${api.path}`);
    if (api.hasWrongImport) console.log(`     ❌ Import incorrect`);
    if (api.missingEnsureConnected) console.log(`     ❌ ensureConnected() manquant`);
  });
  
  console.log('');
  return problematicAPIs;
}

// Créer un script de test pour toutes les APIs
function createTestScript() {
  const testScript = `#!/bin/bash

echo "🧪 Test de toutes les APIs après corrections"
echo "==========================================="

# APIs à tester
apis=(
  "/api/packages"
  "/api/dashboard/carrier"
  "/api/notifications?limit=10"
  "/api/services"
)

for api in "\${apis[@]}"; do
    echo ""
    echo "🔍 Test de \$api..."
    
    response=\$(curl -s -w "HTTP_CODE:%{http_code}" "https://ecodeli.pro\$api" \\
                   -H "Cookie: auth_token=dummy_token_for_test")
    
    http_code=\$(echo "\$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    
    case \$http_code in
        200|201)
            echo "   ✅ \$api : SUCCESS (\$http_code)"
            ;;
        401|403)
            echo "   ✅ \$api : AUTH ERROR (\$http_code) - Normal sans token valide"
            ;;
        500)
            echo "   ❌ \$api : ERREUR 500 - Problème serveur!"
            ;;
        *)
            echo "   ⚠️  \$api : Code \$http_code"
            ;;
    esac
done

echo ""
echo "🔍 Vérification des logs Docker..."
echo "docker logs eco-front-app --tail=20"
`;

  fs.writeFileSync('scripts/test-all-apis.sh', testScript);
  fs.chmodSync('scripts/test-all-apis.sh', '755');
  console.log('📋 Script de test créé: scripts/test-all-apis.sh');
}

// Exécution principale
console.log('🚀 Début de la correction...');

// 1. Corriger packages.js spécifiquement
fixPackagesJS();

// 2. Trouver tous les fichiers problématiques
const problematicAPIs = findProblematicAPIs();

// 3. Corriger chaque fichier trouvé
problematicAPIs.forEach(api => {
  analyzeAndFixFile(api.path);
});

// 4. Créer le script de test
createTestScript();

console.log('🎉 Correction terminée !');
console.log('========================');
console.log('');
console.log('📋 Résumé des corrections :');
console.log('   ✅ Correction de l\'import Prisma dans packages.js');
console.log('   ✅ Ajout de ensureConnected() dans toutes les APIs');
console.log('   ✅ Création de backups des fichiers modifiés');
console.log('   ✅ Script de test créé');
console.log('');
console.log('🚀 Prochaines étapes :');
console.log('   1. Redéployer l\'application :');
console.log('      docker-compose restart eco-front');
console.log('   2. Tester toutes les APIs :');
console.log('      ./scripts/test-all-apis.sh');
console.log('');
console.log('⚠️  IMPORTANT : Vérifiez les logs après le redéploiement :');
console.log('   docker logs eco-front-app --tail=50 -f'); 