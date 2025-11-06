#!/bin/bash
# Script de déploiement de la sécurisation des quotas
# Usage: ./scripts/deploy-secure-quotas.sh

echo "🔒 Déploiement de la sécurisation des quotas"
echo ""

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo "Installez-le avec: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI détecté"
echo ""

# Étape 1: Déployer l'Edge Function
echo "📦 Étape 1: Déploiement de l'Edge Function..."
echo "Commande: supabase functions deploy check-quota-and-chat"
echo ""
echo "⚠️  IMPORTANT: Assurez-vous d'avoir configuré:"
echo "   - SUPABASE_URL (automatique)"
echo "   - SUPABASE_SERVICE_ROLE_KEY (automatique)"
echo "   - GEMINI_API_KEY (à configurer manuellement)"
echo ""
read -p "Voulez-vous déployer maintenant? (o/N) " deploy
if [[ $deploy == "o" || $deploy == "O" ]]; then
    supabase functions deploy check-quota-and-chat
    if [ $? -ne 0 ]; then
        echo "❌ Erreur lors du déploiement"
        exit 1
    fi
    echo "✅ Edge Function déployée"
else
    echo "⏭️  Déploiement ignoré"
fi
echo ""

# Étape 2: Configurer les secrets
echo "🔐 Étape 2: Configuration des secrets Supabase"
echo "⚠️  À faire manuellement dans Supabase Dashboard:"
echo "   1. Allez dans Edge Functions → Secrets"
echo "   2. Ajoutez: GEMINI_API_KEY = votre_clé_api_gemini"
echo ""
read -p "Avez-vous configuré les secrets? (o/N) " configureSecrets
if [[ $configureSecrets != "o" && $configureSecrets != "O" ]]; then
    echo "⚠️  N'oubliez pas de configurer GEMINI_API_KEY!"
fi
echo ""

# Étape 3: Exécuter le script SQL
echo "🗄️  Étape 3: Exécution du script SQL"
echo "⚠️  À faire dans Supabase SQL Editor:"
echo "   1. Ouvrez Supabase Dashboard → SQL Editor"
echo "   2. Copiez le contenu de: sql-scripts/create-consume-ai-credit-function.sql"
echo "   3. Exécutez le script"
echo ""
read -p "Avez-vous exécuté le script SQL? (o/N) " sqlDone
if [[ $sqlDone != "o" && $sqlDone != "O" ]]; then
    echo "⚠️  N'oubliez pas d'exécuter le script SQL!"
fi
echo ""

# Étape 4: Supprimer VITE_GEMINI_API_KEY
echo "🧹 Étape 4: Nettoyage des variables d'environnement"
if [ -f ".env.local" ]; then
    if grep -q "VITE_GEMINI_API_KEY" .env.local; then
        echo "⚠️  VITE_GEMINI_API_KEY trouvée dans .env.local"
        read -p "Voulez-vous la supprimer? (o/N) " remove
        if [[ $remove == "o" || $remove == "O" ]]; then
            sed -i '/VITE_GEMINI_API_KEY/d' .env.local
            echo "✅ VITE_GEMINI_API_KEY supprimée"
        fi
    else
        echo "✅ VITE_GEMINI_API_KEY non trouvée (déjà supprimée)"
    fi
else
    echo "ℹ️  .env.local non trouvé (normal si vous n'utilisez pas de variables locales)"
fi
echo ""

# Résumé
echo "📋 Résumé:"
echo "✅ Edge Function créée: supabase/functions/check-quota-and-chat/"
echo "✅ Service frontend créé: src/services/SecureGeminiService.ts"
echo "✅ Script SQL créé: sql-scripts/create-consume-ai-credit-function.sql"
echo "✅ Documentation créée: Docs/SECURISATION-QUOTAS-IMPLEMENTATION.md"
echo ""
echo "🔴 Actions manuelles requises:"
echo "   1. Déployer l'Edge Function (si pas fait)"
echo "   2. Configurer GEMINI_API_KEY dans Supabase Secrets"
echo "   3. Exécuter le script SQL dans Supabase SQL Editor"
echo "   4. Supprimer VITE_GEMINI_API_KEY du .env.local"
echo ""
echo "📖 Pour plus de détails, consultez: Docs/SECURISATION-QUOTAS-IMPLEMENTATION.md"

