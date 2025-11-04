# DooDates - Guide Complet des Tests

> **Document de référence unique** - Novembre 2025  
> **Dernière mise à jour** : 03 novembre 2025 (Phases 2 & 3 optimisations)

---

## 📊 Vue d'Ensemble

### ✅ Résultats Actuels

```
🎯 Tests Unitaires (Vitest)    : 571/577 passent (99%)
🤖 Tests IA (Gemini/Jest)      : 14/15 passent (93%)
🌐 Tests E2E (Playwright)      : 22/22 passent (100% sur Chrome)
   - Analytics IA              : 9/9 passent (mode enchaîné)
   - Console & React           : 3/3 passent (hooks, errors, leaks)
   - Form Poll Regression      : 4/4 passent (mode enchaîné)
   - Autres E2E                : 6/6 passent
📈 SCORE GLOBAL                : 98%
```

**Status** : ✅ **PRODUCTION-READY** - Analytics IA intégrés

**Dernière mise à jour** : 15/01/2025 - Tests Analytics IA et Form Poll Regression réactivés et intégrés en CI

**Note Firefox/Safari** : Les tests Analytics IA sont skippés sur Firefox/Safari en raison d'un bug Playwright avec le mode serial + shared context ([#13038](https://github.com/microsoft/playwright/issues/13038), [#22832](https://github.com/microsoft/playwright/issues/22832)). Les tests passent à 100% sur Chrome.

**Note CI/Sharding** : Les suites complètes en mode serial (Analytics IA - 9 tests, Form Poll Regression - 4 tests) sont exécutées dans des jobs CI dédiés sans sharding pour éviter les conflits avec la distribution aléatoire des tests. Les tests indépendants peuvent être exécutés avec sharding.

---

## 🚀 Quick Start

**Lancer tous les tests (2 minutes) :**
```bash
# Tests E2E Analytics IA + Console
npx playwright test analytics-ai.spec.ts console-errors.spec.ts --project=chromium
```

**Résultat attendu :**
- 12/12 tests passent
- Durée : ~2 minutes
- Rapport HTML généré automatiquement

**Tests manuels optionnels (17 minutes) :**
1. Créer FormPoll (2min)
2. Voter 5 fois (3min)
3. Clôturer + Analytics IA (5min)
4. Responsive mobile (5min)
5. Cache & Quota (2min)

**Temps total : 19 minutes** (vs 6-8h avant automatisation)

---

## 🏗️ Architecture des Tests

### 1. Tests Unitaires - Vitest

**Couverture** : 36 fichiers actifs
- Hooks : useAutoSave, useConversations, usePollDeletionCascade
- Services : IntentDetection, FormPollIntent, titleGeneration
- Lib : conditionalEvaluator (41 tests), exports (23 tests)
- Components : ConversationCard, PollActions
- Storage : statsStorage (36 tests), messageCounter

**Commandes** :
```bash
npm run test:unit              # Tous les tests
npm run test:unit:fast         # Mode rapide
npm run test:integration       # Tests d'intégration
```

**Configuration** : `vitest.config.ts`
- Environment: jsdom
- Coverage: v8 (html, json, text)
- Exclude: node_modules, tests (E2E séparés)

---

### 2. Tests IA Gemini - Jest

**Innovation** : Premier système de tests IA automatisés avec quality gates

**Tests actifs** :
- Détection intention (Form vs Date)
- Génération questions pertinentes
- Parsing markdown structuré
- Validation qualité réponses

**Commandes** :
```bash
npm run test:gemini            # Tests complets (30s)
npm run test:gemini:quick      # Tests rapides (15s)
```

**Quality Gate** : Score > 70% requis pour merge

---

### 3. Tests E2E - Playwright

**Specs actifs** : 12 fichiers (22 tests)

