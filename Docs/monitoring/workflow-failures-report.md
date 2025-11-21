# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 21/11/2025 12:12:22

_Workflow run #507 (ID 19568659122) — génération UTC 2025-11-21T11:12:22.717Z_

## 🎯 Focus: Commit `ef9d60c`

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

Tous les workflows surveillés ont réussi pour le commit `ef9d60c`.

---

## 2️⃣ Develop → Main (Auto-merge)

**Statut:** ✅ success

**Dernier run:** 21/11/2025 12:04:41

**Statistiques:**
- 📊 **Total runs pour ce commit:** **0**
- ❌ **Échecs pour ce commit:** **0**
### ✅ Aucun échec pour ce commit

Tous les workflows surveillés ont réussi pour le commit `ef9d60c`.

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ❌ failure

**Dernier run:** 21/11/2025 12:08:27

**Statistiques:**
- 📊 **Total runs pour ce commit:** **1**
- ❌ **Échecs pour ce commit:** **1**
### 🔴 Échecs du commit actuel

#### Run #93 - 21/11/2025 12:08:27

- **Commit:** `ef9d60c`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Statut:** failure
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19568577769)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (2)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 2/2)`
    - **Erreurs détectées (8):**
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"error": {
"message": "TimeoutError: locator.waitFor: Timeout 10000ms exceeded.\nCall log:\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]').first()\u001b\n",
"stack": "TimeoutError: locator.waitFor: Timeout 10000ms exceeded.\nCall log:\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]').first()\u001b\n\n    at robustFill (/home/runner/work/DooDates/DooDates/tests/e2e/utils.ts:254:19)\n    at createFormWithDateQuestion (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-helpers.ts:357:9)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-date-question.spec.ts:30:21",
```
      ```
Error: "errors": [

"errors": [
"message": "TimeoutError: locator.waitFor: Timeout 10000ms exceeded.\nCall log:\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]').first()\u001b\n\n\n   at utils.ts:254\n\n  252 |     // 1. Attendre que l'élément soit attaché au DOM\n  253 |     log('1. Waiting for element to be attached...');\n> 254 |     await locator.waitFor({ state: 'attached', timeout });\n      |                   ^\n  255 |     log('✅ Element attached');\n  256 |\n  257 |     // 2. Attendre la stabilité du composant (race condition + re-rendering)\n    at robustFill (/home/runner/work/DooDates/DooDates/tests/e2e/utils.ts:254:19)\n    at createFormWithDateQuestion (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-helpers.ts:357:9)\n    at /home
... (truncated)
```
      ```
Error: "errorLocation": {

"errorLocation": {
"error": {
"message": "TimeoutError: locator.waitFor: Timeout 10000ms exceeded.\nCall log:\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]').first()\u001b\n",
"stack": "TimeoutError: locator.waitFor: Timeout 10000ms exceeded.\nCall log:\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]').first()\u001b\n\n    at robustFill (/home/runner/work/DooDates/DooDates/tests/e2e/utils.ts:254:19)\n    at createFormWithDateQuestion (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-helpers.ts:357:9)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-date-question.spec.ts:30:21",
```
      ```
Error: "errors": [

"errors": [
"message": "TimeoutError: locator.waitFor: Timeout 10000ms exceeded.\nCall log:\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]').first()\u001b\n\n\n   at utils.ts:254\n\n  252 |     // 1. Attendre que l'élément soit attaché au DOM\n  253 |     log('1. Waiting for element to be attached...');\n> 254 |     await locator.waitFor({ state: 'attached', timeout });\n      |                   ^\n  255 |     log('✅ Element attached');\n  256 |\n  257 |     // 2. Attendre la stabilité du composant (race condition + re-rendering)\n    at robustFill (/home/runner/work/DooDates/DooDates/tests/e2e/utils.ts:254:19)\n    at createFormWithDateQuestion (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-helpers.ts:357:9)\n    at /home
... (truncated)
```
      ```
Error: "errorLocation": {

"errorLocation": {
"error": {
"message": "TimeoutError: locator.waitFor: Timeout 10000ms exceeded.\nCall log:\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]').first()\u001b\n",
"stack": "TimeoutError: locator.waitFor: Timeout 10000ms exceeded.\nCall log:\n\u001b  - waiting for locator('input[placeholder*=\"Titre\"], input[placeholder*=\"Questionnaire\"]').first()\u001b\n\n    at robustFill (/home/runner/work/DooDates/DooDates/tests/e2e/utils.ts:254:19)\n    at createFormWithDateQuestion (/home/runner/work/DooDates/DooDates/tests/e2e/helpers/poll-helpers.ts:357:9)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/form-poll-date-question.spec.ts:30:21",
```
      *... et 3 autre(s) erreur(s)*

---

## 📈 Résumé Global

- 🎯 **Focus: Commit actuel** `ef9d60c`
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

*Rapport généré automatiquement par l'analyseur IA - 2025-11-21T11:12:26.385Z*
---

