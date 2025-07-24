#!/bin/bash

echo "🧪 Test de l'API Services après correction"
echo "==========================================="
echo ""

# Configuration
API_URL="${1:-https://ecodeli.pro}"
if [[ $API_URL == *"localhost"* ]]; then
    API_URL="http://localhost:3000"
fi

echo "🌐 URL de test : $API_URL"
echo ""

# Test 1: GET /api/services (sans authentification - devrait marcher)
echo "1️⃣ Test GET /api/services (liste des services)..."
response=$(curl -s -w "HTTP_CODE:%{http_code}" "$API_URL/api/services")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [ "$http_code" = "200" ]; then
    echo "   ✅ GET /api/services : SUCCESS (200)"
    service_count=$(echo "$body" | jq '. | length' 2>/dev/null || echo "JSON parse error")
    echo "   📊 Nombre de services : $service_count"
else
    echo "   ❌ GET /api/services : FAILED ($http_code)"
    echo "   📄 Response: $body"
fi

echo ""

# Test 2: POST /api/services (sans token - devrait retourner 401)
echo "2️⃣ Test POST /api/services (sans token - doit retourner 401)..."
response=$(curl -s -w "HTTP_CODE:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Service","price":50}' \
    "$API_URL/api/services")

http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [ "$http_code" = "401" ]; then
    echo "   ✅ POST /api/services (sans token) : SUCCESS (401 - comportement attendu)"
else
    echo "   ⚠️  POST /api/services (sans token) : Code $http_code (attendu 401)"
    echo "   📄 Response: $body"
fi

echo ""

# Test 3: Vérifier la santé générale de l'application
echo "3️⃣ Test de santé de l'application..."
health_response=$(curl -s -w "HTTP_CODE:%{http_code}" "$API_URL/")
health_code=$(echo "$health_response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)

if [ "$health_code" = "200" ]; then
    echo "   ✅ Application principale : SUCCESS (200)"
else
    echo "   ❌ Application principale : FAILED ($health_code)"
fi

echo ""

# Test 4: Test avec différents endpoints
echo "4️⃣ Tests d'autres endpoints..."

endpoints=(
    "/api/auth/me"
    "/api/dashboard/customer"
)

for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -w "HTTP_CODE:%{http_code}" "$API_URL$endpoint")
    code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    
    case $code in
        200|401|403)
            echo "   ✅ $endpoint : $code (OK)"
            ;;
        500)
            echo "   ❌ $endpoint : $code (ERREUR 500 - problème de configuration)"
            ;;
        *)
            echo "   ⚠️  $endpoint : $code"
            ;;
    esac
done

echo ""

# Résumé
echo "📋 Résumé des tests :"
echo "====================="
echo ""
if [ "$http_code" = "200" ] && [ "$health_code" = "200" ]; then
    echo "✅ L'API semble fonctionner correctement !"
    echo "✅ L'erreur 500 sur /api/services devrait être corrigée"
    echo ""
    echo "🎉 Votre application est maintenant opérationnelle"
else
    echo "❌ Des problèmes persistent. Vérifiez :"
    echo "   1. Les variables d'environnement dans docker-compose.yml"
    echo "   2. Les logs Docker : docker logs eco-front-app --tail=50"
    echo "   3. Relancez le diagnostic : node scripts/diagnose-production-errors.js"
fi

echo ""
echo "🔧 Commandes de débogage utiles :"
echo "   docker logs eco-front-app --tail=100"
echo "   docker exec -it eco-front-app env | grep JWT"
echo "   docker-compose ps" 