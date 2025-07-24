#!/bin/bash

# Script de correction rapide pour les erreurs de base de données en production
echo "🔧 Correction des erreurs de base de données en production"
echo "========================================================="

echo "1️⃣ Arrêt des services actuels..."
docker-compose down

echo "2️⃣ Nettoyage des images pour éviter les conflits..."
docker system prune -f

echo "3️⃣ Vérification de la configuration..."
if [ ! -f ".env.production" ]; then
    echo "❌ Fichier .env.production manquant !"
    echo "📝 Création d'un fichier .env.production de base..."
    
    cat > .env.production << 'EOF'
# Configuration de production pour EcoFront
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Base de données PostgreSQL
DATABASE_URL="postgresql://eco_user:eco_password@postgres:5432/eco_database"
DIRECT_URL="postgresql://eco_user:eco_password@postgres:5432/eco_database"

# URLs de base (IMPORTANT: Remplacez par votre vrai domaine)
NEXT_PUBLIC_BASE_URL=https://ecodeli.pro
NEXTAUTH_URL=https://ecodeli.pro

# Secrets JWT et NextAuth (IMPORTANT: Générez des clés sécurisées)
JWT_SECRET=CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_32_CHARS
NEXTAUTH_SECRET=CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_32_CHARS

# Configuration Redis
REDIS_URL=redis://redis:6379

# Configuration Stripe
STRIPE_SECRET_KEY=sk_test_51Rd5XWRsmi4kGO8BgaHRoKPzPCbxJNg2YzWnq3rnU2x0v2rNpceut83k0fqRiMJhUSY7wk9VLeq3RgXAVRWR3yfj00sFAYxgAA
STRIPE_PUBLISHABLE_KEY=pk_test_51Rd5XWRsmi4kGO8BufaFcB2jcOUsQIjksZEsjCEbQVgKVeiasI9VBZJlReKzg72IWY1tisp1t7lcoY6uuTV0kqSj0070HpwprQ
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Rd5XWRsmi4kGO8BufaFcB2jcOUsQIjksZEsjCEbQVgKVeiasI9VBZJlReKzg72IWY1tisp1t7lcoY6uuTV0kqSj0070HpwprQ

# Configuration Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Configuration de sécurité
COOKIE_SECURE=true
CORS_ORIGIN=https://ecodeli.pro
EOF

    echo "✅ Fichier .env.production créé"
    echo "⚠️  IMPORTANT: Vous devez modifier ce fichier avec vos vraies valeurs !"
fi

echo "4️⃣ Reconstruction des images avec les dernières corrections..."
docker-compose build --no-cache eco-front

echo "5️⃣ Démarrage des services..."
docker-compose up -d

echo "6️⃣ Vérification des logs..."
sleep 5
docker-compose logs eco-front --tail=20

echo ""
echo "✅ Corrections appliquées !"
echo ""
echo "🔍 Pour diagnostiquer les problèmes restants :"
echo "   docker-compose logs eco-front -f"
echo ""
echo "🌐 Testez vos endpoints :"
echo "   curl http://localhost:3000/api/health"
echo "   curl http://localhost:3000/api/db-test"
echo ""
echo "⚠️  Si vous avez encore des erreurs :"
echo "1. Vérifiez votre domaine dans .env.production"
echo "2. Générez des secrets sécurisés avec : ./scripts/generate-production-secrets.sh"
echo "3. Configurez vos vraies clés Stripe et SMTP" 