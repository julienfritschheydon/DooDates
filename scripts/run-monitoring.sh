#!/bin/bash
# Script bash pour exécuter le monitoring avec token GitHub
# Usage: ./scripts/run-monitoring.sh

echo "🔍 Configuration du Monitoring GitHub Actions"
echo ""

# Demander le token
read -sp "📝 Entrez votre Personal Access Token GitHub: " TOKEN
echo ""
echo "   (Créez-en un sur: https://github.com/settings/tokens)"
echo "   Permissions nécessaires: repo, workflow"
echo "   (repo inclut déjà les permissions pour les issues)"
echo ""

# Demander le repository
read -p "📦 Entrez le nom du repository (format: owner/repo): " REPOSITORY
echo ""

# Vérifier que le token commence par ghp_
if [[ ! $TOKEN == ghp_* ]]; then
    echo "⚠️  Le token devrait commencer par 'ghp_'"
    echo "   Vérifiez que vous avez copié le bon token."
    echo ""
    read -p "Continuer quand même? (o/N): " CONTINUE
    if [[ ! $CONTINUE == [oO] ]]; then
        echo "❌ Annulé"
        exit 1
    fi
fi

# Définir les variables d'environnement
export GITHUB_TOKEN="$TOKEN"
export GITHUB_REPOSITORY="$REPOSITORY"

echo ""
echo "✅ Configuration terminée"
echo "   Token: ${TOKEN:0:10}..."
echo "   Repository: $REPOSITORY"
echo ""
echo "🚀 Exécution du monitoring..."
echo ""

# Exécuter le script
node scripts/monitor-workflow-failures.js

echo ""
echo "📊 Vérification du statut..."
echo ""

# Vérifier le statut
node scripts/check-workflow-status.js

echo ""
echo "✅ Terminé!"
echo ""
echo "📋 Fichiers générés:"
echo "   - Docs/monitoring/workflow-failures-report.md"
echo "   - Docs/monitoring/workflow-status.json"
echo ""

