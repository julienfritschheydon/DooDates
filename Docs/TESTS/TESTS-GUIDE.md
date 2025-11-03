# DooDates - Guide Complet des Tests

> **Document de référence unique** - Novembre 2025  
> **Dernière mise à jour** : 02 novembre 2025

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

**Dernière mise à jour** : 02/11/2025 - Ajout tests Analytics IA + Suppression tests redondants

**Note Firefox/Safari** : Les tests Analytics IA sont skippés sur Firefox/Safari en raison d'un bug Playwright avec le mode serial + shared context ([#13038](https://github.com/microsoft/playwright/issues/13038), [#22832](https://github.com/microsoft/playwright/issues/22832)). Les tests passent à 100% sur Chrome.

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

**Analytics IA (Nouveau - 02/11/2025) :**
- `analytics-ai.spec.ts` - 9 tests mode enchaîné ✅
  - Setup complet (création + votes + clôture + insights)
  - Quick queries (4 types)
  - Query personnalisée
  - Cache intelligent (vérification gain temps)
  - Quotas freemium (5/jour)
  - Gestion erreurs (poll vide, API, query longue)
- `console-errors.spec.ts` - 3 tests qualité code ✅
  - Erreurs console page d'accueil
  - Warnings React Hooks
  - Memory leaks après rafraîchissements

**Form Poll :**
- `form-poll-regression.spec.ts` - 4 tests mode enchaîné ✅

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
- Jobs : Validation complète (tests unitaires, intégration, UX, type-check, lint, build, E2E smoke, E2E functional)
- Auto-merge : Si tous les tests passent → merge automatique vers main
- Notification : Issue créée si échec
- Durée : ~15-20 minutes

**2. `pr-validation.yml`** - Validation Pull Requests
- Trigger : Chaque PR vers main/develop
- Jobs : quick-tests, ai-validation, build-validation, code-quality, e2e-smoke, e2e-functional, e2e-matrix
- Durée : ~15-20 minutes

**3. `post-merge.yml`** - Validation Post-Merge
- Trigger : Push sur main
- Jobs : Tests smoke + functional
- Déclenche : error-handling-enforcement, deploy-github-pages, production-deployment
- Durée : ~5 minutes

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

# 2. Commits rapides (lint + format only)
git add .
git commit -m "feat: nouvelle feature"  # ~10s

# 3. Push vers develop (instantané)
git push  # CI complète s'exécute sur GitHub

# 4. Si CI ✅ → Auto-merge vers main automatique
# 5. Si CI ❌ → Issue créée automatiquement, corriger et re-push

# 6. Main toujours stable, déploiement automatique
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
