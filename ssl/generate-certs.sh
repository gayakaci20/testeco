#!/bin/bash

# Script pour générer des certificats SSL auto-signés pour le développement local

echo "Génération des certificats SSL auto-signés..."

# Créer le certificat auto-signé pour localhost
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout localhost.key \
    -out localhost.crt \
    -subj "/C=FR/ST=France/L=Paris/O=EcoFront/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:admin.localhost,IP:127.0.0.1"

# Créer le certificat pour admin.localhost
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout admin.localhost.key \
    -out admin.localhost.crt \
    -subj "/C=FR/ST=France/L=Paris/O=EcoFront/CN=admin.localhost" \
    -addext "subjectAltName=DNS:admin.localhost,DNS:localhost,IP:127.0.0.1"

echo "Certificats SSL générés avec succès:"
echo "- localhost.crt / localhost.key"
echo "- admin.localhost.crt / admin.localhost.key"
echo ""
echo "ATTENTION: Ces certificats sont auto-signés et ne doivent être utilisés qu'en développement."
echo "Pour la production, utilisez des certificats valides d'une autorité de certification." 