#!/bin/bash

# Script de Vérification - Configuration Tests d'Intégration Phase 2
# Ce script vérifie que tout est prêt pour exécuter les tests d'intégration réels

set -e

echo "🔍 Vérification Configuration Tests d'Intégration Phase 2"
echo "============================================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Fonction de vérification
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ $1${NC}"
  else
    echo -e "${RED}❌ $1${NC}"
    ERRORS=$((ERRORS + 1))
  fi
}

warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  WARNINGS=$((WARNINGS + 1))
}

# 1. Vérifier que les fichiers existent
echo "📁 Vérification des fichiers..."
echo ""

if [ -f "tests/integration/real-supabase.test.ts" ]; then
  check "Fichier de tests d'intégration existe"
else
  check "Fichier de tests d'intégration manquant"
fi

if [ -f ".github/workflows/6-integration-tests.yml" ]; then
  check "Workflow GitHub Actions existe"
else
  check "Workflow GitHub Actions manquant"
fi

if [ -f "Docs/TESTS/PROTECTION-PRODUCTION-PHASE2.md" ]; then
  check "Documentation Phase 2 existe"
else
  check "Documentation Phase 2 manquante"
fi

echo ""

# 2. Vérifier les variables d'environnement locales
echo "🔐 Vérification des variables d'environnement locales..."
echo ""

if [ -f ".env.local" ]; then
  check "Fichier .env.local existe"
  
  # Vérifier le contenu
  if grep -q "VITE_SUPABASE_URL" .env.local; then
    check "VITE_SUPABASE_URL configuré dans .env.local"
  else
    warn "VITE_SUPABASE_URL manquant dans .env.local"
  fi
  
  if grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
    check "VITE_SUPABASE_ANON_KEY configuré dans .env.local"
  else
    warn "VITE_SUPABASE_ANON_KEY manquant dans .env.local"
  fi
  
  if grep -q "INTEGRATION_TEST_PASSWORD" .env.local; then
    check "INTEGRATION_TEST_PASSWORD configuré dans .env.local"
  else
    warn "INTEGRATION_TEST_PASSWORD manquant dans .env.local"
  fi
  
  if grep -q "BASE_URL" .env.local; then
    check "BASE_URL configuré dans .env.local"
  else
    warn "BASE_URL manquant dans .env.local (utilise valeur par défaut)"
  fi
else
  warn "Fichier .env.local n'existe pas (tests locaux ne fonctionneront pas)"
  echo "   Pour créer: cp Docs/TESTS/GUIDE-CONFIGURATION-COMPTE-TEST.md"
fi

echo ""

# 3. Vérifier Playwright
echo "🎭 Vérification de Playwright..."
echo ""

if command -v npx &> /dev/null; then
  check "npx est installé"
  
  if npx playwright --version &> /dev/null; then
    VERSION=$(npx playwright --version)
    check "Playwright est installé ($VERSION)"
  else
    warn "Playwright n'est pas installé (exécuter: npx playwright install chromium)"
  fi
else
  warn "npx n'est pas installé"
fi

echo ""

# 4. Tester la connexion Supabase (si .env.local existe)
if [ -f ".env.local" ]; then
  echo "🔗 Test de connexion Supabase..."
  echo ""
  
  # Source .env.local
  export $(cat .env.local | xargs)
  
  if [ ! -z "$VITE_SUPABASE_URL" ]; then
    # Test simple avec curl
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$VITE_SUPABASE_URL/rest/v1/")
    
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
      check "Supabase est accessible (HTTP $HTTP_CODE)"
    else
      warn "Supabase retourne un code inattendu (HTTP $HTTP_CODE)"
    fi
  else
    warn "VITE_SUPABASE_URL non défini, impossible de tester"
  fi
  
  echo ""
fi

# 5. Vérifier le compte de test
echo "👤 Vérification du compte de test..."
echo ""

echo "   Email attendu: test-integration@doodates.com"
echo "   Vérification manuelle requise:"
echo "   1. Pouvez-vous vous connecter avec ce compte?"
echo "   2. Le compte a-t-il des données de test à nettoyer?"
echo ""

# 6. Instructions pour GitHub Secrets
echo "🔐 Configuration des secrets GitHub..."
echo ""
echo "   ⚠️  Les secrets GitHub doivent être configurés manuellement:"
echo ""
echo "   1. Aller sur: https://github.com/julienfritschheydon/DooDates/settings/secrets/actions"
echo "   2. Vérifier/Créer les secrets suivants:"
echo "      - INTEGRATION_TEST_PASSWORD"
echo "      - VITE_SUPABASE_URL"
echo "      - VITE_SUPABASE_ANON_KEY"
echo ""
echo "   Guide complet: Docs/TESTS/GUIDE-CONFIGURATION-COMPTE-TEST.md"
echo ""

# 7. Résumé
echo "============================================================"
echo "📊 RÉSUMÉ"
echo "============================================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ Tout est prêt ! Vous pouvez exécuter les tests d'intégration.${NC}"
  echo ""
  echo "Commandes pour tester:"
  echo "  npx playwright test tests/integration/real-supabase.test.ts --project=chromium"
  echo "  npx playwright test tests/integration/real-supabase.test.ts --project=chromium --ui"
  echo ""
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s) détecté(s)${NC}"
  echo "   Les tests peuvent ne pas fonctionner localement."
  echo "   Consultez les avertissements ci-dessus."
  echo ""
  echo "   Guide: Docs/TESTS/GUIDE-CONFIGURATION-COMPTE-TEST.md"
  echo ""
else
  echo -e "${RED}❌ $ERRORS erreur(s) et $WARNINGS avertissement(s) détecté(s)${NC}"
  echo "   Configuration incomplète. Veuillez corriger les erreurs ci-dessus."
  echo ""
  echo "   Guide: Docs/TESTS/GUIDE-CONFIGURATION-COMPTE-TEST.md"
  echo ""
  exit 1
fi

# 8. Prochaines étapes
echo "🚀 PROCHAINES ÉTAPES"
echo "============================================================"
echo ""
echo "1. Créer le compte de test (si pas encore fait):"
echo "   - Email: test-integration@doodates.com"
echo "   - Voir: Docs/TESTS/GUIDE-CONFIGURATION-COMPTE-TEST.md"
echo ""
echo "2. Configurer les secrets GitHub:"
echo "   - GitHub Settings > Secrets and variables > Actions"
echo "   - Ajouter INTEGRATION_TEST_PASSWORD"
echo ""
echo "3. Tester localement:"
echo "   - npx playwright test tests/integration/real-supabase.test.ts --project=chromium"
echo ""
echo "4. Pusher et vérifier CI:"
echo "   - git push"
echo "   - Vérifier Actions > Integration Tests"
echo ""
echo "Documentation complète: Docs/TESTS/PROTECTION-PRODUCTION-PHASE2.md"
echo ""

exit 0

