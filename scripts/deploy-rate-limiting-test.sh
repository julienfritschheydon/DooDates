#!/bin/bash

# Script pour déployer l'Edge Function quota-tracking en mode test
# avec des limites basses pour les tests E2E

echo "🚀 Déploiement de quota-tracking en mode test..."

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé. Installez-la avec: npm install -g supabase"
    exit 1
fi

# Déployer l'Edge Function avec la variable d'environnement test
echo "📦 Déploiement de l'Edge Function..."
supabase functions deploy quota-tracking --env-file .env.test

# Vérifier le déploiement
if [ $? -eq 0 ]; then
    echo "✅ Edge Function déployée avec succès en mode test"
    echo ""
    echo "📋 Configuration des limites de test:"
    echo "   - conversation_created: 3/heure"
    echo "   - poll_created: 3/heure"
    echo "   - ai_message: 5/heure"
    echo "   - analytics_query: 3/heure"
    echo "   - simulation: 2/heure"
    echo "   - other: 5/heure"
    echo ""
    echo "🧪 Pour exécuter les tests:"
    echo "   Playwright: npx playwright test tests/e2e/rate-limiting.spec.ts"
    echo "   k6: k6 run --env JWT_TOKEN=\"votre_token\" tests/load/rate-limiting-test.js"
else
    echo "❌ Erreur lors du déploiement"
    exit 1
fi
