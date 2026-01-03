# DooDates - Stratégie de Tests Automatisés Complète

## 🎯 Objectif : Tests 100% Automatisés

> Mise à jour 2025-08-26 — Référence actuelle
> **Vision :** Aucun code ne passe en production sans validation automatique complète.
> **Principe :** Fail Fast, Fix Fast - Détection immédiate des régressions.

- Workflows actifs (références exactes dans `.github/workflows/`):
  - `pr-validation.yml`
  - `gemini-tests.yml`
  - `nightly-e2e.yml`
  - `notify-nightly-failure.yml`
  - `production-deploy-fixed.yml`
- Scripts de tests disponibles (extraits de `package.json`):
  - Jest: `test`, `test:watch`, `test:gemini`, `test:gemini:quick`, `test:gemini:production`
  - Vitest: `test:unit`, `test:unit:fast`, `test:unit:watch`, `test:unit:coverage`, `test:integration`, `test:ux-regression`
  - Playwright: `test:e2e`, `test:e2e:ui`, `test:e2e:headed`
  - Utilitaires: `type-check`, `lint:fix`, `format`, `format:check`, `validate:e2e`

Les sections ci-dessous décrivant d'autres workflows/tests non listés ci-dessus sont à considérer comme « Planned » et pourront être activées ultérieurement.

---

## 🔄 Stratégie Multi-Niveaux

### 1. 💻 **Tests Locaux (Développement)**

#### Hook Pre-Commit (Obligatoire)

```bash
# .husky/pre-commit - S'exécute avant chaque commit
#!/bin/sh
echo "🔍 DooDates - Validation pre-commit..."

# Mode rapide optionnel pour accélérer les commits locaux
# Activez-le avec FAST_HOOKS=1 pour ignorer les vérifications lourdes
if [ "$FAST_HOOKS" = "1" ]; then
  echo "⚡ Mode rapide activé (FAST_HOOKS=1) - tests lourds ignorés"
  echo "🧪 Tests unitaires rapides..."
  npm run test:unit:fast
  if [ $? -ne 0 ]; then
    echo "❌ Tests unitaires échoués - Commit bloqué"
    exit 1
  fi

  echo "💅 Formatage du code..."
  npm run format

  echo "✅ Pre-commit (rapide) validé - Commit autorisé"
  exit 0
fi

# 1. Tests unitaires rapides (< 30s)
echo "🧪 Tests unitaires rapides..."
npm run test:unit:fast
if [ $? -ne 0 ]; then
  echo "❌ Tests unitaires échoués - Commit bloqué"
  exit 1
fi

# 2. Validation TypeScript
echo "🔍 Vérification TypeScript..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ Erreurs TypeScript - Commit bloqué"
  exit 1
fi

# 3. Tests UX Régression (critique)
echo "🎨 Tests UX Régression..."
npm run test:ux-regression
if [ $? -ne 0 ]; then
  echo "❌ Régression UX détectée - Commit bloqué"
  exit 1
fi

# 4. Tests d'intégration
echo "🔗 Tests d'intégration..."
npm run test:integration
if [ $? -ne 0 ]; then
  echo "❌ Tests d'intégration échoués - Commit bloqué"
  exit 1
fi

# 5. Formatage automatique
echo "💅 Formatage du code..."
npm run format

echo "✅ Pre-commit validé - Commit autorisé"
```

#### Hook Pre-Push (Validation complète)

```bash
# .husky/pre-push - S'exécute avant chaque push
#!/bin/sh
echo "🚀 DooDates - Validation pre-push..."

# Ressources accrues pour éviter OOM et fiabiliser Vitest
export NODE_OPTIONS="--max-old-space-size=4096"
export VITEST_MAX_THREADS=1
export VITEST_POOL=forks

# 1. Suite complète de tests unitaires
echo "🧪 Tests unitaires complets..."
npm run test:unit
if [ $? -ne 0 ]; then
  echo "❌ Tests unitaires complets échoués - Push bloqué"
  exit 1
fi

# 2. Tests d'intégration
echo "🔗 Tests d'intégration..."
npm run test:integration
if [ $? -ne 0 ]; then
  echo "❌ Tests d'intégration échoués - Push bloqué"
  exit 1
fi

# 3. Build de production
echo "🏗️ Build production..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build production échoué - Push bloqué"
  exit 1
fi

echo "✅ Pre-push validé - Push autorisé"
```

