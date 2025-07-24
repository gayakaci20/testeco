#!/bin/bash

# Script pour générer des secrets sécurisés pour la production
echo "🔐 Génération des secrets de production pour EcoFront"
echo "=================================================="

# Fonction pour générer un secret aléatoire
generate_secret() {
    openssl rand -hex 32
}

# Générer les secrets
JWT_SECRET=$(generate_secret)
NEXTAUTH_SECRET=$(generate_secret)

echo ""
echo "✅ Secrets générés avec succès !"
echo ""
echo "🔑 Variables à mettre à jour dans votre .env.production :"
echo "--------------------------------------------------------"
echo "JWT_SECRET=$JWT_SECRET"
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo ""

# Demander le domaine à l'utilisateur
read -p "🌐 Entrez votre domaine de production (ex: ecodeli.pro): " DOMAIN

if [ ! -z "$DOMAIN" ]; then
    echo ""
    echo "🌐 URLs à mettre à jour dans votre .env.production :"
    echo "----------------------------------------------------"
    echo "NEXT_PUBLIC_BASE_URL=https://$DOMAIN"
    echo "NEXTAUTH_URL=https://$DOMAIN"
    echo "CORS_ORIGIN=https://$DOMAIN"
    echo ""
fi

echo "📝 Instructions suivantes :"
echo "1. Copiez les variables ci-dessus dans votre fichier .env.production"
echo "2. Configurez vos vraies clés Stripe de production"
echo "3. Configurez votre email SMTP (Gmail recommandé)"
echo "4. Redéployez votre application avec : docker-compose up --build -d"
echo ""

# Option pour mettre à jour automatiquement le fichier .env.production
read -p "🤔 Voulez-vous que je mette à jour automatiquement .env.production ? (y/N): " AUTO_UPDATE

if [ "$AUTO_UPDATE" = "y" ] || [ "$AUTO_UPDATE" = "Y" ]; then
    if [ -f ".env.production" ]; then
        # Sauvegarder l'ancien fichier
        cp .env.production .env.production.backup
        echo "💾 Ancien fichier sauvegardé dans .env.production.backup"
        
        # Mettre à jour les secrets
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env.production
        sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEXTAUTH_SECRET/" .env.production
        
        if [ ! -z "$DOMAIN" ]; then
            sed -i "s/NEXT_PUBLIC_BASE_URL=.*/NEXT_PUBLIC_BASE_URL=https:\/\/$DOMAIN/" .env.production
            sed -i "s/NEXTAUTH_URL=.*/NEXTAUTH_URL=https:\/\/$DOMAIN/" .env.production
            sed -i "s/CORS_ORIGIN=.*/CORS_ORIGIN=https:\/\/$DOMAIN/" .env.production
        fi
        
        echo "✅ Fichier .env.production mis à jour automatiquement !"
    else
        echo "❌ Fichier .env.production non trouvé"
    fi
fi

echo ""
echo "🚀 Prêt pour le déploiement ! Exécutez maintenant :"
echo "   docker-compose down && docker-compose up --build -d" 