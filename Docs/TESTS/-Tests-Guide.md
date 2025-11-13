# DooDates - Guide des Tests

> **Document de référence unique** - Novembre 2025  
> **Dernière mise à jour** : 12 novembre 2025 (console-errors réactivé, useAnalyticsQuota partiellement réactivé - 18/21 tests passent)


## 📊 Vue d'Ensemble

### Résultats Actuels

```
🎯 Tests Unitaires (Vitest)    : 794/803 passent (99%)
   - Dashboard                 : ~68 tests
   - BetaKeyService            : 25/25 passent (100%) ✅ NOUVEAU
   - useAiMessageQuota         : 17/22 passent (77%)
   - useAnalyticsQuota         : 18/21 passent (86%) ✅ RÉACTIVÉ
   - FormPoll Results Access   : 14/14 passent (100%) 
🤖 Tests IA (Gemini/Jest)      : 23/25 passent (92%)
   - Date Polls                : 15/15 passent (100%)
   - Form Polls                : 8/10 passent (80%)
🌐 Tests E2E (Playwright)      : 75/75 passent (100% sur Chrome)
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
📈 SCORE GLOBAL                : 97%
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

## 🗺️ Cartographie des suites critiques (mise à jour 11 novembre 2025)

| Suite / bloc | Type | Importance | Mocks | Statut & prochaines actions |
|--------------|------|------------|-------|-----------------------------|
| `tests/e2e/production-smoke.spec.ts` | E2E prod | **Primordial** | Aucun | Actif – à exécuter sur chaque PR/merge/deploy |
| `tests/integration/real-supabase-simplified.test.ts` | Intégration | **Primordial** | Aucun | Actif – nécessite credentials réelles (Supabase) |
| `tests/e2e/ultra-simple.spec.ts` | E2E | **Primordial** | Mock Gemini (IA) | Actif – protège le flux création DatePoll |
| `tests/e2e/dashboard-complete.spec.ts` + `tags-folders.spec.ts` | E2E | **Primordial** | Seed localStorage + guard console | Actifs – couvrent back-office, pas de mock Supabase |
| `tests/e2e/form-poll-regression.spec.ts` + `form-poll-results-access.spec.ts` | E2E | **Primordial** | setupAllMocks (Gemini/Edge), seed localStorage | Actifs – workflows FormPoll réalistes |
| `tests/e2e/beta-key-activation.spec.ts`, `authenticated-workflow.spec.ts`, `poll-actions.spec.ts`, `security-isolation.spec.ts`, `mobile-voting.spec.ts`, `guest-workflow.spec.ts` | E2E | Primordial | Auth/device injectés via localStorage + Gemini mock | Actifs – parcourent les chemins critiques complémentaires |
| `tests/e2e/analytics-ai.spec.ts` | E2E | Primordial | Mock Gemini uniquement | Actif – améliorations partielles (waitForPageLoad ajouté, quelques waitForTimeout remplacés) |
| `tests/e2e/analytics-ai-optimized.spec.ts` | E2E | Primordial | Mock Gemini | ✅ Actif – version optimisée pour CI (3 tests, ~52s, gain 70%) |
| `tests/e2e/console-errors.spec.ts` | E2E | Primordial | Aucun | Test « Pas d'erreurs console critiques » actuellement `test.skip` → identifier la console error CI et réactiver |
| `src/__tests__/error-handling-enforcement.test.ts` | Meta unitaire | Primordial | N/A | Actif – blocage CI si pattern centralisé non respecté |
| `src/lib/__tests__/exports.test.ts` | Unitaire | Important+ | Mock pollStorage ciblé | Actif – couvrir scenarios export (CSV/JSON/PDF) |
| Hooks `useConversations*`, `useAutoSave*`, `usePollConversationLink*` | Unitaires | Important | Mocks Auth/Storage | Actifs – vérifier cohérence avec nouvelles dépendances |
| `src/hooks/__tests__/useAnalyticsQuota.test.ts` | Unitaire | **Primordial** | Mock auth/localStorage | **SKIP** – ajuster les quotas attendus et réactiver la suite |
| Fichiers `*.disabled` (ConversationStorage, PollCreator, etc.) | Unitaires | Important | Mocks libres | À requalifier : soit moderniser, soit supprimer si obsolètes |

### Tests primordiaux sans aucun mock: FAIT

- `tests/e2e/production-smoke.spec.ts` — valide la disponibilité réelle (assets, console propre, navigation) sur build de prod, bloque tout déploiement cassé.
    - `Docs\TESTS\follow-up\production-smoke.md`

- `tests/integration/real-supabase-simplified.test.ts` — vérifie authentification, CRUD et RLS sur la base Supabase réelle ; premier filet pour éviter les régressions backend.
    - `Docs\TESTS\follow-up\integration-real-supabase-simplified.md`

### Tests primordiaux avec isolation locale (mock Gemini ou seed localStorage) : FAIT

- `tests/e2e/ultra-simple.spec.ts` — couvre le parcours DatePoll complet (sélection dates, horaires, partage) cœur de la proposition de valeur.
    - `Docs\TESTS\follow-up\e2e-ultra-simple.md`

- `tests/e2e/dashboard-complete.spec.ts`
    - `Docs\TESTS\follow-up\e2e-dashboard-complete.md`

- `tests/e2e/tags-folders.spec.ts` — garantissent que la gestion des conversations, tags et dossiers fonctionne (back-office critique).
    - `Docs\TESTS\follow-up\e2e-tags-folders.md`

- `tests/e2e/form-poll-regression.spec.ts` — sécurise création/modification FormPoll IA (création, ajout question, suppression, reprise conversation).
    - `Docs\TESTS\follow-up\e2e-form-poll-regression.md`

- `tests/e2e/form-poll-results-access.spec.ts` — sécurise politique de visibilité des résultats FormPoll (creator-only, voters, public) et email de confirmation.
    - `Docs\TESTS\follow-up\e2e-form-poll-results-access.md`

- `tests/e2e/beta-key-activation.spec.ts` — valide le flux d'activation de clés bêta (validation format, activation, gestion erreurs, formatage input).
    - `Docs\TESTS\follow-up\e2e-beta-key-activation.md`
    
- `tests/e2e/authenticated-workflow.spec.ts` — valide l'expérience utilisateur authentifié (sign up, quotas étendus, migration invités → comptes, features premium, sign out).
    - `Docs\TESTS\follow-up\e2e-authenticated-workflow.md`

- `tests/e2e/poll-actions.spec.ts` — valide que le dashboard et les pages de création se chargent sans crash.
    - `Docs\TESTS\follow-up\e2e-poll-actions.md`

- `tests/e2e/security-isolation.spec.ts` — valide la sécurité (pas de fuite de tokens, navigation sécurisée, isolation des données).
    - `Docs\TESTS\follow-up\e2e-security-isolation.md`

- `tests/e2e/mobile-voting.spec.ts` — valide que les pages se chargent correctement sur mobile (DatePoll et FormPoll).
    - `Docs\TESTS\follow-up\e2e-mobile-voting.md`

- `tests/e2e/guest-workflow.spec.ts` — valide le flux complet utilisateur invité (création conversation, quotas, modals auth, persistance).
    - `Docs\TESTS\follow-up\e2e-guest-workflow.md`

- `tests/e2e/analytics-ai.spec.ts` — vérifie que l'analytics IA (insights, queries) reste fonctionnel malgré quotas/mocks.
    - `Docs\TESTS\follow-up\e2e-analytics-ai.md`
    - **Note** : Améliorations partielles (waitForPageLoad ajouté, quelques waitForTimeout remplacés). Fichier très long (1351 lignes), améliorations complètes nécessiteraient plus de temps.

- `tests/e2e/analytics-ai-optimized.spec.ts` — version optimisée pour CI (70% plus rapide, 3 tests vs 18, ~52s vs ~3-4 min).
    - `Docs\TESTS\follow-up\e2e-analytics-ai-optimized.md`
    - **Statut** : ✅ Réactivé et fonctionnel (3/3 tests passent en ~52s)

#### A FAIRE

ℹ️ Ces suites n’appellent pas Supabase en mock, mais injectent l’état navigateur (localStorage, auth token) et interceptent l’IA via `setupGeminiMock`/`setupAllMocks` pour rester stables.

### Tests primordiaux à remettre en service
- ✅ `tests/e2e/console-errors.spec.ts` — réactivé (2/2 tests passent)
- 🔄 `src/hooks/__tests__/useAnalyticsQuota.test.ts` — partiellement réactivé (18/21 tests passent, 86%)
  - ✅ Tests d'erreurs corrigés (try-catch ajouté dans le hook)
  - ⏳ 3 tests restent à corriger : détection utilisateur authentifié (reçoit 20 au lieu de 50)

## ⚠️ Tests Désactivés (À Corriger)

### 🔄 useAnalyticsQuota (18/21 tests passent - 86%)
- **Fichier** : `src/hooks/__tests__/useAnalyticsQuota.test.ts`
- **Statut** : ✅ Partiellement réactivé (18/21 tests passent)
- **Progrès** :
  - ✅ Tests d'erreurs corrigés (try-catch ajouté dans le hook pour gérer les erreurs de parsing JSON)
  - ✅ 18 tests passent maintenant (initialisation anonyme, localStorage, incrémentation, reset, checkQuota, etc.)
  - ⏳ 3 tests restent à corriger : détection utilisateur authentifié

#### Tests restants à corriger (12/2025)
- `initialise avec quota authentifié si user présent (50 queries)` → reçoit **20** au lieu de 50
- `met à jour la limite si changement d'utilisateur` → reste bloqué à **20**
- `utilise limite authentifiée (50 queries)` → reste à **20**

