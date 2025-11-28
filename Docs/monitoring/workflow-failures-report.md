# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 28/11/2025 20:37:48

_Workflow run #632 (ID 19772522785) — génération UTC 2025-11-28T19:37:48.414Z_
**Dernière mise à jour:** 28/11/2025 20:34:44

_Workflow run #629 (ID 19772484792) — génération UTC 2025-11-28T19:34:44.228Z_

## 🎯 Focus: Commit `d4f9c0a`

**Branche:** `main`
**Workflow déclencheur:** `unknown`

> Ce rapport analyse **UNIQUEMENT** les échecs du commit actuel.

> Il peut être consulté par l'IA pour comprendre l'état de santé du CI/CD.

---

## 1️⃣ PR Complete Validation

**Statut:** ❌ failure

**Dernier run:** 19/11/2025 19:23:32

**Statistiques:**
- 📊 **Total runs pour ce commit:** **0**
- ❌ **Échecs pour ce commit:** **0**
### ✅ Aucun échec pour ce commit

Tous les workflows surveillés ont réussi pour le commit `d4f9c0a`.

---

## 2️⃣ Develop → Main (Auto-merge)

**Statut:** ✅ success

**Dernier run:** 28/11/2025 20:31:01

**Statistiques:**
- 📊 **Total runs pour ce commit:** **0**
- ❌ **Échecs pour ce commit:** **0**
### ✅ Aucun échec pour ce commit

Tous les workflows surveillés ont réussi pour le commit `d4f9c0a`.

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ❌ failure
**Statut:** ⏳ unknown

**Dernier run:** 28/11/2025 20:33:58

**Statistiques:**
- 📊 **Total runs pour ce commit:** **1**
- ❌ **Échecs pour ce commit:** **1**
- ❌ **Échecs pour ce commit:** **0**
### 🔴 Échecs du commit actuel

#### Run #108 - 28/11/2025 20:33:58

- **Commit:** `d4f9c0a`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Statut:** failure
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19772484196)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (2)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 2/2)`
    - **Erreurs détectées (8):**
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],
Locator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n",
Expected: \n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n",
Locator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n    at createFormPollViaAI (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-form-helpers.ts:53:27)\n    at withConsoleGuard.allowlist (/home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:62:9)\n    at withConsoleGuard (/home/runner/work/DooDates/DooDates/tests/e2e/utils.ts:63:12)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:53:5",
Expected: 5",

"errors": [],
"errors": [],
"errors": [],
"error": {
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n",
"stack": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testi
... (truncated)
```
      ```
Error: "errors": [
Locator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n\n   at helpers/poll-form-helpers.ts:53\n\n  51 |\n  52 |   const chatInput = page.locator('[data-testid=\"message-input\"]');\n> 53 |   await expect(chatInput).toBeVisible({ timeout: 10000 });\n     |                           ^\n  54 |\n  55 |   await robustFill(chatInput, prompt, { debug: process.env.DEBUG_E2E === '1' });\n  56 |\n    at createFormPollViaAI (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-form-helpers.ts:53:27)\n    at withConsoleGuard.allowlist (/home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:62:9)\n    at withConsoleGuard (/home/runner/work/DooDates/DooDates/tests/e2e/utils.ts:63:12)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:53:5"
Expected: 5"

"errors": [
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n\n   at helpers/poll-form-helpers.ts:53\n\n  51 |\n  52 |   const chatInput = page.locator('[data-testid=\"message-input\"]');\n> 53 |   await expect(chatInput).toBeVisible({ timeout: 10000 });\n     |                           ^\n  54 |\n  55 |   await robustFill(chatInput, prompt, { debug: process.env.DEBUG_E2E === '1' });\n  56 |\n    at createFormPollViaAI (/home/runner/work/DooDates/DooDate
... (truncated)
```
      ```
Error: "errorLocation": {
Locator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n",
Expected: \n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n",
Locator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n    at createFormPollViaAI (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-form-helpers.ts:53:27)\n    at withConsoleGuard.allowlist (/home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:62:9)\n    at withConsoleGuard (/home/runner/work/DooDates/DooDates/tests/e2e/utils.ts:63:12)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:53:5",
Expected: 5",

"errorLocation": {
"error": {
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n",
"stack": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\
... (truncated)
```
      ```
Error: "errors": [
Locator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n\n   at helpers/poll-form-helpers.ts:53\n\n  51 |\n  52 |   const chatInput = page.locator('[data-testid=\"message-input\"]');\n> 53 |   await expect(chatInput).toBeVisible({ timeout: 10000 });\n     |                           ^\n  54 |\n  55 |   await robustFill(chatInput, prompt, { debug: process.env.DEBUG_E2E === '1' });\n  56 |\n    at createFormPollViaAI (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-form-helpers.ts:53:27)\n    at withConsoleGuard.allowlist (/home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:62:9)\n    at withConsoleGuard (/home/runner/work/DooDates/DooDates/tests/e2e/utils.ts:63:12)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:53:5"
Expected: 5"

"errors": [
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('[data-testid=\"message-input\"]')\nExpected: visible\nTimeout: 10000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 10000ms\u001b\n\u001b  - waiting for locator('[data-testid=\"message-input\"]')\u001b\n\n\n   at helpers/poll-form-helpers.ts:53\n\n  51 |\n  52 |   const chatInput = page.locator('[data-testid=\"message-input\"]');\n> 53 |   await expect(chatInput).toBeVisible({ timeout: 10000 });\n     |                           ^\n  54 |\n  55 |   await robustFill(chatInput, prompt, { debug: process.env.DEBUG_E2E === '1' });\n  56 |\n    at createFormPollViaAI (/home/runner/work/DooDates/DooDate
... (truncated)
```
      *... et 3 autre(s) erreur(s)*
- **Statut:** null
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19772484196)

---

## 📈 Résumé Global

- 🎯 **Focus: Commit actuel** `d4f9c0a`
- ❌ **Échecs pour ce commit:** 1
- ❌ **Échecs pour ce commit:** 0
- 📊 **Workflows monitorés:** 6

### ✅ État de santé

Le commit actuel passe tous les tests CI/CD. Vous pouvez continuer vos développements en toute sérénité !

## 💡 Améliorations suggérées

- **Monitoring :** Ajouter des métriques de performance

## 🔮 Analyse Prédictive (Indisponible)

⚠️ **Service Gemini non configuré**
- Définir la variable `GEMINI_API_KEY` pour activer l'analyse prédictive
- L'analyse de risque et les recommandations proactives seront disponibles

---

*Rapport généré automatiquement par l'analyseur IA - 2025-11-28T19:37:51.295Z*
*Rapport généré automatiquement par l'analyseur IA - 2025-11-28T19:34:46.930Z*
---

