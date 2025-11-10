# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 07/11/2025 23:31:19

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

**Dernier run:** 07/11/2025 23:26:53

**Statistiques:**
- ❌ Échecs (24h): **12**
- ❌ Échecs (7 jours): **12**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #93 - 07/11/2025 23:26:53

- **Commit:** `9e98677`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19182918594)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🔗 Tests d'intégration`
    - **Erreurs détectées (10):**
      ```
File: src/components/polls/PollAnalyticsPanel.tsx:24
Error: stdout | src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts > titleGeneration + useAutoSave Integration > Error Handling Integration > should handle title generation errors gracefully

stdout | src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts > titleGeneration + useAutoSave Integration > Error Handling Integration > should handle title generation errors gracefully
at PollAnalyticsPanel (/home/runner/work/DooDates/DooDates/src/components/polls/PollAnalyticsPanel.tsx:24:31)
❌ ℹ️ Erreur lors du chargement depuis Supabase, utilisation de localStorage Error: Storage error
❌ ℹ️ Erreur lors du chargement depuis Supabase, utilisation de localStorage Error: Storage error
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
File: src/lib/error-handling.ts:103
Error: 🚨 DooDates Error: {

🚨 DooDates Error: {
message: 'API Error',
name: 'DooDatesError',
stack: 'DooDatesError: API Error\n' +
'    at handleError (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:103:22)\n' +
```
      *... et 5 autre(s) erreur(s)*

#### Run #92 - 07/11/2025 23:19:46

- **Commit:** `a1f63de`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19182773429)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🔗 Tests d'intégration`
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`

#### Run #91 - 07/11/2025 23:12:53

- **Commit:** `70ed4b7`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19182625773)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🔗 Tests d'intégration`
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`

#### Run #87 - 07/11/2025 17:02:57

- **Commit:** `f0a18ea`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19173881984)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

#### Run #86 - 07/11/2025 16:58:28

- **Commit:** `b1b9c86`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19173762402)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`
  - ❌ `build-validation` (failure)
    - Steps en échec: `🏗️ Build production`

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ✅ success

**Dernier run:** 07/11/2025 18:24:36

**Statistiques:**
- ❌ Échecs (24h): **0**
- ❌ Échecs (7 jours): **3**
- 📊 Total runs analysés: **20**

### ⚠️ Échecs récents (7 jours)

Aucun échec dans les 24 dernières heures, mais **3** échec(s) cette semaine.

---

## 6️⃣ Nightly Full Regression

**Statut:** ❌ failure

**Dernier run:** 07/11/2025 04:04:00

**Statistiques:**
- ❌ Échecs (24h): **1**
- ❌ Échecs (7 jours): **4**
- 📊 Total runs analysés: **4**

### 🔴 Échecs récents (24h)

#### Run #4 - 07/11/2025 04:04:00

- **Commit:** `698aa0c`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19156822356)
- **Jobs en échec:**
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
Locator: locator('body, form, [role=\"dialog\"]').first()\nExpected: visible\nReceived: undefined\nTimeout:  5000ms\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 5000ms\u001b\n\u001b  - waiting for locator('body, form, [role=\"dialog\"]').first()\u001b\n",
Expected: \n\u001b  - Expect \"toBeVisible\" with timeout 5000ms\u001b\n\u001b  - waiting for locator('body, form, [role=\"dialog\"]').first()\u001b\n",
Locator: locator('body, form, [role=\"dialog\"]').first()\nExpected: visible\nReceived: undefined\nTimeout:  5000ms\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 5000ms\u001b\n\u001b  - waiting for locator('body, form, [role=\"dialog\"]').first()\u001b\n\n    at /home/runner/work/DooDates/DooDates/tests/e2e/authenticated-workflow.spec.ts:57:71",
Expected: 71",

"errors": [],
"errors": [],
"error": {
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator:  locator('body, form, [role=\"dialog\"]').first()\nExpected: visible\nReceived: undefined\nTimeout:  5000ms\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 5000ms\u001b\n\u001b  - waiting for locator('body, form, [role=\"dialog\"]').first()\u001b\n",
"stack": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator:  locator('body, form, [role=\"dialog\"]').first()\nExpected: visible\nReceived: undefined\nTimeout:  5000ms\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 5000ms\u001b\n\u001b  - waiting for locator('body, form, [role=\"dia
... (truncated)
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

---

## 📈 Résumé Global

- ❌ **Total échecs (24h):** 7
- ❌ **Total échecs (7 jours):** 10
- 📊 **Workflows monitorés:** 6

### ⚠️ Recommandations

Des échecs ont été détectés dans les 24 dernières heures. Consultez les sections ci-dessus pour plus de détails.