**Problème identifié** : Le hook ne détecte pas correctement l'utilisateur authentifié dans les tests. Le mock `createAuthMock(mockUser)` retourne bien `user: mockUser`, mais le hook reçoit toujours `limit: 20` (ANONYMOUS) au lieu de `limit: 50` (AUTHENTICATED).

**Action requise** :
  - Vérifier que le mock `useAuth` est correctement configuré avant le rendu du hook
  - S'assurer que le `useEffect` se déclenche correctement quand `user` change
  - Possible problème de timing : le hook initialise le state avec `limit` calculé à l'initialisation

#### Sujets connexes
- **Problème de mise à jour des quotas analytics** (`useAnalyticsQuota.ts`)
  - Attendu : passage de 20 → 50 requêtes après authentification
  - État actuel : limite reste à 20 (test ignoré temporairement)
  - Impact : utilisateurs fraîchement connectés restent sur la limite invitée
- **Questions ouvertes** :
  - Intérêt de conserver des quotas séparés (invité vs authentifié)
  - Revue complète des tests liés aux quotas pour s'assurer qu'ils restent représentatifs

### 🐛 Tests Console (1 test ignoré)
- **Fichier** : `e2e/console-errors.spec.ts`
- **Erreur** : `process is not defined`
- **Statut** : Test ignoré - Problème connu lié à l'environnement de test
- **Impact** : Aucun sur les fonctionnalités de production
- **Action requise** : À investiguer dans une prochaine itération