**Analytics IA (Réactivés - 15/01/2025) :**
- `analytics-ai.spec.ts` - 18 tests (9 en suite complète + 9 indépendants) ✅
  - Suite complète (mode serial) : Setup + Quick Queries + Query personnalisée + Cache + Quotas + Erreurs
  - Tests indépendants : Quick Queries, Query Personnalisée, Cache, Quotas, Dark Mode, Gestion Erreurs
  - **Status CI** : Intégrés (plus d'exclusion `--grep-invert "@analytics"`)
  - **Sélecteurs robustes** : Utilisation de `data-testid` et `toBeAttached()` pour éviter les timeouts
  - **Logs détaillés** : Screenshots et logs à chaque étape pour debug
- `console-errors.spec.ts` - 2 tests qualité code ✅
  - Erreurs console page d'accueil
  - Warnings React Hooks
  - ~~Memory leaks après rafraîchissements~~ (supprimé - redondant avec monitoring Sentry)

**Form Poll Regression (Réactivés - 15/01/2025) :**
- `form-poll-regression.spec.ts` - 4 tests mode enchaîné ✅
  - RÉGRESSION #1 : Créer Form Poll avec 1 question via IA (@smoke @critical @functional)
  - RÉGRESSION #2 : Ajouter une question via IA (@functional)
  - RÉGRESSION #3 : Supprimer une question (@functional)
  - RÉGRESSION #4 : Reprendre conversation après refresh (@functional)
  - **Status CI** : Intégrés (job dédié `e2e-form-poll-regression`)
  - **Mode serial** : Tests enchaînés avec variables partagées (`pollUrl`, `pollCreated`)
  - **Mock IA amélioré** : Détection intention pour ajout/suppression de questions
  - **Navigation robuste** : Utilisation de `toBeAttached()` et `networkidle` pour stabilité

**Autres :**
- `ultra-simple.spec.ts` - Workflow DatePoll complet ✅
- `security-isolation.spec.ts` - Tests sécurité ✅
- `mobile-voting.spec.ts` - Vote mobile ✅
- `navigation-regression.spec.ts` - Navigation ✅
- `poll-actions.spec.ts` - Actions polls ✅

**WIP (skippés) :**
- `guest-workflow.spec.ts` - Mode invité ⏸️
- `authenticated-workflow.spec.ts` - Mode authentifié ⏸️
- `edge-cases.spec.ts` - Cas limites ⏸️

**Navigateurs testés** : Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

**Tests WIP exclus de la CI** :
Les tests marqués `.skip()` sont automatiquement exclus via `--grep-invert` dans le workflow CI :
- `Edge Cases and Error Handling`
- `Guest User Workflow`
- `Authenticated User Workflow`

**Commandes** :
```bash
npm run test:e2e               # Tous navigateurs
npm run test:e2e:smoke         # Tests critiques (Chromium)
npm run test:e2e:functional    # Tests fonctionnels (Chromium)
npm run test:e2e:ui            # Interface graphique
npm run test:e2e:headed        # Mode visible

# Tests spécifiques Analytics IA
npx playwright test analytics-ai.spec.ts --project=chromium
npx playwright test console-errors.spec.ts --project=chromium
npx playwright test form-poll-regression.spec.ts --project=chromium
```

**Configuration** : `playwright.config.ts`
- Timeout: 30s par test
- Retries: 2 sur CI, 0 en local
- Reporters: html, list
- Base URL: http://localhost:8080

---

## 🛡️ Protection contre les Régressions

### Tags des Tests E2E

**@smoke @critical** (Tests rapides ~2min) :
- `ultra-simple.spec.ts` - Workflow DatePoll
- `form-poll-regression.spec.ts` Test #1 - Créer Form Poll
- `security-isolation.spec.ts` - 2 tests sécurité

**@functional** (Tests complets ~5min) :
- `form-poll-regression.spec.ts` Tests #2, #3, #4

### Protection Multi-Niveaux

**Niveau 1 : Git Hooks (Local)**
- Pre-push exécute tests E2E smoke sur push vers `main`
- Bloque automatiquement si tests échouent
- Fichier : `.husky/pre-push`
- Bypass urgence : `git push --no-verify`

**Niveau 2 : GitHub Actions (PR)**
- Workflow `pr-validation.yml` sur chaque PR
- 7 jobs : tests unitaires, IA, build, lint, E2E smoke/functional/matrix
- Commentaire automatique avec résumé
- Durée : ~15-20 minutes

**Niveau 3 : GitHub Actions (Post-Merge)**
- Workflow `post-merge.yml` après merge vers main
- Tests smoke rapides (~2min)
- Création d'issue automatique si échec

**Niveau 4 : GitHub Actions (Nightly)**
- Workflow `nightly-e2e.yml` tous les jours à 2h UTC
- Tests complets sur 5 navigateurs (~30min)
- Création d'issue automatique si échec

---

## 🔄 CI/CD - Workflows GitHub Actions

### Workflows Actifs

**1. `develop-to-main.yml`** - Auto-merge Develop → Main ⭐ NOUVEAU
- Trigger : Push sur develop
- Jobs parallèles : tests-unit (unitaires, intégration, UX), tests-e2e (smoke only), build-validation (type-check, lint, build)
- Optimisations : Cache agressif (node_modules + Playwright browsers)
- E2E sélectifs : Smoke uniquement sur develop (tests complets sur main)
- Auto-merge : Si tous les tests passent → merge automatique vers main
- Notification : Issue créée si échec
- Durée : ~5-8 minutes (vs 15-20min avant)

**2. `pr-validation.yml`** - Validation Pull Requests
- Trigger : Chaque PR vers main/develop
- Jobs : quick-tests, ai-validation, build-validation, code-quality, e2e-smoke, e2e-functional, e2e-matrix
- Durée : ~15-20 minutes

**3. `post-merge.yml`** - Validation Post-Merge ⭐ PARALLÉLISÉ + SHARDING
- Trigger : Push sur main
- Jobs parallèles : e2e-smoke (3 shards ~1min), e2e-functional (3 shards ~2min), notify-failure (si échec)
- Optimisations : Sharding Playwright (3 runners par job), cache partagé (node_modules + Playwright browsers)
- Déclenche : error-handling-enforcement, deploy-github-pages, production-deployment
- Durée : ~2 minutes (temps du shard le plus long - gain ~5-6min vs séquentiel)

**4. `production-deploy-fixed.yml`** - Déploiement Production
- Trigger : workflow_run après post-merge (success)
- Quality gates stricts : tous tests passent
- Déploiement seulement si 100% validé
- Durée : ~8 minutes

**5. `deploy-github-pages.yml`** - Déploiement Pages
- Trigger : workflow_run après post-merge (success)
- Déploie rapports Playwright
- Durée : ~3 minutes

**6. `error-handling-enforcement.yml`** - Validation Erreurs
- Trigger : workflow_run après post-merge (success)
- Jobs : Force utilisation ErrorFactory
- Durée : ~2 minutes

**7. `nightly-e2e.yml`** - Tests Nocturnes
- Trigger : Quotidien 2h UTC + manuel
- Jobs : Tests complets 5 navigateurs
- Durée : ~30 minutes

**8. `gemini-tests.yml`** - Tests IA Mensuels
- Trigger : 1er du mois + manuel
- Jobs : Tests IA complets
- Quality gate : Score > 70%

**9. `validate-yaml.yml`** - Validation Workflows YAML
- Trigger : PR/Push modifiant `.github/workflows/**`
- Vérifie syntaxe YAML et patterns problématiques
- Durée : < 1min

### Exécuter un Workflow Manuellement

1. Aller sur : `https://github.com/julienfritschheydon/DooDates/actions`
2. Sélectionner le workflow (ex: `Nightly E2E Tests`)
3. Cliquer sur "Run workflow"
4. Sélectionner la branche `main`
5. Cliquer sur "Run workflow"

### Consulter les Rapports Playwright

1. Aller sur un workflow run
2. Scroller vers "Artifacts"
3. Télécharger `playwright-report-*`
4. Extraire et ouvrir : `npx playwright show-report playwright-report`

---

## 🪝 Hooks Git Locaux

### Stratégie: Workflow Develop → CI → Main

**Objectif** : Commits rapides en développement, validation complète en CI, merge automatique vers main si succès.

**Architecture** :
- **Branche `develop`** : Hooks allégés (lint + format), push rapide, CI complète
- **Branche `main`** : Hooks complets (tests + build + E2E), protection maximale
- **Auto-merge** : Si CI develop ✅ → merge automatique vers main

### Pre-Commit Hook

**Comportement conditionnel selon la branche** :

#### Sur branche `develop` (rapide ~10-20s)
1. Scan secrets (ggshield)
2. Lint (ESLint)
3. Formatage automatique (Prettier)

#### Sur branche `main` (complet ~2min)
1. Scan secrets (ggshield)
2. Tests unitaires rapides
3. Vérification TypeScript
4. Tests UX Régression
5. Tests d'intégration
6. Error Handling Enforcement
7. Formatage automatique (Prettier)

**Bypass** :
```bash
# Mode rapide (toutes branches)
FAST_HOOKS=1 git commit -m "message"

# Skip formatage
NO_FORMAT=1 git commit -m "message"

# Bypass complet (déconseillé)
git commit --no-verify -m "message"
```

### Pre-Push Hook

**Comportement conditionnel selon la branche** :

#### Sur branche `develop` (instantané)
- Aucune validation (CI fera tout sur GitHub)
- Push immédiat

#### Sur branche `main` (complet ~3-5min)
1. Tests unitaires complets (604 tests)
2. Tests d'intégration
3. Build production
4. Tests E2E smoke (~2min)

**Bypass** :
```bash
git push --no-verify
```

### Workflow Quotidien Recommandé

```bash
# 1. Développement sur develop
git checkout develop

# 2. Commits rapides depuis Cursor (lint + format only)
# Utiliser l'outil Git de Cursor (Ctrl+Shift+G)
# Écrire message → Commit → ~10s
git add .
git commit -m "feat: nouvelle feature"  # ~10s

# 3. Push vers develop (instantané depuis Cursor)
git push  # CI complète s'exécute sur GitHub (~5-8min)

# 4. Continue à coder pendant que CI tourne
# Si CI ✅ → Auto-merge vers main → déploiement
# Si CI ❌ → Issue créée, corriger et re-push

# 5. Skip CI pour changements mineurs (docs, typos)
git commit -m "docs: fix typo [skip ci]"
```

### Optimisations CI

**Parallélisation (gain ~12min):**
- Workflow `develop-to-main.yml` : 3 jobs en parallèle (tests-unit, tests-e2e, build-validation) → Durée ~5-8min
- Workflow `post-merge.yml` : 2 jobs E2E en parallèle (smoke + functional) → Durée ~5min (gain ~2-3min)
- Durée totale = temps du job le plus long (au lieu de la somme séquentielle)

**Sharding Playwright (gain ~3-5min):** ⭐ NOUVEAU
- Tests E2E divisés en 3 shards (runners) parallèles
- Smoke : 3min → ~1min (divisé par 3)
- Functional : 5min → ~2min (divisé par 2-3)
- 6 runners simultanés (3 smoke + 3 functional)

**Cache agressif (gain ~3-5min):**
- `node_modules` mis en cache entre runs (clé: `package-lock.json`)
- Navigateurs Playwright mis en cache (clé: `package-lock.json`)
- ESLint cache (`.eslintcache`) → gain ~30s par run
- Réinstallation uniquement si dépendances changent
- Cache partagé entre jobs du même workflow

**Tests parallèles Vitest (gain ~1min):** ⭐ Phase 1
- 4 workers (threads) en parallèle
- Tests unitaires : 2min → ~1min
- Configuration : `vitest.config.ts` (maxWorkers: 4, pool: 'threads')

**Skip Docs Only (gain ~8min si docs uniquement):** ⭐ Phase 2
- Détection changements avec `dorny/paths-filter@v2`
- Skip complet des tests/build si seuls docs/md modifiés
- Docs-only commits : < 10s (vs ~8-10min avant)
- Workflow affiche notification "Docs only - Skip tests"

**Vite Build Cache (gain ~30s-1min):** ⭐ Phase 2
- Cache `dist/` et `node_modules/.vite/`
- Clé : Hash de `src/**`, `vite.config.ts`, `tsconfig.json`
- Réutilisation entre runs si code inchangé

**TypeScript Incremental (gain ~30s-1min):** ⭐ Phase 3
- Project References déjà configurées (`composite: true`)
- Cache `.tsbuildinfo` pour builds incrémentaux
- Clé : Hash de `src/**/*.ts*`, `tsconfig*.json`
- Réutilisation entre runs pour `tsc` et `type-check`

**Cache Multi-Niveaux (gain cumulatif):** ⭐ Phase 3
- 5 caches en parallèle : deps, eslint, tsbuildinfo, vite, playwright
- Restore-keys multi-niveaux pour fallback intelligent
- Invalidation automatique sur changement de dépendances/code

**E2E sélectifs (gain ~5min):**
- Develop : Smoke tests uniquement (~2min)
- Main : Smoke + Functional shardés (~2min vs ~8min séquentiel)
- Nightly : Tous tests + 5 navigateurs (~30min)

**Conditional E2E (gain ~2min si tests-only):** ⭐ Phase 4 - NOUVEAU
- Détection intelligente avec `dorny/paths-filter@v2`
- E2E **requis** si changements :
  - Code source (`src/**/*.tsx`, `src/**/*.ts` hors tests)
  - Config (`package.json`, `vite.config.ts`, `playwright.config.ts`)
  - Tests E2E (`tests/e2e/**`)
- E2E **skip** si uniquement :
  - Tests unitaires (`src/**/__tests__/**`, `src/**/*.test.ts`)
  - Config Vitest (`vitest.config.ts`)
- Safeguards : Patterns négatifs pour éviter faux négatifs
- Cas d'usage : Fix test unitaire → gain ~2min (pas besoin d'E2E)
- Workflow affiche notification "E2E Skipped - Tests unitaires uniquement"