### 2. 🌐 **Tests GitHub (CI/CD)**

#### A. Pull Request (Validation Complète)

```yaml
# .github/workflows/pr-validation.yml
name: 🔍 PR Validation
on:
  pull_request:
    branches: [main, develop]

jobs:
  # Job 1: Tests Rapides (Parallèle)
  quick-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-type: [unit, integration, ux-regression]
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run ${{ matrix.test-type }} tests
        run: npm run test:${{ matrix.test-type }}

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-results-${{ matrix.test-type }}
          path: test-results/

  # Job 2: Tests IA (Critique)
  ai-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js 20
        uses: actions/setup-node@v4

      - name: Install dependencies
        run: npm ci

      - name: Run AI Tests (Quick)
        run: npm run test:gemini:quick
        env:
          VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}

      - name: Validate AI Performance
        run: |
          SCORE=$(node -e "
            const report = require('./tests/reports/quick-report.json');
            console.log(report.percentage);
          ")
          echo "Score IA: $SCORE%"
          if (( $(echo "$SCORE < 70" | bc -l) )); then
            echo "❌ Performance IA insuffisante: $SCORE%"
            exit 1
          fi
          echo "✅ Performance IA validée: $SCORE%"

  # Job 3: Build & Deploy Preview
  build-preview:
    needs: [quick-tests, ai-validation]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js 20
        uses: actions/setup-node@v4

      - name: Install dependencies
        run: npm ci

      - name: Build production
        run: npm run build

      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          scope: ${{ secrets.TEAM_ID }}

      - name: Comment PR with preview link
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview déployé: https://doodates-pr-${{ github.event.number }}.vercel.app'
            })
```

#### B. Push sur Main (Déploiement Production)

```yaml
# .github/workflows/production-deploy.yml
name: 🚀 Production Deploy
on:
  push:
    branches: [main]

jobs:
  # Job 1: Quality Gates (Bloquants)
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js 20
        uses: actions/setup-node@v4

      - name: Install dependencies
        run: npm ci

      # Gate 1: Tests complets
      - name: "Gate 1: Tests Unitaires"
        run: npm run test:unit

      - name: "Gate 1: Tests Intégration"
        run: npm run test:integration

      - name: "Gate 1: Tests UX Régression"
        run: npm run test:ux-regression

      # Gate 2: Performance IA
      - name: "Gate 2: Tests IA Complets"
        run: npm run test:gemini:production
        env:
          VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
        timeout-minutes: 30

      - name: "Gate 2: Validation Score IA"
        run: |
          SCORE=$(node -e "
            const report = require('./tests/reports/gemini-test-report.json');
            console.log(report.globalScore.percentage);
          ")
          echo "Score IA Production: $SCORE%"
          if (( $(echo "$SCORE < 95" | bc -l) )); then
            echo "❌ Score IA insuffisant pour production: $SCORE%"
            echo "Minimum requis: 95%"
            exit 1
          fi
          echo "✅ Score IA validé pour production: $SCORE%"

      # Gate 3: Build Production
      - name: "Gate 3: Build Production"
        run: npm run build

      - name: "Gate 3: Bundle Analysis"
        run: npm run analyze

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: production-build
          path: dist/

  # Job 2: Tests E2E (Post-build)
  e2e-tests:
    needs: quality-gates
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js 20
        uses: actions/setup-node@v4

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: production-build
          path: dist/

      - name: Start preview server
        run: npm run preview &

      - name: Wait for server
        run: npx wait-on http://localhost:4173

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload E2E results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-results
          path: test-results/

  # Job 3: Déploiement Production
  deploy-production:
    needs: [quality-gates, e2e-tests]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: production-build
          path: dist/

      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--prod"
          scope: ${{ secrets.TEAM_ID }}

      - name: Post-deploy smoke tests
        run: npm run test:smoke:production
        env:
          PRODUCTION_URL: https://doodates.app

      - name: Notify success
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.repos.createCommitStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              sha: context.sha,
              state: 'success',
              description: '🚀 Déploiement production réussi',
              context: 'deployment/production'
            })
```