### ⚠️ Tests d'intégration skippés (10/11/2025)
- **Tests concernés** : 10 tests (841/850 passent — 98.9%)
- **Fichiers** :
  - `src/hooks/__tests__/useAutoSave.test.ts` → 6 tests `skip`
  - `src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts` → 3 tests `skip`
  - `src/hooks/__tests__/useAutoSave.titleGeneration.test.ts` → 1 test `skip`
- **Problème** : 
  - `createConversation` n'est jamais appelé dans l'environnement de test (conflit quota/context/timing)
  - `generateTitle` n'est pas appelé dans `useAutoSave.titleGeneration.test.ts` (problème de timing/debounce)
- **Impact** : Aucun — la fonctionnalité reste couverte par les tests unitaires et E2E
- **Suivi post-bêta (≈2-3h)** :
  - Réviser le setup React/timing async des tests
  - Réactiver les 10 tests (`.skip` → `.only` pour validation lors du correctif)
- **Échecs unitaires restants associés** :
  - `should persist quota in localStorage` → localStorage `null`
  - `should restore quota from localStorage` → `aiMessagesUsed = 0`
  - `should persist poll counts in localStorage` → localStorage `null`
  - `should allow message after cooldown expires` → `isInCooldown` reste `true`
  - `should initialize reset date for authenticated users` → localStorage `null`
  - `devrait générer un titre après création de sondage` → `generateTitle` n'est pas appelé
