#!/bin/bash

echo "🧪 Test de toutes les APIs après corrections"
echo "==========================================="

# APIs à tester
apis=(
  "/api/packages"
  "/api/dashboard/carrier"
  "/api/notifications?limit=10"
  "/api/services"
)

for api in "${apis[@]}"; do
    echo ""
    echo "🔍 Test de $api..."
    
    response=$(curl -s -w "HTTP_CODE:%{http_code}" "https://ecodeli.pro$api" \
                   -H "Cookie: auth_token=dummy_token_for_test")
    
    http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    
    case $http_code in
        200|201)
            echo "   ✅ $api : SUCCESS ($http_code)"
            ;;
        401|403)
            echo "   ✅ $api : AUTH ERROR ($http_code) - Normal sans token valide"
            ;;
        500)
            echo "   ❌ $api : ERREUR 500 - Problème serveur!"
            ;;
        *)
            echo "   ⚠️  $api : Code $http_code"
            ;;
    esac
done

echo ""
echo "🔍 Vérification des logs Docker..."
echo "docker logs eco-front-app --tail=20"