#### C. Tests Programmés (Monitoring Continu)

```yaml
# .github/workflows/scheduled-monitoring.yml
name: 📊 Monitoring Continu
on:
  schedule:
    # Tests IA complets: Lundi 9h UTC
    - cron: "0 9 * * 1"
    # Tests performance: Mercredi 14h UTC
    - cron: "0 14 * * 3"
    # Tests E2E production: Vendredi 16h UTC
    - cron: "0 16 * * 5"
  workflow_dispatch:

jobs:
  ai-monitoring:
    if: github.event.schedule == '0 9 * * 1' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js 20
        uses: actions/setup-node@v4

      - name: Install dependencies
        run: npm ci

      - name: Run Full AI Test Suite
        run: npm run test:gemini:monitoring
        env:
          VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
        timeout-minutes: 60

      - name: Generate Weekly Report
        run: npm run test:report:weekly

      - name: Create Issue if Degradation
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            const report = require('./tests/reports/weekly-report.json');
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🚨 Dégradation IA détectée - ${new Date().toLocaleDateString('fr-FR')}`,
              body: `
              ## 📊 Rapport Hebdomadaire IA
              
              **Score actuel:** ${report.currentScore}%
              **Score précédent:** ${report.previousScore}%
              **Évolution:** ${report.evolution}
              
              ### Tests échoués:
              ${report.failedTests.map(test => `- ${test.name}: ${test.error}`).join('\n')}
              
              ### Actions recommandées:
              - [ ] Vérifier les changements récents
              - [ ] Analyser les logs Gemini
              - [ ] Relancer les tests manuellement
              
              /cc @${context.actor}
              `,
              labels: ['bug', 'ai-performance', 'priority-high']
            })

  performance-monitoring:
    if: github.event.schedule == '0 14 * * 3' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js 20
        uses: actions/setup-node@v4

      - name: Install dependencies
        run: npm ci

      - name: Run Lighthouse CI
        run: npm run test:lighthouse

      - name: Bundle size analysis
        run: npm run analyze:bundle

      - name: Performance regression check
        run: npm run test:performance:regression

  e2e-production-monitoring:
    if: github.event.schedule == '0 16 * * 5' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js 20
        uses: actions/setup-node@v4

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E against production
        run: npm run test:e2e:production
        env:
          BASE_URL: https://doodates.app

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: e2e-production-results
          path: test-results/
