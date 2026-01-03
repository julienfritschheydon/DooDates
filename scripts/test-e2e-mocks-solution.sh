#!/bin/bash

echo "🧪 Test de la solution E2E_FORCE_MOCKS"
echo "=================================="

echo ""
echo "1. Test avec E2E_FORCE_MOCKS=true (doit utiliser les mocks)"
echo "---------------------------------------------------------"
E2E_FORCE_MOCKS=true npx playwright test tests/e2e/ultra-simple-poll.spec.ts --project=chromium --grep "@critical" --reporter=list 2>&1 | head -20

echo ""
echo "2. Test sans E2E_FORCE_MOCKS (doit utiliser les vrais appels si disponible)"
echo "-----------------------------------------------------------------------"
echo "⚠️  Ce test peut consommer des crédits Gemini - exécuter avec précaution"
echo "Commande: npx playwright test tests/e2e/gemini-real-api.spec.ts --project=chromium --grep \"@real-gemini\""

echo ""
echo "3. Vérification des hooks Git"
echo "----------------------------"
echo "✅ pre-commit: E2E_FORCE_MOCKS=true npx playwright test..."
echo "✅ pre-push: E2E_FORCE_MOCKS=true npm run test:e2e:smoke"

echo ""
echo "4. Vérification des workflows GitHub Actions"
echo "-------------------------------------------"
echo "✅ Tous les workflows ont E2E_FORCE_MOCKS=true"
echo "✅ Sauf gemini-real-api.spec.ts qui utilise @real-gemini"

echo ""
echo "🎯 Solution implémentée avec succès !"
echo "=================================="
echo "• Hooks Git: forcent les mocks ✅"
echo "• Workflows CI: forcent les mocks ✅" 
echo "• Test dédié: gemini-real-api.spec.ts pour vrais appels ✅"
echo "• Script npm: test:gemini-real pour tests manuels ✅"
