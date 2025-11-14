# DooDates - Guide des Tests

> **Document de référence unique** - Novembre 2025  
> **Dernière mise à jour** : 14 novembre 2025 (réactivation tests skipés - 6 tests réactivés - 863/863 tests passent - 100%)


## 📊 Vue d'Ensemble

### Résultats Actuels

```
🎯 Tests Unitaires (Vitest)    : 863/863 passent (100%)
   - Dashboard                 : ~68 tests
   - BetaKeyService            : 25/25 passent (100%) ✅ NOUVEAU
   - useAutoSave               : 13/13 passent (100%) ✅ RÉACTIVÉ
   - titleGeneration.useAutoSave: 9/9 passent (100%) ✅ RÉACTIVÉ
   - useAutoSave.titleGeneration: 1/1 passe (100%) ✅ RÉACTIVÉ
   - useAiMessageQuota         : 22/22 passent (100%) ✅ CORRIGÉ
   - useAnalyticsQuota         : 21/21 passent (100%) ✅ RÉACTIVÉ
   - MultiStepFormVote         : 17/17 passent (100%) ✅ RÉACTIVÉ (14/11/2025)
   - usePollConversationLink   : 12/12 passent (100%) ✅ RÉACTIVÉ (14/11/2025)
   - FormPoll Results Access   : 14/14 passent (100%) 
🤖 Tests IA (Gemini/Jest)      : 23/25 passent (92%)
   - Date Polls                : 15/15 passent (100%)
   - Form Polls                : 8/10 passent (80%)
🌐 Tests E2E (Playwright)      : 81/81 passent (100% sur Chrome)
   - Dashboard                 : 22 tests
   - Analytics IA              : 9/9 passent
   - Analytics IA Optimized    : 3/3 passent ✅ RÉACTIVÉ (~52s, gain 70%)
   - Form Poll Regression      : 4/4 passent
   - FormPoll Results Access   : 5/5 passent
   - Beta Key Activation       : 9/9 passent ✅ NOUVEAU
   - Authenticated Workflow    : 6/6 passent ✅ RÉACTIVÉ
   - Poll Actions              : 1/1 passe ✅ NOUVEAU
   - Security Isolation        : 2/2 passent ✅ NOUVEAU
   - Mobile Voting             : 2/2 passent ✅ NOUVEAU
   - Guest Workflow            : 7/7 passent ✅ RÉACTIVÉ
   - Supabase Integration       : 11/11 passent ✅ NOUVEAU - Automatisation tests manuels
   - Availability Poll Workflow : 6/6 passent ✅ NOUVEAU - MVP v1.0 Agenda Intelligent
📈 SCORE GLOBAL                : 98%
```

**Status** : ✅ **PRODUCTION-READY**

**Note** : Tests Analytics IA skippés sur Firefox/Safari (bug Playwright). Passent à 100% sur Chrome.

## 🎯 Critères d'importance des tests (11 novembre 2025)

| Niveau | Rôle dans la qualité | Déclenchement recommandé | Couverture attendue | Politique de mocks | Actions si échec |
|--------|----------------------|--------------------------|---------------------|--------------------|------------------|
| **Primordial** | Empêche un incident production (perte de données, IA indisponible, export cassé, build inutilisable) | Chaque PR + nightly + post-déploiement | Chemin critique complet, environnement proche production | ⚠️ Proscrire les mocks de dépendances métier (Supabase, stockage, Gemini) sauf si sandbox officielle | Bloquer merge/déploiement, correction immédiate |
| **Important** | Sécurise une fonctionnalité clé mais non bloquante (UX avancée, analytics secondaires) | PR contenant du code impacté + nightly ciblée | Cas nominaux + régressions connues | Mocks autorisés si dépendances instables, prévoir au moins un test d’intégration sans mock par feature | Corriger avant fin de sprint, suivi dans backlog |
| **Support** | Prévention de régressions mineures ou documentation | À la demande (pre-commit, avant release) | Comportements spécifiques, edge cases | Mocks libres, priorité à la vitesse d’exécution | Ne bloque pas, planifier la correction |

