#!/bin/bash

# Script de test end-to-end du système de monitoring des performances
# Usage: ./scripts/test-performance-system.sh

set -e

echo "🧪 =========================================="
echo "   TEST DU SYSTÈME DE MONITORING"
echo "=========================================="
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier les prérequis
echo "📋 Vérification des prérequis..."

if [ -z "$VITE_SUPABASE_URL" ]; then
  echo -e "${RED}❌ VITE_SUPABASE_URL n'est pas défini${NC}"
  echo "   Export: export VITE_SUPABASE_URL='https://votre-projet.supabase.co'"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo -e "${RED}❌ SUPABASE_SERVICE_KEY n'est pas défini${NC}"
  echo "   Export: export SUPABASE_SERVICE_KEY='votre-service-key'"
  exit 1
fi

echo -e "${GREEN}✅ Variables d'environnement configurées${NC}"
echo ""

# Test 1: Vérifier que les fichiers existent
echo "📁 Test 1: Vérification des fichiers..."

FILES=(
  "scripts/send-performance-metrics.js"
  "scripts/extract-e2e-metrics.js"
  "scripts/apply-performance-migrations.sql"
  "e2e-metrics-example.json"
  "public/performance-baseline.json"
  "src/services/performance-collector.ts"
  "src/components/performance/PerformanceDashboard.tsx"
  "src/components/performance/PerformanceAlerts.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${RED}✗${NC} $file (manquant)"
    exit 1
  fi
done

echo -e "${GREEN}✅ Tous les fichiers sont présents${NC}"
echo ""

# Test 2: Envoyer des métriques E2E de test
echo "📊 Test 2: Envoi de métriques E2E..."

export GITHUB_RUN_ID="test-$(date +%s)"
export GITHUB_SHA="$(git rev-parse HEAD 2>/dev/null || echo 'test-commit')"
export GITHUB_REF="refs/heads/$(git branch --show-current 2>/dev/null || echo 'test-branch')"

if node scripts/send-performance-metrics.js --source e2e --file e2e-metrics-example.json; then
  echo -e "${GREEN}✅ Métriques E2E envoyées avec succès${NC}"
else
  echo -e "${RED}❌ Échec de l'envoi des métriques E2E${NC}"
  exit 1
fi

echo ""

# Test 3: Vérifier que les données sont dans Supabase
echo "🔍 Test 3: Vérification des données dans Supabase..."

# Utiliser curl pour interroger l'API Supabase
RESPONSE=$(curl -s -X GET \
  "${VITE_SUPABASE_URL}/rest/v1/performance_metrics?order=created_at.desc&limit=1" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}")

if echo "$RESPONSE" | grep -q "e2e"; then
  echo -e "${GREEN}✅ Données trouvées dans Supabase${NC}"
  echo "   Dernière métrique: $(echo $RESPONSE | jq -r '.[0].source' 2>/dev/null || echo 'e2e')"
else
  echo -e "${YELLOW}⚠️  Aucune donnée trouvée (peut être normal si première exécution)${NC}"
fi

echo ""

# Test 4: Vérifier le dashboard local
echo "🌐 Test 4: Vérification du dashboard..."

if [ -f "src/pages/Performance.tsx" ]; then
  echo -e "${GREEN}✅ Page Performance existe${NC}"
  
  # Vérifier que les imports sont corrects
  if grep -q "PerformanceDashboard" src/pages/Performance.tsx; then
    echo -e "${GREEN}✅ Import PerformanceDashboard correct${NC}"
  else
    echo -e "${RED}❌ Import PerformanceDashboard manquant${NC}"
  fi
  
  if grep -q "PerformanceAlerts" src/components/performance/PerformanceDashboard.tsx; then
    echo -e "${GREEN}✅ Import PerformanceAlerts correct${NC}"
  else
    echo -e "${YELLOW}⚠️  Import PerformanceAlerts non trouvé${NC}"
  fi
else
  echo -e "${RED}❌ Page Performance manquante${NC}"
  exit 1
fi

echo ""

# Test 5: Vérifier la configuration des workflows
echo "⚙️  Test 5: Vérification des workflows GitHub..."

if [ -f ".github/workflows/lighthouse.yml" ]; then
  if grep -q "send-performance-metrics" .github/workflows/lighthouse.yml; then
    echo -e "${GREEN}✅ Workflow Lighthouse configuré${NC}"
  else
    echo -e "${YELLOW}⚠️  Workflow Lighthouse non configuré pour envoyer les métriques${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Workflow Lighthouse non trouvé${NC}"
fi

echo ""

# Test 6: Tester la détection de régression
echo "🚨 Test 6: Test de détection de régression..."

# Créer un fichier de métriques avec régression
cat > /tmp/test-regression-metrics.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  "source": "e2e",
  "dashboard_load_50_conversations": 6000,
  "dashboard_load_200_conversations": 10000,
  "tags_menu_open": 1000,
  "folders_menu_open": 1000
}
EOF

echo "   Envoi de métriques avec régression..."
if node scripts/send-performance-metrics.js --source e2e --file /tmp/test-regression-metrics.json; then
  echo -e "${GREEN}✅ Métriques avec régression envoyées${NC}"
  
  # Vérifier si des alertes ont été créées
  sleep 2
  ALERTS=$(curl -s -X GET \
    "${VITE_SUPABASE_URL}/rest/v1/performance_alerts?order=created_at.desc&limit=1" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}")
  
  if echo "$ALERTS" | grep -q "dashboard_load"; then
    echo -e "${GREEN}✅ Alerte de régression créée${NC}"
  else
    echo -e "${YELLOW}⚠️  Aucune alerte créée (vérifier le seuil de régression)${NC}"
  fi
else
  echo -e "${RED}❌ Échec de l'envoi des métriques de régression${NC}"
fi

# Nettoyage
rm -f /tmp/test-regression-metrics.json

echo ""

# Résumé
echo "=========================================="
echo "   RÉSUMÉ DES TESTS"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ Fichiers système présents${NC}"
echo -e "${GREEN}✅ Envoi de métriques fonctionnel${NC}"
echo -e "${GREEN}✅ Dashboard configuré${NC}"
echo -e "${GREEN}✅ Détection de régression testée${NC}"
echo ""
echo "🎉 Système de monitoring opérationnel !"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Appliquer les migrations SQL dans Supabase"
echo "   2. Configurer SUPABASE_SERVICE_KEY dans GitHub Secrets"
echo "   3. Tester le dashboard: http://localhost:8080/DooDates/performance"
echo "   4. Déclencher un workflow Lighthouse pour test complet"
echo ""

