# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 14/11/2025 15:36:46

_Workflow run #309 (ID 19367826821) — génération UTC 2025-11-14T14:36:46.112Z_

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

**Statut:** ✅ success

**Dernier run:** 14/11/2025 15:31:21

**Statistiques:**
- ❌ Échecs (24h): **6**
- ❌ Échecs (7 jours): **7**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #168 - 14/11/2025 14:56:12

- **Commit:** `bc0d2a6`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19366744143)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
    - **Erreurs détectées (10):**
      ```
File: src/lib/error-handling.ts:141
Error: 🚨 DooDates Error: {

🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Erreur synchronisation Supabase (non-bloquant)\n' +
'    at Object.storage (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:141:5)\n' +
```
      ```
File: src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:54
Error: originalError: Error: Supabase not available in tests

originalError: Error: Supabase not available in tests
at /home/runner/work/DooDates/DooDates/src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:54:49
🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Erreur synchronisation Supabase (non-bloquant)\n' +
'    at Object.storage (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:141:5)\n' +
```
      ```
File: src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:54
Error: originalError: Error: Supabase not available in tests

originalError: Error: Supabase not available in tests
at /home/runner/work/DooDates/DooDates/src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:54:49
🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Erreur Supabase\n' +
'    at Object.storage (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:141:5)\n' +
```
      ```
File: src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:55
Error: originalError: Error: Supabase not available in tests

originalError: Error: Supabase not available in tests
at /home/runner/work/DooDates/DooDates/src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:55:42
🚨 DooDates Error: {
name: 'DooDatesError',
stack: "DooDatesError: Erreur Supabase lors de l'ajout du message\n" +
'    at Object.storage (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:141:5)\n' +
```
      ```
File: src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:55
Error: error: Error: Supabase not available in tests

error: Error: Supabase not available in tests
at /home/runner/work/DooDates/DooDates/src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:55:42
errorMessage: 'Supabase not available in tests'
error: Error: Supabase not available in tests
```
      *... et 5 autre(s) erreur(s)*

#### Run #167 - 14/11/2025 14:31:35

- **Commit:** `6aab09b`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19366130310)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

#### Run #166 - 14/11/2025 13:56:57

- **Commit:** `6c30ea0`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19365259986)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

#### Run #165 - 14/11/2025 13:41:21

- **Commit:** `2c6cc2c`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19364893110)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`

#### Run #164 - 14/11/2025 13:35:15

- **Commit:** `8388b7b`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19364749935)
- **Jobs en échec:**
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ⏳ unknown

**Dernier run:** 14/11/2025 15:36:01

**Statistiques:**
- ❌ Échecs (24h): **1**
- ❌ Échecs (7 jours): **13**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #79 - 14/11/2025 15:17:51

- **Commit:** `cceff68`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19367324184)
- **Jobs en échec:**
  - ❌ `📋 Form Poll Regression - Suite Complète (Serial)` (failure)
    - Steps en échec: `📋 Run Form Poll Regression Suite (Serial - No Sharding)`
    - **Erreurs détectées (9):**
      ```
Error: "error": {
Locator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n",
Expected: \n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n",
Locator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-regression.spec.ts:199:31",
Expected: 31",

"error": {
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n",
"stack": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n    at /ho
... (truncated)
```
      ```
Error: "message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n\n  197 |       log(`📊 Nombre d'inputs trouvés : ${inputCount}`);\n  198 |       \n> 199 |       await expect(chatInput).toBeVisible({ timeout: 10000 });\n      |                               ^\n  200 |       log('✅ Chat input visible');\n  201 |       \n  202 |       const isDisabled = await chatInput.isDisabled();\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-regression.spec.ts:199:31"
Locator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n\n  197 |       log(`📊 Nombre d'inputs trouvés : ${inputCount}`);\n  198 |       \n> 199 |       await expect(chatInput).toBeVisible({ timeout: 10000 });\n      |                               ^\n  200 |       log('✅ Chat input visible');\n  201 |       \n  202 |       const isDisabled = await chatInput.isDisabled();\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-regression.spec.ts:199:31"
Expected: 31"

"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n\n  197 |       log(`📊 Nombre d'inputs trouvés : ${inputCount}`);\n  198 |       \n> 199 |       await expect(chatInput).toBeVisible({ timeout: 10000 });\n      |                               ^\n  200 |       log('✅ Chat input visible');\n  201 |       \n  202 |       const isDisabled = await chatInput.isDisabled();\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-regression.spec.ts:199:31"
... (truncated)
```
      ```
Error: "error": {
Locator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n",
Expected: \n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n",
Locator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-regression.spec.ts:199:31",
Expected: 31",

"error": {
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n",
"stack": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n    at /ho
... (truncated)
```
      ```
Error: "message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n\n  197 |       log(`📊 Nombre d'inputs trouvés : ${inputCount}`);\n  198 |       \n> 199 |       await expect(chatInput).toBeVisible({ timeout: 10000 });\n      |                               ^\n  200 |       log('✅ Chat input visible');\n  201 |       \n  202 |       const isDisabled = await chatInput.isDisabled();\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-regression.spec.ts:199:31"
Locator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n\n  197 |       log(`📊 Nombre d'inputs trouvés : ${inputCount}`);\n  198 |       \n> 199 |       await expect(chatInput).toBeVisible({ timeout: 10000 });\n      |                               ^\n  200 |       log('✅ Chat input visible');\n  201 |       \n  202 |       const isDisabled = await chatInput.isDisabled();\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-regression.spec.ts:199:31"
Expected: 31"

"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n\n  197 |       log(`📊 Nombre d'inputs trouvés : ${inputCount}`);\n  198 |       \n> 199 |       await expect(chatInput).toBeVisible({ timeout: 10000 });\n      |                               ^\n  200 |       log('✅ Chat input visible');\n  201 |       \n  202 |       const isDisabled = await chatInput.isDisabled();\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-regression.spec.ts:199:31"
... (truncated)
```
      ```
Error: "error": {
Locator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n",
Expected: \n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n",
Locator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-regression.spec.ts:199:31",
Expected: 31",

"error": {
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n",
"stack": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n    at /ho
... (truncated)
```
      *... et 4 autre(s) erreur(s)*

---

## 📈 Résumé Global

- ❌ **Total échecs (24h):** 7
- ❌ **Total échecs (7 jours):** 13
- 📊 **Workflows monitorés:** 6

### ⚠️ Recommandations

Des échecs ont été détectés dans les 24 dernières heures. Consultez les sections ci-dessus pour plus de détails.

