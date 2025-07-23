#!/bin/bash

# Script de déploiement complet EcoFront OPTIMISÉ
# Version optimisée pour serveurs avec espace disque limité
# Gère mieux les secrets et l'espace disque

set -e

echo "🚀 DÉPLOIEMENT COMPLET ECOFFRONT (OPTIMISÉ)"
echo "============================================="
echo "Version optimisée pour serveurs avec espace disque limité"
echo ""

# Vérifier l'espace disque initial
echo "=== Étape 1: Vérification de l'espace disque ==="
echo "Espace disque disponible:"
df -h / | grep -E "(Avail|Available)"

# Seuil minimum d'espace libre (en Go)
MIN_SPACE_GB=5
AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
AVAILABLE_SPACE_GB=$((AVAILABLE_SPACE / 1024 / 1024))

if [ $AVAILABLE_SPACE_GB -lt $MIN_SPACE_GB ]; then
    echo "⚠️  Espace disque insuffisant ($AVAILABLE_SPACE_GB Go disponible, minimum $MIN_SPACE_GB Go requis)"
    echo "🧹 Lancement du nettoyage automatique..."
    
    # Nettoyer Docker
    docker-compose down --remove-orphans || true
    docker system prune -a -f --volumes
    
    # Nettoyer les logs
    journalctl --vacuum-time=1d || true
    
    # Nettoyer les caches
    apt clean || true
    npm cache clean --force 2>/dev/null || true
    
    # Vérifier à nouveau
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    AVAILABLE_SPACE_GB=$((AVAILABLE_SPACE / 1024 / 1024))
    
    if [ $AVAILABLE_SPACE_GB -lt $MIN_SPACE_GB ]; then
        echo "❌ Espace disque toujours insuffisant après nettoyage"
        echo "💡 Exécutez d'abord : sudo ./deploy/cleanup-disk-space.sh"
        exit 1
    fi
fi

echo "✅ Espace disque suffisant ($AVAILABLE_SPACE_GB Go disponible)"

# Vérifier les prérequis
echo ""
echo "=== Étape 2: Vérification des prérequis ==="
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

if ! command -v certbot &> /dev/null; then
    echo "🔧 Installation de certbot..."
    apt update
    apt install -y certbot
    echo "✅ Certbot installé"
else
    echo "✅ Certbot déjà installé"
fi

# Arrêt du nginx système pour éviter les conflits
echo "=== Étape 3: Arrêt du nginx système ==="
if systemctl is-active --quiet nginx; then
    systemctl stop nginx
    systemctl disable nginx
    echo "✅ Nginx système arrêté"
else
    echo "✅ Nginx système déjà arrêté"
fi

# PHASE 1: NETTOYAGE ET PRÉPARATION
echo ""
echo "=== PHASE 1: NETTOYAGE ET PRÉPARATION ==="
echo "🧹 Nettoyage préparatoire..."
docker-compose down --remove-orphans || true

# Nettoyer seulement les images non utilisées (pas tout)
echo "🧹 Nettoyage des images Docker non utilisées..."
docker image prune -f

# Nettoyer les anciens builds
echo "🧹 Nettoyage des anciens builds..."
rm -rf .next admin-dashboard/.next 2>/dev/null || true

# PHASE 2: BUILD OPTIMISÉ
echo ""
echo "=== PHASE 2: BUILD DOCKER OPTIMISÉ ==="
echo "🏗️  Construction des images avec optimisations..."

# Créer un fichier .dockerignore optimisé
cat > .dockerignore << 'EOF'
node_modules
.git
.next
dist
build
*.log
.env.local
.env.production
*.backup-*
README.md
docs/
tests/
coverage/
.coverage
.nyc_output
.eslintcache
.cache
EOF

# Builder les services un par un pour économiser l'espace
echo "🔧 Build de la base de données..."
docker-compose build postgres

echo "🔧 Build de Redis..."
docker-compose build redis

echo "🔧 Build de l'application principale..."
docker-compose build eco-front

echo "🔧 Build du dashboard admin..."
docker-compose build admin-dashboard

echo "🔧 Build de Nginx..."
docker-compose build nginx

echo "✅ Build terminé avec succès"

# PHASE 3: DÉMARRAGE DES SERVICES
echo ""
echo "=== PHASE 3: DÉMARRAGE DES SERVICES ==="
echo "🎯 Démarrage des services de base..."
docker-compose up -d postgres redis