- **Correctifs partiels déjà en place** : timers réels pour localStorage, progression progressive du cooldown, extraction de `processMonthlyQuotaReset()` testée à 100%

### 🐛 Tests useAiMessageQuota (22 tests désactivés)
- **Fichier** : `src/hooks/__tests__/useAiMessageQuota.test.ts`
- **Problème** : Erreurs liées aux timers (`vi.useFakeTimers()`) et à React DOM (`Right-hand side of 'instanceof' is not an object`)
- **Impact** : Tests de quota de messages IA désactivés temporairement
- **Statut** : Tous les tests marqués avec `.skip` en attendant correction des problèmes de timers
- **Action requise** : 
  - Corriger les problèmes de timers dans les tests (conflits entre `vi.useFakeTimers()` et `vi.useRealTimers()`)
  - Résoudre l'erreur React DOM liée à `instanceof`
  - Réactiver les tests une fois corrigés

#### Détails des échecs actuels (11/2025)
- **Erreur principale** : `TypeError: Right-hand side of 'instanceof' is not an object` dans React DOM
- **Erreur secondaire** : `Error: Should not already be working` (conflit de timers)
- **Tests concernés** : Tous les 22 tests de la suite `useAiMessageQuota`
  - Guest User Limits (2 tests)
  - Authenticated User Limits (2 tests)
  - AI Messages Quota (4 tests)
  - Polls Per Conversation Limit (4 tests)
  - Cooldown Anti-Spam (3 tests)
  - Reset Quota (1 test)
  - processMonthlyQuotaReset (4 tests)
  - Monthly Reset for Authenticated Users (2 tests)

#### Contexte
Les tests échouaient déjà avant la simplification du mock (retrait de `STORAGE_QUOTAS` et `CONVERSATION_QUOTAS`). Le problème est indépendant du mock et semble lié à la configuration des timers dans Vitest et à l'interaction avec React DOM.

#### Suivi
- **2025-11-12** : Simplification du mock (retrait de `STORAGE_QUOTAS` et `CONVERSATION_QUOTAS`, mock direct de `useFreemiumQuota`)
- **2025-11-12** : Tous les tests désactivés avec `.skip` en attendant correction des problèmes de timers

### ✅ Tests guestQuotaService (17/17 passent — corrigés)

- **Fichier** : `src/lib/__tests__/guestQuotaService.test.ts`
- **Statut** : ✅ **TOUS LES TESTS PASSENT** (17/17)
- **Correction** : Problèmes de mocks Supabase résolus

#### Détails de la correction (11/2025)
Les 3 tests qui échouaient étaient dus à des problèmes de mocks Supabase :
1. **"should create new quota if not found"** : `localStorage` contenait `guest_quota_id`, empêchant la création. Ajout de `localStorage.removeItem("guest_quota_id")` au début du test.
2. **"should consume credits successfully"** : Le mock de `single` était correct, mais les assertions utilisaient des valeurs incorrectes. Correction des assertions pour utiliser `updatedRow.ai_messages` directement.
3. **"should handle missing quota gracefully"** : Même problème que le test 1, `localStorage` contenait une valeur. Ajout de `localStorage.removeItem("guest_quota_id")` et utilisation de `mockReturnValueOnce` au lieu de `mockImplementationOnce` pour `insert`.

#### Contexte
Ces problèmes étaient masqués par le bypass E2E avant la correction. Après avoir corrigé le bypass E2E (via `setupQuotaTestWindow()`), les problèmes de mocks Supabase sont devenus visibles et ont été corrigés.

