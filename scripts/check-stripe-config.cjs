#!/usr/bin/env node

/**
 * Script de diagnostic pour vérifier la configuration Stripe
 * Usage: node scripts/check-stripe-config.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function checkStripeConfig() {
  console.log('Diagnostic de configuration Stripe');
  console.log('=====================================\n');

  let hasErrors = false;

  // 1. Vérifier les variables d'environnement
  console.log('Variables d\'environnement :');
  
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  if (!secretKey) {
    console.log('❌ STRIPE_SECRET_KEY : Non définie');
    hasErrors = true;
  } else if (secretKey === 'your-stripe-secret-key') {
    console.log('❌ STRIPE_SECRET_KEY : Valeur par défaut (non configurée)');
    hasErrors = true;
  } else if (!secretKey.startsWith('sk_')) {
    console.log('❌ STRIPE_SECRET_KEY : Format invalide (doit commencer par sk_)');
    hasErrors = true;
  } else {
    const keyType = secretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE';
    console.log('✅ STRIPE_SECRET_KEY : Configurée (' + keyType + ')');
  }
  
  if (!publishableKey) {
    console.log('❌ STRIPE_PUBLISHABLE_KEY : Non définie');
    hasErrors = true;
  } else if (publishableKey === 'your-stripe-publishable-key') {
    console.log('❌ STRIPE_PUBLISHABLE_KEY : Valeur par défaut (non configurée)');
    hasErrors = true;
  } else if (!publishableKey.startsWith('pk_')) {
    console.log('❌ STRIPE_PUBLISHABLE_KEY : Format invalide (doit commencer par pk_)');
    hasErrors = true;
  } else {
    const keyType = publishableKey.startsWith('pk_test_') ? 'TEST' : 'LIVE';
    console.log('✅ STRIPE_PUBLISHABLE_KEY : Configurée (' + keyType + ')');
  }

  // 2. Vérifier la cohérence des clés
  if (secretKey && publishableKey) {
    const secretIsTest = secretKey.startsWith('sk_test_');
    const publishableIsTest = publishableKey.startsWith('pk_test_');
    
    if (secretIsTest !== publishableIsTest) {
      console.log('❌ INCOHÉRENCE : Les clés secrète et publique ne correspondent pas au même environnement');
      hasErrors = true;
    }
  }

  // 3. Test de connexion à Stripe
  if (secretKey && secretKey !== 'your-stripe-secret-key' && secretKey.startsWith('sk_')) {
    console.log('\nTest de connexion à Stripe...');
    try {
      const Stripe = require('stripe');
      const stripe = new Stripe(secretKey);
      
      const account = await stripe.accounts.retrieve();
      console.log('✅ Connexion réussie ! Compte : ' + (account.display_name || account.id));
      console.log('Pays : ' + (account.country || 'Non spécifié'));
      console.log('Devise par défaut : ' + (account.default_currency || 'Non spécifiée'));
      
      // Test basique avec un customer list
      await stripe.customers.list({ limit: 1 });
      console.log('✅ API Stripe opérationnelle');
      
    } catch (error) {
      console.log('❌ Erreur lors du test de connexion :');
      console.log('   ' + error.message);
      hasErrors = true;
    }
  }

  // 4. Vérifier les fichiers de configuration
  console.log('\nFichiers de configuration :');
  
  const configFiles = [
    '.env',
    '.env.local',
    '.env.production',
    'docker-compose.yml'
  ];
  
  configFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('your-stripe-secret-key') || content.includes('your-stripe-publishable-key')) {
        console.log(file + ' : Contient des valeurs par défaut à configurer');
      } else {
        console.log('✅ ' + file + ' : Trouvé');
      }
    } else {
      console.log(file + ' : Non trouvé');
    }
  });

  // 5. Recommandations
  console.log('\nRecommandations :');
  
  if (hasErrors) {
    console.log('Pour corriger les erreurs :');
    console.log('1. Exécutez : node scripts/configure-stripe.js');
    console.log('2. Ou configurez manuellement les variables dans docker-compose.yml');
    console.log('3. Redéployez avec : sudo deploy/full-deploy.sh');
  } else {
    console.log('✅ Configuration Stripe correcte !');
    console.log('Votre application devrait pouvoir traiter les paiements.');
  }

  // 6. Informations utiles
  console.log('\nLiens utiles :');
  console.log('• Dashboard Stripe : https://dashboard.stripe.com/');
  console.log('• Documentation API : https://stripe.com/docs/api');
  console.log('• Webhooks : https://dashboard.stripe.com/webhooks');
  
  return !hasErrors;
}

// Execute if run directly
if (require.main === module) {
  checkStripeConfig()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Erreur lors du diagnostic :', error);
      process.exit(1);
    });
}

module.exports = { checkStripeConfig }; 