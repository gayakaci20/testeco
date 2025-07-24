#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction avancée des erreurs de syntaxe - APIs');
console.log('================================================\n');

// Fichiers problématiques détectés
const problematicFiles = [
  'pages/api/subscriptions.js',
  'pages/api/packages/[id]/rate-carrier.js',
  'pages/api/auth/login.js',
  'pages/api/db-test.js',
  'pages/api/ride-proposals.js',
  'pages/api/rides.js'
];

function fixComplexSyntaxErrors(filePath) {
  console.log(`🔍 Correction avancée de ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  Fichier non trouvé: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let needsUpdate = false;
  
  // Créer un backup avant modifications
  const backupPath = `${filePath}.advanced-backup-${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`   📦 Backup créé: ${backupPath}`);
  
  // 1. Corriger les fins de fichier mal formatées
  const originalLength = content.length;
  content = content.trim() + '\n';
  if (content.length !== originalLength) {
    console.log(`   ✅ Fin de fichier normalisée`);
    needsUpdate = true;
  }
  
  // 2. Corriger les structures try/catch orphelines ou doubles
  const beforeTryCatch = content;
  
  // Supprimer les doubles try blocks
  content = content.replace(/try\s*\{\s*\/\/\s*[Ee]nsure[\s\S]*?await ensureConnected\(\);\s*try\s*\{/g, 
    'try {\n    // Ensure database connection is established\n    await ensureConnected();\n');
  
  // Corriger les catch orphelins
  content = content.replace(/\s*\}\s*\} catch \(error\) \{\s*console\.error\(['"]API error['"].*?\s*return res\.status\(500\).*?\s*\}/g, '');
  
  // Corriger les finally/catch mal ordonnés
  content = content.replace(/\}\s*finally\s*\{[\s\S]*?\}\s*\} catch \(error\) \{/g, '} catch (error) {');
  
  if (beforeTryCatch !== content) {
    console.log(`   ✅ Structures try/catch/finally réorganisées`);
    needsUpdate = true;
  }
  
  // 3. Corrections spécifiques par fichier
  if (filePath.includes('rate-carrier.js')) {
    // Vérifier que le fichier se termine correctement
    const lines = content.split('\n');
    const lastMeaningfulLine = lines.findLastIndex(line => line.trim() !== '');
    
    if (lastMeaningfulLine !== -1 && !lines[lastMeaningfulLine].trim().endsWith('}')) {
      // Le fichier ne se termine pas par une accolade fermante
      let openBraces = 0;
      for (const line of lines) {
        openBraces += (line.match(/\{/g) || []).length;
        openBraces -= (line.match(/\}/g) || []).length;
      }
      
      if (openBraces > 0) {
        // Ajouter les accolades manquantes
        while (openBraces > 0) {
          content += '\n}';
          openBraces--;
        }
        console.log(`   ✅ Accolades fermantes ajoutées dans rate-carrier.js`);
        needsUpdate = true;
      }
    }
  }
  
  // 4. Vérification et correction des accolades déséquilibrées
  const braceBalance = (content.match(/\{/g) || []).length - (content.match(/\}/g) || []).length;
  if (braceBalance !== 0) {
    console.log(`   ⚠️  Accolades déséquilibrées détectées (différence: ${braceBalance})`);
    
    if (braceBalance > 0) {
      // Trop d'ouvertures, ajouter des fermetures
      for (let i = 0; i < braceBalance; i++) {
        content += '\n}';
      }
      console.log(`   ✅ ${braceBalance} accolade(s) fermante(s) ajoutée(s)`);
      needsUpdate = true;
    } else {
      // Trop de fermetures - problème plus complexe
      console.log(`   ❌ Trop d'accolades fermantes - correction manuelle requise`);
    }
  }
  
  // 5. Nettoyer les lignes vides multiples
  const beforeClean = content;
  content = content.replace(/\n\n\n+/g, '\n\n');
  if (beforeClean !== content) {
    console.log(`   ✅ Lignes vides multiples nettoyées`);
    needsUpdate = true;
  }
  
  // 6. S'assurer que le fichier se termine par une seule ligne vide
  if (!content.endsWith('\n')) {
    content += '\n';
    needsUpdate = true;
  } else if (content.endsWith('\n\n\n')) {
    content = content.replace(/\n+$/, '\n');
    needsUpdate = true;
  }
  
  if (needsUpdate) {
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ Corrections avancées appliquées`);
  } else {
    console.log(`   ✅ Aucune correction nécessaire`);
  }
  
  console.log('');
  return needsUpdate;
}

// Test de validation syntaxique avec Node.js
function validateSyntax(filePath) {
  const { execSync } = require('child_process');
  try {
    execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error.stderr?.toString() || error.message 
    };
  }
}

// Exécution principale
console.log('🚀 Début de la correction avancée...\n');

let totalFixed = 0;
let totalErrors = 0;

for (const filePath of problematicFiles) {
  if (fs.existsSync(filePath)) {
    // Corriger le fichier
    if (fixComplexSyntaxErrors(filePath)) {
      totalFixed++;
    }
    
    // Valider la syntaxe après correction
    const validation = validateSyntax(filePath);
    if (!validation.valid) {
      console.log(`   ❌ Validation échouée: ${validation.error}`);
      totalErrors++;
    } else {
      console.log(`   ✅ Validation syntaxique réussie`);
    }
  } else {
    console.log(`🔍 ${filePath}...`);
    console.log(`   ⚠️  Fichier non trouvé`);
  }
  console.log('');
}

console.log('📊 Résumé de la correction avancée:');
console.log(`   • ${totalFixed} fichier(s) corrigé(s)`);
console.log(`   • ${totalErrors} erreur(s) de validation restante(s)`);
console.log('');

// Test de compilation final
console.log('🧪 Test de compilation final...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { 
    stdio: 'pipe',
    timeout: 90000 // 1.5 minutes
  });
  console.log('✅ Compilation réussie !');
  console.log('');
  console.log('🎉 Toutes les corrections sont terminées avec succès !');
  console.log('Vous pouvez maintenant déployer en toute sécurité.');
} catch (error) {
  console.log('❌ Erreurs de compilation persistantes:');
  const output = error.stdout?.toString() || error.stderr?.toString() || error.message;
  
  // Extraire les erreurs les plus pertinentes
  const lines = output.split('\n');
  const errorLines = lines.filter(line => 
    line.includes('Error:') || 
    line.includes('Expected') ||
    line.includes('Caused by:')
  ).slice(0, 10); // Limiter à 10 erreurs
  
  if (errorLines.length > 0) {
    console.log('');
    errorLines.forEach(line => console.log(`   ${line.trim()}`));
  }
  
  console.log('');
  console.log('💡 Correction manuelle requise pour les erreurs restantes.');
  console.log('📋 Utilisez les backups .advanced-backup-* pour restaurer si nécessaire.');
}

console.log('');
console.log('🎯 Correction avancée terminée !');
console.log('==============================='); 