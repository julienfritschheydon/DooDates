#!/bin/bash

# Script de promotion de pre-prod vers main
# Usage: ./scripts/promote-to-main.sh

echo "🚀 Promotion de pre-prod vers main..."

# Vérifier qu'on est sur la branche pre-prod
if [ "$(git branch --show-current)" != "pre-prod" ]; then
    echo "❌ Erreur: Vous devez être sur la branche pre-prod"
    echo "   Commande: git checkout pre-prod"
    exit 1
fi

# Vérifier que la branche est à jour
echo "📥 Mise à jour de la branche pre-prod..."
git pull origin pre-prod

# Vérifier qu'il n'y a pas de changements non commités
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Erreur: Il y a des changements non commités"
    echo "   Committez vos changements avant de continuer"
    git status --short
    exit 1
fi

# Tests complets de validation locale
echo "🧪 Lancement des tests de validation pre-prod..."
npm run test:preprod:local

if [ $? -ne 0 ]; then
    echo "❌ Erreur: Les tests ont échoué"
    echo "   Corrigez les erreurs avant de continuer"
    exit 1
fi

echo "✅ Tests réussis"

# Switch vers main
echo "🔄 Switch vers main..."
git checkout main

# Merge de pre-prod dans main
echo "🔀 Merge de pre-prod dans main..."
git merge pre-prod

if [ $? -ne 0 ]; then
    echo "❌ Erreur: Le merge a échoué"
    echo "   Résolvez les conflits et relancez le script"
    exit 1
fi

# Push vers main
echo "📤 Push vers main..."
git push origin main

echo "✅ Promotion terminée avec succès!"
echo "🌐 Lancement du déploiement production..."
echo "📊 Monitoring: https://github.com/julienfritschheydon/DooDates/actions"
