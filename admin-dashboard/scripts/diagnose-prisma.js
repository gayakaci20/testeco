#!/usr/bin/env node

console.log('🔍 Diagnostic Prisma pour EcoDeli');
console.log('================================');

// Informations système
console.log('📋 Informations système:');
console.log('- Node.js version:', process.version);
console.log('- Platform:', process.platform);
console.log('- Architecture:', process.arch);
console.log('');

// Vérifier les fichiers Prisma
const fs = require('fs');
const path = require('path');

console.log('📁 Vérification des fichiers Prisma:');

// Schema
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
console.log('- Schema prisma/schema.prisma:', fs.existsSync(schemaPath) ? '✅ Existe' : '❌ Manquant');

// Generated client
const generatedPath = path.join(__dirname, '../src/generated/prisma');
console.log('- Client généré src/generated/prisma:', fs.existsSync(generatedPath) ? '✅ Existe' : '❌ Manquant');

// Node modules client
const nodeModulesPath = path.join(__dirname, '../node_modules/.prisma/client');
console.log('- Client node_modules/.prisma/client:', fs.existsSync(nodeModulesPath) ? '✅ Existe' : '❌ Manquant');

// @prisma/client
const prismaClientPath = path.join(__dirname, '../node_modules/@prisma/client');
console.log('- Package @prisma/client:', fs.existsSync(prismaClientPath) ? '✅ Existe' : '❌ Manquant');

console.log('');

// Test de chargement
console.log('🧪 Test de chargement des clients:');

// Test 1: @prisma/client
try {
  console.log('🔧 Test 1: @prisma/client...');
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Import réussi');
  
  try {
    const client = new PrismaClient();
    console.log('✅ Instanciation réussie');
    await client.$disconnect();
  } catch (instErr) {
    console.log('❌ Erreur d\'instanciation:', instErr.message);
  }
} catch (importErr) {
  console.log('❌ Erreur d\'import:', importErr.message);
}

// Test 2: Generated client
try {
  console.log('🔧 Test 2: src/generated/prisma...');
  const { PrismaClient } = require('../src/generated/prisma');
  console.log('✅ Import réussi');
  
  try {
    const client = new PrismaClient();
    console.log('✅ Instanciation réussie');
    await client.$disconnect();
  } catch (instErr) {
    console.log('❌ Erreur d\'instanciation:', instErr.message);
  }
} catch (importErr) {
  console.log('❌ Erreur d\'import:', importErr.message);
}

// Test 3: node_modules/.prisma/client
try {
  console.log('🔧 Test 3: node_modules/.prisma/client...');
  const { PrismaClient } = require('../node_modules/.prisma/client');
  console.log('✅ Import réussi');
  
  try {
    const client = new PrismaClient();
    console.log('✅ Instanciation réussie');
    await client.$disconnect();
  } catch (instErr) {
    console.log('❌ Erreur d\'instanciation:', instErr.message);
  }
} catch (importErr) {
  console.log('❌ Erreur d\'import:', importErr.message);
}

console.log('');

// Vérifier package.json
console.log('📦 Vérification package.json:');
try {
  const packageJson = require('../package.json');
  console.log('- @prisma/client version:', packageJson.dependencies['@prisma/client'] || 'Non trouvé');
  console.log('- prisma version:', packageJson.dependencies['prisma'] || 'Non trouvé');
} catch (err) {
  console.log('❌ Erreur lecture package.json:', err.message);
}

console.log('');
console.log('💡 Recommandations:');
console.log('1. Si "Unexpected token \'?\'" → Problème de compatibilité Node.js');
console.log('2. Si clients manquants → Exécuter "npx prisma generate"');
console.log('3. Si erreur d\'instanciation → Vérifier la base de données');
console.log('4. Si problème persistant → Réinstaller les dépendances'); 