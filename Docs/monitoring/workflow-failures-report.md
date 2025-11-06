# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 06/11/2025 19:29:53

> Ce rapport est généré automatiquement pour suivre les échecs de workflows.
> Il peut être consulté par l'IA pour comprendre l'état de santé du CI/CD.

---

## 1️⃣ PR Complete Validation

**Statut:** ⏳ unknown

**Statistiques:**
- ❌ Échecs (24h): **0**
- ❌ Échecs (7 jours): **0**
- 📊 Total runs analysés: **0**

### ✅ Aucun échec récent

Aucun échec détecté dans les 7 derniers jours.

---

## 2️⃣ Develop → Main (Auto-merge)

**Statut:** ❌ failure

**Dernier run:** 06/11/2025 19:06:56

**Statistiques:**
- ❌ Échecs (24h): **5**
- ❌ Échecs (7 jours): **6**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #57 - 06/11/2025 19:06:56

- **Commit:** `8df910d`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19145287292)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
    - **Erreurs détectées (10):**
      ```
File: src/lib/error-handling.ts:150
Error: name: 'DooDatesError',

name: 'DooDatesError',
stack: 'DooDatesError: Gemini model not initialized\n' +
'    at Object.api (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:150:8)\n' +
🚨 DooDates Error: {
```
      ```
File: src/lib/error-handling.ts:136
Error: name: 'DooDatesError',

name: 'DooDatesError',
stack: 'DooDatesError: Poll not found\n' +
'    at Object.validation (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:136:5)\n' +
🚨 DooDates Error: {
message: 'API Error',
name: 'DooDatesError',
stack: 'DooDatesError: API Error\n' +
'    at handleError (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:103:22)\n' +
```
      ```
File: src/lib/error-handling.ts:103
Error: 🚨 DooDates Error: {

🚨 DooDates Error: {
message: 'API Error',
name: 'DooDatesError',
stack: 'DooDatesError: API Error\n' +
'    at handleError (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:103:22)\n' +
```
      ```
File: src/lib/error-handling.ts:150
Error: 🚨 DooDates Error: {

🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Gemini model not initialized\n' +
'    at Object.api (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:150:8)\n' +
```
      ```
File: src/lib/error-handling.ts:136
Error: 🚨 DooDates Error: {

🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Poll not found\n' +
'    at Object.validation (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:136:5)\n' +
```
      *... et 5 autre(s) erreur(s)*
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`
    - **Erreurs détectées (10):**
      ```
Error: "body": "fix: corriger les tests unitaires en échec\n\n- useAiMessageQuota.test.ts: utiliser act() pour les effets React et vi.setSystemTime() pour le cooldown\n- BetaKeyService.test.ts: ajouter les mocks manquants pour handleError et ErrorFactory.auth\n- useConversations.test.ts: ajouter userId aux conversations mockées et corriger le test guest mode\n- useConversations.favorites.test.ts: ajouter les mocks pour ConversationStorageSupabase\n\nTous les tests passent maintenant (25/25)\n",

"body": "fix: corriger les tests unitaires en échec\n\n- useAiMessageQuota.test.ts: utiliser act() pour les effets React et vi.setSystemTime() pour le cooldown\n- BetaKeyService.test.ts: ajouter les mocks manquants pour handleError et ErrorFactory.auth\n- useConversations.test.ts: ajouter userId aux conversations mockées et corriger le test guest mode\n- useConversations.favorites.test.ts: ajouter les mocks pour ConversationStorageSupabase\n\nTous les tests passent maintenant (25/25)\n",
"body": "fix: corriger les tests unitaires en échec\n\n- useAiMessageQuota.test.ts: utiliser act() pour les effets React et vi.setSystemTime() pour le cooldown\n- BetaKeyService.test.ts: ajouter les mocks manquants pour handleError et ErrorFactory.auth\n- useConversations.test.ts: ajouter userId aux conver
... (truncated)
```
      ```
Error: "body": "fix: corriger les tests unitaires en échec\n\n- useAiMessageQuota.test.ts: utiliser act() pour les effets React et vi.setSystemTime() pour le cooldown\n- BetaKeyService.test.ts: ajouter les mocks manquants pour handleError et ErrorFactory.auth\n- useConversations.test.ts: ajouter userId aux conversations mockées et corriger le test guest mode\n- useConversations.favorites.test.ts: ajouter les mocks pour ConversationStorageSupabase\n\nTous les tests passent maintenant (25/25)\n",

"body": "fix: corriger les tests unitaires en échec\n\n- useAiMessageQuota.test.ts: utiliser act() pour les effets React et vi.setSystemTime() pour le cooldown\n- BetaKeyService.test.ts: ajouter les mocks manquants pour handleError et ErrorFactory.auth\n- useConversations.test.ts: ajouter userId aux conversations mockées et corriger le test guest mode\n- useConversations.favorites.test.ts: ajouter les mocks pour ConversationStorageSupabase\n\nTous les tests passent maintenant (25/25)\n",
"body": "fix: corriger les tests unitaires en échec\n\n- useAiMessageQuota.test.ts: utiliser act() pour les effets React et vi.setSystemTime() pour le cooldown\n- BetaKeyService.test.ts: ajouter les mocks manquants pour handleError et ErrorFactory.auth\n- useConversations.test.ts: ajouter userId aux conver
... (truncated)
```
      ```
Error: "title": "Console Errors & React Warnings",

"title": "Console Errors & React Warnings",
"file": "console-errors.spec.ts",
"errors": [],
"file": "console-errors.spec.ts",
```
      ```
Error: "errors": [],

"errors": [],
"title": "Documentation page loads without errors @smoke",
"errors": [],
"title": "Documentation assets load correctly (no 404 errors) @smoke",
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      *... et 5 autre(s) erreur(s)*