**Parallélisation E2E + Sharding (détails) :**

Tests E2E shardés dans `post-merge.yml` :

```yaml
# Job 1 : e2e-smoke (3 shards en parallèle)
strategy:
  matrix:
    shard: [1, 2, 3]
steps:
  - run: npx playwright test --grep @smoke --shard=${{ matrix.shard }}/3
  - Tests critiques (@smoke) divisés en 3 parties
  - Durée : ~1min (vs 3min séquentiel)
  - Rapports : playwright-smoke-report-{1,2,3}

# Job 2 : e2e-functional (3 shards en parallèle)
strategy:
  matrix:
    shard: [1, 2, 3]
steps:
  - run: npx playwright test --grep @functional --grep-invert "@wip|@flaky" --shard=${{ matrix.shard }}/2
  - Tests complets divisés en 2 parties (sharding optimisé)
  - **Analytics IA inclus** : Tests réactivés et fonctionnels (fixes sélecteurs + setup)
  - **Form Poll Regression inclus** : Tests réactivés et fonctionnels (mock IA amélioré)
  - Note : Suites complètes en mode serial (Analytics IA, Form Poll Regression) exécutées hors sharding pour éviter conflits
  - Durée : ~2min (vs 5min séquentiel)
  - Rapports : playwright-functional-report-{1,2}

# Job 3 : notify-failure (si échec)
- Crée issue avec détails des 2 jobs
- Labels : critical, bug, main-branch, e2e-failure
```