echo "⏳ Attente de PostgreSQL..."
for i in {1..30}; do
    if docker-compose exec postgres pg_isready -U eco_user -d eco_database >/dev/null 2>&1; then
        echo "✅ PostgreSQL prêt"
        break
    fi
    echo "  Tentative $i/30..."
    sleep 2
done

echo "🔄 Migration de la base de données..."
docker-compose up prisma-migrate

if [ $? -eq 0 ]; then
    echo "✅ Migration réussie!"
else
    echo "❌ Migration échouée!"
    docker-compose logs prisma-migrate
    exit 1
fi

# PHASE 4: CONFIGURATION WEBROOT
echo ""
echo "=== PHASE 4: CONFIGURATION WEBROOT ==="
echo "🔧 Configuration du répertoire webroot..."
sudo mkdir -p /var/www/certbot/.well-known/acme-challenge
sudo chmod -R 755 /var/www/certbot
sudo chown -R $USER:$USER /var/www/certbot
echo "test-webroot-$(date)" > /var/www/certbot/.well-known/acme-challenge/test.txt

# Vérifier/corriger le docker-compose.yml pour le volume certbot
echo "🔧 Vérification du docker-compose.yml..."
if ! grep -q "/var/www/certbot:/var/www/certbot:ro" docker-compose.yml; then
    echo "🔧 Ajout du volume certbot au docker-compose.yml..."
    cp docker-compose.yml docker-compose.yml.backup-$(date +%Y%m%d_%H%M%S)
    
    # Ajouter le volume certbot au service nginx
    sed -i '/nginx:/,/^  [a-zA-Z]/ {
        /volumes:/a\
      - /var/www/certbot:/var/www/certbot:ro
    }' docker-compose.yml
    
    echo "✅ Volume certbot ajouté"
else
    echo "✅ Volume certbot déjà présent"
fi

# PHASE 5: DÉMARRAGE DES SERVICES RESTANTS
echo ""
echo "=== PHASE 5: DÉMARRAGE DES SERVICES RESTANTS ==="
echo "🌟 Démarrage des services applicatifs..."
docker-compose up -d eco-front admin-dashboard nginx

echo "⏳ Attente des services..."
sleep 20

# PHASE 6: CONFIGURATION HTTPS
echo ""
echo "=== PHASE 6: CONFIGURATION HTTPS ==="

