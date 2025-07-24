#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction des erreurs de syntaxe - APIs');
console.log('=========================================\n');

// Fichiers à vérifier pour les erreurs de syntaxe
const filesToCheck = [
  'pages/api/auth/login.js',
  'pages/api/carrier-reviews.js', 
  'pages/api/confirm-payment.js',
  'pages/api/create-payment-intent.js',
  'pages/api/db-test.js',
  'pages/api/logs.js',
  'pages/api/package-payments.js',
  'pages/api/packages/[id]/rate-carrier.js',
  'pages/api/packages/[id].js',
  'pages/api/ride-payments.js',
  'pages/api/ride-proposals.js',
  'pages/api/ride-requests.js',
  'pages/api/rides.js',
  'pages/api/subscriptions.js',
  'pages/api/transport-requests.js'
];

function fixSyntaxErrors(filePath) {
  console.log(`🔍 Vérification de ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  Fichier non trouvé: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let needsUpdate = false;
  let backupCreated = false;
  
  // 1. Corriger les espaces en trop à la fin des fichiers
  const originalEnd = content.slice(-10);
  content = content.replace(/\s+$/, '');
  if (originalEnd !== content.slice(-10)) {
    console.log(`   ✅ Espaces en fin de fichier supprimés`);
    needsUpdate = true;
  }
  
  // 2. Corriger les accolades avec espaces en trop
  const beforeBraces = content;
  content = content.replace(/}\s+$/gm, '}');
  if (beforeBraces !== content) {
    console.log(`   ✅ Espaces après accolades corrigés`);
    needsUpdate = true;
  }
  
  // 3. Corriger les try/catch mal formés
  const beforeTryCatch = content;
  
  // Pattern problématique: double try
  content = content.replace(
    /(\s+)try\s*\{\s*\/\/\s*Ensure database connection[\s\S]*?await ensureConnected\(\);\s*try\s*\{/g,
    '$1try {\n$1  // Ensure database connection is established\n$1  await ensureConnected();\n$1'
  );
  
  // Pattern problématique: catch orphelin
  content = content.replace(
    /\s*\}\s*catch\s*\(\s*error\s*\)\s*\{\s*console\.error\(['"]API error['"].*?\s*return res\.status\(500\).*?\s*\}/g,
    ''
  );
  
  if (beforeTryCatch !== content) {
    console.log(`   ✅ Structures try/catch corrigées`);
    needsUpdate = true;
  }
  
  // 4. Vérifier la structure générale et corriger si nécessaire
  const lines = content.split('\n');
  let fixed = false;
  
  // Supprimer les lignes vides en trop à la fin
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
    fixed = true;
  }
  
  // S'assurer qu'il y a une ligne vide à la fin
  if (lines.length > 0 && lines[lines.length - 1].trim() !== '') {
    lines.push('');
    fixed = true;
  }
  
  if (fixed) {
    content = lines.join('\n');
    console.log(`   ✅ Structure de fin de fichier corrigée`);
    needsUpdate = true;
  }
  
  // 5. Vérifications spécifiques par type d'erreur
  
  // Corriger "} catch" mal placé dans logs.js
  if (filePath.includes('logs.js')) {
    const beforeLogs = content;
    // Supprimer les catch orphelins
    content = content.replace(/\s*\}\s*\} catch \(error\) \{\s*console\.error\(['"]API error['"].*?\s*return res\.status\(500\).*?\s*\}/g, '');
    if (beforeLogs !== content) {
      console.log(`   ✅ Catch orphelin supprimé dans logs.js`);
      needsUpdate = true;
    }
  }
  
  if (needsUpdate) {
    // Créer un backup seulement si nécessaire
    if (!backupCreated) {
      const backupPath = `${filePath}.syntax-backup-${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
      console.log(`   📦 Backup créé: ${backupPath}`);
      backupCreated = true;
    }
    
    // Écrire le fichier corrigé
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ Erreurs de syntaxe corrigées`);
  } else {
    console.log(`   ✅ Pas d'erreur de syntaxe détectée`);
  }
  
  console.log('');
  return needsUpdate;
}

// Fonction pour tester la compilation
function testCompilation() {
  console.log('🧪 Test de compilation...');
  const { execSync } = require('child_process');
  
  try {
    // Test rapide avec next build --dry-run si disponible, sinon compilation complète
    execSync('npm run build', { 
      stdio: 'pipe',
      timeout: 60000 // 1 minute timeout
    });
    console.log('✅ Compilation réussie !');
    return true;
  } catch (error) {
    console.log('❌ Erreurs de compilation détectées:');
    console.log(error.stdout?.toString() || error.stderr?.toString() || error.message);
    return false;
  }
}

// Fonction pour analyser les erreurs de compilation spécifiques
function analyzeCompilationErrors() {
  console.log('🔍 Analyse des erreurs de compilation...');
  const { execSync } = require('child_process');
  
  try {
    execSync('npm run build', { stdio: 'pipe' });
    return [];
  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const errors = [];
    
    // Parser les erreurs Next.js
    const lines = output.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Rechercher les erreurs de syntaxe
      if (line.includes('Error:') && line.includes('Expected')) {
        const nextLine = lines[i + 1] || '';
        const fileMatch = nextLine.match(/,-\[(.*?):\d+:\d+\]/);
        if (fileMatch) {
          errors.push({
            file: fileMatch[1],
            error: line.trim(),
            line: nextLine
          });
        }
      }
    }
    
    return errors;
  }
}

// Exécution principale
console.log('🚀 Début de la correction des erreurs de syntaxe...\n');

let totalFixed = 0;

// Corriger chaque fichier
filesToCheck.forEach(filePath => {
  if (fixSyntaxErrors(filePath)) {
    totalFixed++;
  }
});

console.log('📊 Résumé des corrections:');
console.log(`   • ${totalFixed} fichier(s) corrigé(s)`);
console.log(`   • ${filesToCheck.length - totalFixed} fichier(s) déjà correct(s)`);
console.log('');

// Analyser les erreurs de compilation restantes
console.log('🔍 Vérification des erreurs de compilation...');
const compilationErrors = analyzeCompilationErrors();

if (compilationErrors.length === 0) {
  console.log('✅ Aucune erreur de compilation détectée !');
} else {
  console.log(`❌ ${compilationErrors.length} erreur(s) de compilation restante(s):`);
  compilationErrors.forEach((error, index) => {
    console.log(`   ${index + 1}. ${path.basename(error.file)}: ${error.error}`);
  });
  
  console.log('');
  console.log('💡 Suggestions de correction:');
  console.log('   • Vérifiez la structure des try/catch blocks');
  console.log('   • Assurez-vous que toutes les accolades sont équilibrées');
  console.log('   • Supprimez les espaces en trop en fin de ligne');
}

console.log('');
console.log('🎉 Correction des erreurs de syntaxe terminée !');
console.log('===============================================');
console.log('');
console.log('🚀 Prochaines étapes:');
console.log('   1. Vérifier la compilation: npm run build');
console.log('   2. Si OK, déployer: docker-compose restart eco-front');
console.log('   3. Tester les APIs: ./scripts/test-all-apis.sh');
console.log('');
console.log('📋 En cas d\'erreur persistante:');
console.log('   • Restaurer depuis les backups .syntax-backup-*');
console.log('   • Examiner manuellement les fichiers problématiques');
console.log('   • Utiliser les backups originaux .backup-* si nécessaire'); 