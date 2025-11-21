# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 21/11/2025 11:29:49

_Workflow run #504 (ID 19567591281) — génération UTC 2025-11-21T10:29:49.565Z_

## 🎯 Focus: Commit `6020740`

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

Tous les workflows surveillés ont réussi pour le commit `6020740`.

---

## 2️⃣ Develop → Main (Auto-merge)

**Statut:** ❌ failure

**Dernier run:** 21/11/2025 11:24:58

**Statistiques:**
- 📊 **Total runs pour ce commit:** **0**
- ❌ **Échecs pour ce commit:** **0**
### ✅ Aucun échec pour ce commit

Tous les workflows surveillés ont réussi pour le commit `6020740`.

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ❌ failure

**Dernier run:** 21/11/2025 10:02:19

**Statistiques:**
- 📊 **Total runs pour ce commit:** **1**
- ❌ **Échecs pour ce commit:** **1**
### 🔴 Échecs du commit actuel

#### Run #92 - 21/11/2025 10:02:19

- **Commit:** `6020740`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Statut:** failure
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19565372641)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (2)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 2/2)`
    - **Erreurs détectées (10):**
      ```
Error: "errors": [],
Locator: locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\u001b\n",
Expected: \n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\u001b\n",
Locator: locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\u001b\n\n    at createFormWithDateQuestion (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-helpers.ts:349:28)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-date-question.spec.ts:30:21",
Expected: 21",

"errors": [],
"errors": [],
"error": {
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\u001b\n",
"stack": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b
... (truncated)
```
      ```
Error: "errors": [
Locator: locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\u001b\n\n\n   at helpers/poll-helpers.ts:349\n\n  347 |   // Attendre que l'interface soit prête\n  348 |   const titleInput = page.locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]');\n> 349 |   await expect(titleInput).toBeVisible({ timeout: timeouts.element });\n      |                            ^\n  350 |   \n  351 |   // Mettre le titre\n  352 |   console.log(`[DEBUG] Définition du titre: ${formTitle}`);\n    at createFormWithDateQuestion (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-helpers.ts:349:28)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-date-question.spec.ts:30:21"
Expected: 21"

"errors": [
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\u001b\n\n\n   at helpers/poll-helpers.ts:349\n\n  347 |   // Attendre que l'interface soit prête\n  348 |   const titleInput = page.locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]');\n> 349 |   await expect(titleInput).toBeVisible({ timeout: timeouts.element });\n      |                            ^\n 
... (truncated)
```
      ```
Error: "errorLocation": {
Locator: locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\u001b\n",
Expected: \n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\u001b\n",
Locator: locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\u001b\n\n    at createFormWithDateQuestion (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-helpers.ts:349:28)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-date-question.spec.ts:30:21",
Expected: 21",

"errorLocation": {
"error": {
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\u001b\n",
"stack": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expec
... (truncated)
```
      ```
Error: "errors": [
Locator: locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\u001b\n\n\n   at helpers/poll-helpers.ts:349\n\n  347 |   // Attendre que l'interface soit prête\n  348 |   const titleInput = page.locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]');\n> 349 |   await expect(titleInput).toBeVisible({ timeout: timeouts.element });\n      |                            ^\n  350 |   \n  351 |   // Mettre le titre\n  352 |   console.log(`[DEBUG] Définition du titre: ${formTitle}`);\n    at createFormWithDateQuestion (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-helpers.ts:349:28)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-date-question.spec.ts:30:21"
Expected: 21"

"errors": [
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\u001b\n\n\n   at helpers/poll-helpers.ts:349\n\n  347 |   // Attendre que l'interface soit prête\n  348 |   const titleInput = page.locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]');\n> 349 |   await expect(titleInput).toBeVisible({ timeout: timeouts.element });\n      |                            ^\n 
... (truncated)
```
      ```
Error: "errorLocation": {
Locator: locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\u001b\n",
Expected: \n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\u001b\n",
Locator: locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\u001b\n\n    at createFormWithDateQuestion (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-helpers.ts:349:28)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-date-question.spec.ts:30:21",
Expected: 21",

"errorLocation": {
"error": {
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\u001b\n",
"stack": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]')\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expec
... (truncated)
```
      *... et 5 autre(s) erreur(s)*

---

## 📈 Résumé Global

- 🎯 **Focus: Commit actuel** `6020740`
- ❌ **Échecs pour ce commit:** 1
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

## 💡 Améliorations suggérées

- **Monitoring :** Ajouter des métriques de performance

## 🔮 Analyse Prédictive (Indisponible)

⚠️ **Service Gemini non configuré**
- Définir la variable `GEMINI_API_KEY` pour activer l'analyse prédictive
- L'analyse de risque et les recommandations proactives seront disponibles

---

*Rapport généré automatiquement par l'analyseur IA - 2025-11-21T10:29:53.892Z*
---