**Avantages :**
- ✅ Gain de temps : **~5-6min** (2min vs 8min séquentiel)
- ✅ Scalabilité : Facile d'ajouter plus de shards (4, 5...)
- ✅ Isolation : Pas de collision de ports (Playwright gère automatiquement)
- ✅ Rapports séparés : Debugging plus facile par shard
- ✅ Fail-fast : Échec d'un shard n'empêche pas les autres

**Coût GitHub Actions :** 6 runners simultanés (gratuit pour projets publics)

**Impact total CI (Phases 1+2+3+4) :**
- Avant optimisations : ~8-10min
- Après Phase 1 (sharding) : ~2min
- Après Phase 2 (skip docs, vite cache) : ~1-2min (si code change)
- Après Phase 3 (TS incremental) : ~1min (builds répétés)
- Après Phase 4 (conditional E2E) : ~30s-1min (si tests-only)
- **Gain total : ~7-9min par run (80-90% plus rapide)**
- **Docs-only commits : < 10s (skip complet)**
- **Tests-only commits : ~30s-1min (skip E2E, ~2min gagnés)**

**Skip CI:**
```bash
# Pour docs, README, commentaires
git commit -m "docs: update README [skip ci]"
git commit -m "style: format code [skip ci]"

# NE PAS skip pour code fonctionnel
git commit -m "feat: nouvelle feature"  # ← CI obligatoire
```