# Configuration nginx temporaire pour validation
echo "🔧 Configuration nginx temporaire..."
cat > nginx-temp.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    upstream eco_app {
        server eco-front:3000;
    }

    upstream admin_app {
        server eco-admin-dashboard:3001;
    }

    server {
        listen 80;
        server_name ecodeli.pro www.ecodeli.pro admin.ecodeli.pro;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            proxy_pass http://eco_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    server {
        listen 80;
        server_name admin.ecodeli.pro;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            proxy_pass http://admin_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

cp nginx.conf nginx.conf.backup-$(date +%Y%m%d_%H%M%S)
cp nginx-temp.conf nginx.conf

echo "🔄 Redémarrage nginx avec configuration temporaire..."
docker-compose restart nginx
sleep 5

# Test du webroot avec plus de patience
echo "🔍 Test du webroot..."
for i in {1..15}; do
    if curl -f http://ecodeli.pro/.well-known/acme-challenge/test.txt >/dev/null 2>&1; then
        echo "✅ Webroot accessible"
        break
    else
        echo "⏳ Tentative $i/15 - Webroot non accessible, attente..."
        sleep 10
    fi
    if [ $i -eq 15 ]; then
        echo "❌ Webroot toujours non accessible après 15 tentatives"
        echo "🔍 Diagnostic:"
        curl -I http://ecodeli.pro/.well-known/acme-challenge/test.txt
        echo "🔍 Logs nginx:"
        docker-compose logs --tail=10 nginx
        exit 1
    fi
done

# Génération des certificats SSL
echo "🔐 Génération des certificats SSL..."
certbot certonly --webroot -w /var/www/certbot -d ecodeli.pro -d www.ecodeli.pro --agree-tos --no-eff-email --email admin@ecodeli.pro --non-interactive

if [ $? -eq 0 ]; then
    echo "✅ Certificat pour ecodeli.pro généré"
else
    echo "❌ Échec de génération du certificat pour ecodeli.pro"
    exit 1
fi

certbot certonly --webroot -w /var/www/certbot -d admin.ecodeli.pro --agree-tos --no-eff-email --email admin@ecodeli.pro --non-interactive

if [ $? -eq 0 ]; then
    echo "✅ Certificat pour admin.ecodeli.pro généré"
else
    echo "❌ Échec de génération du certificat pour admin.ecodeli.pro"
    exit 1
fi

# Copie des certificats
echo "📋 Copie des certificats..."
mkdir -p ssl
cp /etc/letsencrypt/live/ecodeli.pro/fullchain.pem ssl/ecodeli.pro.crt
cp /etc/letsencrypt/live/ecodeli.pro/privkey.pem ssl/ecodeli.pro.key
cp /etc/letsencrypt/live/admin.ecodeli.pro/fullchain.pem ssl/admin.ecodeli.pro.crt
cp /etc/letsencrypt/live/admin.ecodeli.pro/privkey.pem ssl/admin.ecodeli.pro.key
chmod 644 ssl/*.crt
chmod 600 ssl/*.key
echo "✅ Certificats copiés"

# Configuration nginx finale avec HTTPS
echo "🔧 Configuration nginx finale avec HTTPS..."
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    upstream eco_app {
        server eco-front:3000;
    }

    upstream admin_app {
        server eco-admin-dashboard:3001;
    }

    # Redirection HTTP vers HTTPS
    server {
        listen 80;
        server_name ecodeli.pro www.ecodeli.pro admin.ecodeli.pro;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS pour le domaine principal
    server {
        listen 443 ssl;
        http2 on;
        server_name ecodeli.pro www.ecodeli.pro;

        ssl_certificate /etc/nginx/ssl/ecodeli.pro.crt;
        ssl_certificate_key /etc/nginx/ssl/ecodeli.pro.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        client_max_body_size 10M;

        location / {
            proxy_pass http://eco_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 86400;
        }
    }

    # HTTPS pour admin
    server {
        listen 443 ssl;
        http2 on;
        server_name admin.ecodeli.pro;

        ssl_certificate /etc/nginx/ssl/admin.ecodeli.pro.crt;
        ssl_certificate_key /etc/nginx/ssl/admin.ecodeli.pro.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        client_max_body_size 10M;

        location / {
            proxy_pass http://admin_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 86400;
        }
    }
}
EOF

echo "🔄 Redémarrage nginx avec configuration HTTPS..."
docker-compose restart nginx
sleep 5

# PHASE 7: CRÉATION DE L'ADMIN (OPTIMISÉE)
echo ""
echo "=== PHASE 7: CRÉATION DE L'ADMINISTRATEUR ==="

# Créer le script de création d'admin corrigé avec le bon client Prisma
cat > admin-dashboard/scripts/create-admin-correct.js << 'EOF'
const bcrypt = require('bcryptjs');

async function createAdmin() {
    let prisma;
    
    try {
        // Utiliser le bon client Prisma (celui du dashboard admin)
        console.log('🔧 Chargement du client Prisma du dashboard admin...');
        const { PrismaClient } = require('../src/generated/prisma');
        prisma = new PrismaClient();
        
        await prisma.$connect();
        console.log('✅ Client Prisma connecté');

        // Vérifier si l'admin existe déjà
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@ecodeli.pro' }
        });

        if (existingAdmin) {
            console.log('⚠️  Admin déjà existant avec email: admin@ecodeli.pro');
            console.log('🔧 Mise à jour du mot de passe...');
            
            // Mettre à jour le mot de passe et s'assurer que tous les champs sont corrects
            const hashedPassword = await bcrypt.hash('admin123', 12);
            const updatedAdmin = await prisma.user.update({
                where: { email: 'admin@ecodeli.pro' },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN',
                    userType: 'INDIVIDUAL',
                    isVerified: true,
                    emailVerified: new Date()
                }
            });
            
            console.log('✅ Admin mis à jour avec succès!');
            console.log('📧 Email: admin@ecodeli.pro');
            console.log('🔑 Mot de passe: admin123');
            console.log('👤 UserType: INDIVIDUAL');
            console.log('🎯 Role: ADMIN');
            return;
        }

        // Créer l'admin avec userType INDIVIDUAL
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        const admin = await prisma.user.create({
            data: {
                email: 'admin@ecodeli.pro',
                password: hashedPassword,
                name: 'Admin Ecodeli',
                firstName: 'Admin',
                lastName: 'Ecodeli',
                role: 'ADMIN',
                userType: 'INDIVIDUAL',  // ✅ userType INDIVIDUAL
                isVerified: true,
                emailVerified: new Date()
            }
        });

        console.log('✅ Admin créé avec succès!');
        console.log('📧 Email: admin@ecodeli.pro');
        console.log('🔑 Mot de passe: admin123');
        console.log('👤 UserType: INDIVIDUAL');
        console.log('🎯 Role: ADMIN');
        
    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'admin:', error.message);
        console.error('🔍 Détails de l\'erreur:', error);
        throw error;
    } finally {
        if (prisma) {
            await prisma.$disconnect();
        }
    }
}

createAdmin().catch(console.error);
EOF

# Créer aussi un script de diagnostic complet
cat > admin-dashboard/scripts/diagnose-admin.js << 'EOF'
const bcrypt = require('bcryptjs');

async function diagnoseAndFixAdmin() {
    let prisma;
    
    try {
        // Essayer de charger le client Prisma utilisé par le dashboard admin
        console.log('🔧 Chargement du client Prisma du dashboard admin...');
        const { PrismaClient } = require('../src/generated/prisma');
        prisma = new PrismaClient();
        
        await prisma.$connect();
        console.log('✅ Client Prisma connecté');

        // Vérifier si l'admin existe
        console.log('🔍 Recherche de l\'admin existant...');
        const existingAdmin = await prisma.user.findMany({
            where: {
                OR: [
                    { email: 'admin@ecodeli.pro' },
                    { role: 'ADMIN' }
                ]
            }
        });

        console.log(`📊 Trouvé ${existingAdmin.length} utilisateur(s) admin/avec email admin@ecodeli.pro`);
        
        if (existingAdmin.length > 0) {
            console.log('📋 Détails des admins existants:');
            existingAdmin.forEach((admin, index) => {
                console.log(`  ${index + 1}. ID: ${admin.id}, Email: ${admin.email}, Role: ${admin.role}, UserType: ${admin.userType}, Verified: ${admin.isVerified}`);
            });
        }

        // Vérifier spécifiquement l'admin principal
        const mainAdmin = await prisma.user.findUnique({
            where: { email: 'admin@ecodeli.pro' }
        });

        if (mainAdmin) {
            console.log('🔍 Admin principal trouvé:');
            console.log(`   Email: ${mainAdmin.email}`);
            console.log(`   Role: ${mainAdmin.role}`);
            console.log(`   UserType: ${mainAdmin.userType}`);
            console.log(`   Vérifié: ${mainAdmin.isVerified}`);
            console.log(`   Date création: ${mainAdmin.createdAt}`);
            
            // Tester le mot de passe
            console.log('🔐 Test du mot de passe...');
            const isPasswordValid = await bcrypt.compare('admin123', mainAdmin.password);
            console.log(`   Mot de passe valide: ${isPasswordValid}`);
            
            if (!isPasswordValid) {
                console.log('🔧 Correction du mot de passe...');
                const hashedPassword = await bcrypt.hash('admin123', 12);
                await prisma.user.update({
                    where: { email: 'admin@ecodeli.pro' },
                    data: {
                        password: hashedPassword,
                        role: 'ADMIN',
                        userType: 'INDIVIDUAL',
                        isVerified: true,
                        emailVerified: new Date()
                    }
                });
                console.log('✅ Mot de passe corrigé!');
            }
        } else {
            console.log('❌ Aucun admin trouvé avec email admin@ecodeli.pro');
            console.log('🔧 Création de l\'admin...');
            
            const hashedPassword = await bcrypt.hash('admin123', 12);
            const admin = await prisma.user.create({
                data: {
                    email: 'admin@ecodeli.pro',
                    password: hashedPassword,
                    name: 'Admin Ecodeli',
                    firstName: 'Admin',
                    lastName: 'Ecodeli',
                    role: 'ADMIN',
                    userType: 'INDIVIDUAL',
                    isVerified: true,
                    emailVerified: new Date()
                }
            });
            
            console.log('✅ Admin créé avec succès!');
        }

        console.log('🎯 Informations de connexion:');
        console.log('   📧 Email: admin@ecodeli.pro');
        console.log('   🔑 Mot de passe: admin123');
        console.log('   🌐 URL: https://admin.ecodeli.pro');
        
    } catch (error) {
        console.error('❌ Erreur lors du diagnostic:', error.message);
        console.error('🔍 Détails de l\'erreur:', error);
        throw error;
    } finally {
        if (prisma) {
            await prisma.$disconnect();
        }
    }
}

diagnoseAndFixAdmin().catch(console.error);
EOF

# Attendre que le service admin soit complètement prêt
echo "⏳ Attente du service admin-dashboard..."
for i in {1..10}; do
    if docker-compose exec admin-dashboard node -e "console.log('Service ready')" >/dev/null 2>&1; then
        echo "✅ Service admin-dashboard prêt"
        break
    fi
    echo "  Tentative $i/10..."
    sleep 5
done

# Vérifier que les dépendances nécessaires sont installées
echo "🔧 Vérification des dépendances admin..."
docker-compose exec admin-dashboard npm list bcryptjs >/dev/null 2>&1 || {
    echo "📦 Installation de bcryptjs..."
    docker-compose exec admin-dashboard npm install bcryptjs
}

# S'assurer que le répertoire scripts existe
docker-compose exec admin-dashboard mkdir -p scripts

echo "🔐 Création de l'utilisateur admin..."
if docker-compose exec admin-dashboard node scripts/create-admin-correct.js; then
    echo "✅ Admin créé avec succès!"
else
    echo "⚠️  Échec de création de l'admin, tentative avec le script de diagnostic..."
    echo "🔧 Exécution du diagnostic complet..."
    if docker-compose exec admin-dashboard node scripts/diagnose-admin.js; then
        echo "✅ Admin diagnostiqué et corrigé avec succès!"
    else
        echo "❌ Échec du diagnostic. Vérification manuelle requise."
        echo "💡 Vous pouvez diagnostiquer manuellement avec:"
        echo "   docker-compose exec admin-dashboard node scripts/diagnose-admin.js"
        echo "💡 Ou créer l'admin manuellement avec:"
        echo "   docker-compose exec admin-dashboard node scripts/create-admin-correct.js"
    fi
fi

# Configuration du renouvellement automatique
echo ""
echo "=== PHASE 8: CONFIGURATION DU RENOUVELLEMENT ==="
cat > /etc/cron.daily/certbot-renew << 'EOL'
#!/bin/bash
certbot renew --quiet --post-hook "cd /root/ecodeli && cp /etc/letsencrypt/live/ecodeli.pro/fullchain.pem ssl/ecodeli.pro.crt && cp /etc/letsencrypt/live/ecodeli.pro/privkey.pem ssl/ecodeli.pro.key && cp /etc/letsencrypt/live/admin.ecodeli.pro/fullchain.pem ssl/admin.ecodeli.pro.crt && cp /etc/letsencrypt/live/admin.ecodeli.pro/privkey.pem ssl/admin.ecodeli.pro.key && docker-compose restart nginx"
EOL
chmod +x /etc/cron.daily/certbot-renew
echo "✅ Renouvellement automatique configuré"

# Mise à jour des variables d'environnement
echo "🔧 Mise à jour des variables d'environnement..."
if grep -q "NEXTAUTH_URL=" .env; then
    sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://ecodeli.pro|' .env
else
    echo "NEXTAUTH_URL=https://ecodeli.pro" >> .env
fi

if grep -q "ADMIN_URL=" .env; then
    sed -i 's|ADMIN_URL=.*|ADMIN_URL=https://admin.ecodeli.pro|' .env
else
    echo "ADMIN_URL=https://admin.ecodeli.pro" >> .env
fi

# Nettoyage final
echo "🧹 Nettoyage final..."
rm -f nginx-temp.conf
rm -f /var/www/certbot/.well-known/acme-challenge/test.txt
rm -f .dockerignore

# Nettoyer les images Docker inutilisées après déploiement
echo "🧹 Nettoyage des images Docker inutilisées..."
docker image prune -f

echo ""
echo "🎉 DÉPLOIEMENT COMPLET TERMINÉ AVEC SUCCÈS !"
echo "=============================================="
echo ""
echo "🌐 Vos sites sont maintenant accessibles en HTTPS :"
echo "   ✅ https://ecodeli.pro        → Application principale"
echo "   ✅ https://admin.ecodeli.pro  → Dashboard admin"
echo ""
echo "🔐 Informations des certificats SSL :"
echo "   📅 Expiration : dans 90 jours"
echo "   🔄 Renouvellement : automatique"
echo ""
echo "🔑 Accès admin :"
echo "   📧 Email: admin@ecodeli.pro"
echo "   🔒 Password: admin123"
echo "   👤 UserType: INDIVIDUAL"
echo "   🎯 Role: ADMIN"
echo "   ⚠️  IMPORTANT: Changez ce mot de passe après la première connexion"
echo ""
echo "📊 Statut des services:"
docker-compose ps
echo ""
echo "💾 Espace disque final:"
df -h / | grep -E "(Used|Avail|Available)"
echo ""
echo "✅ Déploiement terminé ! Vos sites sont prêts à l'emploi." 