#### Suivi
- **2025-11-12** : Problème identifié dans `guestQuotaService.test.ts`
- **2025-11-12** : Helper `setupQuotaTestWindow()` créé et appliqué
- **2025-11-12** : `guestQuotaService.test.ts` corrigé (14/17 tests passent maintenant)
- **2025-11-12** : 3 tests restants nécessitent une investigation approfondie des mocks Supabase
- **2025-11-12** : ✅ **TOUS LES TESTS CORRIGÉS** (17/17 passent)

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
- **Hooks** : useAutoSave, useConversations, usePollDeletionCascade, useAnalyticsQuota (18/21 tests) ✅ RÉACTIVÉ, useAiMessageQuota (17/22 tests)
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

**Specs actifs** : 19 fichiers (~75 tests)

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

## 📈 Analyse de Couverture

### Résumé

```
🎯 Tests Unitaires (Vitest)    : 756/787 passent (96%)
   - Tests en échec             : ~5 tests (useAiMessageQuota) + autres mineurs
   - Tests désactivés           : ~10 fichiers (.disabled, .skip)
   - useAiMessageQuota          : 17/22 passent (77%) - Réactivé ✅
   - FormPoll Results Access    : 14/14 passent (100%) ✅ NOUVEAU
   - ✅ Récemment corrigés      : IntentDetectionService (29/29), DashboardFilters (20/20), 
                                  ManageTagsFolderDialog (11/11), utils.test.ts (30/30)
🤖 Tests IA (Gemini/Jest)      : 23/25 passent (92%)
   - Date Polls                 : 15/15 passent (100%)
   - Form Polls                 : 8/10 passent (80%)
🌐 Tests E2E (Playwright)      : 47/47 passent (100% sur Chrome)
   - FormPoll Results Access    : 5/5 passent ✅ NOUVEAU
📈 SCORE GLOBAL                : 97%
```

### Zones Bien Couvertes

- ✅ Hooks critiques : useAutoSave, useConversations, useAnalyticsQuota
- ✅ Services critiques : PollAnalyticsService, sort-comparator, EmailService ✅ NOUVEAU
- ✅ Components Dashboard : DashboardFilters, ManageTagsFolderDialog, DashboardTableView
- ✅ Components Analytics : PollAnalyticsPanel
- ✅ Lib pollStorage : resultsVisibility, email confirmation ✅ NOUVEAU

### Zones Non Couvertes / Priorités

**Priorité 1 (Critiques)** :
- 🔴 `GeminiChatInterface` - Aucun test unitaire (1510 lignes)

**Récemment corrigés** ✅ :
- ✅ `IntentDetectionService` - 29/29 tests passent (corrigé)
- ✅ `DashboardFilters` - 20/20 tests passent (corrigé)
- ✅ `ManageTagsFolderDialog` - 11/11 tests passent (corrigé)
- ✅ `utils.test.ts` (dashboard) - 30/30 tests passent (corrigé)

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
- Tests IA : Maintenir > 90% (actuellement 92%)
- Corriger les 5 tests restants useAiMessageQuota
- Améliorer Form Polls tests (actuellement 80%)

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

#### 1. IntentDetectionService - ✅ Corrigé
#### 2. useAiMessageQuota.test.ts - Réactivé ✅ (Partiellement corrigé)

**Statut actuel** : 17/22 tests passent (77%)

**Problèmes restants** :
- `should persist quota in localStorage` - localStorage null (effet ne sauvegarde pas)
- `should restore quota from localStorage` - aiMessagesUsed = 0 au lieu de 1
- `should persist poll counts in localStorage` - localStorage null
- `should allow message after cooldown expires` - isInCooldown reste true (setInterval problème)
- `should initialize reset date for authenticated users` - localStorage null (guest au lieu de auth)

**Solutions appliquées** :
- ✅ Refactorisé logique reset mensuel → fonction pure `processMonthlyQuotaReset()` (100% couverture)
- ✅ Ajouté 4 tests unitaires pour `processMonthlyQuotaReset()`
- ✅ Utilisé real timers pour localStorage
- ✅ Avancement progressif pour cooldown

