#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

async function fixProductionConfig() {
  console.log('🔧 Correction de la configuration de production');
  console.log('===============================================\n');

  // 1. Obtenir les informations de l'utilisateur
  console.log('📋 Informations requises :');
  console.log('');
  
  const domain = await question('🌐 Votre domaine (ex: ecodeli.pro) : ');
  if (!domain) {
    console.log('❌ Domaine requis pour la configuration');
    process.exit(1);
  }

  const protocol = domain.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${domain}`;
  
  console.log(`✅ URL de base configurée : ${baseUrl}`);

  // 2. Générer des secrets sécurisés
  console.log('\n🔐 Génération des secrets sécurisés...');
  
  const jwtSecret = generateSecureSecret(32);
  const nextAuthSecret = generateSecureSecret(32);
  
  console.log('✅ JWT_SECRET généré');
  console.log('✅ NEXTAUTH_SECRET généré');

  // 3. Mise à jour du docker-compose.yml
  console.log('\n📝 Mise à jour du docker-compose.yml...');
  
  const dockerComposePath = path.join(process.cwd(), 'docker-compose.yml');
  
  if (!fs.existsSync(dockerComposePath)) {
    console.log('❌ docker-compose.yml non trouvé');
    process.exit(1);
  }

  // Backup du fichier original
  const backupPath = `${dockerComposePath}.backup-${Date.now()}`;
  fs.copyFileSync(dockerComposePath, backupPath);
  console.log(`📦 Backup créé : ${backupPath}`);

  // Lire et modifier le contenu
  let dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');
  
  // Remplacer les variables d'environnement
  const replacements = [
    {
      pattern: /JWT_SECRET=your_jwt_secret_key_here_change_in_production/g,
      replacement: `JWT_SECRET=${jwtSecret}`,
      description: 'JWT_SECRET'
    },
    {
      pattern: /NEXTAUTH_SECRET=your-super-secret-key-change-in-production/g,
      replacement: `NEXTAUTH_SECRET=${nextAuthSecret}`,
      description: 'NEXTAUTH_SECRET'
    },
    {
      pattern: /NEXT_PUBLIC_BASE_URL=http:\/\/localhost:3000/g,
      replacement: `NEXT_PUBLIC_BASE_URL=${baseUrl}`,
      description: 'NEXT_PUBLIC_BASE_URL'
    },
    {
      pattern: /NEXTAUTH_URL=http:\/\/localhost:3000/g,
      replacement: `NEXTAUTH_URL=${baseUrl}`,
      description: 'NEXTAUTH_URL (eco-front)'
    },
    {
      pattern: /NEXTAUTH_URL=http:\/\/localhost:3001/g,
      replacement: `NEXTAUTH_URL=${baseUrl}/admin`,
      description: 'NEXTAUTH_URL (admin-dashboard)'
    }
  ];

  let changesCount = 0;
  replacements.forEach(({ pattern, replacement, description }) => {
    const matches = dockerComposeContent.match(pattern);
    if (matches) {
      dockerComposeContent = dockerComposeContent.replace(pattern, replacement);
      console.log(`   ✅ ${description} mis à jour (${matches.length} occurrence(s))`);
      changesCount += matches.length;
    }
  });

  if (changesCount === 0) {
    console.log('   ℹ️  Aucune configuration par défaut trouvée - déjà configuré ?');
  } else {
    // Écrire le fichier modifié
    fs.writeFileSync(dockerComposePath, dockerComposeContent);
    console.log(`✅ docker-compose.yml mis à jour (${changesCount} changements)`);
  }

  // 4. Créer/mettre à jour .env.production
  console.log('\n📄 Création du fichier .env.production...');
  
  const envProductionPath = path.join(process.cwd(), '.env.production');
  const envContent = `# Configuration de production - ${new Date().toISOString()}
# ⚠️  NE PAS COMMITER CE FICHIER - CONTIENT DES SECRETS

NODE_ENV=production

# Base de données
DATABASE_URL="postgresql://eco_user:eco_password@postgres:5432/eco_database"
DIRECT_URL="postgresql://eco_user:eco_password@postgres:5432/eco_database"

# URLs
NEXT_PUBLIC_BASE_URL="${baseUrl}"
NEXTAUTH_URL="${baseUrl}"

# Secrets JWT
JWT_SECRET="${jwtSecret}"
NEXTAUTH_SECRET="${nextAuthSecret}"

# Stripe (À CONFIGURER avec vos vraies clés)
STRIPE_SECRET_KEY=sk_test_51Rd5XWRsmi4kGO8BgaHRoKPzPCbxJNg2YzWnq3rnU2x0v2rNpceut83k0fqRiMJhUSY7wk9VLeq3RgXAVRWR3yfj00sFAYxgAA
STRIPE_PUBLISHABLE_KEY=pk_test_51Rd5XWRsmi4kGO8BufaFcB2jcOUsQIjksZEsjCEbQVgKVeiasI9VBZJlReKzg72IWY1tisp1t7lcoY6uuTV0kqSj0070HpwprQ
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Rd5XWRsmi4kGO8BufaFcB2jcOUsQIjksZEsjCEbQVgKVeiasI9VBZJlReKzg72IWY1tisp1t7lcoY6uuTV0kqSj0070HpwprQ

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=flashtuto894@gmail.com
SMTP_PASS=zjtt lfqe npnf xbsh

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY="AIzaSyANYtALRlop0ARSz4HXv9XzR-CPRgJ4Vss"

# Prisma
PRISMA_STUDIO_URL="http://localhost:5555"
`;

  fs.writeFileSync(envProductionPath, envContent);
  console.log('✅ .env.production créé');

  // 5. Mise à jour de .gitignore pour les secrets
  console.log('\n🔒 Mise à jour de .gitignore...');
  
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    let gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    
    const secretsToIgnore = [
      '.env.production',
      'docker-compose.yml.backup-*',
      '*.backup-*'
    ];
    
    let gitignoreUpdated = false;
    secretsToIgnore.forEach(pattern => {
      if (!gitignoreContent.includes(pattern)) {
        gitignoreContent += `\n${pattern}`;
        gitignoreUpdated = true;
      }
    });
    
    if (gitignoreUpdated) {
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log('✅ .gitignore mis à jour pour exclure les secrets');
    } else {
      console.log('✅ .gitignore déjà configuré');
    }
  }

  // 6. Créer un script de démarrage amélioré
  console.log('\n🚀 Création du script de redéploiement...');
  
  const redeployScript = `#!/bin/bash

echo "🔄 Redéploiement avec la nouvelle configuration..."

# Arrêt des services
echo "⏹️  Arrêt des services..."
docker-compose down

# Nettoyage des images obsolètes
echo "🧹 Nettoyage..."
docker system prune -f

# Reconstruction et démarrage
echo "🏗️  Reconstruction des services..."
docker-compose up --build -d

# Attente de la base de données
echo "⏳ Attente de PostgreSQL..."
sleep 30

# Vérification des services
echo "✅ Vérification des services..."
docker-compose ps

echo ""
echo "🎉 Redéploiement terminé !"
echo "📍 Application disponible sur : ${baseUrl}"
echo "📍 Admin dashboard : ${baseUrl}/admin"
echo ""
echo "🔍 Pour vérifier les logs :"
echo "   docker logs eco-front-app --tail=50"
echo "   docker logs eco-admin-dashboard --tail=50"
`;

  const redeployScriptPath = path.join(process.cwd(), 'redeploy-production.sh');
  fs.writeFileSync(redeployScriptPath, redeployScript);
  fs.chmodSync(redeployScriptPath, '755');
  console.log('✅ Script redeploy-production.sh créé');

  // 7. Résumé et prochaines étapes
  console.log('\n🎉 Configuration terminée !');
  console.log('==========================');
  console.log('');
  console.log('📋 Résumé des changements :');
  console.log(`   ✅ JWT_SECRET généré et configuré`);
  console.log(`   ✅ NEXTAUTH_SECRET généré et configuré`);
  console.log(`   ✅ URLs mises à jour pour ${domain}`);
  console.log(`   ✅ Fichier .env.production créé`);
  console.log(`   ✅ Script de redéploiement créé`);
  console.log('');
  console.log('🚀 Prochaines étapes :');
  console.log('   1. Configurez vos vraies clés Stripe si nécessaire');
  console.log('   2. Lancez le redéploiement :');
  console.log('      ./redeploy-production.sh');
  console.log('');
  console.log('🔍 Débogage si problèmes :');
  console.log('   node scripts/diagnose-production-errors.js');
  console.log('');
  console.log('⚠️  IMPORTANT : Les secrets ont été générés automatiquement.');
  console.log('   Gardez une copie sécurisée si vous devez les restaurer.');

  rl.close();
}

// Gestion des erreurs
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur inattendue:', error.message);
  rl.close();
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Configuration interrompue');
  rl.close();
  process.exit(0);
});

// Démarrer la configuration
fixProductionConfig().catch(error => {
  console.error('❌ Erreur lors de la configuration:', error.message);
  rl.close();
  process.exit(1);
}); 