#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function configureStripe() {
  console.log('🔧 Configuration des clés Stripe pour EcoDeli');
  console.log('========================================\n');
  
  console.log('📋 Pour obtenir vos clés Stripe :');
  console.log('1. Connectez-vous sur https://dashboard.stripe.com/');
  console.log('2. Allez dans "Développeurs" > "Clés API"');
  console.log('3. Copiez votre clé secrète (sk_test_... ou sk_live_...)');
  console.log('4. Copiez votre clé publique (pk_test_... ou pk_live_...)\n');

  const environment = await question('🌍 Environnement (test/production) ? [test]: ');
  const useEnv = environment.toLowerCase() === 'production' ? 'production' : 'test';
  
  console.log(`\n🔑 Configuration pour l'environnement : ${useEnv}`);
  
  const secretKey = await question(`\n🔐 Clé secrète Stripe (sk_${useEnv}_...) : `);
  if (!secretKey || !secretKey.startsWith(`sk_${useEnv}_`)) {
    console.error('❌ Clé secrète invalide. Elle doit commencer par sk_test_ ou sk_live_');
    process.exit(1);
  }

  const publishableKey = await question(`🔓 Clé publique Stripe (pk_${useEnv}_...) : `);
  if (!publishableKey || !publishableKey.startsWith(`pk_${useEnv}_`)) {
    console.error('❌ Clé publique invalide. Elle doit commencer par pk_test_ ou pk_live_');
    process.exit(1);
  }

  // Update docker-compose.yml
  const dockerComposePath = path.join(process.cwd(), 'docker-compose.yml');
  
  if (fs.existsSync(dockerComposePath)) {
    let dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');
    
    // Replace Stripe keys
    dockerComposeContent = dockerComposeContent
      .replace(/STRIPE_SECRET_KEY=.*/, `STRIPE_SECRET_KEY=${secretKey}`)
      .replace(/STRIPE_PUBLISHABLE_KEY=.*/, `STRIPE_PUBLISHABLE_KEY=${publishableKey}`);
    
    fs.writeFileSync(dockerComposePath, dockerComposeContent);
    console.log('✅ docker-compose.yml mis à jour');
  }

  // Create/update .env.production
  const envProdPath = path.join(process.cwd(), '.env.production');
  const envContent = `# Configuration Stripe - ${new Date().toISOString()}
DATABASE_URL="postgres://eco_user:eco_password@localhost:5432/eco_database"
DIRECT_URL="postgres://eco_user:eco_password@localhost:5432/eco_database"

PRISMA_STUDIO_URL="http://localhost:5555"

NEXT_PUBLIC_GOOGLE_MAPS_KEY="AIzaSyANYtALRlop0ARSz4HXv9XzR-CPRgJ4Vss"

NEXT_PUBLIC_BASE_URL="http://localhost:3000"

JWT_SECRET="+IHgn4XgWSry/7K0IwgjbjgLned5S1MeLwbI4mRT+5VQ02yH7nohP3KWX8/MGRdj"
NEXTAUTH_SECRET="d7f82b4e8c1a9e6f3b0c5d2a8e1f7b4c6d3a9e2f8b1c7d5e0a9f4b8c2d6e1f3a"

STRIPE_SECRET_KEY=sk_test_51Rd5XWRsmi4kGO8BgaHRoKPzPCbxJNg2YzWnq3rnU2x0v2rNpceut83k0fqRiMJhUSY7wk9VLeq3RgXAVRWR3yfj00sFAYxgAA
STRIPE_PUBLISHABLE_KEY=pk_test_51Rd5XWRsmi4kGO8BufaFcB2jcOUsQIjksZEsjCEbQVgKVeiasI9VBZJlReKzg72IWY1tisp1t7lcoY6uuTV0kqSj0070HpwprQ
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Rd5XWRsmi4kGO8BufaFcB2jcOUsQIjksZEsjCEbQVgKVeiasI9VBZJlReKzg72IWY1tisp1t7lcoY6uuTV0kqSj0070HpwprQ

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=flashtuto894@gmail.com
SMTP_PASS=zjtt lfqe npnf xbsh
`;

  fs.writeFileSync(envProdPath, envContent);
  console.log('✅ .env.production créé');

  // Test Stripe connection
  console.log('\n🧪 Test de connexion à Stripe...');
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(secretKey);
    
    await stripe.customers.list({ limit: 1 });
    console.log('✅ Connexion Stripe réussie !');
  } catch (error) {
    console.error('❌ Erreur de connexion Stripe :', error.message);
  }

  console.log('\n🎉 Configuration terminée !');
  console.log('\n📝 Prochaines étapes :');
  console.log('1. Vérifiez le domaine dans NEXT_PUBLIC_BASE_URL');
  console.log('2. Configurez les autres variables si nécessaire');
  console.log('3. Redéployez votre application : sudo deploy/full-deploy.sh');
  
  rl.close();
}

// Execute if run directly
if (require.main === module) {
  configureStripe().catch(console.error);
}

module.exports = { configureStripe }; 