# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 07/11/2025 09:28:08

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

**Dernier run:** 07/11/2025 09:22:04

**Statistiques:**
- ❌ Échecs (24h): **7**
- ❌ Échecs (7 jours): **8**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #71 - 07/11/2025 09:22:04

- **Commit:** `6da5d06`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19162482977)
- **Jobs en échec:**
  - ❌ `production-smoke-pre-merge` (failure)
    - Steps en échec: `🔥 Run production smoke tests`
    - **Erreurs détectées (9):**
      ```
File: tests/e2e/production-smoke.spec.ts:138
Error: "errors": [],

"errors": [],
"errors": [],
"error": {
"message": "Error: \u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoBe\u001b(\u001b\u001b[32mexpected\u001b\u001b) // Object.is equality\u001b\n\nExpected: \u001b[32m0\u001b\nReceived: \u001b[31m1\u001b",
"stack": "Error: \u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoBe\u001b(\u001b\u001b[32mexpected\u001b\u001b) // Object.is equality\u001b\n\nExpected: \u001b[32m0\u001b\nReceived: \u001b[31m1\u001b\n    at /home/runner/work/DooDates/DooDates/tests/e2e/production-smoke.spec.ts:138:34",
```
      ```
File: tests/e2e/production-smoke.spec.ts:138
Error: "snippet": "\u001b[0m \u001b 136 |\u001b     }\n \u001b 137 |\u001b     \n\u001b[31m\u001b[1m>\u001b\u001b\u001b 138 |\u001b     expect(consoleErrors\u001b[33m.\u001blength)\u001b[33m.\u001btoBe(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b     |\u001b                                  \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 139 |\u001b   })\u001b[33m;\u001b\n \u001b 140 |\u001b\n \u001b 141 |\u001b   \u001b/**\u001b\u001b[0m"

"snippet": "\u001b[0m \u001b 136 |\u001b     }\n \u001b 137 |\u001b     \n\u001b[31m\u001b[1m>\u001b\u001b\u001b 138 |\u001b     expect(consoleErrors\u001b[33m.\u001blength)\u001b[33m.\u001btoBe(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b     |\u001b                                  \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 139 |\u001b   })\u001b[33m;\u001b\n \u001b 140 |\u001b\n \u001b 141 |\u001b   \u001b/**\u001b\u001b[0m"
"errors": [
"message": "Error: \u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoBe\u001b(\u001b\u001b[32mexpected\u001b\u001b) // Object.is equality\u001b\n\nExpected: \u001b[32m0\u001b\nReceived: \u001b[31m1\u001b\n\n  136 |     }\n  137 |     \n> 138 |     expect(consoleErrors.length).toBe(0);\n      |                                  ^\n  139 |   });\n  
... (truncated)
```
      ```
File: tests/e2e/production-smoke.spec.ts:138
Error: "path": "/home/runner/work/DooDates/DooDates/test-results/production-smoke-🔥-Produc-226ec-d-erreurs-console-critiques-chromium/error-context.md"

"path": "/home/runner/work/DooDates/DooDates/test-results/production-smoke-🔥-Produc-226ec-d-erreurs-console-critiques-chromium/error-context.md"
"errorLocation": {
"error": {
"message": "Error: \u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoBe\u001b(\u001b\u001b[32mexpected\u001b\u001b) // Object.is equality\u001b\n\nExpected: \u001b[32m0\u001b\nReceived: \u001b[31m1\u001b",
"stack": "Error: \u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoBe\u001b(\u001b\u001b[32mexpected\u001b\u001b) // Object.is equality\u001b\n\nExpected: \u001b[32m0\u001b\nReceived: \u001b[31m1\u001b\n    at /home/runner/work/DooDates/DooDates/tests/e2e/production-smoke.spec.ts:138:34",
```
      ```
File: tests/e2e/production-smoke.spec.ts:138
Error: "snippet": "\u001b[0m \u001b 136 |\u001b     }\n \u001b 137 |\u001b     \n\u001b[31m\u001b[1m>\u001b\u001b\u001b 138 |\u001b     expect(consoleErrors\u001b[33m.\u001blength)\u001b[33m.\u001btoBe(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b     |\u001b                                  \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 139 |\u001b   })\u001b[33m;\u001b\n \u001b 140 |\u001b\n \u001b 141 |\u001b   \u001b/**\u001b\u001b[0m"

"snippet": "\u001b[0m \u001b 136 |\u001b     }\n \u001b 137 |\u001b     \n\u001b[31m\u001b[1m>\u001b\u001b\u001b 138 |\u001b     expect(consoleErrors\u001b[33m.\u001blength)\u001b[33m.\u001btoBe(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b     |\u001b                                  \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 139 |\u001b   })\u001b[33m;\u001b\n \u001b 140 |\u001b\n \u001b 141 |\u001b   \u001b/**\u001b\u001b[0m"
"errors": [
"message": "Error: \u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoBe\u001b(\u001b\u001b[32mexpected\u001b\u001b) // Object.is equality\u001b\n\nExpected: \u001b[32m0\u001b\nReceived: \u001b[31m1\u001b\n\n  136 |     }\n  137 |     \n> 138 |     expect(consoleErrors.length).toBe(0);\n      |                                  ^\n  139 |   });\n  
... (truncated)
```
      ```
File: tests/e2e/production-smoke.spec.ts:138
Error: "path": "/home/runner/work/DooDates/DooDates/test-results/production-smoke-🔥-Produc-226ec-d-erreurs-console-critiques-chromium-retry1/error-context.md"

"path": "/home/runner/work/DooDates/DooDates/test-results/production-smoke-🔥-Produc-226ec-d-erreurs-console-critiques-chromium-retry1/error-context.md"
"errorLocation": {
"error": {
"message": "Error: \u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoBe\u001b(\u001b\u001b[32mexpected\u001b\u001b) // Object.is equality\u001b\n\nExpected: \u001b[32m0\u001b\nReceived: \u001b[31m1\u001b",
"stack": "Error: \u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoBe\u001b(\u001b\u001b[32mexpected\u001b\u001b) // Object.is equality\u001b\n\nExpected: \u001b[32m0\u001b\nReceived: \u001b[31m1\u001b\n    at /home/runner/work/DooDates/DooDates/tests/e2e/production-smoke.spec.ts:138:34",
```
      *... et 4 autre(s) erreur(s)*

#### Run #64 - 07/11/2025 00:37:22

- **Commit:** `06ae38d`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19153200043)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

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

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ✅ success

**Dernier run:** 07/11/2025 09:01:45

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

- ❌ **Total échecs (24h):** 5
- ❌ **Total échecs (7 jours):** 8
- 📊 **Workflows monitorés:** 6

### ⚠️ Recommandations

Des échecs ont été détectés dans les 24 dernières heures. Consultez les sections ci-dessus pour plus de détails.

