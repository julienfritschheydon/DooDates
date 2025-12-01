#!/bin/bash

# Script de promotion de testing vers staging
# Usage: ./scripts/promote-to-staging.sh

echo "🚀 Promotion de testing vers staging..."

# Vérifier qu'on est sur la branche testing
if [ "$(git branch --show-current)" != "testing" ]; then
    echo "❌ Erreur: Vous devez être sur la branche testing"
    echo "   Commande: git checkout testing"
    exit 1
fi

# Vérifier que la branche est à jour
echo "📥 Mise à jour de la branche testing..."
git pull origin testing

# Vérifier qu'il n'y a pas de changements non commités
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Erreur: Il y a des changements non commités"
    echo "   Committez vos changements avant de continuer"
    git status --short
    exit 1
fi

# Tests rapides de validation
echo "🧪 Lancement des tests de validation testing..."
npm run test:testing:all

if [ $? -ne 0 ]; then
    echo "❌ Erreur: Les tests ont échoué"
    echo "   Corrigez les erreurs avant de continuer"
    exit 1
fi

echo "✅ Tests réussis"

# Switch vers staging
echo "🔄 Switch vers staging..."
git checkout staging

# Merge de testing dans staging
echo "🔀 Merge de testing dans staging..."
git merge testing

if [ $? -ne 0 ]; then
    echo "❌ Erreur: Le merge a échoué"
    echo "   Résolvez les conflits et relancez le script"
    exit 1
fi

# Push vers staging
echo "📤 Push vers staging..."
git push origin staging

echo "✅ Promotion terminée avec succès!"
echo "📊 Prochaine étape: Valider sur staging puis promouvoir vers pre-prod"
echo "🌐 URL de staging: npm run preview"