```

---

## 🛠️ Scripts NPM Complets

```json
{
  "scripts": {
    // ✅ Tests Locaux
    "test:unit": "vitest run",
    "test:unit:fast": "vitest run --reporter=basic --run",
    "test:unit:watch": "vitest",
    "test:unit:coverage": "vitest run --coverage",

    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:ux-regression": "vitest run src/lib/__tests__/ux-regression.test.ts",

    // ✅ Tests IA
    "test:gemini": "jest --testPathPattern=gemini --testTimeout=30000",
    "test:gemini:quick": "jest --testPathPattern=gemini --testNamePattern='Quick' --testTimeout=15000",
    "test:gemini:production": "jest --testPathPattern=gemini --testTimeout=60000",
    "test:gemini:monitoring": "jest --testPathPattern=gemini --testTimeout=120000 --verbose",

    // ✅ Tests E2E
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:production": "playwright test --config=playwright.production.config.ts",
    "test:e2e:debug": "playwright test --debug",

    // ✅ Tests Performance
    "test:lighthouse": "lighthouse-ci",
    "test:performance": "npm run test:lighthouse && npm run analyze:bundle",
    "test:performance:regression": "node scripts/performance-regression.js",

    // ✅ Tests Smoke
    "test:smoke": "node scripts/smoke-tests.js",
    "test:smoke:production": "BASE_URL=https://doodates.app node scripts/smoke-tests.js",

    // ✅ Suites Complètes
    "test:all": "npm run test:unit && npm run test:integration && npm run test:ux-regression",
    "test:ci": "npm run test:all && npm run test:gemini:quick",
    "test:full": "npm run test:all && npm run test:gemini && npm run test:e2e",

    // ✅ Reporting
    "test:report": "node scripts/generate-test-report.js",
    "test:report:weekly": "node scripts/generate-weekly-report.js",

    // ✅ Utilitaires
    "type-check": "tsc --noEmit",
    "lint:fix": "eslint --fix src/",
    "format": "prettier --write src/",
    "analyze": "npm run analyze:bundle && npm run analyze:deps",
    "analyze:bundle": "webpack-bundle-analyzer dist/stats.json",
    "analyze:deps": "depcheck"
  }
}
```

---

## 📊 Métriques et Alertes

### Seuils de Qualité (Quality Gates)

```javascript
// scripts/quality-gates.js
const QUALITY_THRESHOLDS = {
  // Tests obligatoires
  unitTests: { min: 95, target: 100 },
  integrationTests: { min: 90, target: 100 },
  uxRegression: { min: 100, target: 100 }, // Zéro régression tolérée

  // IA Performance
  aiPerformance: {
    development: { min: 70, target: 85 },
    production: { min: 95, target: 98 },
  },

  // Performance Web
  lighthouse: {
    performance: { min: 90, target: 95 },
    accessibility: { min: 95, target: 100 },
    seo: { min: 90, target: 95 },
  },

  // Code Quality
  coverage: { min: 80, target: 90 },
  bundleSize: { max: "500KB", target: "300KB" },
};
```

### Dashboard de Monitoring

```yaml
# .github/workflows/dashboard-update.yml
name: 📈 Dashboard Update
on:
  workflow_run:
    workflows: ["🚀 Production Deploy", "📊 Monitoring Continu"]
    types: [completed]

jobs:
  update-dashboard:
    runs-on: ubuntu-latest
    steps:
      - name: Update README badges
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = require('./tests/reports/latest-report.json');

            const badges = [
              `![Tests](https://img.shields.io/badge/Tests-${report.testsPass}%2F${report.testsTotal}-${report.testsPass === report.testsTotal ? 'green' : 'red'})`,
              `![IA Performance](https://img.shields.io/badge/IA-${report.aiScore}%25-${report.aiScore >= 95 ? 'green' : 'orange'})`,
              `![Coverage](https://img.shields.io/badge/Coverage-${report.coverage}%25-${report.coverage >= 80 ? 'green' : 'red'})`,
              `![Build](https://img.shields.io/badge/Build-${report.buildStatus}-${report.buildStatus === 'passing' ? 'green' : 'red'})`
            ];

            // Mise à jour du README avec les badges
            let readme = fs.readFileSync('README.md', 'utf8');
            readme = readme.replace(/<!-- BADGES_START -->[\s\S]*<!-- BADGES_END -->/, 
              `<!-- BADGES_START -->\n${badges.join('\n')}\n<!-- BADGES_END -->`);
            fs.writeFileSync('README.md', readme);