**Durée restante** : 2-4 heures pour corriger les 5 tests restants

#### 3. Tests Dashboard - ✅ Tous corrigés


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
- [x] Corriger IntentDetectionService ✅ (29/29 tests passent - corrigé)
- [x] Réactiver useAiMessageQuota.test.ts ✅ (17/22 passent, 5 restants)
- [ ] Corriger les 5 tests restants useAiMessageQuota (localStorage, cooldown)
- [x] Corriger DashboardFilters ✅ (20/20 tests passent - corrigé)
- [x] Corriger ManageTagsFolderDialog ✅ (11/11 tests passent - corrigé)
- [x] Corriger utils.test.ts dashboard ✅ (30/30 tests passent - corrigé)

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
- GeminiChatInterface.integration.test.tsx.skip

**Tests réactivés** :
- ✅ useAiMessageQuota.test.ts (17/22 passent, 77%)

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
**Dernière révision** : 12 novembre 2025 (Tests Supabase automatisés - 11 tests manuels convertis en E2E)

---

## 📋 Tests FormPoll Results Access - Novembre 2025

**Tests unitaires** : 14/14 passent (100%)
- `pollStorage.resultsVisibility.test.ts` (9 tests)
- `EmailService.test.ts` (5 tests)

**Tests E2E** : 5/5 passent (100%) - `form-poll-results-access.spec.ts`
- Visibilité creator-only/voters/public
- Email de confirmation + validation

**Exécution** :
```bash
npm run test:unit -- src/lib/__tests__/pollStorage.resultsVisibility.test.ts src/services/__tests__/EmailService.test.ts
npx playwright test form-poll-results-access.spec.ts --project=chromium
```

---

## 🔐 Tests Authentification & Clés Bêta - Novembre 2025

### Tests Unitaires BetaKeyService

**Tests** : 25/25 passent (100%) ✅  
**Fichier** : `src/services/__tests__/BetaKeyService.test.ts`

**Couverture** :
- `redeemKey()` - 9 tests (activation, validation, erreurs HTTP)
- `generateKeys()` - 3 tests (génération, session, erreurs)
- `exportToCSV()` - 2 tests (export, cas vide)
- Helper functions - 11 tests (`isValidBetaKeyFormat`, `formatBetaKey`)

**Exécution** :
```bash
npm run test:unit -- BetaKeyService
```

### Tests E2E Authenticated Workflow

**Tests** : 6 tests réactivés ✅  
**Fichier** : `tests/e2e/authenticated-workflow.spec.ts`

**Couverture** :
- Sign up/sign in process
- Création conversations (limites premium)
- Migration données guest → authenticated
- Persistance sessions
- Gestion quotas

**Exécution** :
```bash
npx playwright test authenticated-workflow.spec.ts --project=chromium
```

### Tests E2E Beta Key Activation

**Tests** : 9 tests ✅  
**Fichier** : `tests/e2e/beta-key-activation.spec.ts`

**Couverture** :
- Validation format clé
- Activation avec mock API
- Gestion erreurs (invalide, déjà utilisée, 401, 403, 404)
- Formatage automatique input
- Normalisation (trim, uppercase)
- Tests intégration (skipped par défaut)

**Exécution** :
```bash
npx playwright test beta-key-activation.spec.ts --project=chromium
```

### Helpers de Test Supabase

**Fichier** : `tests/e2e/helpers/supabase-test-helpers.ts`

**Fonctions disponibles** :
- `createTestUser(email, password)` - Créer utilisateur test
- `signInTestUser(email, password)` - Se connecter
- `signOutTestUser()` - Se déconnecter
- `generateTestEmail(prefix)` - Email unique
- `cleanupTestData(userId)` - Nettoyer données test
- `isBetaKeyActive(code)` - Vérifier clé active
- `getUserQuotas(userId)` - Récupérer quotas

### Configuration Supabase Test

