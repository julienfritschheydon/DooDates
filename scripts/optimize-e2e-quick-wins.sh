#!/bin/bash

# Script d'optimisation E2E - Quick Wins
# Applique automatiquement les optimisations rapides et sûres
# Gain estimé: 40-50% plus rapide

set -e

echo "🚀 DooDates - Optimisation Tests E2E (Quick Wins)"
echo "=================================================="
echo ""

# Vérifier qu'on est à la racine du projet
if [ ! -f "package.json" ]; then
  echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
  exit 1
fi

echo "📋 Étape 1/5: Backup des fichiers originaux"
echo "-------------------------------------------"
mkdir -p .backup-e2e-optimization
cp playwright.config.ts .backup-e2e-optimization/playwright.config.ts.bak
cp .github/workflows/post-merge.yml .backup-e2e-optimization/post-merge.yml.bak
echo "✅ Backups créés dans .backup-e2e-optimization/"
echo ""

echo "⚙️  Étape 2/5: Optimisation playwright.config.ts"
echo "-------------------------------------------"
# Remplacer workers: 1 → 3
sed -i.tmp 's/workers: process\.env\.CI ? 1 :/workers: process.env.CI ? 3 :/' playwright.config.ts
rm -f playwright.config.ts.tmp
echo "✅ Workers CI: 1 → 3"
echo ""

echo "🌐 Étape 3/5: Remplacer networkidle par domcontentloaded"
echo "-------------------------------------------"
# Trouver tous les fichiers spec.ts
TEST_FILES=$(find tests/e2e -name "*.spec.ts" -not -path "*/node_modules/*" -not -path "*/OLD/*")
COUNT=0
for file in $TEST_FILES; do
  if grep -q "networkidle" "$file"; then
    sed -i.tmp 's/networkidle/domcontentloaded/g' "$file"
    rm -f "$file.tmp"
    COUNT=$((COUNT+1))
    echo "  ✓ $file"
  fi
done
echo "✅ $COUNT fichiers modifiés"
echo ""

echo "📸 Étape 4/5: Supprimer screenshots de debug"
echo "-------------------------------------------"
# Commenter les screenshots de debug (pas ceux dans les fixtures)
for file in $TEST_FILES; do
  if grep -q "\.screenshot.*test-results\|\.screenshot.*debug\|\.screenshot.*Docs/screenshots" "$file"; then
    # Commenter les lignes de screenshot de debug
    sed -i.tmp 's/^\(\s*\)\(await page\.screenshot({ path:.*test-results\|await page\.screenshot({ path:.*debug\|await page\.screenshot({ path:.*Docs\/screenshots\)/\1\/\/ \2/' "$file"
    rm -f "$file.tmp"
    echo "  ✓ $file"
  fi
done
echo "✅ Screenshots de debug commentés"
echo ""

echo "🔧 Étape 5/5: Optimisation workflow GitHub Actions"
echo "-------------------------------------------"
# Améliorer le cache Playwright
if grep -q "npx playwright install --with-deps chromium" .github/workflows/post-merge.yml; then
  # Ajouter installation conditionnelle
  sed -i.tmp '/npx playwright install --with-deps chromium/c\
      - name: 🧭 Install Playwright browsers\
        run: |\
          if [ ! -d ~/.cache/ms-playwright/chromium-* ]; then\
            echo "Installing Playwright with deps..."\
            npx playwright install --with-deps chromium\
          else\
            echo "Playwright already cached, skipping deps..."\
            npx playwright install chromium\
          fi' .github/workflows/post-merge.yml
  rm -f .github/workflows/post-merge.yml.tmp
  echo "✅ Installation conditionnelle de Playwright configurée"
fi
echo ""

echo "✨ Optimisations appliquées avec succès!"
echo "========================================"
echo ""
echo "📊 Résumé des changements:"
echo "  1. ✅ Workers CI: 1 → 3 (tests parallèles)"
echo "  2. ✅ networkidle → domcontentloaded ($COUNT fichiers)"
echo "  3. ✅ Screenshots de debug commentés"
echo "  4. ✅ Cache Playwright optimisé"
echo ""
echo "🧪 Prochaines étapes:"
echo "  1. Tester localement: npm run test:e2e:smoke"
echo "  2. Vérifier les tests: npm run test:e2e"
echo "  3. Si tout fonctionne: git add . && git commit -m 'perf: optimize E2E tests'"
echo "  4. Push et vérifier les temps CI sur GitHub Actions"
echo ""
echo "📁 Backups disponibles dans: .backup-e2e-optimization/"
echo ""
echo "⏱️  Gain estimé: 40-50% plus rapide"
echo ""
echo "💡 Pour plus d'optimisations, voir Docs/PERFORMANCE/README.md"

