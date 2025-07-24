#!/bin/bash

echo "🧪 Test rapide de compilation"
echo "============================"
echo ""

echo "🔍 Vérification de la syntaxe JavaScript..."

# Test avec node --check sur les fichiers critiques
critical_files=(
    "pages/api/packages.js"
    "pages/api/services.js" 
    "pages/api/carrier-reviews.js"
    "pages/api/confirm-payment.js"
    "pages/api/create-payment-intent.js"
    "pages/api/package-payments.js"
    "pages/api/logs.js"
)

syntax_errors=0

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo -n "   Checking $file... "
        if node --check "$file" 2>/dev/null; then
            echo "✅ OK"
        else
            echo "❌ ERREUR DE SYNTAXE"
            echo "      Détails: $(node --check "$file" 2>&1 | head -1)"
            ((syntax_errors++))
        fi
    else
        echo "   ⚠️  $file non trouvé"
    fi
done

echo ""

if [ $syntax_errors -eq 0 ]; then
    echo "✅ Aucune erreur de syntaxe détectée dans les fichiers critiques"
    echo ""
    echo "🚀 Lancement du test de compilation Next.js..."
    
    # Test de compilation Next.js
    if npm run build > /tmp/build-test.log 2>&1; then
        echo "✅ Compilation Next.js réussie !"
        echo ""
        echo "🎉 Tous les tests sont passés avec succès !"
        echo "Vous pouvez déployer en toute sécurité."
    else
        echo "❌ Erreurs de compilation Next.js détectées:"
        echo ""
        tail -20 /tmp/build-test.log
        echo ""
        echo "💡 Utilisez le script fix-syntax-errors.cjs pour corriger les erreurs."
    fi
else
    echo "❌ $syntax_errors erreur(s) de syntaxe trouvée(s)"
    echo ""
    echo "🔧 Correction automatique recommandée:"
    echo "   node scripts/fix-syntax-errors.cjs"
    echo ""
fi

echo ""
echo "📋 Commandes utiles:"
echo "   • Corriger les erreurs: node scripts/fix-syntax-errors.cjs"
echo "   • Compilation complète: npm run build"
echo "   • Test des APIs: ./scripts/test-all-apis.sh" 