**Heuristiques d’évaluation :**
- **Impact utilisateur :** perte de données, indisponibilité IA, blocage de création = Primordial.
- **Couche testée :** plus on se rapproche du runtime réel (prod build, Supabase, navigateur), plus la priorité augmente.
- **Délai de détection acceptable :** ce qui doit échouer en < 5 min post-déploiement est primordial.
- **Tolérance aux mocks :** un test primordial doit valider la pile réelle au moins une fois (smoke, intégration), les tests unitaires restent complémentaires.
- **Single point of failure :** si aucune autre suite ne couvrirait la régression, sur-classer en primordial.

Ces critères servent de référence pour classer les suites dans le reste du guide et prioriser les réparations.

## 🗺️ Tests Critiques

### Tests Primordiaux (Sans Mocks)
- `tests/e2e/production-smoke.spec.ts` - Smoke tests production (bloque déploiement cassé)
- `tests/integration/real-supabase-simplified.test.ts` - Intégration Supabase réelle

### Tests Primordiaux (Avec Mocks)
- `tests/e2e/ultra-simple.spec.ts` - Parcours DatePoll complet
- `tests/e2e/dashboard-complete.spec.ts` + `tags-folders.spec.ts` - Back-office
- `tests/e2e/form-poll-regression.spec.ts` + `form-poll-results-access.spec.ts` - FormPoll
- `tests/e2e/analytics-ai-optimized.spec.ts` - Analytics IA (3 tests, ~52s)
- `tests/e2e/availability-poll-workflow.spec.ts` - Agenda Intelligent (6 tests)
- Autres workflows : beta-key-activation, authenticated-workflow, security-isolation, mobile-voting, guest-workflow

**Note** : 2 tests skipés avec tag `@flaky` dans analytics-ai-optimized (problème CI avec mocks Playwright)

### ✅ Tests d'intégration useAutoSave
- ✅ **23/23 tests passent** (100%)
- Fichiers : useAutoSave.test.ts (13/13), titleGeneration.useAutoSave.test.ts (9/9), useAutoSave.titleGeneration.test.ts (1/1)

### ⚠️ Tests E2E skippés

**Résumé** : ~36 tests E2E skipés au total, tous documentés et justifiés
- **Flaky** : 3 tests (analytics-ai-optimized, analytics-ai) - problème CI avec mocks Playwright
- **Conditionnels** : 15 tests (WebKit, mobile, production)
- **Défensifs** : 15 tests (skip si conditions non remplies)
- **Intentionnels** : 3 tests (intégration réelle, pages non prêtes)
- **Redondants** : 5 describe.skip (version optimisée utilisée)

Les tests actifs (81 tests) sont tous robustes.

### ✅ Tests useAiMessageQuota
- ✅ **22/22 tests passent** (100%)
- **Correction** : Tests vérifient maintenant le comportement principal (état du hook) plutôt que les détails d'implémentation (localStorage)

### ✅ Tests Unitaires Skipés - Réactivés
- ✅ **6 tests réactivés** (14/11/2025)
- MultiStepFormVote : 5 tests (17/17 passent) - Correction 52 erreurs linting
- usePollConversationLink : 1 test (12/12 passent) - Correction mock window.location

### ✅ Tests guestQuotaService
- ✅ **17/17 tests passent** (100%)
- Correction : Problèmes de mocks Supabase résolus (localStorage cleanup)

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

# Authentification & Clés Bêta
npm run test:unit -- BetaKeyService
npx playwright test authenticated-workflow.spec.ts beta-key-activation.spec.ts --project=chromium

# Documentation
npm run test:docs              # Mode dev
npm run test:docs:production   # Mode production

# Form Poll Regression
npx playwright test form-poll-regression.spec.ts --project=chromium

# Agenda Intelligent (Sondage Inversé)
npx playwright test availability-poll-workflow.spec.ts --project=chromium

