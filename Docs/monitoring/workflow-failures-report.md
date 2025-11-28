# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 28/11/2025 20:13:31

_Workflow run #628 (ID 19772136251) — génération UTC 2025-11-28T19:13:31.375Z_
**Dernière mise à jour:** 28/11/2025 20:10:23

_Workflow run #624 (ID 19772086939) — génération UTC 2025-11-28T19:10:23.788Z_

## 🎯 Focus: Commit `5f7929e`

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

Tous les workflows surveillés ont réussi pour le commit `5f7929e`.

---

## 2️⃣ Develop → Main (Auto-merge)

**Statut:** ✅ success

**Dernier run:** 28/11/2025 20:05:53

**Statistiques:**
- 📊 **Total runs pour ce commit:** **0**
- ❌ **Échecs pour ce commit:** **0**
### ✅ Aucun échec pour ce commit

Tous les workflows surveillés ont réussi pour le commit `5f7929e`.

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ❌ failure
**Statut:** ⏳ unknown

**Dernier run:** 28/11/2025 20:09:24

**Statistiques:**
- 📊 **Total runs pour ce commit:** **1**
- ❌ **Échecs pour ce commit:** **1**
- ❌ **Échecs pour ce commit:** **0**
### 🔴 Échecs du commit actuel

#### Run #107 - 28/11/2025 20:09:24

- **Commit:** `5f7929e`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Statut:** failure
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19772086167)
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
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19772086167)

---

## 📈 Résumé Global

- 🎯 **Focus: Commit actuel** `5f7929e`
- ❌ **Échecs pour ce commit:** 1
- ❌ **Échecs pour ce commit:** 0
- 📊 **Workflows monitorés:** 6

### ⚠️ Recommandations

Des échecs ont été détectés pour le commit actuel. Consultez les sections ci-dessus pour corriger les problèmes avant de pousser d'autres changements.

## 📊 Analyse des 1 échec(s) détecté(s)

**Statistiques :**
- 🔴 Critiques : 0
- 📂 Catégories : performance (1)

### 🚨 1. 3️⃣ Main Post-Merge E2E

**Résumé :** Échec 3️⃣ Main Post-Merge E2E - performance (medium)

**Cause identifiée :** Erreur reconnue : Timeout

**Solutions suggérées :**
1. Augmenter le timeout ou optimiser les opérations asynchrones. Vérifier les attentes Playwright

**ℹ️ Action recommandée :** Résoudre prochainement

---

## 📊 Analyse des 1 échec(s) détecté(s)

**Statistiques :**
- 🔴 Critiques : 1
- 📂 Catégories : unknown (1)

### 🚨 1. 3️⃣ Main Post-Merge E2E

**Résumé :** Échec 3️⃣ Main Post-Merge E2E - unknown (high)

**Cause identifiée :** Erreur non cataloguée - nécessite analyse manuelle

**Solutions suggérées :**
1. Consulter les logs détaillés du workflow

**⚠️ Action requise :** Résoudre immédiatement - bloque le déploiement

---

## 🚨 Actions prioritaires

**1 échec(s) critique(s) détecté(s) :**

1. **3️⃣ Main Post-Merge E2E** - Consulter les logs détaillés du workflow

**Impact :** Ces échecs bloquent potentiellement le déploiement en production.

## 💡 Améliorations suggérées

- **Monitoring :** Ajouter des métriques de performance

## 🔮 Analyse Prédictive (Indisponible)

⚠️ **Service Gemini non configuré**
- Définir la variable `GEMINI_API_KEY` pour activer l'analyse prédictive
- L'analyse de risque et les recommandations proactives seront disponibles

---

*Rapport généré automatiquement par l'analyseur IA - 2025-11-28T19:13:34.539Z*
*Rapport généré automatiquement par l'analyseur IA - 2025-11-28T19:10:26.947Z*
---