```

---

## 🚀 Prochaines Actions Immédiates

### 1. Configuration des Hooks Git

```bash
# Installation husky pour les hooks
npm install -D husky
npx husky install
npx husky add .husky/pre-commit "npm run test:unit:fast && npm run test:ux-regression"
npx husky add .husky/pre-push "npm run test:ci"
```

### 2. Configuration Playwright E2E

```bash
# Installation Playwright
npm install -D @playwright/test
npx playwright install
```

### 3. Tests E2E Critiques à Créer

```typescript
// tests/e2e/critical-flows.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Flows Critiques DooDates", () => {
  test("Flow complet: Création → Partage → Vote → Résultats", async ({ page }) => {
    // 1. Création de sondage
    await page.goto("/");
    await page.click('[data-testid="create-poll"]');

    // 2. Configuration dates
    await page.click('[data-date="2025-07-01"]');
    await page.click('[data-date="2025-07-02"]');

    // 3. Configuration horaires
    await page.click('[data-timeslot="09:00"]');
    await page.click('[data-timeslot="14:00"]');

    // 4. Informations sondage
    await page.fill('[data-testid="poll-title"]', "Test E2E Automatique");
    await page.fill('[data-testid="poll-emails"]', "test@example.com");

    // 5. Création
    await page.click('[data-testid="create-poll-button"]');

    // 6. Vérification redirection
    await expect(page).toHaveURL(/\/poll\/test-e2e-automatique/);

    // 7. Test vote
    await page.click('[data-testid="vote-slot-2025-07-01-09:00"]');
    await page.click('[data-testid="submit-vote"]');

    // 8. Vérification résultats
    await expect(page.locator('[data-testid="vote-count"]')).toContainText("1");
  });

  test("IA Gemini: Génération automatique de sondage", async ({ page }) => {
    await page.goto("/");
    await page.click('[data-testid="ai-assistant"]');
    await page.fill('[data-testid="ai-prompt"]', "Organise une réunion équipe lundi matin");
    await page.click('[data-testid="ai-generate"]');

    // Vérification génération IA
    await expect(page.locator('[data-testid="generated-title"]')).not.toBeEmpty();
    await expect(page.locator('[data-testid="generated-dates"]')).not.toBeEmpty();
  });
});
```

---

## 📊 Que Tester Maintenant ?

### 🎯 **Priorité 1 : Tests E2E (Flows Critiques)**

```typescript
// tests/e2e/critical-flows.spec.ts
test("Flow complet: Création → Partage → Vote → Résultats", async ({ page }) => {
  // Test du parcours utilisateur complet
});

test("IA Gemini: Génération automatique de sondage", async ({ page }) => {
  // Test de l'intégration IA en conditions réelles
});
```

### 🎯 **Priorité 2 : Tests Performance**

```bash
# Tests Lighthouse automatisés
npm run test:lighthouse

# Analyse bundle size
npm run analyze:bundle

# Tests de charge
npm run test:load
```

### 🎯 **Priorité 3 : Tests d'Accessibilité**

```typescript
// tests/a11y/accessibility.spec.ts
test('Navigation au clavier', async ({ page }) => {
  // Test navigation Tab/Shift+Tab
});

test('Lecteurs d'écran', async ({ page }) => {
  // Test aria-labels et structure sémantique
});
```

---

## 🚀 Automatisation GitHub/Local

### ✅ **Commits Locaux**

- **Pre-commit :** Tests unitaires + UX régression (< 30s)
- **Pre-push :** Suite complète (< 2min)
- **Feedback immédiat** : Échec = commit/push bloqué

### ✅ **Pull Requests GitHub**

- **Tests parallèles** : Unit, Integration, UX, IA
- **Deploy preview** : Environnement de test automatique
- **Quality gates** : PR bloquée si tests échouent

### ✅ **Production (main branch)**

- **Quality gates stricts** : IA > 95%, tous tests passent
- **Tests E2E** : Validation complète post-build
- **Déploiement automatique** : Seulement si 100% validé

### ✅ **Monitoring Continu**

- **Tests IA hebdomadaires** : Lundi 9h UTC
- **Tests performance** : Mercredi 14h UTC
- **Tests E2E production** : Vendredi 16h UTC
- **Alertes automatiques** : Issues créées si dégradation

---

## 🎯 **Prochaines Actions Immédiates**

1. **Setup Playwright E2E** (30min)
2. **Configuration hooks Git** (15min)
3. **Création workflows GitHub** (1h)
4. **Tests flows critiques** (2h)

**Résultat :** Tests 100% automatisés, zéro régression possible ! 🚀