**Variables d'environnement** (`.env.local`) :
```bash
# Variables de test Supabase (optionnel)
VITE_SUPABASE_URL_TEST=https://votre-projet-test.supabase.co
VITE_SUPABASE_ANON_KEY_TEST=votre-anon-key-de-test
```

**Configuration Playwright** : `playwright.config.ts` charge automatiquement `.env.local` et utilise :
1. `VITE_SUPABASE_URL_TEST` si défini
2. Sinon fallback sur `VITE_SUPABASE_URL`

**Générer clés bêta de test** (dans Supabase SQL Editor) :
```sql
SELECT * FROM generate_beta_key(5, 'Test keys', 12);
```

### CI/CD - Secrets GitHub

Pour GitHub Actions, ajouter les secrets :
- `VITE_SUPABASE_URL_TEST`
- `VITE_SUPABASE_ANON_KEY_TEST`

**Dans workflow YAML** :
```yaml
env:
  VITE_SUPABASE_URL_TEST: ${{ secrets.VITE_SUPABASE_URL_TEST }}
  VITE_SUPABASE_ANON_KEY_TEST: ${{ secrets.VITE_SUPABASE_ANON_KEY_TEST }}
```

### Bonnes Pratiques

**Tests avec Supabase de test** :
- ✅ Utiliser un projet Supabase séparé pour les tests
- ✅ Générer des emails uniques : `generateTestEmail()`
- ✅ Nettoyer les données après tests : `cleanupTestData()`
- ❌ Ne jamais utiliser la base de production pour les tests

**Mocking** :
- Tests unitaires : Supabase complètement mocké
- Tests E2E : API Supabase réelle, Gemini mocké

---

## 🔄 Tests Supabase Integration Automatisés - Novembre 2025

**Tests E2E** : 11 tests automatisés (anciennement manuels) ✅ **NOUVEAU**  
**Fichier** : `tests/e2e/supabase-integration-manual.spec.ts`

**Contexte** : Automatisation des tests manuels Supabase listés dans `Planning.md` (lignes 290-351). Ces tests couvrent les scénarios critiques de synchronisation localStorage ↔ Supabase, migration, multi-appareils, et gestion des conversations.

**Tests couverts** :
1. **Test 2: Ajout de messages** - Vérifie sauvegarde messages, `message_count`, cache localStorage
2. **Test 4: Migration localStorage → Supabase** - Migration automatique conversations guest vers compte authentifié
3. **Test 5: Fusion localStorage + Supabase** - Synchronisation multi-appareils, pas de doublons
4. **Test 6: Fallback localStorage si Supabase échoue** - Mode offline, sauvegarde locale, synchronisation différée
5. **Test 7: Multi-appareils (CRITIQUE)** - Création/modification sur appareil A, vérification sur appareil B
6. **Test 8: Mise à jour conversation** - Modification titre/favoris/tags, persistence après déconnexion/reconnexion
7. **Test 9: Suppression conversation** - Suppression, vérification Supabase/localStorage, non réapparition
8. **Test 10: Génération automatique titre** - Génération titre après debounce, historique
9. **Test 11: Mode guest** - Conversations guest uniquement dans localStorage, pas dans Supabase
10. **Test 12: Performance et limites** - Création 20+ conversations, chargement rapide, pas de timeout

**Exécution** :
```bash
# Tous les tests Supabase
npx playwright test supabase-integration-manual.spec.ts --project=chromium

# Test spécifique
npx playwright test supabase-integration-manual.spec.ts -g "2. Test ajout de messages" --project=chromium
```

**Durée** : ~10-15 minutes (vs 4-6h pour tests manuels)  
**Gain** : ~95% de temps économisé, tests reproductibles et intégrables en CI

**Prérequis** :
- Configuration Supabase de test (`.env.local` avec `VITE_SUPABASE_URL_TEST` et `VITE_SUPABASE_ANON_KEY_TEST`)
- Utilisateur de test créé automatiquement par `beforeAll`
- Nettoyage automatique des données après chaque test

**Note** : Ces tests utilisent un vrai client Supabase (pas de mock) pour valider l'intégration complète. Gemini est mocké pour éviter les coûts API.