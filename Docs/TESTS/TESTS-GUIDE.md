# DooDates - Guide des Tests

> **Document de référence unique** - Novembre 2025  
> **Dernière mise à jour** : 03 novembre 2025 (Phases 2 & 3 optimisations)

---

## 📊 Vue d'Ensemble

### Résultats Actuels

```
🎯 Tests Unitaires (Vitest)    : 737/743 passent (99%)
   - Dashboard                 : ~68 tests
🤖 Tests IA (Gemini/Jest)      : 14/15 passent (93%)
🌐 Tests E2E (Playwright)      : 42/42 passent (100% sur Chrome)
   - Dashboard                 : 22 tests
   - Analytics IA              : 9/9 passent
   - Form Poll Regression      : 4/4 passent
📈 SCORE GLOBAL                : 98%
```

**Status** : ✅ **PRODUCTION-READY**

**Note** : Tests Analytics IA skippés sur Firefox/Safari (bug Playwright). Passent à 100% sur Chrome.

---

## 🚀 Quick Start

### Tests Essentiels (2 minutes)

```bash
# Tests E2E critiques (Analytics IA + Console)
npx playwright test analytics-ai.spec.ts console-errors.spec.ts --project=chromium
```

**Résultat attendu** : 12/12 tests passent, ~2 minutes

### Tests Complets par Type

```bash
# Tests unitaires
npm run test:unit              # Tous les tests (~30s)

# Tests IA
npm run test:gemini            # Tests complets (~30s)

# Tests E2E
npm run test:e2e:smoke         # Tests critiques (~2min)
npm run test:e2e:functional    # Tests fonctionnels (~5min)
npm run test:e2e               # Tous navigateurs (~15min)
```

### Tests Spécifiques

```bash
# Dashboard
npx playwright test dashboard-complete.spec.ts tags-folders.spec.ts --project=chromium
npm run test:unit -- src/components/dashboard/__tests__

# Documentation
npm run test:docs              # Mode dev
npm run test:docs:production   # Mode production

# Form Poll Regression
npx playwright test form-poll-regression.spec.ts --project=chromium
```

---

## 📦 Scripts NPM

### Tests

```bash
# Unitaires
npm run test:unit              # Tous les tests Vitest
npm run test:unit:fast         # Mode rapide
npm run test:integration       # Tests d'intégration

# IA
npm run test:gemini            # Tests IA complets
npm run test:gemini:quick      # Tests IA rapides

# E2E
npm run test:e2e               # Tous navigateurs
npm run test:e2e:smoke         # Tests critiques (Chromium)
npm run test:e2e:functional    # Tests fonctionnels (Chromium)
npm run test:e2e:ui            # Interface graphique
npm run test:e2e:headed        # Mode visible

# Documentation
npm run test:docs              # Tests E2E documentation (mode dev)
npm run test:docs:production   # Test production avec base path
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

## 🏗️ Architecture des Tests

### 1. Tests Unitaires (Vitest)

**Couverture** : 45 fichiers actifs

**Principales zones couvertes** :
- **Hooks** : useAutoSave, useConversations, usePollDeletionCascade, useAnalyticsQuota
- **Services** : PollAnalyticsService, FormPollIntent, IntentDetection
- **Components** : DashboardFilters, ManageTagsFolderDialog, PollAnalyticsPanel, MultiStepFormVote
- **Lib** : conditionalEvaluator, exports, SimulationComparison
- **Storage** : statsStorage, messageCounter

**Configuration** : `vitest.config.ts`
- Environment: jsdom
- Coverage: v8 (html, json, text)
- Workers: 4 threads parallèles

### 2. Tests IA (Gemini/Jest)

**Tests actifs** :
- Détection intention (Form vs Date)
- Génération questions pertinentes
- Parsing markdown structuré
- Validation qualité réponses

**Quality Gate** : Score > 70% requis pour merge

### 3. Tests E2E (Playwright)

**Specs actifs** : 15 fichiers (~46 tests)

**Principales suites** :
- **Dashboard** : `dashboard-complete.spec.ts` (16 tests), `tags-folders.spec.ts` (6 tests)
- **Analytics IA** : `analytics-ai.spec.ts` (18 tests)
- **Form Poll Regression** : `form-poll-regression.spec.ts` (4 tests)
- **Documentation** : `docs.spec.ts` (4 tests)
- **Autres** : ultra-simple, security-isolation, mobile-voting, navigation-regression, poll-actions

**Navigateurs testés** : Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

**Configuration** : `playwright.config.ts`
- Timeout: 30s par test
- Retries: 2 sur CI, 0 en local
- Base URL: http://localhost:8080

**Tags** :
- `@smoke @critical` : Tests rapides (~2min)
- `@functional` : Tests complets (~5min)
- `@wip` : Tests en cours (skippés en CI)

---

## 🔄 CI/CD - Workflows GitHub Actions

### Workflows Principaux

**1. `develop-to-main.yml`** - Auto-merge Develop → Main
- Trigger : Push sur develop
- Jobs : tests-unit, tests-e2e (smoke), build-validation
- Auto-merge : Si tous les tests passent → merge automatique vers main
- Durée : ~5-8 minutes

**2. `pr-validation.yml`** - Validation Pull Requests
- Trigger : Chaque PR vers main/develop
- Jobs : tests-unit, ai-validation, build, lint, e2e-smoke/functional/matrix
- Durée : ~15-20 minutes

**3. `post-merge.yml`** - Validation Post-Merge
- Trigger : Push sur main
- Jobs : e2e-smoke (3 shards ~1min), e2e-functional (3 shards ~2min)
- Optimisations : Sharding Playwright, cache agressif
- Durée : ~2 minutes (gain ~5-6min vs séquentiel)

**4. `nightly-e2e.yml`** - Tests Nocturnes
- Trigger : Quotidien 2h UTC + manuel
- Tests complets sur 5 navigateurs
- Durée : ~30 minutes

### Exécuter un Workflow Manuellement

1. Aller sur : `https://github.com/julienfritschheydon/DooDates/actions`
2. Sélectionner le workflow
3. Cliquer sur "Run workflow"
4. Sélectionner la branche `main`
5. Cliquer sur "Run workflow"