# 🔥 Protection Production (CRITIQUE)
npm run test:production          # Windows - Test build de production localement
npm run test:production:bash     # Linux/Mac - Test build de production localement
```

---

## 🔥 Tests de Protection Production

**Date de mise en œuvre:** 7 novembre 2025  
**Statut:** ✅ ACTIF - Protection contre déploiements cassés

### 📊 Contexte

Suite à un incident où l'application était en ligne mais ne fonctionnait plus, une stratégie de tests en 3 phases a été mise en place pour empêcher que cela ne se reproduise.

**Problème identifié:** Les tests unitaires étaient sur-mockés (179 `vi.mock()` dans la codebase), masquant les problèmes réels d'intégration qui ne se révélaient qu'en production.

### ✅ Solution Phase 1 (Implémentée)

#### 1. Tests de Smoke Production

**Fichier:** `tests/e2e/production-smoke.spec.ts`  
**Tests:** 10 tests critiques sans mocks  
**Durée:** ~2-3 minutes

**Tests critiques:**
- ✅ Page d'accueil charge correctement
- ✅ Assets (JS/CSS) chargent sans erreur
- ✅ Pas d'erreurs console critiques
- ✅ Navigation principale fonctionne
- ✅ Configuration Supabase est valide
- ✅ Routing SPA fonctionne (404 fallback)
- ✅ UI principale est rendue
- ✅ Service Worker est disponible
- ✅ Mode invité accessible
- ✅ Assets statiques accessibles

#### 2. Workflow PR Validation (Blocage AVANT Merge)

Les tests de production s'exécutent **dans le workflow de PR validation** AVANT que le code ne soit mergé :

```
PR créée
    ↓
Build production local
    ↓
Tests de smoke sur le build
    ↓
    ├─ ✅ Succès → Autres tests → Merge possible
    └─ ❌ Échec → BLOQUE le merge + rapport d'erreur
```

**Workflow:** `.github/workflows/1-pr-validation.yml`  
**Job:** `production-smoke` (prioritaire, bloque tous les autres jobs)

#### 3. Workflow Post-Déploiement (Filet de Sécurité)

En plus du blocage pré-merge, un second niveau de vérification teste la VRAIE production après déploiement :

```
Déploiement GitHub Pages
    ↓
Attente propagation CDN (30s)
    ↓
Tests sur URL de production réelle
    ↓
    ├─ ✅ Succès → Application OK
    └─ ❌ Échec → Issue GitHub critique créée automatiquement
```

**Workflow:** `.github/workflows/5-production-smoke-tests.yml`  
**Déclenchement:** Automatique après chaque déploiement

**En cas d'échec:**
- 🚨 Issue GitHub créée avec labels `critical`, `production`, `incident`
- 👤 Auteur du commit assigné automatiquement
- 📸 Screenshots et rapports sauvegardés (30 jours)
- 📊 Lien vers les logs et instructions de rollback

#### 4. Tests Locaux (AVANT de Pousher)

**⚠️ IMPORTANT:** Toujours tester localement AVANT de pousher vers main

```bash
# Windows PowerShell
npm run test:production

# Linux/Mac
npm run test:production:bash
```

**Ce que fait le script:**
1. Vérifie les variables d'environnement (.env.local)
2. Build de production (`npm run build`)
3. Lance serveur preview local (port 4173)
4. Exécute les tests de smoke
5. Nettoie automatiquement
6. Affiche un résumé coloré

**⚠️ NE PAS POUSSER SI LES TESTS ÉCHOUENT!**

### 🚨 Que Se Passe-t-il en Cas d'Échec?

#### En PR (Avant Merge)
- ❌ Le merge est **bloqué automatiquement**
- 📊 Rapport d'erreur dans les checks GitHub
- 📸 Screenshots disponibles dans les artefacts
- 🔧 Correction requise avant de pouvoir merger

#### En Production (Après Déploiement)
- 🚨 **Issue GitHub critique créée automatiquement**
- 👤 **Vous êtes assigné** (l'auteur du commit)
- 📸 **Screenshots** des erreurs sauvegardés
- 📊 **Rapports détaillés** dans les artefacts (30 jours)

**Issue créée contient:**
- Titre: "🚨 PRODUCTION CASSÉE - Tests de Smoke Échoués"
- Détails des tests qui ont échoué
- Lien vers les logs et screenshots
- Instructions de rollback ou hotfix

**Actions à prendre:**

```bash
# Option 1: Rollback (rapide)
git revert <commit-qui-a-cassé>
git push origin main

