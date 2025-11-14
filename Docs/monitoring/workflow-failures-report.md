# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 13/11/2025 17:14:59

_Workflow run #291 (ID 19338054404) — génération UTC 2025-11-13T16:14:59.328Z_

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

**Dernier run:** 13/11/2025 17:13:34

**Statistiques:**
- ❌ Échecs (24h): **7**
- ❌ Échecs (7 jours): **7**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #155 - 13/11/2025 11:58:20

- **Commit:** `5c261ed`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19329223008)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
    - **Erreurs détectées (10):**
      ```
File: src/components/polls/PollAnalyticsPanel.tsx:24
Error: ↓ titleGeneration + useAutoSave Integration > Error Handling Integration > should handle title generation errors gracefully

↓ titleGeneration + useAutoSave Integration > Error Handling Integration > should handle title generation errors gracefully
✓ titleGeneration + useAutoSave Integration > Error Handling Integration > should handle empty message arrays in title generation 3ms
at PollAnalyticsPanel (/home/runner/work/DooDates/DooDates/src/components/polls/PollAnalyticsPanel.tsx:24:31)
❌ ℹ️ Erreur lors du chargement depuis Supabase, utilisation de localStorage Error: Storage error
```
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
      *... et 5 autre(s) erreur(s)*

#### Run #148 - 13/11/2025 09:25:57

- **Commit:** `d5ee9bf`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19325188826)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

#### Run #147 - 13/11/2025 09:05:47

- **Commit:** `7eb6530`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19324701452)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

#### Run #146 - 13/11/2025 07:44:17

- **Commit:** `e5de845`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19322981577)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

#### Run #145 - 12/11/2025 23:59:35

- **Commit:** `970e384`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19314555729)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ✅ success

**Dernier run:** 13/11/2025 16:57:48

**Statistiques:**
- ❌ Échecs (24h): **10**
- ❌ Échecs (7 jours): **12**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #76 - 13/11/2025 14:43:02

- **Commit:** `85377e4`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19333583885)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (1)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 1/2)`
    - **Erreurs détectées (10):**
      ```