### Consulter les Rapports Playwright

1. Aller sur un workflow run
2. Scroller vers "Artifacts"
3. Télécharger `playwright-report-*`
4. Extraire et ouvrir : `npx playwright show-report playwright-report`

### Branche "test" - Tests Rapides en Conditions CI

La branche `test` permet de tester rapidement des corrections en **conditions CI réelles** sans bloquer `develop` ou `main`.

#### 🎯 Objectif

Tester rapidement des corrections (fix de tests, améliorations, etc.) en conditions CI réelles sans impacter les branches principales.

#### 🚀 Utilisation

**1. Créer la branche depuis develop**

```bash
git checkout develop
git pull origin develop
git checkout -b test
git push origin test
```

**2. Faire vos modifications**

Apportez vos corrections (fix de tests, améliorations, etc.) et commit :

```bash
git add .
git commit -m "fix: description de vos corrections"
git push origin test
```

**3. Le workflow CI se déclenche automatiquement**

Le workflow `.github/workflows/0-test-branch-ci.yml` s'exécute automatiquement sur chaque push vers `test` et :

- ✅ Lance les tests E2E fonctionnels (même configuration que CI principale)
- ✅ Lance les tests E2E smoke (tests critiques)
- ✅ Utilise les mêmes shards, workers, retries que la CI principale
- ✅ Génère des rapports HTML et JSON dans les artefacts

**4. Vérifier les résultats**

1. Allez sur **Actions** dans GitHub
2. Sélectionnez le workflow **"🧪 Test Branch - CI Conditions"**
3. Consultez les rapports dans les artefacts téléchargeables

**5. Si les tests passent**

Une fois validés, mergez vos corrections vers `develop` :

```bash
git checkout develop
git merge test
git push origin develop
```

#### 📋 Configuration

Le workflow utilise **exactement la même configuration** que la CI principale :

- ✅ `playwright.config.optimized.ts`
- ✅ `--project=chromium`
- ✅ `--grep "@functional"` (exclut `@wip`, `@flaky`, etc.)
- ✅ `--shard=1/2` et `--shard=2/2` (2 shards)
- ✅ `CI=true` (mode CI)
- ✅ Workers: 3 (comme en CI)
- ✅ Retries: 2 (comme en CI)

#### ⚡ Avantages

- **Rapide** : Tests uniquement sur Chromium (plus rapide que multi-navigateurs)
- **Réaliste** : Conditions identiques à la CI principale
- **Non-bloquant** : N'impacte pas `develop` ou `main`
- **Itératif** : Peut push plusieurs fois rapidement pour tester des corrections

#### 🔄 Workflow Recommandé

1. Identifier un problème de test en CI
2. Créer une branche `test` depuis `develop`
3. Faire les corrections
4. Push et attendre les résultats CI
5. Si ça passe → merge vers `develop`
6. Si ça échoue → corriger et push à nouveau (itération rapide)

