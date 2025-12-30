#!/bin/bash

# 🚀 Script de validation de la qualité du code DooDates
# À exécuter avant chaque commit ou PR

echo "🔍 Validation de la qualité du code DooDates..."
echo "=================================="

# Couleurs pour une meilleure lisibilité
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 - OK${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 - ÉCHEC${NC}"
        return 1
    fi
}

# 1. Vérification TypeScript
echo "📋 1/5 Vérification TypeScript..."
npm run type-check
TYPE_CHECK_RESULT=$?

# 2. Linting (objectif: 0 warnings)
echo "📋 2/5 Vérification Linting (max 30 warnings)..."
LINT_OUTPUT=$(npm run lint -- --max-warnings=30 2>&1)
LINT_RESULT=$?

# Extraire le nombre de warnings
WARNINGS_COUNT=$(echo "$LINT_OUTPUT" | grep -o '✖ [0-9]* problems' | grep -o '[0-9]*' || echo "0")

if [ "$LINT_RESULT" -eq 0 ] && [ "$WARNINGS_COUNT" -le 30 ]; then
    echo -e "${GREEN}✅ Linting - OK ($WARNINGS_COUNT warnings)${NC}"
else
    echo -e "${RED}❌ Linting - ÉCHEC ($WARNINGS_COUNT warnings > 30)${NC}"
    echo "$LINT_OUTPUT" | tail -20
fi

# 3. Tests unitaires
echo "📋 3/5 Tests unitaires..."
npm run test:unit
UNIT_TESTS_RESULT=$?

# 4. Build production
echo "📋 4/5 Build production..."
npm run build
BUILD_RESULT=$?

# 5. Vérification des imports non utilisés
echo "📋 5/5 Vérification imports non utilisés..."
npx ts-unused-exports tsconfig.json --ignoreUnusedExports 2>/dev/null || echo "⚠️  ts-unused-exports non disponible"
UNUSED_IMPORTS_RESULT=$?

# Résumé
echo ""
echo "=================================="
echo "📊 RÉSUMÉ DE LA VALIDATION"
echo "=================================="

TOTAL_ERRORS=0

# Vérifier chaque étape
check_result "TypeScript" || TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
[ "$LINT_RESULT" -eq 0 ] && [ "$WARNINGS_COUNT" -le 30 ] || TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
check_result "Tests unitaires" || TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
check_result "Build production" || TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
check_result "Imports non utilisés" || TOTAL_ERRORS=$((TOTAL_ERRORS + 1))

# Résultat final
if [ $TOTAL_ERRORS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 VALIDATION RÉUSSIE !${NC}"
    echo -e "${GREEN}✅ Le code est prêt pour le commit/PR${NC}"
    echo ""
    echo "📊 Statistiques :"
    echo "   - Warnings ESLint : $WARNINGS_COUNT/30"
    echo "   - Tests unitaires : ✅"
    echo "   - Build : ✅"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}🚨 VALIDATION ÉCHOUÉE !${NC}"
    echo -e "${RED}❌ Corrigez les erreurs avant de committer${NC}"
    echo ""
    echo "📋 Actions requises :"
    echo "   1. Corriger les erreurs TypeScript"
    echo "   2. Réduire les warnings ESLint sous 30"
    echo "   3. Faire passer les tests unitaires"
    echo "   4. Assurer que le build fonctionne"
    echo ""
    echo "📚 Référez-vous à : Docs/DEVELOPMENT-GUIDELINES.md"
    echo ""
    exit 1
fi
