# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 28/11/2025 20:58:05

_Workflow run #638 (ID 19772802930) — génération UTC 2025-11-28T19:58:05.335Z_

## 🎯 Focus: Commit `81863af`

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

Tous les workflows surveillés ont réussi pour le commit `81863af`.

---

## 2️⃣ Develop → Main (Auto-merge)

**Statut:** ✅ success

**Dernier run:** 28/11/2025 20:50:56

**Statistiques:**
- 📊 **Total runs pour ce commit:** **0**
- ❌ **Échecs pour ce commit:** **0**
### ✅ Aucun échec pour ce commit

Tous les workflows surveillés ont réussi pour le commit `81863af`.

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ❌ failure

**Dernier run:** 28/11/2025 20:53:43

**Statistiques:**
- 📊 **Total runs pour ce commit:** **1**
- ❌ **Échecs pour ce commit:** **1**
### 🔴 Échecs du commit actuel

#### Run #110 - 28/11/2025 20:53:43

- **Commit:** `81863af`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Statut:** failure
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19772762924)
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
Locator: locator('#voter-name-input').first()\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('#voter-name-input').first()\u001b\n",
Expected: \n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('#voter-name-input').first()\u001b\n",
Locator: locator('#voter-name-input').first()\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('#voter-name-input').first()\u001b\n\n    at voteOnPollComplete (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-helpers.ts:548:27)\n    at withConsoleGuard.allowlist (/home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:155:11)\n    at withConsoleGuard (/home/runner/work/DooDates/DooDates/tests/e2e/utils.ts:63:12)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:53:5",
Expected: 5",

"errors": [],
"errors": [],
"errors": [],
"error": {
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('#voter-name-input').first()\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('#voter-name-input').first()\u001b\n",
"stack": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('#voter-name-input').first()\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('#voter-name-input').first()\u
... (truncated)
```
      ```
Error: "errors": [
Locator: locator('#voter-name-input').first()\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('#voter-name-input').first()\u001b\n\n\n   at helpers/poll-helpers.ts:548\n\n  546 |   // Remplir le nom du votant\n  547 |   const nameInput = page.locator('#voter-name-input').first();\n> 548 |   await expect(nameInput).toBeVisible({ timeout: timeouts.element });\n      |                           ^\n  549 |   await nameInput.fill(voterName);\n  550 |\n  551 |   // Attendre que le formulaire soit prêt\n    at voteOnPollComplete (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-helpers.ts:548:27)\n    at withConsoleGuard.allowlist (/home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:155:11)\n    at withConsoleGuard (/home/runner/work/DooDates/DooDates/tests/e2e/utils.ts:63:12)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:53:5"
Expected: 5"

"errors": [
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('#voter-name-input').first()\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('#voter-name-input').first()\u001b\n\n\n   at helpers/poll-helpers.ts:548\n\n  546 |   // Remplir le nom du votant\n  547 |   const nameInput = page.locator('#voter-name-input').first();\n> 548 |   await expect(nameInput).toBeVisible({ timeout: timeouts.element });\n      |                           ^\n  549 |   await nameInput.fill(voterName);\n  550 |\n  551 |   // Attendre que le formulaire soit prêt\n    at voteOnPollComplete (/home/runner/
... (truncated)
```
      ```
Error: "errorLocation": {
Locator: locator('#voter-name-input').first()\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('#voter-name-input').first()\u001b\n",
Expected: \n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('#voter-name-input').first()\u001b\n",
Locator: locator('#voter-name-input').first()\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('#voter-name-input').first()\u001b\n\n    at voteOnPollComplete (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-helpers.ts:548:27)\n    at withConsoleGuard.allowlist (/home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:155:11)\n    at withConsoleGuard (/home/runner/work/DooDates/DooDates/tests/e2e/utils.ts:63:12)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:53:5",
Expected: 5",

"errorLocation": {
"error": {
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('#voter-name-input').first()\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('#voter-name-input').first()\u001b\n",
"stack": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('#voter-name-input').first()\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('#voter-name-input').first()\u001b\n\n    at voteOnPo
... (truncated)
```
      ```
Error: "errors": [
Locator: locator('#voter-name-input').first()\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('#voter-name-input').first()\u001b\n\n\n   at helpers/poll-helpers.ts:548\n\n  546 |   // Remplir le nom du votant\n  547 |   const nameInput = page.locator('#voter-name-input').first();\n> 548 |   await expect(nameInput).toBeVisible({ timeout: timeouts.element });\n      |                           ^\n  549 |   await nameInput.fill(voterName);\n  550 |\n  551 |   // Attendre que le formulaire soit prêt\n    at voteOnPollComplete (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-helpers.ts:548:27)\n    at withConsoleGuard.allowlist (/home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:155:11)\n    at withConsoleGuard (/home/runner/work/DooDates/DooDates/tests/e2e/utils.ts:63:12)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/ultra-simple-form.spec.ts:53:5"
Expected: 5"

"errors": [
"message": "Error: \u001bexpect(\u001b\u001b[31mlocator\u001b\u001b).\u001btoBeVisible\u001b(\u001b\u001b)\u001b failed\n\nLocator: locator('#voter-name-input').first()\nExpected: visible\nTimeout: 15000ms\nError: element(s) not found\n\nCall log:\n\u001b  - Expect \"toBeVisible\" with timeout 15000ms\u001b\n\u001b  - waiting for locator('#voter-name-input').first()\u001b\n\n\n   at helpers/poll-helpers.ts:548\n\n  546 |   // Remplir le nom du votant\n  547 |   const nameInput = page.locator('#voter-name-input').first();\n> 548 |   await expect(nameInput).toBeVisible({ timeout: timeouts.element });\n      |                           ^\n  549 |   await nameInput.fill(voterName);\n  550 |\n  551 |   // Attendre que le formulaire soit prêt\n    at voteOnPollComplete (/home/runner/
... (truncated)
```
      *... et 3 autre(s) erreur(s)*

---

## 📈 Résumé Global

- 🎯 **Focus: Commit actuel** `81863af`
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

*Rapport généré automatiquement par l'analyseur IA - 2025-11-28T19:58:09.227Z*
---

