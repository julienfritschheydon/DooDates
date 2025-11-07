# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 07/11/2025 08:37:09

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

**Dernier run:** 07/11/2025 08:34:00

**Statistiques:**
- ❌ Échecs (24h): **6**
- ❌ Échecs (7 jours): **7**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #64 - 07/11/2025 00:37:22

- **Commit:** `06ae38d`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19153200043)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
    - **Erreurs détectées (10):**
      ```
File: src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:29
Error: [] [4f185223-2d7e-42b5-adf1-d02db22ec173] ❌ Erreur Supabase, fallback localStorage: Error: Supabase not available in tests

[] [4f185223-2d7e-42b5-adf1-d02db22ec173] ❌ Erreur Supabase, fallback localStorage: Error: Supabase not available in tests
at /home/runner/work/DooDates/DooDates/src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:29:49
❌ ℹ️ Erreur lors de la création dans Supabase, utilisation de localStorage Error: Supabase not available in tests
[] [a13e4a82-9ff9-4fad-acfb-bf5f6eb516ea] ❌ Erreur Supabase, fallback localStorage: Error: Supabase not available in tests
```
      ```
File: src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:29
Error: ❌ ℹ️ Erreur lors de la création dans Supabase, utilisation de localStorage Error: Supabase not available in tests

❌ ℹ️ Erreur lors de la création dans Supabase, utilisation de localStorage Error: Supabase not available in tests
at /home/runner/work/DooDates/DooDates/src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:29:49
[] [7449806b-a1ea-4697-aea4-9cb038cf3604] ❌ Erreur Supabase, fallback localStorage: Error: Supabase not available in tests
❌ ℹ️ Erreur lors de la création dans Supabase, utilisation de localStorage Error: Supabase not available in tests
```
      ```
File: src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:29
Error: [] [4924e7ca-2822-4dba-a19a-3dbfeb0c072b] ❌ Erreur Supabase, fallback localStorage: Error: Supabase not available in tests

[] [4924e7ca-2822-4dba-a19a-3dbfeb0c072b] ❌ Erreur Supabase, fallback localStorage: Error: Supabase not available in tests
at /home/runner/work/DooDates/DooDates/src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:29:49
❌ ℹ️ Erreur lors de la création dans Supabase, utilisation de localStorage Error: Supabase not available in tests
[] [88626269-7143-4b60-900d-843494ee3874] ❌ Erreur Supabase, fallback localStorage: TypeError: Cannot read properties of undefined (reading 'id')
```
      ```
File: src/hooks/useAutoSave.ts:138
Error: ❌ ℹ️ Erreur lors de la création dans Supabase, utilisation de localStorage TypeError: Cannot read properties of undefined (reading 'id')

❌ ℹ️ Erreur lors de la création dans Supabase, utilisation de localStorage TypeError: Cannot read properties of undefined (reading 'id')
at /home/runner/work/DooDates/DooDates/src/hooks/useAutoSave.ts:138:103
[] [dbdf914f-2857-4808-87dc-934450d9133e] ❌ Erreur Supabase, fallback localStorage: TypeError: Cannot read properties of undefined (reading 'id')
❌ ℹ️ Erreur lors de la création dans Supabase, utilisation de localStorage TypeError: Cannot read properties of undefined (reading 'id')
```
      ```
File: src/hooks/useAutoSave.ts:138
Error: [] [319108be-ece0-4538-a28d-4cdc816cefd1] ❌ Erreur Supabase, fallback localStorage: TypeError: Cannot read properties of undefined (reading 'id')

[] [319108be-ece0-4538-a28d-4cdc816cefd1] ❌ Erreur Supabase, fallback localStorage: TypeError: Cannot read properties of undefined (reading 'id')
at /home/runner/work/DooDates/DooDates/src/hooks/useAutoSave.ts:138:103
❌ ℹ️ Erreur lors de la création dans Supabase, utilisation de localStorage TypeError: Cannot read properties of undefined (reading 'id')
[] [992d699e-5051-4b46-8cde-30d2ae33c632] ❌ Erreur Supabase, fallback localStorage: TypeError: Cannot read properties of undefined (reading 'id')
```
      *... et 5 autre(s) erreur(s)*

#### Run #63 - 07/11/2025 00:15:05

- **Commit:** `c8055d9`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19152755549)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`

#### Run #62 - 06/11/2025 22:28:17

- **Commit:** `56181eb`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19150412550)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
  - ❌ `build-validation` (failure)
    - Steps en échec: `🧹 Lint (warnings allowed on develop)`
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`

#### Run #57 - 06/11/2025 19:06:56

- **Commit:** `8df910d`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19145287292)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`

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

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ⏳ unknown

**Dernier run:** 07/11/2025 08:36:04

**Statistiques:**
- ❌ Échecs (24h): **0**
- ❌ Échecs (7 jours): **10**
- 📊 Total runs analysés: **20**

### ⚠️ Échecs récents (7 jours)

Aucun échec dans les 24 dernières heures, mais **10** échec(s) cette semaine.

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

- ❌ **Total échecs (24h):** 4
- ❌ **Total échecs (7 jours):** 8
- 📊 **Workflows monitorés:** 6

### ⚠️ Recommandations

Des échecs ont été détectés dans les 24 dernières heures. Consultez les sections ci-dessus pour plus de détails.

