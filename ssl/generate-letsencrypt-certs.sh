#!/bin/bash

# Script pour générer des certificats SSL avec Let's Encrypt pour ecodeli.pro

DOMAIN="ecodeli.pro"
ADMIN_DOMAIN="admin.ecodeli.pro"
EMAIL="admin@ecodeli.pro"  # Remplacez par votre email
WEBROOT="/var/www/certbot"

echo "=== Configuration des certificats SSL pour $DOMAIN ==="
echo "Email: $EMAIL"
echo "Domaine principal: $DOMAIN"
echo "Domaine admin: $ADMIN_DOMAIN"
echo ""

# Vérifier si certbot est installé
if ! command -v certbot &> /dev/null; then
    echo "Installation de certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Créer le dossier webroot pour la validation
sudo mkdir -p $WEBROOT

# Générer le certificat pour le domaine principal
echo "Génération du certificat pour $DOMAIN..."
sudo certbot certonly \
    --webroot \
    --webroot-path=$WEBROOT \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN,www.$DOMAIN

# Générer le certificat pour le sous-domaine admin
echo "Génération du certificat pour $ADMIN_DOMAIN..."
sudo certbot certonly \
    --webroot \
    --webroot-path=$WEBROOT \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $ADMIN_DOMAIN

# Copier les certificats dans le dossier ssl du projet
echo "Copie des certificats..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./ecodeli.pro.crt
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./ecodeli.pro.key

sudo cp /etc/letsencrypt/live/$ADMIN_DOMAIN/fullchain.pem ./admin.ecodeli.pro.crt
sudo cp /etc/letsencrypt/live/$ADMIN_DOMAIN/privkey.pem ./admin.ecodeli.pro.key

# Définir les permissions appropriées
sudo chown $USER:$USER *.crt *.key
chmod 644 *.crt
chmod 600 *.key

echo ""
echo "=== Certificats SSL générés avec succès ==="
echo "Certificats copiés dans le dossier ssl/"
echo "- ecodeli.pro.crt / ecodeli.pro.key"
echo "- admin.ecodeli.pro.crt / admin.ecodeli.pro.key"
echo ""
echo "Configuration du renouvellement automatique..."

# Créer un script de renouvellement
cat > /tmp/renew-ssl.sh << 'EOF'
#!/bin/bash
# Script de renouvellement automatique des certificats SSL

certbot renew --quiet

# Redémarrer nginx après le renouvellement
if [ $? -eq 0 ]; then
    # Copier les nouveaux certificats
    cp /etc/letsencrypt/live/ecodeli.pro/fullchain.pem /path/to/your/project/ssl/ecodeli.pro.crt
    cp /etc/letsencrypt/live/ecodeli.pro/privkey.pem /path/to/your/project/ssl/ecodeli.pro.key
    cp /etc/letsencrypt/live/admin.ecodeli.pro/fullchain.pem /path/to/your/project/ssl/admin.ecodeli.pro.crt
    cp /etc/letsencrypt/live/admin.ecodeli.pro/privkey.pem /path/to/your/project/ssl/admin.ecodeli.pro.key
    
    # Redémarrer les conteneurs
    cd /path/to/your/project
    docker-compose restart nginx
fi
EOF

sudo mv /tmp/renew-ssl.sh /usr/local/bin/renew-ssl.sh
sudo chmod +x /usr/local/bin/renew-ssl.sh

# Ajouter la tâche cron pour le renouvellement automatique
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/renew-ssl.sh") | crontab -

echo "Renouvellement automatique configuré (tous les jours à 2h du matin)"
echo ""
echo "=== Instructions finales ==="
echo "1. Modifiez les variables d'environnement dans docker-compose.yml"
echo "2. Redémarrez les conteneurs Docker : docker-compose restart"
echo "3. Testez l'accès HTTPS : https://ecodeli.pro et https://admin.ecodeli.pro" 