File: tests/e2e/analytics-ai-optimized.spec.ts:421
Error: "error": {

"error": {
"message": "Error: L'IA a retourné une erreur: Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?",
"stack": "Error: L'IA a retourné une erreur: Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?\n    at createPollWithVotesAndClose (/home/runner/work/DooDates/DooDates/tests/e2e/analytics-ai-optimized.spec.ts:76:11)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/analytics-ai-optimized.spec.ts:421:25",
"snippet": "\u001b[0m \u001b 74 |\u001b   \u001b[36mif\u001b (hasError) {\n \u001b 75 |\u001b     \u001b[36mconst\u001b errorContent \u001b[33m=\u001b \u001b[36mawait\u001b errorText\u001b[33m.\u001btextContent()\u001b[33m;\u001b\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 76 |\u001b     \u001b[36mthrow\u001b \u001
... (truncated)
```
      ```
Error: "errors": [

"errors": [
"message": "Error: L'IA a retourné une erreur: Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?\n\n  74 |   if (hasError) {\n  75 |     const errorContent = await errorText.textContent();\n> 76 |     throw new Error(`L'IA a retourné une erreur: ${errorContent}`);\n     |           ^\n  77 |   }\n  78 |   \n  79 |   await expect(successText).toBeVisible({ timeout: 5000 });\n    at createPollWithVotesAndClose (/home/runner/work/DooDates/DooDates/tests/e2e/analytics-ai-optimized.spec.ts:76:11)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/analytics-ai-optimized.spec.ts:421:25"
"name": "error-context",
"path": "/home/runner/work/DooDates/DooDates/test-results/analytics-ai-optimized-Ana-8af5d-et-Cache-combiné-functional-chromium/error-conte
... (truncated)
```
      ```
File: tests/e2e/analytics-ai-optimized.spec.ts:421
Error: "errorLocation": {

"errorLocation": {
"error": {
"message": "Error: L'IA a retourné une erreur: Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?",
"stack": "Error: L'IA a retourné une erreur: Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?\n    at createPollWithVotesAndClose (/home/runner/work/DooDates/DooDates/tests/e2e/analytics-ai-optimized.spec.ts:76:11)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/analytics-ai-optimized.spec.ts:421:25",
```
      ```
Error: "snippet": "\u001b[0m \u001b 74 |\u001b   \u001b[36mif\u001b (hasError) {\n \u001b 75 |\u001b     \u001b[36mconst\u001b errorContent \u001b[33m=\u001b \u001b[36mawait\u001b errorText\u001b[33m.\u001btextContent()\u001b[33m;\u001b\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 76 |\u001b     \u001b[36mthrow\u001b \u001b[36mnew\u001b \u001b[33mError\u001b(\u001b[32m`L'IA a retourné une erreur: ${errorContent}`\u001b)\u001b[33m;\u001b\n \u001b    |\u001b           \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 77 |\u001b   }\n \u001b 78 |\u001b   \n \u001b 79 |\u001b   \u001b[36mawait\u001b expect(successText)\u001b[33m.\u001btoBeVisible({ timeout\u001b[33m:\u001b \u001b[35m5000\u001b })\u001b[33m;\u001b\u001b[0m"

"snippet": "\u001b[0m \u001b 74 |\u001b   \u001b[36mif\u001b (hasError) {\n \u001b 75 |\u001b     \u001b[36mconst\u001b errorContent \u001b[33m=\u001b \u001b[36mawait\u001b errorText\u001b[33m.\u001btextContent()\u001b[33m;\u001b\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 76 |\u001b     \u001b[36mthrow\u001b \u001b[36mnew\u001b \u001b[33mError\u001b(\u001b[32m`L'IA a retourné une erreur: ${errorContent}`\u001b)\u001b[33m;\u001b\n \u001b    |\u001b           \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 77 |\u001b   }\n \u001b 78 |\u001b   \n \u001b 79 |\u001b   \u001b[36mawait\u001b expect(successText)\u001b[33m.\u001btoBeVisible({ timeout\u001b[33m:\u001b \u001b[35m5000\u001b })\u001b[33m;\u001b\u001b[0m"
"errors": [
"message": "Error: L'IA a retourné une erreur: Désolé, je n'ai pas pu traiter v
... (truncated)
```
      ```
File: tests/e2e/analytics-ai-optimized.spec.ts:421
Error: "path": "/home/runner/work/DooDates/DooDates/test-results/analytics-ai-optimized-Ana-8af5d-et-Cache-combiné-functional-chromium-retry1/error-context.md"

"path": "/home/runner/work/DooDates/DooDates/test-results/analytics-ai-optimized-Ana-8af5d-et-Cache-combiné-functional-chromium-retry1/error-context.md"
"errorLocation": {
"error": {
"message": "Error: L'IA a retourné une erreur: Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?",
"stack": "Error: L'IA a retourné une erreur: Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?\n    at createPollWithVotesAndClose (/home/runner/work/DooDates/DooDates/tests/e2e/analytics-ai-optimized.spec.ts:76:11)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/analytics-ai-optimized.spec.ts:421:25",
```
      *... et 5 autre(s) erreur(s)*

#### Run #75 - 13/11/2025 14:33:22

- **Commit:** `2935311`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19333314624)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (1)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 1/2)`

#### Run #74 - 13/11/2025 12:36:58

- **Commit:** `b910182`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19330233710)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (1)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 1/2)`

#### Run #73 - 13/11/2025 12:22:35

- **Commit:** `79619e8`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19329860428)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (1)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 1/2)`

#### Run #72 - 13/11/2025 11:57:55

- **Commit:** `ac9fd04`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19329212933)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (1)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 1/2)`

---

## 📈 Résumé Global

- ❌ **Total échecs (24h):** 9
- ❌ **Total échecs (7 jours):** 9
- 📊 **Workflows monitorés:** 6

### ⚠️ Recommandations

Des échecs ont été détectés dans les 24 dernières heures. Consultez les sections ci-dessus pour plus de détails.