---

## 📦 Scripts NPM Essentiels

### Tests
```bash
# Unitaires
npm run test:unit              # Tous les tests Vitest
npm run test:integration       # Tests d'intégration

# IA
npm run test:gemini            # Tests IA complets
npm run test:gemini:quick      # Tests IA rapides

# E2E
npm run test:e2e               # Tous navigateurs
npm run test:e2e:smoke         # Tests critiques (Chromium)
npm run test:e2e:functional    # Tests fonctionnels (Chromium)
npm run test:e2e:ui            # Interface graphique
```

### Validation Code
```bash
npm run type-check             # TypeScript
npm run lint                   # ESLint
npm run format                 # Prettier
npm run build                  # Build production
npm run validate:workflows     # Validation workflows YAML
```

### Suites Complètes
```bash
npm run test                   # Tous tests Vitest
npm run test:ci                # Suite CI complète
```

---

## 🔧 Configuration et Setup

### Installation

```bash
# 1. Installer dépendances
npm install

# 2. Installer navigateurs Playwright
npx playwright install --with-deps

# 3. Configurer Husky (hooks Git)
npm run prepare

# 4. Créer .env.local
cp .env.example .env.local
# Ajouter VITE_GEMINI_API_KEY
```

### Secrets GitHub Requis

```bash
VITE_GEMINI_API_KEY           # API Gemini (requis)
RESEND_API_KEY                # Email alertes (optionnel)
ALERT_EMAIL_TO                # Email destination (optionnel)
```

