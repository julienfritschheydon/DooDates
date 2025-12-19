#!/bin/bash
# Script de déploiement des Edge Functions manquantes
# Usage: ./scripts/deploy-missing-edge-functions.sh

echo "🚀 Déploiement des Edge Functions manquantes"
echo ""

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo "Installez-le avec: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI détecté"
echo ""

# Vérifier que le projet est lié
echo "🔗 Vérification de la connexion au projet..."
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Vous devez vous connecter et lier le projet:"
    echo "   1. supabase login"
    echo "   2. supabase link --project-ref outmbbisrrdiumlweira"
    echo ""
    read -p "Voulez-vous continuer quand même? (o/N) " continue
    if [[ ! $continue =~ ^[Oo]$ ]]; then
        exit 1
    fi
fi

echo ""

# Fonctions à déployer
declare -a functions=(
    "data-retention-warnings:Avertissements de rétention de données:RESEND_API_KEY"
    "send-poll-confirmation-email:Emails de confirmation après vote:RESEND_API_KEY"
)

echo "📦 Fonctions à déployer:"
for func_info in "${functions[@]}"; do
    IFS=':' read -r name desc secrets <<< "$func_info"
    echo "   - $name: $desc"
done
echo ""

read -p "Voulez-vous déployer ces fonctions maintenant? (o/N) " deploy
if [[ ! $deploy =~ ^[Oo]$ ]]; then
    echo "⏭️  Déploiement annulé"
    exit 0
fi

echo ""

# Déployer chaque fonction
for func_info in "${functions[@]}"; do
    IFS=':' read -r name desc secrets <<< "$func_info"
    echo "📦 Déploiement de $name..."
    echo "   Description: $desc"
    
    if supabase functions deploy "$name"; then
        echo "   ✅ $name déployée avec succès"
        echo "   ⚠️  Secrets requis: $secrets"
        echo "   📝 Configurez-les dans: Supabase Dashboard > Edge Functions > $name > Settings > Secrets"
    else
        echo "   ❌ Erreur lors du déploiement de $name"
        echo "   Vérifiez les logs ci-dessus"
    fi
    echo ""
done

echo "✅ Déploiement terminé!"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Configurer les secrets RESEND_API_KEY pour chaque fonction"
echo "   2. Tester les fonctions avec curl ou depuis l'application"
echo "   3. Vérifier les logs dans Supabase Dashboard > Edge Functions > Logs"
echo ""

