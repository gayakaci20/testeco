#!/bin/bash

echo "🧪 Test des corrections API Services (local)"
echo "============================================"
echo ""

# Vérifier que le serveur local tourne
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Serveur local non accessible sur http://localhost:3000"
    echo "   Démarrez votre serveur avec: npm run dev"
    exit 1
fi

echo "✅ Serveur local accessible"
echo ""

# Test 1: GET /api/services
echo "1️⃣ Test GET /api/services (doit fonctionner)..."
response=$(curl -s -w "HTTP_CODE:%{http_code}" "http://localhost:3000/api/services")
http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [ "$http_code" = "200" ]; then
    echo "   ✅ GET /api/services : SUCCESS (200)"
    service_count=$(echo "$body" | jq '. | length' 2>/dev/null || echo "N/A")
    echo "   📊 Nombre de services : $service_count"
else
    echo "   ❌ GET /api/services : FAILED ($http_code)"
    echo "   📄 Response: $body"
fi

echo ""

# Test 2: POST /api/services sans token (doit retourner 401)
echo "2️⃣ Test POST /api/services sans token (doit retourner 401)..."
response=$(curl -s -w "HTTP_CODE:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Service","price":50,"category":"OTHER"}' \
    "http://localhost:3000/api/services")

http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*$//')

if [ "$http_code" = "401" ]; then
    echo "   ✅ POST /api/services (sans token) : SUCCESS (401 - comportement attendu)"
    echo "   📄 Message: $(echo "$body" | jq -r '.error' 2>/dev/null || echo "$body")"
else
    echo "   ⚠️  POST /api/services (sans token) : Code $http_code (attendu 401)"
    echo "   📄 Response: $body"
fi

echo ""

# Test 3: Vérifier que les logs sont maintenant détaillés
echo "3️⃣ Vérification des logs détaillés..."
echo "   💡 Avec les corrections, vous devriez voir des logs comme :"
echo "      🚀 POST /api/services - Start"
echo "      ✅ Database connection established"
echo "      ❌ No auth token provided"
echo ""

# Test 4: Simuler la structure de données pour création
echo "4️⃣ Validation de la structure des données..."
test_data='{"name":"Test Service","description":"Service de test","category":"OTHER","price":50,"duration":60,"location":"Test Location"}'

if echo "$test_data" | jq . > /dev/null 2>&1; then
    echo "   ✅ Structure JSON valide"
    echo "   📋 Données test: $test_data"
else
    echo "   ❌ Structure JSON invalide"
fi

echo ""

# Résumé des corrections
echo "📋 Résumé des corrections apportées :"
echo "====================================="
echo "   ✅ Ajout de await ensureConnected() dans POST"
echo "   ✅ Ajout de logs détaillés pour le débogage"
echo "   ✅ Amélioration de la gestion d'erreur"
echo "   ✅ Logs de traçage à chaque étape"
echo ""

echo "🚀 Pour tester en production :"
echo "   1. Transférez le fichier services.js corrigé sur votre serveur"
echo "   2. Redéployez: docker-compose restart eco-front"
echo "   3. Testez: curl -X POST https://ecodeli.pro/api/services -H 'Content-Type: application/json' -d '{\"name\":\"Test\",\"price\":50}'"
echo ""

echo "🔍 Pour voir les logs en production :"
echo "   docker logs eco-front-app --tail=50 -f" 