#### 📝 Notes

- La branche `test` peut être réutilisée (pas besoin de la recréer à chaque fois)
- Les artefacts sont conservés 3 jours (vs 7 jours pour develop/main)
- Le workflow peut aussi être déclenché manuellement depuis GitHub Actions UI

---

## 🪝 Git Hooks Locaux

### Stratégie: Workflow Develop → CI → Main

**Branche `develop`** : Hooks allégés (lint + format), push rapide, CI complète  
**Branche `main`** : Hooks complets (tests + build + E2E), protection maximale

### Pre-Commit Hook

**Sur `develop`** (rapide ~10-20s) :
- Scan secrets (ggshield)
- Lint (ESLint)
- Formatage automatique (Prettier)

**Sur `main`** (complet ~2min) :
- Scan secrets
- Tests unitaires rapides
- Vérification TypeScript
- Tests UX Régression
- Tests d'intégration
- Error Handling Enforcement
- Formatage automatique

**Bypass** :
```bash
FAST_HOOKS=1 git commit -m "message"      # Mode rapide
NO_FORMAT=1 git commit -m "message"       # Skip formatage
git commit --no-verify -m "message"        # Bypass complet (déconseillé)
```

### Pre-Push Hook

**Sur `develop`** : Aucune validation (CI fera tout sur GitHub)  
**Sur `main`** : Tests unitaires complets + Tests d'intégration + Build + E2E smoke

**Bypass** : `git push --no-verify`

### Workflow Quotidien Recommandé

```bash
# 1. Développement sur develop
git checkout develop

# 2. Commits rapides (lint + format only, ~10s)
git add .
git commit -m "feat: nouvelle feature"

# 3. Push vers develop (instantané)
git push  # CI complète s'exécute sur GitHub (~5-8min)

# 4. Si CI ✅ → Auto-merge vers main → déploiement
# 5. Skip CI pour changements mineurs (docs, typos)
git commit -m "docs: fix typo [skip ci]"
```

### Optimisations CI

- **Sharding Playwright** : Tests E2E divisés en 3 shards parallèles (gain ~5-6min)
- **Cache agressif** : node_modules, Playwright browsers, ESLint, TypeScript, Vite
- **Tests parallèles Vitest** : 4 workers en parallèle
- **Skip Docs Only** : Skip complet si seuls docs/md modifiés (< 10s)
- **Conditional E2E** : Skip E2E si uniquement tests unitaires modifiés (gain ~2min)
- **Gain total** : ~7-9min par run (80-90% plus rapide)

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

**Solutions** :
```bash
npm run validate:workflows
```

**Règles** :
- ✅ Utiliser du texte simple dans les `body`
- ✅ Utiliser des puces `-` au lieu de `1.`
- ✅ Éviter les emojis dans les strings multi-lignes

### Tests Unitaires Lents

**Solutions** :
```bash
npm run test:unit:fast         # Mode rapide
npm run test:unit              # Parallélisation
```

### Tests E2E Instables

**Solutions** :
```bash
npm run test:e2e:headed        # Mode visible
npm run test:e2e:debug         # Mode debug
```

### Tests Gemini Échouent

**Solutions** :
```bash
echo $VITE_GEMINI_API_KEY      # Vérifier API key
npm run test:gemini:quick      # Tester connexion
# Attendre si quota dépassé
```

### Documentation ne Charge Pas (404)

**Solutions** :
```bash
npm run test:docs              # Tester mode dev
npm run test:docs:production   # Tester mode production

# Vérifier que DocsViewer utilise BASE_URL
# src/components/docs/DocsViewer.tsx doit contenir:
# const baseUrl = import.meta.env.BASE_URL || '/';
```

### Hooks Git Bloquent Commits

**Solutions** :
```bash
NO_FORMAT=1 git commit -m "message"      # Skip formatage
git commit --no-verify -m "message"       # Bypass (déconseillé)
```

### Build Production Échoue

**Solutions** :
```bash
npm run type-check             # Vérifier erreurs TypeScript
npm run build:dev              # Build dev pour debug
```

---

## 📊 Métriques et Temps d'Exécution

| Suite | Temps | Contexte |
|-------|-------|----------|
| Tests unitaires | 30s | Local |
| Tests unitaires dashboard | ~10s | Local (68 tests) |
| Tests IA | 15-30s | Local |
| Tests E2E smoke | 2min | Chromium |
| Tests E2E dashboard | ~5-8min | Chromium (22 tests) |
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
- [ ] Documentation testée : `npm run test:docs` ✅
- [ ] Documentation production testée : `npm run test:docs:production` ✅

