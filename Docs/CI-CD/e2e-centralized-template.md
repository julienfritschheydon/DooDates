name: 🎯 E2E Tests Centralized

# Template pour centraliser les tests E2E - À copier/coller dans les workflows

# Ce fichier sert de documentation et de référence

# ========================================

# CONFIGURATIONS DISPONIBLES

# ========================================

# Smoke Suite (5 min) - Tests critiques de production

# npx playwright test --config=playwright.config.smoke.ts --project=chromium

# Critical Suite (15 min) - Tests essentiels (Chromium + Firefox)

# npx playwright test --config=playwright.config.critical.ts --project=chromium

# npx playwright test --config=playwright.config.critical.ts --project=firefox

# Full Suite (45 min) - Tous les tests multi-navigateurs

# npx playwright test --config=playwright.config.full.ts

# ========================================

# EXEMPLE D'UTILISATION DANS UN WORKFLOW

# ========================================

# name: Example E2E Tests

# on:

# pull_request:

# branches: [main]

# jobs:

# e2e-tests:

# runs-on: ubuntu-latest

# steps:

# - name: 📥 Checkout

# uses: actions/checkout@v4

# - name: 📦 Setup Node.js

# uses: actions/setup-node@v4

# with:

# node-version: '20'

# cache: 'npm'

# - name: 🔧 Install dependencies

# run: npm ci

# - name: 🎭 Cache Playwright

# uses: actions/cache@v4

# with:

# path: ~/.cache/ms-playwright

# key: ${{ runner.os }}-playwright-${{ hashFiles('package-lock.json') }}

# restore-keys: ${{ runner.os }}-playwright-

# - name: 🧭 Install Playwright

# run: npx playwright install chromium firefox --with-deps

# - name: 🏗️ Build

# run: npm run build

# - name: 🚀 Start server

# run: |

# npx http-server dist -p 4173 --cors &

# sleep 5

# - name: ⏳ Wait for server

# run: npx wait-on http://localhost:4173/ --timeout 60000

# - name: 🎯 Run Smoke Tests

# run: npx playwright test --config=playwright.config.smoke.ts --project=chromium

# env:

# CI: true

# BASE_URL: http://localhost:4173/

# VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}

# VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

# [DEPRECATED_KEY]: fake-key-for-e2e-tests

# - name: 📊 Upload results

# if: always()

# uses: actions/upload-artifact@v4

# with:

# name: playwright-report

# path: playwright-report/

# ========================================

# RÉFÉRENCE DES CONFIGURATIONS

# ========================================

# Smoke: playwright.config.smoke.ts

# - Tests: production-smoke.spec.ts + ultra-simple-\*.spec.ts

# - Navigateurs: Chromium uniquement

# - Durée: ~5 minutes

# Critical: playwright.config.critical.ts

# - Tests: Smoke + dashboard + navigation produits

# - Navigateurs: Chromium + Firefox

# - Durée: ~15 minutes

# Full: playwright.config.full.ts

# - Tests: Tous les tests .spec.ts

# - Navigateurs: Chromium + Firefox + Webkit + Mobile

# - Durée: ~45 minutes

# ========================================

# VARIABLES D'ENVIRONNEMENT

# ========================================

# CI: true

# BASE_URL: http://localhost:4173/ (ou URL de staging/production)

# VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}

# VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

# [DEPRECATED_KEY]: fake-key-for-e2e-tests

# ========================================

# MÉTRIQUES ACTUELLES

# ========================================

# Avant centralisation:

# - 6 workflows avec tests dupliqués

# - 45+ minutes par validation PR

# - 8 jobs parallèles maximum

# Après centralisation:

# - 3 configurations Playwright

# - 15 minutes par validation PR (-67%)

# - 2-3 jobs maximum (-63%)

# ========================================

# STATUS

# ========================================

# ✅ Configurations créées et testées

# ✅ Workflows mis à jour (PR, Staging, Nightly)

# ✅ Tests ultra-simple activés

# ✅ Documentation complète

# Prêt pour utilisation dans les workflows CI/CD