#### Run #56 - 06/11/2025 18:13:03

- **Commit:** `e3cdc79`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19143857151)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`

#### Run #55 - 06/11/2025 18:01:00

- **Commit:** `ad3abfe`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19143507905)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`

#### Run #53 - 05/11/2025 23:34:37

- **Commit:** `28ea5e9`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19118439223)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

#### Run #47 - 05/11/2025 22:36:16

- **Commit:** `1c6ea9c`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19117072227)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ✅ success

**Dernier run:** 05/11/2025 23:24:26

**Statistiques:**
- ❌ Échecs (24h): **6**
- ❌ Échecs (7 jours): **12**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #32 - 05/11/2025 23:06:37

- **Commit:** `2401316`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19117793740)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (2)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 2/2)`
    - **Erreurs détectées (9):**
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],
Locator: locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\nExpected: visible\nTimeout: 5000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 5000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\u001b\n",
Expected: \n\u001b  - Expect \"toBeVisible\" with timeout 5000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\u001b\n",
Locator: locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\nExpected: visible\nTimeout: 5000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 5000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\u001b\n\n    at /home/runner/work/DooDates/DooDates/tests/e2e/tags-folders.spec.ts:438:32",
Expected: 32",

"errors": [],
"errors": [],
"errors": [],
"error": {
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\nExpected: visible\nTimeout: 5000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 5000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\u001b\n",
"stack": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\nExpected: visible\nTimeout: 5000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"
... (truncated)
```
      ```
Error: "errors": [
Locator: locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\nExpected: visible\nTimeout: 5000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 5000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\u001b\n\n\n  436 |       // Vérifier que les tags sont visibles - utiliser getByText (comme dans les autres tests corrigés)\n  437 |       const tag1OnCard = conversationCard.getByText(/Test Tag 1/i);\n> 438 |       await expect(tag1OnCard).toBeVisible({ timeout: 5000 });\n      |                                ^\n  439 |       \n  440 |       const tag2OnCard = conversationCard.getByText(/Test Tag 2/i);\n  441 |       await expect(tag2OnCard).toBeVisible({ timeout: 5000 });\n    at /home/runner/work/DooDates/DooDates/tests/e2e/tags-folders.spec.ts:438:32"
Expected: 32"

"errors": [
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\nExpected: visible\nTimeout: 5000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 5000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\u001b\n\n\n  436 |       // Vérifier que les tags sont visibles - utiliser getByText (comme dans les autres tests corrigés)\n  437 |       const tag1OnCard = conversationCard.getByText(/Test Tag 1/i);\n> 438 |       await expect(tag1OnCard).toBeVisible({ timeout: 5000 });\n      |                                ^\n  439 |       \n  440 |       const
... (truncated)
```
      ```
Error: "errorLocation": {
Locator: locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\nExpected: visible\nTimeout: 5000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 5000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\u001b\n",
Expected: \n\u001b  - Expect \"toBeVisible\" with timeout 5000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\u001b\n",
Locator: locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\nExpected: visible\nTimeout: 5000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 5000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\u001b\n\n    at /home/runner/work/DooDates/DooDates/tests/e2e/tags-folders.spec.ts:438:32",
Expected: 32",

"errorLocation": {
"error": {
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\nExpected: visible\nTimeout: 5000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 5000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\u001b\n",
"stack": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"poll-item\"]').first().getByText(/Test Tag 1/i)\nExpected: visible\nTimeout: 5000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with time
... (truncated)
```
      *... et 4 autre(s) erreur(s)*

#### Run #31 - 05/11/2025 22:57:14

- **Commit:** `8ad185b`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19117560292)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (2)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 2/2)`

#### Run #30 - 05/11/2025 22:49:40

- **Commit:** `befcd11`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19117388174)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (2)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 2/2)`

#### Run #29 - 05/11/2025 21:17:52

- **Commit:** `10bbf69`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19115094876)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (2)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 2/2)`

#### Run #28 - 05/11/2025 21:05:28

- **Commit:** `d5b74f1`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19114766874)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (2)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 2/2)`

---

## 6️⃣ Nightly Full Regression

**Statut:** ❌ failure

**Dernier run:** 06/11/2025 04:06:52

**Statistiques:**
- ❌ Échecs (24h): **1**
- ❌ Échecs (7 jours): **3**
- 📊 Total runs analysés: **3**

### 🔴 Échecs récents (24h)

#### Run #3 - 06/11/2025 04:06:52

- **Commit:** `3ac5fcc`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19123469257)
- **Jobs en échec:**
  - ❌ `full-regression (firefox)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (firefox)`
    - **Erreurs détectées (10):**
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      *... et 5 autre(s) erreur(s)*
  - ❌ `full-regression (Mobile Chrome)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (Mobile Chrome)`
    - **Erreurs détectées (10):**
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      *... et 5 autre(s) erreur(s)*
  - ❌ `full-regression (webkit)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (webkit)`
    - **Erreurs détectées (10):**
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      *... et 5 autre(s) erreur(s)*
  - ❌ `full-regression (chromium)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (chromium)`
    - **Erreurs détectées (10):**
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      *... et 5 autre(s) erreur(s)*
  - ❌ `full-regression (Mobile Safari)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (Mobile Safari)`
    - **Erreurs détectées (10):**
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      *... et 5 autre(s) erreur(s)*

---

## 📈 Résumé Global

- ❌ **Total échecs (24h):** 11
- ❌ **Total échecs (7 jours):** 15
- 📊 **Workflows monitorés:** 6

### ⚠️ Recommandations

Des échecs ont été détectés dans les 24 dernières heures. Consultez les sections ci-dessus pour plus de détails.