---

## 📚 Sections Spécialisées

### Dashboard - Tests Complets

**Tests E2E** : 22 tests (2 fichiers)
- `dashboard-complete.spec.ts` : 16 tests
- `tags-folders.spec.ts` : 6 tests

**Tests Unitaires** : ~68 tests (4 fichiers)
- `utils.test.ts` : 30 tests
- `DashboardFilters.test.tsx` : ~20 tests
- `ManageTagsFolderDialog.test.tsx` : 11 tests
- `DashboardTableView.test.tsx` : 7 tests

**Tests Manuels** : 97 tests (2 fichiers)
- `TESTS-MANUELS-DASHBOARD-COMPLET.md` : 71 tests
- `TESTS-MANUELS-TAGS-FOLDERS.md` : 26 tests

**Exécution** :
```bash
# Tests E2E
npx playwright test dashboard-complete.spec.ts tags-folders.spec.ts --project=chromium

# Tests Unitaires
npm run test:unit -- src/components/dashboard/__tests__
```

### Documentation - Tests

**Tests E2E** : 4 tests dans `docs.spec.ts`
- Documentation page loads without errors @smoke
- Documentation page loads a specific document @functional
- Documentation page handles 404 gracefully @functional
- Documentation assets load correctly @smoke

**Exécution** :
```bash
npm run test:docs              # Mode dev
npm run test:docs:production   # Mode production (base path /DooDates/)
```

**Note** : `DocsViewer` utilise `import.meta.env.BASE_URL` pour respecter le base path en production.

---

## 📈 Analyse de Couverture

### Résumé

```
🎯 Tests Unitaires (Vitest)    : 742/773 passent (96%)
   - Tests en échec             : 31 tests (4%)
   - Tests désactivés           : ~10 fichiers (.disabled, .skip)
🤖 Tests IA (Gemini/Jest)      : 14/15 passent (93%)
🌐 Tests E2E (Playwright)      : 42/42 passent (100% sur Chrome)
📈 SCORE GLOBAL                : 97%
```

### Zones Bien Couvertes

- ✅ Hooks critiques : useAutoSave, useConversations, useAnalyticsQuota
- ✅ Services critiques : PollAnalyticsService, sort-comparator
- ✅ Components Dashboard : DashboardFilters, ManageTagsFolderDialog, DashboardTableView
- ✅ Components Analytics : PollAnalyticsPanel

### Zones Non Couvertes / Priorités

**Priorité 1 (Critiques)** :
- 🔴 `IntentDetectionService` - 31 tests en échec
- 🔴 `GeminiChatInterface` - Aucun test unitaire (1510 lignes)

**Priorité 2 (Importantes)** :
- 🟠 Services : ConversationService, QuotaService, PollCreatorService
- 🟠 Hooks : useGeminiAPI, useIntentDetection, usePollManagement
- 🟠 Lib : error-handling.ts, temporal-parser.ts

**Priorité 3 (Souhaitables)** :
- 🟡 Composants UI Shadcn (56 fichiers)
- 🟡 Pages principales (12 fichiers)
- 🟡 Contexts (AuthContext, OnboardingContext)

### Objectifs

**Court Terme (1 mois)** :
- Tests unitaires : 95% de réussite
- Tests E2E : Maintenir 100% sur Chrome
- Tests IA : Maintenir > 90%

**Moyen Terme (3 mois)** :
- Couverture code : 70%
- Tests critiques : 100%

**Long Terme (6 mois)** :
- Couverture code : 80%+
- Tests de performance : Intégrés

---
dema
## 🎯 Prochaines Étapes

### Priorité 1 : Critiques (À faire immédiatement)

#### 1. Corriger IntentDetectionService (28 tests en échec) 🔴

**Problème** : `detectSimpleIntent` retourne `undefined` au lieu des intentions attendues

**Actions** :
```bash
# Vérifier l'implémentation actuelle
npm run test:unit -- src/services/__tests__/IntentDetectionService.test.ts
```

**Étapes** :
1. Vérifier que `IntentDetectionService.detectSimpleIntent()` existe
2. Comparer l'implémentation avec les tests attendus
3. Corriger les patterns regex ou la logique de détection
4. Vérifier les helpers (getTestDate, formatDate)

**Fichiers** : `src/services/IntentDetectionService.ts`, `src/services/__tests__/IntentDetectionService.test.ts`  
**Durée** : 2-4 heures

#### 2. Réactiver useAiMessageQuota.test.skip.ts 🟠