### Variables d'Environnement

```bash
# .env.local
VITE_GEMINI_API_KEY=your_key_here
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

---

## 🐛 Troubleshooting

### Workflows YAML Invalides

**Problème** : "Invalid workflow file" dans GitHub Actions

**Causes communes** :
- Emoji ❌ dans les strings `body` ou `title`
- Markdown bold `**` dans les multi-lignes
- Listes numérotées `1.` au lieu de puces `-`
- Backticks non fermés

**Solutions** :
```bash
# Valider localement avant de push
npm run validate:workflows

# Vérifier les patterns problématiques
bash scripts/validate-workflows.sh
```

**Règles à suivre** :
- ✅ Utiliser du texte simple dans les `body`
- ✅ Utiliser des puces `-` au lieu de `1.`
- ✅ Éviter les emojis dans les strings multi-lignes
- ✅ Tester avec `npm run validate:workflows`

### Tests Unitaires Lents

**Problème** : Tests > 5min

**Solutions** :
```bash
# Mode rapide
npm run test:unit:fast

# Parallélisation
npm run test:unit
```

### Tests E2E Instables

**Problème** : Timeouts, éléments non trouvés

**Solutions** :
```bash
# Mode headed (voir ce qui se passe)
npm run test:e2e:headed

# Mode debug
npm run test:e2e:debug

