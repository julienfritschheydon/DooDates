# E2E Test Infrastructure: Exhaustive Analysis Report

## GOALS
- Test should be fast
- Test should be reliable
- Test should be maintainable
- Test should be readable
- Test should be simple

## METHODS TO RESPECT
- Test always as soon as possible
- One test at a time
- Once it's working, commit but don't push until you are done with all the tests

## � Definition of Done

### Success Metrics
- [ ] **0 tests skipped** (baseline all tests to passing state)
- [ ] **0 flaky tests** (≥ 95% pass rate on CI across all browsers)
- [ ] **E2E execution time < 5min** (optimize slow test blocks)
- [ ] **Unit test coverage > 80%** for all helper files
- [ ] **All RGPD tests consolidated** into single lifecycle file
- [ ] **Rate limiting validated** via integration tests (not mocked E2E)

---

### 2. Rate Limiting Tests (`rate-limiting-api-only.spec.ts`) 🔧 TODO

**Current Status**: 3 failures. Mocks are complex and failing due to JWT/backend simulation issues.

**Problem**: E2E tests are trying to validate backend Edge Function logic (rate limits) by mocking the network. This verifies the *mock*, not the backend.

**Restructuring Plan**:
- **Strategy**: **Hybrid Approach** (not full deletion).
- **Integration Tests**: Write robust integration tests for `useFreemiumQuota` and `QuizzService` using `vitest`.
  - Test file: `src/services/__tests__/QuizzService.test.ts`
  - Mock Supabase responses with realistic rate limit headers
  - Validate quota calculation logic in isolation
- **E2E Smoke Test**: Keep **ONE** simple E2E test that verifies the UI displays the rate limit error message when quota is exceeded.
  - Use `page.route()` to intercept and return a 429 response
  - Verify error toast/modal appears with correct message
- **Why**: Rate limiting is deterministic logic based on headers/DB state. Most of it is better tested in isolation, but we keep one E2E test to ensure the UI correctly handles the error state.


### 3. RGPD Tests (Consolidation)
**Current Status**: 9 failures. Tests are fragmented across many files.
- **Problem**: Too many files testing the same "Settings" page. Navigation allows "Intro" screen to block access.
- **Files to Consolidate**:
  - [tests/e2e/rgpd/consent-management.spec.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/rgpd/consent-management.spec.ts)
  - [tests/e2e/rgpd/account-deletion.spec.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/rgpd/account-deletion.spec.ts)
  - [tests/e2e/rgpd/automatic-deletion.spec.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/rgpd/automatic-deletion.spec.ts)
  - [tests/e2e/rgpd/data-export.spec.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/rgpd/data-export.spec.ts)
  - Relevant tests from [tests/e2e/security-rate-limiting-rgpd.spec.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/security-rate-limiting-rgpd.spec.ts)
- **Restructuring Plan**:
  - **Strategy**: **Consolidate & Simplify**.
  - **Action**: Merge all RGPD lifecycle tests into a single `rgpd-lifecycle.spec.ts`.
  - **Flow**:
    1. **Seed State**: User has data (polls, votes).
    2. **Navigate**: Go directly to `/data-control` (bypassing Intro).
    3. **Execute**: Export → Consent Toggle → Delete Account.
  - **Git History**: Keep commit history by using `git mv` for file renames/merges.
  - **Gain**: Reduces setup overhead from ~10 browser startups to 1.

### 4. Specific UI Tests (`form-visibility`, `backend`)
**Current Status**: Skipped. `form-visibility` tests if elements hide/show. `backend` tests depend on live Supabase.
- **Problem**: `form-visibility` is pure React logic (render condition). `backend` tests are flaky in CI.
- **Restructuring Plan**:
  - **Form Visibility**: **Convert to Component Test**. Move to `src/components/polls/__tests__/FormPoll.test.tsx` using React Testing Library. It's faster and less brittle.
  - **Backend Test**: **Delete from E2E**. Backend logic should be tested via Supabase local (cli) tests, not Playwright frontend tests.

---

## �🛠️ Phase 1: Infrastructure Refactoring (Priority 2)