**Actions** :
1. Renommer `useAiMessageQuota.test.skip.ts` → `useAiMessageQuota.test.ts`
2. Vérifier les imports (`@/contexts/AuthContext`)
3. Corriger les mocks si nécessaire
4. Relancer les tests

**Durée** : 1-2 heures

#### 3. Corriger les 3 tests mineurs en échec 🟡

**Tests concernés** :
- `DashboardFilters.test.tsx` - 1 test (comportement debounce)
- `ManageTagsFolderDialog.test.tsx` - 1 test (sélection multiple)
- `utils.test.ts` (dashboard) - 1 test (filtrage par dossier)

**Durée** : 1-2 heures

### Priorité 2 : Importantes (À planifier)

#### 4. Ajouter tests pour GeminiChatInterface 🔴

**Problème** : Composant le plus complexe (1510 lignes) sans tests unitaires

**Approche** : Tests par responsabilité (11 responsabilités identifiées)
- Gestion des messages, état de conversation, détection d'intentions
- Création/modification de polls, gestion des quotas, erreurs
- Auto-save, navigation, affichage conditionnel, formulaires

**Stratégie** :
- Commencer par les fonctions utilitaires isolables
- Tester les hooks personnalisés séparément
- Mocker les dépendances externes (Gemini API, storage)

**Durée** : 8-12 heures (réparti sur plusieurs sessions)

#### 5-7. Ajouter tests pour services/hooks/lib critiques 🟠

**Services** : ConversationService, QuotaService, PollCreatorService, PollCreationBusinessLogic  
**Hooks** : useGeminiAPI, useIntentDetection, usePollManagement  
**Lib** : error-handling.ts, temporal-parser.ts, enhanced-gemini.ts

**Durée** : 2-6 heures par fichier

### Priorité 3 : Souhaitables (Nice to have)

#### 8-10. Tests pour composants UI, pages, contexts 🟡

**Composants UI** : Shadcn (56 fichiers), voting (18 fichiers), polls (25 fichiers)  
**Pages** : App.tsx, Index.tsx, Auth.tsx, Vote.tsx, Results.tsx  
**Contexts** : AuthContext, OnboardingContext

**Durée** : 1-3 heures par fichier

### 📋 Checklist de Progression

**Phase 1 : Corrections Critiques (1-2 semaines)**
- [ ] Corriger IntentDetectionService (28 tests)
- [ ] Réactiver useAiMessageQuota.test.skip.ts
- [ ] Corriger DashboardFilters (1 test)
- [ ] Corriger ManageTagsFolderDialog (1 test)
- [ ] Corriger utils.test.ts dashboard (1 test)

**Objectif** : 100% de réussite des tests existants

**Phase 2 : Couverture Critiques (2-4 semaines)**
- [ ] Ajouter tests GeminiChatInterface (par responsabilité)
- [ ] Ajouter tests services critiques
- [ ] Ajouter tests hooks critiques

**Objectif** : Couverture 100% des composants/services critiques

**Phase 3 : Couverture Complémentaire (1-2 mois)**
- [ ] Ajouter tests lib critiques
- [ ] Ajouter tests composants UI principaux
- [ ] Ajouter tests pages principales
- [ ] Ajouter tests contexts

**Objectif** : Couverture code 70%+

### 🚀 Commandes Utiles

```bash
# Vérifier l'état actuel
npm run test:unit

# Tests en échec uniquement
npm run test:unit 2>&1 | Select-String -Pattern "FAIL"

# Tests spécifiques
npm run test:unit -- src/services/__tests__/IntentDetectionService.test.ts

# Générer rapport de couverture
npm run test:unit -- --coverage
```

---

## 📝 Notes Importantes

### Tests Désactivés

**Fichiers `.disabled`** : Tests obsolètes après refonte architecture
- ConversationStorageSupabase.test.ts.disabled
- PollCreator.test.tsx.disabled
- ConversationSearch.test.tsx.disabled

**Fichiers `.skip`** : Tests temporairement désactivés
- useAiMessageQuota.test.skip.ts
- GeminiChatInterface.integration.test.tsx.skip

**Tests E2E skippés** : 4 tests sur mobile (form-poll-regression Tests #2, #3)

### Branch Protection

GitHub Branch Protection nécessite un compte Team/Enterprise (payant).  
Approche alternative gratuite :
- Git Hooks locaux (bloquent les pushs vers main)
- GitHub Actions (vérifient chaque PR)
- Post-merge (détecte les régressions)
- Nightly (couverture complète)

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
**Dernière révision** : Janvier 2025