# Option 2: Hotfix (si vous pouvez corriger vite)
git checkout -b hotfix/production-fix
# Corriger le problème
npm run test:production  # Vérifier localement
git push  # Créer une PR
```

### 📋 Workflow Développeur Recommandé

**Avant CHAQUE commit vers main:**

```bash
# 1. Tests unitaires
npm run test:unit

# 2. Tests E2E locaux
npm run test:e2e:smoke

# 3. 🔥 NOUVEAU: Test du build de production
npm run test:production

# 4. Si tout passe, commit et push
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
```

**Après le push (création de PR):**

1. ⏳ Vérifier que le job `production-smoke` passe (GitHub Actions)
2. ✅ Si vert → Les autres tests s'exécutent
3. ❌ Si rouge → Corriger immédiatement (le merge est bloqué)

**Après le merge et déploiement:**

1. ⏳ Attendre 3-5 minutes
2. 🔍 Vérifier que le workflow `5️⃣ Production Smoke Tests` passe
3. ✅ Si vert → Tout va bien
4. ❌ Si rouge → Issue créée automatiquement, agir immédiatement

### 📊 Comparaison Avant/Après

| Aspect | ❌ Avant | ✅ Après Phase 1 |
|--------|----------|------------------|
| **Tests de prod** | Aucun | Smoke tests auto |
| **Détection de panne** | Utilisateurs (heures/jours) | < 3 min après deploy |
| **Blocage merge** | ❌ Non | ✅ Oui (si build cassé) |
| **Mocks** | 100% mocké | Tests prod sans mocks |
| **Alertes** | Manuelles | Issue auto + assign |
| **Rollback** | Manuel lent | Procédure définie |
| **Confiance déploiement** | 🔴 Faible | 🟡 Moyenne |

### ⏱️ Temps Ajouté

- **Tests locaux:** ~2-3 minutes (avant de pusher)
- **Tests PR:** ~2-3 minutes (avant merge)
- **Tests production:** ~2-3 minutes (après déploiement)
- **Total:** ~6-9 minutes par déploiement

**Bénéfice:** Plus JAMAIS d'application cassée en production découverte par les utilisateurs!

### 🔗 Fichiers Créés

- `tests/e2e/production-smoke.spec.ts` - Tests de smoke
- `.github/workflows/5-production-smoke-tests.yml` - Workflow post-déploiement
- `scripts/test-production-build.ps1` - Script Windows
- `scripts/test-production-build.sh` - Script Linux/Mac
- `Docs/PROTECTION-PRODUCTION.md` - Documentation complète
- `PHASE1-COMPLETE.md` - Résumé phase 1

### 📅 Phases Suivantes

**Phase 2: Tests d'Intégration Sans Mocks (Semaine prochaine)**
- Environnement Supabase de staging
- Tests d'intégration réels (authentification, base de données)
- Réduction de 80% des mocks dans les tests critiques
- Bloquer le merge si échec

**Phase 3: Monitoring & Tests de Charge (Post-beta)**
- Monitoring continu 24/7 (Sentry, UptimeRobot)
- Tests de charge (k6)
- Alertes temps réel
- SLA garantis (99.5% uptime)

### ❓ FAQ

**Q: Dois-je vraiment tester AVANT chaque push vers main?**  
**R:** Oui! C'est votre filet de sécurité. 2-3 minutes maintenant évitent des heures de debugging plus tard.

**Q: Et si je suis pressé?**  
**R:** Les tests s'exécuteront quand même automatiquement en PR et bloqueront le merge si problème. Mais vous risquez de devoir corriger en urgence.

**Q: Les tests peuvent-ils avoir des faux positifs?**  
**R:** Les tests ont 2 retries automatiques pour éviter ça. Si vraiment c'est un faux positif, consultez les logs.

**Q: Combien de temps sont gardés les artefacts?**  
**R:** 30 jours pour les tests de production (vs. 7 jours pour les autres tests), car ils sont critiques.

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
- **Hooks** : useAutoSave (13/13 tests) ✅ RÉACTIVÉ, useConversations, usePollDeletionCascade, useAnalyticsQuota (21/21 tests) ✅ RÉACTIVÉ, useAiMessageQuota (22/22 tests) ✅ CORRIGÉ, usePollConversationLink (12/12 tests) ✅ RÉACTIVÉ
- **Components** : MultiStepFormVote (17/17 tests) ✅ RÉACTIVÉ, DashboardFilters, ManageTagsFolderDialog, PollAnalyticsPanel
- **Intégration useAutoSave** : titleGeneration.useAutoSave (9/9 tests) ✅ RÉACTIVÉ, useAutoSave.titleGeneration (1/1 test) ✅ RÉACTIVÉ
- **Services** : BetaKeyService (25/25 tests) ✅ NOUVEAU, PollAnalyticsService, FormPollIntent, IntentDetection, EmailService
- **Components** : DashboardFilters, ManageTagsFolderDialog, PollAnalyticsPanel, MultiStepFormVote
- **Lib** : conditionalEvaluator, exports, SimulationComparison, pollStorage (resultsVisibility)
- **Storage** : statsStorage, messageCounter

**Configuration** : `vitest.config.ts`
- Environment: jsdom
- Coverage: v8 (html, json, text)
- Workers: 4 threads parallèles

### 2. Tests IA (Gemini/Jest)

**Tests actifs** : 25 tests (Date Polls + Form Polls)
- **Date Polls** : 15 tests (Réunions, Événements, Formations) - 100% réussite
- **Form Polls** : 10 tests (Simples, Rating, NPS, Matrix, Validation, Mix Types, Event, Feedback, Complex) - 80% réussite

**Catégories testées** :
- Détection intention (Form vs Date)
- Génération questions pertinentes
- Parsing markdown structuré
- Validation qualité réponses
- Types de questions avancés (rating, nps, matrix)
- Validations (email, phone, url)
- Questions conditionnelles

**Score actuel** : 91.83/100 (92%) - ✅ **EXCELLENT**

**Quality Gate** : Score > 70% requis pour merge

**Rapports** : Générés automatiquement dans `tests/reports/gemini-test-report.md`

### 3. Tests E2E (Playwright)

**Specs actifs** : 20 fichiers (~81 tests)

**Principales suites** :
- **Dashboard** : `dashboard-complete.spec.ts` (16 tests), `tags-folders.spec.ts` (6 tests)
- **Analytics IA** : `analytics-ai.spec.ts` (18 tests), `analytics-ai-optimized.spec.ts` (3 tests) ✅ RÉACTIVÉ
- **Authentification** : `authenticated-workflow.spec.ts` (6 tests) ✅ RÉACTIVÉ
- **Beta Keys** : `beta-key-activation.spec.ts` (9 tests) ✅ NOUVEAU
- **Supabase Integration** : `supabase-integration-manual.spec.ts` (11 tests) ✅ NOUVEAU - Automatisation tests manuels
- **Form Poll Regression** : `form-poll-regression.spec.ts` (4 tests)
- **Form Poll Results Access** : `form-poll-results-access.spec.ts` (5 tests)
- **Poll Actions** : `poll-actions.spec.ts` (1 test) ✅ NOUVEAU
- **Security Isolation** : `security-isolation.spec.ts` (2 tests) ✅ NOUVEAU
- **Mobile Voting** : `mobile-voting.spec.ts` (2 tests) ✅ NOUVEAU
- **Guest Workflow** : `guest-workflow.spec.ts` (7 tests) ✅ RÉACTIVÉ
- **Agenda Intelligent** : `availability-poll-workflow.spec.ts` (6 tests) ✅ NOUVEAU - MVP v1.0
- **Documentation** : `docs.spec.ts` (4 tests)
- **Autres** : ultra-simple, navigation-regression

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

Le workflow `.github/workflows/0-test-branch-ci.yml` s'exécute automatiquement sur chaque push vers `test` ou `test-dashboard` et :

- ✅ Lance les tests E2E dashboard (tests corrigés)
- ✅ Focus sur tests fonctionnels dashboard (Sélectionner, Assigner tags/dossiers)
- ✅ Utilise `playwright.config.optimized.ts`
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

Le workflow utilise une configuration optimisée pour les tests dashboard :

- ✅ `playwright.config.optimized.ts`
- ✅ `--project=chromium`
- ✅ `--grep "@functional - (Sélectionner|Assigner)"` (tests dashboard spécifiques)
- ✅ Tests : `dashboard-complete.spec.ts` et `tags-folders.spec.ts`
- ✅ `CI=true` (mode CI)
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
| Tests IA | 30-60s | Local (25 tests : Date + Form Polls) |
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

## 📈 Couverture

### Zones Bien Couvertes ✅
- Hooks critiques : useAutoSave, useConversations, useAnalyticsQuota, useAiMessageQuota
- Services : BetaKeyService, PollAnalyticsService, EmailService
- Components Dashboard : DashboardFilters, ManageTagsFolderDialog

### Zones Non Couvertes 🔴
- **GeminiChatInterface** - 0 tests (1510 lignes) - Voir Priorité 2
- Services critiques : ConversationService, QuotaService, PollCreatorService
- Hooks critiques : useGeminiAPI, useIntentDetection, usePollManagement
- Lib critiques : error-handling.ts, temporal-parser.ts, enhanced-gemini.ts

### Objectifs
- **Court terme** : Priorité 2 à 50%, couverture 60%
- **Moyen terme** : Priorité 2 à 100%, Priorité 3 à 30%, couverture 70%

---

## 🎯 Plan d'Action - Priorités

### 🔴 Priorité 2 : Importantes - EN COURS

#### 1. GeminiChatInterface (1510 lignes, 0 tests) 🔴

**Fichier** : `src/components/GeminiChatInterface.tsx`

**Hooks utilisés** (à tester séparément) :
- `useConversationMessages()`, `useConversationActions()` - Gestion messages/conversations
- `useEditorState()`, `useEditorActions()` - État éditeur poll
- `useQuota()`, `useIntentDetection()`, `usePollManagement()` - Quotas/intentions/polls
- `useMessageSender()`, `useAutoSave()`, `useGeminiAPI()` - Envoi/auto-save/API
- `useVoiceRecognition()`, `useConnectionStatus()` - Voice/connexion

**Fonctions principales à tester** :
1. `handleSendMessage()` - Envoi message utilisateur
2. `handleUsePollSuggestion()` - Utilisation suggestion poll
3. `submitMessage()` (via ref) - Soumission programmatique
4. Gestion erreurs (quota, API)
5. Navigation entre conversations
6. Création/modification polls
7. Auto-save
8. Voice recognition

**Stratégie** :
1. Tester les hooks séparément (déjà en cours pour certains)
2. Tester les fonctions utilitaires isolables
3. Tests d'intégration avec mocks complets

**Fichier de test** : `src/components/__tests__/GeminiChatInterface.test.tsx`  
**Durée estimée** : 8-12 heures

#### 2. Services Critiques 🟠

- **ConversationService** (`src/services/ConversationService.ts`) - CRUD conversations, tags/folders, recherche
  - Tests : `src/services/__tests__/ConversationService.test.ts` (3-4h)

- **QuotaService** (`src/services/QuotaService.ts`) - Vérification/incrémentation/reset quotas
  - Tests : `src/services/__tests__/QuotaService.test.ts` (2-3h)

- **PollCreatorService** (`src/services/PollCreatorService.ts`) - Création/validation/transformation polls
  - Tests : `src/services/__tests__/PollCreatorService.test.ts` (3-4h)

- **PollCreationBusinessLogic** (`src/services/PollCreationBusinessLogic.ts`) - Logique métier création polls
  - Tests : `src/services/__tests__/PollCreationBusinessLogic.test.ts` (2-3h)

#### 3. Hooks Critiques 🟠

- **useGeminiAPI** (`src/hooks/useGeminiAPI.ts`) - Tests API Gemini (2-3h)
- **useIntentDetection** (`src/hooks/useIntentDetection.ts`) - Tests détection intentions (2-3h)
- **usePollManagement** (`src/hooks/usePollManagement.ts`) - Tests gestion polls (2-3h)

#### 4. Lib Critiques 🟠

- **error-handling.ts** - `handleError()`, `ErrorFactory`, `logError()` (2h)
- **temporal-parser.ts** - Parsing dates/heures, validation (2-3h)
- **enhanced-gemini.ts** - Wrapper Gemini API, retry logic (3-4h)

### 🟡 Priorité 3 : Souhaitables

- **Composants UI** : Shadcn (56 fichiers), voting (18 fichiers), polls (25 fichiers) - Tests de base/interactions
- **Pages** : App.tsx, Index.tsx, Auth.tsx, Vote.tsx, Results.tsx - Tests routing/landing/auth/vote/résultats
- **Contexts** : AuthContext, OnboardingContext - Tests état auth/onboarding

**Durée estimée** : 1-3 heures par fichier

### 📊 Progression

**Priorité 2** :
- [ ] GeminiChatInterface - Structure de tests
- [ ] ConversationService - Tests CRUD
- [ ] QuotaService - Tests quotas
- [ ] PollCreatorService - Tests création
- [ ] PollCreationBusinessLogic - Tests logique métier
- [ ] useGeminiAPI - Tests API
- [ ] useIntentDetection - Tests détection
- [ ] usePollManagement - Tests gestion polls
- [ ] error-handling.ts - Tests erreurs
- [ ] temporal-parser.ts - Tests parsing
- [ ] enhanced-gemini.ts - Tests wrapper

**Priorité 3** :
- [ ] Composants UI principaux
- [ ] Pages principales
- [ ] Contexts

### 🎯 Objectifs

**Court terme (1 mois)** :
- Priorité 2 : 50% complété
- Couverture code : 60%

**Moyen terme (3 mois)** :
- Priorité 2 : 100% complété
- Priorité 3 : 30% complété
- Couverture code : 70%

---

## 📝 Notes Importantes

### Tests Désactivés

**Fichiers `.disabled`** : Tests obsolètes après refonte architecture
- ConversationStorageSupabase.test.ts.disabled
- PollCreator.test.tsx.disabled
- ConversationSearch.test.tsx.disabled

**Fichiers `.skip`** : Tests temporairement désactivés
- GeminiChatInterface.integration.test.tsx.skip

**Tests réactivés** :
- ✅ useAiMessageQuota.test.ts (22/22 passent, 100%) ✅ CORRIGÉ COMPLÈTEMENT (14/11/2025)
- ✅ MultiStepFormVote.test.tsx (17/17 passent, 100%) ✅ RÉACTIVÉ (14/11/2025)
- ✅ usePollConversationLink.test.ts (12/12 passent, 100%) ✅ RÉACTIVÉ (14/11/2025)

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
**Dernière révision** : Décembre 2025 (Ajout tests E2E Agenda Intelligent MVP v1.0 - 6 tests)

---

## 📝 Notes Importantes

### Tests Désactivés
- **Fichiers `.disabled`** : Tests obsolètes après refonte (ConversationStorageSupabase, PollCreator, ConversationSearch)
- **Fichiers `.skip`** : GeminiChatInterface.integration.test.tsx.skip

### Tests Réactivés
- ✅ useAiMessageQuota (22/22), MultiStepFormVote (17/17), usePollConversationLink (12/12)

### Tests Spécifiques
- **Agenda Intelligent** : 6/6 tests E2E (`availability-poll-workflow.spec.ts`) - MVP v1.0
- **FormPoll Results Access** : 14/14 tests unitaires + 5/5 tests E2E
- **Authentification & Clés Bêta** : BetaKeyService (25/25), authenticated-workflow (6 tests), beta-key-activation (9 tests)
- **Supabase Integration** : 11 tests E2E automatisés (anciennement manuels)

### Corrections E2E
- ✅ **Sharding** : Tests rendus indépendants avec fonctions helper (3 fichiers corrigés)
- ✅ **Persistance mocks** : `setupAllMocks()` ajouté avant chaque `page.goto()` dans helpers

---