> [!NOTE]
> **Phase 1 is executed AFTER Phase 2** to ensure all refactoring is validated against a passing test suite. This reduces the risk of introducing regressions during structural changes.

### Improvement Suggestions & Expected Gains

### 1. Consolidate Storage Seeding Logic
There is significant overlap between helpers that seed `localStorage`.

- **Files involved**:
  - [tests/e2e/helpers/poll-helpers.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-helpers.ts) ([createPollInStorage](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-helpers.ts#795-847))
  - [tests/e2e/helpers/poll-storage-helpers.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-storage-helpers.ts) ([createPollInLocalStorage](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-storage-helpers.ts#5-36), [createPollInStorage](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-helpers.ts#795-847))
  - [tests/e2e/helpers/test-data.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/test-data.ts) ([createTestPoll](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/test-data.ts#209-258))
- **Suggested Action**: 
  - Centralize all "Seed Poll" logic in [tests/e2e/helpers/test-data.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/test-data.ts).
  - Provide two standard versions: one using `page.evaluate` (for active pages) and one using `page.addInitScript` (for pre-navigation seeding).
  - Ensure all variants correctly set the `doodates_device_id` and `doodates_polls` keys.
- **Migration Strategy** (to avoid breaking existing tests):
  - **Phase 1**: Create new consolidated functions in [test-data.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/test-data.ts) WITHOUT touching existing helpers:
    - `seedPollViaEvaluate(page, pollData)` - for active pages
    - `seedPollViaInitScript(page, pollData)` - for pre-navigation
  - **Phase 2**: Migrate tests one-by-one to use new functions, commit after each successful migration
  - **Phase 3**: Only delete old helpers ([createPollInStorage](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-helpers.ts#795-847), [createPollInLocalStorage](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-storage-helpers.ts#5-36)) when all tests are green
  - **Validation**: Run full E2E suite after each migration batch to catch regressions early
- **Expected Gains**:
  - **Reliability**: Ensures consistent `device_id` injection across all tests, preventing subtle "missing creator" bugs.
  - **Maintenance**: Reduces code duplication by ~50 lines and simplifies future schema updates to a single source of truth.

### 2. Unify Dashboard Verification
Verification of poll visibility in the dashboard is scattered.

- **Files involved**:
  - [tests/e2e/helpers/poll-helpers.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-helpers.ts) ([verifyPollInDashboard](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-helpers.ts#770-794), [verifyPollBySlugInDashboard](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-helpers.ts#848-903))
  - [tests/e2e/helpers/poll-storage-helpers.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-storage-helpers.ts) ([createPollsAndVerifyInDashboard](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-storage-helpers.ts#37-83))
- **Suggested Action**:
  - Move these functions to [tests/e2e/helpers/poll-navigation-helpers.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-navigation-helpers.ts) or a new `tests/e2e/helpers/dashboard-helpers.ts`.
  - Use the "Robust Search" pattern from [verifyPollBySlugInDashboard](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-helpers.ts#848-903) (scanning items + fallback to global link scan) as the standard for all dashboard checks.
- **Expected Gains**:
  - **Stability**: Eliminates flakiness in dashboard lookups by using a single, robust search strategy.
  - **Efficiency**: Reduces maintenance effort when DOM selectors change (single point of fix).
  - **Standardization**: Ensures timeouts are handled consistently across all dashboard verification steps.

### 3. Clean Up [poll-helpers.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-helpers.ts)
This file has become a "kitchen sink" for various poll-related utilities.

- **Suggested Action**:
  - Move [sendChatCommand](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-helpers.ts#43-94) to [chat-helpers.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/chat-helpers.ts).
  - Move [submitVoteAndVerifyConfirmation](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-helpers.ts#132-215) and [voteOnPollComplete](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-helpers.ts#561-730) to a dedicated `vote-helpers.ts`.
  - Use [poll-helpers.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-helpers.ts) only as a barrel file (exporting from sub-helpers) or for high-level orchestrations.
- **Expected Gains**:
  - **Organization**: Improves codebase navigability by cleanly separating Chat, Voting, and Storage concerns.
  - **Readability**: Reduces the monolithic size of [poll-helpers.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/poll-helpers.ts), making it easier for developers to find relevant functions.
  - **Testability**: Facilitates easier unit testing of isolated helper functions.

### 4. Standardize Helper Signatures
Currently, the order and presence of the `browserName` argument is inconsistent.

- **Current state**: Mixed use of [(page, browserName, ...)](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/utils.ts#256-259) and [(page, ...)](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/utils.ts#256-259).
- **Suggested Action**: Standardize all helpers to accept a `context: { page: Page; browserName: string }` object or consistently use [(page, browserName, ...)](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/utils.ts#256-259) to ensure timeouts are always calculated correctly for the active browser.
- **Expected Gains**:
  - **Cross-Browser Stability**: Ensures all tests correctly respect browser-specific timeouts (critical for Firefox/WebKit CI stability).
  - **Developer Experience**: Provides a predictable API signature for all helpers, reducing usage errors.
  - **Consistency**: Reduces "timeout drift" where default timeouts are accidentally used instead of tuned values.

### 5. Address TODOs in [supabase-test-helpers.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/supabase-test-helpers.ts)
The following functions are placeholders or marked as "admin only":
- [deleteTestUser](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/supabase-test-helpers.ts#94-111): Needs a service role key or a secure backend endpoint.
- [createTestBetaKey](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/helpers/supabase-test-helpers.ts#175-201): Currently a placeholder.
- **Suggested Action**: Implement these via a local "test-only" API endpoint or a Supabase Edge Function that uses the service role key, keeping the secrets out of the E2E front-end bundle.
- **Expected Gains**:
  - **Security**: Greatly improves security by keeping admin secrets completely out of the frontend bundle.
  - **Coverage**: Unlocks the ability to test critical admin flows (User Deletion, Beta Keys) which are currently untested or mocked loosely.

### 6. Audit for "Ghost" References
- **`poll-validation-helpers.ts`**: This file is referenced in some mental models but does not exist. A grep should be performed to ensure no tests are attempting to import from it.
- **Expected Gains**:
  - **Clarity**: Cleans up the developer mental model and prevents confusion during onboarding.
  - **Hygiene**: Ensures all imports in the codebase point to valid, existing files.

---
> [!TIP]
> Prioritizing **Point 1** (Storage consolidation) and **Point 2** (Dashboard unification) will provide the most immediate benefit in reducing flakiness and maintenance overhead.

## ✅ Verification Status
- **Analysis**: All core helper files and browser-specific logic (Firefox/WebKit/Mobile) analyzed.
- **Access Control**: Verified [results-access-control.spec.ts](file:///c:/Users/Julien%20Fritsch/Documents/GitHub/DooDates/tests/e2e/results-access-control.spec.ts) exists and correctly tests `localStorage` manipulation for `doodates_device_id` to simulate multi-user scenarios.
- **Hygiene**: Confirmed no broken references to missing files.

----

### 🏗️ **API Dashboard Architecture (Nouveau)**

**Priorité : Haute - Ajouté le 2 janvier 2026**

#### **Objectif**

Créer une API layer pour les dashboards produits afin d'améliorer la testabilité et préparer l'architecture pour les applications mobiles.

#### **Approche Hybride**

```typescript
Dashboard React → API Optionnelle → localStorage Fallback
```

#### **Tâches (10h total)**

| Bloc        | Durée | Tâche                                                         |
| ----------- | ----- | ------------------------------------------------------------- |
| 2h Critique | 2h    | **API Dashboard Core**                                        |
|             |       | - Créer `src/api/dashboard/` avec endpoints REST              |
|             |       | - Implémenter `GET /api/dashboard/:productType`               |
|             |       | - Support pagination, filtres, recherche                      |
| 2h Critique | 2h    | **Intégration Dashboard React**                               |
|             |       | - Modifier `useDashboardData` pour utiliser API               |
|             |       | - Fallback localStorage si API indisponible                   |
|             |       | - Gestion erreurs et loading states                           |
| 1h Fond     | 1h    | **Tests API Dashboard**                                       |
|             |       | - Tests unitaires endpoints API                               |
|             |       | - Tests intégration React + API                               |
|             |       | - Tests E2E avec mock API                                     |
| 1h Fond     | 1h    | **Documentation API**                                         |
|             |       | - Spécification OpenAPI/Swagger                               |
|             |       | - Documentation endpoints                                     |
|             |       | - Exemples d'utilisation                                      |
| 1h Fond     | 1h    | **Tests Edge Cases Post-API**                                 |
|             |       | - Créer edge cases pour form-polls, availability-polls, quizz |
|             |       | - Utiliser nouvelle API (plus simple que localStorage)        |
|             |       | - Couverture performance, responsive, navigation              |
| 3h Fond     | 3h    | **Déploiement & Monitoring**                                  |
|             |       | - Configuration Supabase Functions                            |
|             |       | - Monitoring API performances                                 |
|             |       | - Logs et erreurs                                             |

#### **Livrables**

- `src/api/dashboard/` - API REST complète
- `useDashboardData` modifié - Support API + localStorage
- Tests unitaires + intégration + E2E
- Documentation OpenAPI
- Tests edge cases pour tous les produits
  | 2h Critique | 2h | **API Design** - Endpoints `/api/dashboard/{product}/polls`, Schema TypeScript |
  | 4h Critique | 4h | **Backend Implementation** - Express.js routes, validation, error handling |
  | 2h Fond | 2h | **Frontend Integration** - Hook hybride `useDashboardData`, fallback localStorage |
  | 2h Fond | 2h | **Tests** - Backend unitaires, API integration, frontend mocks |

#### **Bénéfices attendus**

- ✅ Tests plus simples et rapides (backend unitaires)
- ✅ Foundation pour mobile apps (API partagée)
- ✅ Performance monitoring (côté serveur)
- ✅ Sécurité centralisée

---

### 🧪 **Tests Edge Cases Dashboards Produits (Nouveau)**

**Priorité : Haute - Ajouté le 2 janvier 2026**

#### **Objectif**

Créer des tests edge cases pour les 4 dashboards produits pour remplacer les tests obsolètes du dashboard principal supprimé.

#### **Tests à créer**

```
tests/e2e/products/
├── date-polls/
│   ├── date-polls-edge-cases.spec.ts ✅ CRÉÉ
│   ├── date-polls-responsive.spec.ts
│   └── date-polls-data-validation.spec.ts
├── form-polls/
│   ├── form-polls-edge-cases.spec.ts
│   ├── form-polls-responsive.spec.ts
│   └── form-polls-data-validation.spec.ts
├── availability-polls/
│   ├── availability-polls-edge-cases.spec.ts
│   ├── availability-polls-responsive.spec.ts
│   └── availability-polls-data-validation.spec.ts
└── quizz/
    ├── quizz-edge-cases.spec.ts
    ├── quizz-responsive.spec.ts
    └── quizz-data-validation.spec.ts
```

#### **Edge Cases à couvrir**

| Catégorie          | Tests spécifiques                           |
| ------------------ | ------------------------------------------- |
| **Dashboard vide** | Message approprié quand aucun sondage       |
| **Performance**    | 50+ sondages, pagination, scroll            |
| **UI/UX**          | Titres très longs, layout responsive        |
| **Données**        | Données corrompues, invalides, manquantes   |
| **Filtres**        | Recherche, statuts, pagination avec filtres |
| **Responsive**     | Mobile vs Desktop, navigation tactile       |
| **Navigation**     | Clics rapides, retour arrière, deep linking |

#### **État actuel Tests PÉRIMÈTRE C**

```
✅ tags-folders.spec.ts - 6/6 passent (probablement obsolètes)
✅ product-isolation.spec.ts - 3/3 passents
✅ hyper-task.feature.spec.ts - 2/2 passents
✅ formpolls.feature.spec.ts - Corrigé, data-testid ajoutés
❌ dashboard-edge-cases.spec.ts - Supprimé (obsolète)
🔄 Tests dashboards produits - En cours (date-polls créé)

---
> [!NOTE]

> The infrastructure is now well-documented and the path for refactoring is clear. No immediate bugs were found that prevent the current tests from running.



