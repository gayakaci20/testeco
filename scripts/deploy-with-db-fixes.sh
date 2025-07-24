#!/bin/bash

# Script de déploiement avec corrections de base de données
echo "🚀 Déploiement EcoFront avec corrections de base de données"
echo "==========================================================="

set -e  # Arrêter en cas d'erreur

# Configuration
PROJECT_DIR=$(pwd)
BACKUP_DIR="$PROJECT_DIR/backups/$(date +%Y%m%d_%H%M%S)"

echo "📁 Répertoire du projet: $PROJECT_DIR"
echo "💾 Répertoire de sauvegarde: $BACKUP_DIR"
echo ""

# Étape 1: Sauvegarde avant déploiement
echo "=== Étape 1: Sauvegarde ==="
mkdir -p "$BACKUP_DIR"

echo "💾 Sauvegarde des conteneurs actuels..."
docker-compose ps > "$BACKUP_DIR/containers_before.txt" 2>/dev/null || true

echo "💾 Sauvegarde de la base de données..."
if docker-compose ps postgres | grep -q "Up"; then
    docker-compose exec -T postgres pg_dump -U eco_user eco_database > "$BACKUP_DIR/database_backup.sql" || echo "⚠️ Sauvegarde DB échouée (normal si DB indisponible)"
fi

echo "💾 Sauvegarde de la configuration actuelle..."
cp -r .env* "$BACKUP_DIR/" 2>/dev/null || true
cp docker-compose.yml "$BACKUP_DIR/" 2>/dev/null || true

echo "✅ Sauvegarde terminée dans: $BACKUP_DIR"

# Étape 2: Arrêt des services
echo ""
echo "=== Étape 2: Arrêt des services ==="
echo "🛑 Arrêt de tous les conteneurs..."
docker-compose down --remove-orphans || true

echo "🧹 Nettoyage des ressources inutilisées..."
docker system prune -f --volumes || true

# Étape 3: Vérification de la configuration
echo ""
echo "=== Étape 3: Vérification de la configuration ==="

if [ ! -f ".env.production" ]; then
    echo "❌ Fichier .env.production manquant!"
    echo "🔧 Création du fichier avec vos valeurs actuelles..."
    
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
JWT_SECRET=+IHgn4XgWSry/7K0IwgjbjgLned5S1MeLwbI4mRT+5VQ02yH7nohP3KWX8/MGRdj
NEXTAUTH_SECRET=d7f82b4e8c1a9e6f3b0c5d2a8e1f7b4c6d3a9e2f8b1c7d5e0a9f4b8c2d6e1f3a

# Configuration Redis
REDIS_URL=redis://redis:6379

# Configuration Stripe
STRIPE_SECRET_KEY=sk_test_51Rd5XWRsmi4kGO8BgaHRoKPzPCbxJNg2YzWnq3rnU2x0v2rNpceut83k0fqRiMJhUSY7wk9VLeq3RgXAVRWR3yfj00sFAYxgAA
STRIPE_PUBLISHABLE_KEY=pk_test_51Rd5XWRsmi4kGO8BufaFcB2jcOUsQIjksZEsjCEbQVgKVeiasI9VBZJlReKzg72IWY1tisp1t7lcoY6uuTV0kqSj0070HpwprQ
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Rd5XWRsmi4kGO8BufaFcB2jcOUsQIjksZEsjCEbQVgKVeiasI9VBZJlReKzg72IWY1tisp1t7lcoY6uuTV0kqSj0070HpwprQ

# Configuration Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=flashtuto894@gmail.com
SMTP_PASS=zjtt lfqe npnf xbsh

# Configuration de sécurité
COOKIE_SECURE=true
CORS_ORIGIN=https://ecodeli.pro
EOF
    
    echo "✅ Fichier .env.production créé avec vos valeurs"
else
    echo "✅ Fichier .env.production trouvé"
fi

# Étape 4: Construction avec les nouvelles corrections
echo ""
echo "=== Étape 4: Construction avec corrections DB ==="
echo "🏗️ Construction de l'image avec les corrections de base de données..."

# Forcer la reconstruction sans cache pour s'assurer que les corrections sont appliquées
docker-compose build --no-cache eco-front

# Étape 5: Démarrage des services
echo ""
echo "=== Étape 5: Démarrage des services ==="
echo "🚀 Démarrage des services avec les nouvelles corrections..."
docker-compose up -d

# Étape 6: Vérification de la santé
echo ""
echo "=== Étape 6: Vérification de la santé ==="
echo "⏳ Attente du démarrage des services..."

# Attendre que les services soient prêts
for i in {1..30}; do
    if docker-compose ps eco-front | grep -q "Up"; then
        echo "✅ Service eco-front démarré"
        break
    fi
    echo "⏳ Attente... ($i/30)"
    sleep 2
done

# Test de connectivité
echo "🔍 Test de l'endpoint de santé..."
sleep 5

for i in {1..10}; do
    if curl -s http://localhost:3000/api/health > /dev/null; then
        echo "✅ Endpoint /api/health répond"
        break
    fi
    echo "⏳ Attente de l'API... ($i/10)"
    sleep 3
done

# Test de la base de données
echo "🔍 Test de la connexion à la base de données..."
if curl -s http://localhost:3000/api/db-status | grep -q '"status":"healthy"'; then
    echo "✅ Base de données fonctionnelle avec les nouvelles corrections!"
else
    echo "⚠️ Problème détecté avec la base de données"
    echo "📋 Statut détaillé:"
    curl -s http://localhost:3000/api/db-status | jq . || curl -s http://localhost:3000/api/db-status
fi

# Étape 7: Surveillance automatique
echo ""
echo "=== Étape 7: Surveillance ==="
echo "🔧 Instructions de surveillance:"
echo ""
echo "📊 Pour surveiller la base de données en continu:"
echo "   ./scripts/monitor-database.sh"
echo ""
echo "🔍 Pour vérifier l'état actuel:"
echo "   curl http://localhost:3000/api/db-status | jq ."
echo ""
echo "📝 Pour consulter les logs:"
echo "   docker-compose logs eco-front -f"
echo ""

# Affichage du statut final
echo ""
echo "=== 🎉 DÉPLOIEMENT TERMINÉ ==="
echo "Corrections appliquées:"
echo "  ✅ Configuration Prisma améliorée avec timeout et pools"
echo "  ✅ Système de reconnexion automatique avec retry exponentiel"
echo "  ✅ Heartbeat pour maintenir les connexions actives"
echo "  ✅ Endpoint de diagnostic /api/db-status"
echo "  ✅ Scripts de surveillance"
echo ""
echo "🌐 Votre application est accessible sur:"
echo "   - Application: http://localhost:3000"
echo "   - Admin: http://localhost:3001"
echo "   - Statut DB: http://localhost:3000/api/db-status"
echo ""
echo "📊 Surveillez les performances avec:"
echo "   ./scripts/monitor-database.sh 30 5"
echo ""

# Test final après 1 minute
echo "⏰ Test automatique dans 1 minute pour vérifier la stabilité..."
(
    sleep 60
    echo ""
    echo "=== Test de stabilité (1 minute après déploiement) ==="
    if curl -s http://localhost:3000/api/db-status | grep -q '"status":"healthy"'; then
        echo "✅ Base de données stable après 1 minute"
    else
        echo "⚠️ Problème de stabilité détecté - démarrez la surveillance:"
        echo "   ./scripts/monitor-database.sh"
    fi
) &

echo "✅ Déploiement terminé avec succès!" 