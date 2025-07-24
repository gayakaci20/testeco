#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Correction finale des erreurs de syntaxe');
console.log('==========================================\n');

// Fichiers à corriger avec leurs backups
const filesToFix = [
  { file: 'pages/api/packages.js', hasEssentialImport: true },
  { file: 'pages/api/services.js', hasEssentialImport: true },
  { file: 'pages/api/carrier-reviews.js', needsRestore: true },
  { file: 'pages/api/confirm-payment.js', needsRestore: true },
  { file: 'pages/api/create-payment-intent.js', needsRestore: true },
  { file: 'pages/api/package-payments.js', needsRestore: true },
  { file: 'pages/api/logs.js', needsRestore: true },
  { file: 'pages/api/subscriptions.js', needsRestore: true },
  { file: 'pages/api/packages/[id]/rate-carrier.js', needsRestore: true },
  { file: 'pages/api/packages/[id].js', needsRestore: true }
];

function findBackupFile(filePath) {
  const backupPattern = `${filePath}.backup-`;
  try {
    // Chercher les fichiers de backup
    const files = execSync(`ls ${backupPattern}* 2>/dev/null || echo ""`, { encoding: 'utf8' });
    const backupFiles = files.trim().split('\n').filter(f => f);
    
    if (backupFiles.length > 0) {
      // Prendre le backup le plus récent (le plus grand timestamp)
      return backupFiles.sort().pop();
    }
  } catch (error) {
    // Ignorer les erreurs
  }
  return null;
}

function simpleCorrection(filePath) {
  console.log(`🔧 Correction simple de ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  Fichier non trouvé`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let needsUpdate = false;
  
  // Correction 1: Import Prisma standardisé
  const wrongImports = [
    /import { prisma } from '\.\.\/\.\.\/src\/lib\/prisma';/g,
    /import { PrismaClient } from ['"@]prisma\/client['"];?\s*const prisma = new PrismaClient\(\);?/gs
  ];
  
  for (const wrongImport of wrongImports) {
    if (wrongImport.test(content)) {
      const correctImport = filePath.includes('packages/[id]') 
        ? "import prisma, { ensureConnected } from '../../../../lib/prisma';"
        : "import prisma, { ensureConnected } from '../../lib/prisma';";
      
      content = content.replace(wrongImport, correctImport);
      console.log(`   ✅ Import Prisma corrigé`);
      needsUpdate = true;
    }
  }
  
  // Correction 2: Ajouter ensureConnected() seulement si manquant
  if (!content.includes('await ensureConnected()')) {
    // Trouver le premier try block ou le début de la fonction handler
    const handlerMatch = content.match(/(export default async function handler\(req, res\) \{\s*)(.*)/s);
    if (handlerMatch) {
      const beforeHandler = handlerMatch[1];
      const afterHandler = handlerMatch[2];
      
      // Ajouter ensureConnected() au tout début
      const updatedHandler = beforeHandler + 
        'try {\n    // Ensure database connection is established\n    await ensureConnected();\n    ' +
        afterHandler;
      
      content = content.replace(handlerMatch[0], updatedHandler);
      
      // Ajouter un catch à la fin si le fichier ne se termine pas par catch
      if (!content.match(/\} catch \([^)]+\) \{[\s\S]*?\}\s*$/) && !content.includes('} catch (error) {')) {
        // Trouver la dernière accolade et ajouter le catch avant
        const lastBraceIndex = content.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
          content = content.slice(0, lastBraceIndex) + 
            '  } catch (error) {\n    console.error(\'API error:\', error);\n    return res.status(500).json({ error: \'Internal server error\' });\n  }\n' +
            content.slice(lastBraceIndex);
        }
      }
      
      console.log(`   ✅ ensureConnected() ajouté avec try/catch`);
      needsUpdate = true;
    }
  }
  
  // Correction 3: Nettoyer la fin du fichier
  const cleanContent = content.replace(/\s+$/, '') + '\n';
  if (cleanContent !== content) {
    content = cleanContent;
    needsUpdate = true;
  }
  
  if (needsUpdate) {
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ Corrections appliquées`);
  } else {
    console.log(`   ✅ Déjà correct`);
  }
  
  // Test de syntaxe
  try {
    execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
    console.log(`   ✅ Syntaxe validée`);
    return true;
  } catch (error) {
    console.log(`   ❌ Erreur de syntaxe: ${error.stderr?.toString().split('\n')[0] || 'Erreur inconnue'}`);
    return false;
  }
}

// Exécution principale
console.log('🚀 Début de la correction finale...\n');

let totalFixed = 0;
let totalErrors = 0;

for (const { file, needsRestore, hasEssentialImport } of filesToFix) {
  console.log(`📁 Traitement de ${file}:`);
  
  // Étape 1: Restaurer depuis backup si nécessaire
  if (needsRestore) {
    const backupFile = findBackupFile(file);
    if (backupFile) {
      try {
        execSync(`cp "${backupFile}" "${file}"`, { stdio: 'pipe' });
        console.log(`   📦 Restauré depuis ${backupFile}`);
      } catch (error) {
        console.log(`   ❌ Échec de restauration: ${error.message}`);
      }
    } else if (!hasEssentialImport) {
      console.log(`   ⚠️  Aucun backup trouvé`);
    }
  }
  
  // Étape 2: Appliquer les corrections
  if (simpleCorrection(file)) {
    totalFixed++;
  } else {
    totalErrors++;
  }
  
  console.log('');
}

console.log('📊 Résumé final:');
console.log(`   • ${totalFixed} fichier(s) corrigé(s) avec succès`);
console.log(`   • ${totalErrors} fichier(s) avec erreurs persistantes`);
console.log('');

// Test de compilation final
if (totalErrors === 0) {
  console.log('🧪 Test de compilation final...');
  try {
    execSync('npm run build', { stdio: 'pipe', timeout: 120000 });
    console.log('✅ Compilation réussie !');
    console.log('');
    console.log('🎉 TOUTES LES CORRECTIONS SONT TERMINÉES !');
    console.log('Vous pouvez maintenant déployer votre application.');
  } catch (error) {
    console.log('❌ Erreurs de compilation restantes - correction manuelle requise');
  }
} else {
  console.log('⚠️  Des erreurs de syntaxe persistent - vérification manuelle recommandée');
}

console.log('');
console.log('🎯 Correction finale terminée !'); 