# Utiliser robustClick() dans les specs
import { robustClick, robustFill } from './utils';
await robustClick(page.locator('button'));
await robustFill(page.locator('input'), 'text');
```

### Tests Gemini Échouent

**Problème** : API errors, quotas

**Solutions** :
```bash
# Vérifier API key
echo $VITE_GEMINI_API_KEY

# Tester connexion
npm run test:gemini:quick

# Attendre si quota dépassé
sleep 60 && npm run test:gemini
```

### Hooks Git Bloquent Commits

**Problème** : Pre-commit trop lent

**Solutions** :
```bash
# Mode rapide (skip formatage)
NO_FORMAT=1 git commit -m "message"

# Bypass (déconseillé)
git commit --no-verify -m "message"
```

### Build Production Échoue

**Problème** : Erreurs TypeScript

**Solutions** :
```bash
# Vérifier erreurs
npm run type-check

# Build dev pour debug
npm run build:dev
```

---

## 📊 Métriques

### Temps d'Exécution

| Suite | Temps | Contexte |
|-------|-------|----------|
| Tests unitaires | 30s | Local |
| Tests IA | 15-30s | Local |
| Tests E2E smoke | 2min | Chromium |
| Tests E2E functional | 5min | Chromium |
| Tests E2E matrix | 15min | 5 navigateurs |
| Pre-commit hook | < 2min | Local |
| Pre-push hook | < 3min | Local (< 5min si main) |
| CI/CD complet | 15-20min | GitHub Actions |

### Quality Gates

```javascript
const QUALITY_THRESHOLDS = {
  unitTests: { pass: 95, warn: 90 },
  geminiTests: { pass: 70, warn: 60 },
  e2eTests: { pass: 90, warn: 80 },
  typeCheck: { errors: 0 },
  lint: { errors: 0, warnings: 10 },
  build: { success: true }
};
```

---

## ✅ Checklist Production

### Avant de Merger une PR

- [ ] Tous les tests unitaires passent
- [ ] Tests IA > 70%
- [ ] Tests E2E smoke passent
- [ ] Build production réussit
- [ ] Lint 0 erreur
- [ ] TypeScript 0 erreur
- [ ] Tous les workflows GitHub Actions verts

### Avant un Déploiement

- [ ] Tests E2E matrix passent (5 navigateurs)
- [ ] Tests nightly récents passent
- [ ] Aucune issue automatique ouverte
- [ ] Rapports Playwright consultés
- [ ] Changelog mis à jour

---

## 📝 Notes Importantes

### Branch Protection

**Note** : Branch Protection GitHub nécessite un compte Team/Enterprise (payant).  
On utilise une approche alternative gratuite mais efficace :
- Git Hooks locaux (bloquent les pushs vers main)
- GitHub Actions (vérifient chaque PR)
- Post-merge (détecte les régressions)
- Nightly (couverture complète)

### Tests Désactivés

**Tests unitaires** : 1 test échoue actuellement (non-bloquant)
- `useAiMessageQuota.test.ts` - Import manquant
- ~~`providers-integration.test.tsx`~~ - ✅ **SUPPRIMÉ** (30/10/2025) - Redondant avec E2E

**Tests E2E** : 4 tests skippés sur mobile
- `form-poll-regression.spec.ts` Tests #2, #3 - Textarea caché par z-index

**Note** : Les providers (`ConversationStateProvider`, `EditorStateProvider`) sont validés par les tests E2E Playwright qui couvrent les workflows complets utilisateur.

### Maintenance

**Hebdomadaire** :
- Consulter rapports nightly
- Vérifier issues automatiques
- Mettre à jour dépendances si nécessaire

**Mensuel** :
- Consulter rapports tests IA
- Analyser métriques performance
- Nettoyer artifacts anciens

---

**Document maintenu par** : Équipe DooDates  
**Dernière révision** : 30 octobre 2025
