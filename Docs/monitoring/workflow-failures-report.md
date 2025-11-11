# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 11/11/2025 11:14:00

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

**Dernier run:** 11/11/2025 11:09:00

**Statistiques:**
- ❌ Échecs (24h): **4**
- ❌ Échecs (7 jours): **4**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #126 - 11/11/2025 11:09:00

- **Commit:** `c8cb6ec`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19262176055)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
    - **Erreurs détectées (10):**
      ```
File: src/lib/error-handling.ts:141
Error: 🚨 DooDates Error: {

🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Erreur Supabase, fallback localStorage\n' +
'    at Object.storage (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:141:5)\n' +
```
      ```
File: 2025-11-11T10:10:23.1651449Z     at VitestMocker.createError (file:///home/runner/work/DooDates/DooDates/node_modules/vitest/dist/chunks/execute.B7h3T_Hc.js:284
Error: error: [Error]

error: [Error]
❌ ℹ️ Erreur lors de la création dans Supabase, utilisation de localStorage Error: [vitest] No "incrementConversationCreated" export is defined on the "../../quotaTracking" mock. Did you forget to return it from "vi.mock"?
at VitestMocker.createError (file:///home/runner/work/DooDates/DooDates/node_modules/vitest/dist/chunks/execute.B7h3T_Hc.js:284:17)
🚨 DooDates Error: {
```
      ```
File: src/lib/error-handling.ts:141
Error: name: 'DooDatesError',

name: 'DooDatesError',
stack: 'DooDatesError: Erreur dans createConversation\n' +
'    at Object.storage (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:141:5)\n' +
error: [Error],
isQuotaError: false
```
      ```
File: src/lib/error-handling.ts:141
Error: 🚨 DooDates Error: {

🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Erreur dans addMessage\n' +
'    at Object.storage (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:141:5)\n' +
```
      ```
File: 2025-11-11T10:10:23.1748559Z     at VitestMocker.createError (file:///home/runner/work/DooDates/DooDates/node_modules/vitest/dist/chunks/execute.B7h3T_Hc.js:284
Error: error: [Error]

error: [Error]
❌ ℹ️ Failed to save message immediately Error: [vitest] No "incrementConversationCreated" export is defined on the "../../quotaTracking" mock. Did you forget to return it from "vi.mock"?
at VitestMocker.createError (file:///home/runner/work/DooDates/DooDates/node_modules/vitest/dist/chunks/execute.B7h3T_Hc.js:284:17)
🚨 DooDates Error: {
```
      *... et 5 autre(s) erreur(s)*

#### Run #124 - 10/11/2025 19:49:22

- **Commit:** `37ae638`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19242549623)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

#### Run #123 - 10/11/2025 19:25:30

- **Commit:** `0b001b1`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19241881281)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

#### Run #121 - 10/11/2025 17:18:19

- **Commit:** `290d910`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19238303992)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🔗 Tests d'intégration`
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ✅ success

**Dernier run:** 10/11/2025 20:09:36

**Statistiques:**
- ❌ Échecs (24h): **1**
- ❌ Échecs (7 jours): **1**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #61 - 10/11/2025 18:15:24

- **Commit:** `c79a457`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19239971384)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (1)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 1/2)`
    - **Erreurs détectées (10):**
      ```
File: tests/e2e/dashboard-complete.spec.ts:167
Error: "error": {

"error": {
"message": "Error: [console.error] ❌ ℹ️ Failed to fetch guest quota \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u001b\nReceived array:  \u001b[31m[\"[console.error] ❌ ℹ️ Failed to fetch guest quota \"]\u001b",
"stack": "Error: [console.error] ❌ ℹ️ Failed to fetch guest quota \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u001b\nReceived array:  \u001b[31m[\"[console.error] ❌ ℹ️ Failed to fetch guest quota \"]\u001b\n    at Object.assertClean (/home/runner/work/DooDates/DooDates/tests/e2e/uti
... (truncated)
```
      ```
File: tests/e2e/dashboard-complete.spec.ts:167
Error: "errors": [

"errors": [
"message": "Error: [console.error] ❌ ℹ️ Failed to fetch guest quota \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u001b\nReceived array:  \u001b[31m[\"[console.error] ❌ ℹ️ Failed to fetch guest quota \"]\u001b\n\n   at utils.ts:89\n\n  87 |   return {\n  88 |     async assertClean() {\n> 89 |       await expect(errors, errors.join('\\n')).toHaveLength(0);\n     |                                               ^\n  90 |     },\n  91 |     stop() {\n  92 |       page.off('console', onConsole);\n    at Object.assertClean (/home/runner/work/DooDates/DooDates/tests/e2e/utils.ts:89:47)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/da
... (truncated)
```
      ```
File: tests/e2e/dashboard-complete.spec.ts:167
Error: "errorLocation": {

"errorLocation": {
"error": {
"message": "Error: [console.error] ❌ ℹ️ Failed to fetch guest quota \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u001b\nReceived array:  \u001b[31m[\"[console.error] ❌ ℹ️ Failed to fetch guest quota \"]\u001b",
"stack": "Error: [console.error] ❌ ℹ️ Failed to fetch guest quota \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u001b\nReceived array:  \u001b[31m[\"[console.error] ❌ ℹ️ Failed to fetch guest quota \"]\u001b\n    at Object.assertClean (/home/runner/work/DooDates/Doo
... (truncated)
```
      ```
File: tests/e2e/dashboard-complete.spec.ts:167
Error: "snippet": "   at utils.ts:89\n\n\u001b[0m \u001b 87 |\u001b   \u001b[36mreturn\u001b {\n \u001b 88 |\u001b     \u001b[36masync\u001b assertClean() {\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 89 |\u001b       \u001b[36mawait\u001b expect(errors\u001b[33m,\u001b errors\u001b[33m.\u001bjoin(\u001b[32m'\\n'\u001b))\u001b[33m.\u001btoHaveLength(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b    |\u001b                                               \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 90 |\u001b     }\u001b[33m,\u001b\n \u001b 91 |\u001b     stop() {\n \u001b 92 |\u001b       page\u001b[33m.\u001boff(\u001b[32m'console'\u001b\u001b[33m,\u001b onConsole)\u001b[33m;\u001b\u001b[0m"

"snippet": "   at utils.ts:89\n\n\u001b[0m \u001b 87 |\u001b   \u001b[36mreturn\u001b {\n \u001b 88 |\u001b     \u001b[36masync\u001b assertClean() {\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 89 |\u001b       \u001b[36mawait\u001b expect(errors\u001b[33m,\u001b errors\u001b[33m.\u001bjoin(\u001b[32m'\\n'\u001b))\u001b[33m.\u001btoHaveLength(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b    |\u001b                                               \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 90 |\u001b     }\u001b[33m,\u001b\n \u001b 91 |\u001b     stop() {\n \u001b 92 |\u001b       page\u001b[33m.\u001boff(\u001b[32m'console'\u001b\u001b[33m,\u001b onConsole)\u001b[33m;\u001b\u001b[0m"
"errors": [
"message": "Error: [console.error] ❌ ℹ️ Failed to fetch guest quota \n\n\u001bexpect(\u001b\u001b[31mrec
... (truncated)
```
      ```
File: tests/e2e/dashboard-complete.spec.ts:167
Error: "path": "/home/runner/work/DooDates/DooDates/test-results/dashboard-complete-Dashboa-c369e-Rechercher-une-conversation-chromium-retry1/error-context.md"

"path": "/home/runner/work/DooDates/DooDates/test-results/dashboard-complete-Dashboa-c369e-Rechercher-une-conversation-chromium-retry1/error-context.md"
"errorLocation": {
"error": {
"message": "Error: [console.error] ❌ ℹ️ Failed to fetch guest quota \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u001b\nReceived array:  \u001b[31m[\"[console.error] ❌ ℹ️ Failed to fetch guest quota \"]\u001b",
"stack": "Error: [console.error] ❌ ℹ️ Failed to fetch guest quota \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u
... (truncated)
```
      *... et 5 autre(s) erreur(s)*
  - ❌ `⚡ E2E Functional Tests (2)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 2/2)`
    - **Erreurs détectées (10):**
      ```
File: tests/e2e/tags-folders.spec.ts:217
Error: "errors": [],

"errors": [],
"errors": [],
"error": {
"message": "Error: [console.error] ❌ ℹ️ Failed to fetch guest quota \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u001b\nReceived array:  \u001b[31m[\"[console.error] ❌ ℹ️ Failed to fetch guest quota \"]\u001b",
"stack": "Error: [console.error] ❌ ℹ️ Failed to fetch guest quota \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u001b\nReceived array:  \u001b[31m[\"[console.error] ❌ ℹ️ Failed to fetch guest quota \"]\u001b\n    at Object.assertClean (/home/runner/work/Doo
... (truncated)
```
      ```
File: tests/e2e/tags-folders.spec.ts:217
Error: "snippet": "   at utils.ts:89\n\n\u001b[0m \u001b 87 |\u001b   \u001b[36mreturn\u001b {\n \u001b 88 |\u001b     \u001b[36masync\u001b assertClean() {\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 89 |\u001b       \u001b[36mawait\u001b expect(errors\u001b[33m,\u001b errors\u001b[33m.\u001bjoin(\u001b[32m'\\n'\u001b))\u001b[33m.\u001btoHaveLength(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b    |\u001b                                               \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 90 |\u001b     }\u001b[33m,\u001b\n \u001b 91 |\u001b     stop() {\n \u001b 92 |\u001b       page\u001b[33m.\u001boff(\u001b[32m'console'\u001b\u001b[33m,\u001b onConsole)\u001b[33m;\u001b\u001b[0m"

"snippet": "   at utils.ts:89\n\n\u001b[0m \u001b 87 |\u001b   \u001b[36mreturn\u001b {\n \u001b 88 |\u001b     \u001b[36masync\u001b assertClean() {\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 89 |\u001b       \u001b[36mawait\u001b expect(errors\u001b[33m,\u001b errors\u001b[33m.\u001bjoin(\u001b[32m'\\n'\u001b))\u001b[33m.\u001btoHaveLength(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b    |\u001b                                               \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 90 |\u001b     }\u001b[33m,\u001b\n \u001b 91 |\u001b     stop() {\n \u001b 92 |\u001b       page\u001b[33m.\u001boff(\u001b[32m'console'\u001b\u001b[33m,\u001b onConsole)\u001b[33m;\u001b\u001b[0m"
"errors": [
"message": "Error: [console.error] ❌ ℹ️ Failed to fetch guest quota \n\n\u001bexpect(\u001b\u001b[31mrec
... (truncated)
```
      ```
File: tests/e2e/tags-folders.spec.ts:217
Error: "path": "/home/runner/work/DooDates/DooDates/test-results/tags-folders-Dashboard---T-18eb3-des-tags-à-une-conversation-chromium/error-context.md"

"path": "/home/runner/work/DooDates/DooDates/test-results/tags-folders-Dashboard---T-18eb3-des-tags-à-une-conversation-chromium/error-context.md"
"errorLocation": {
"error": {
"message": "Error: [console.error] ❌ ℹ️ Failed to fetch guest quota \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u001b\nReceived array:  \u001b[31m[\"[console.error] ❌ ℹ️ Failed to fetch guest quota \"]\u001b",
"stack": "Error: [console.error] ❌ ℹ️ Failed to fetch guest quota \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u001b\nR
... (truncated)
```
      ```
File: tests/e2e/tags-folders.spec.ts:217
Error: "snippet": "   at utils.ts:89\n\n\u001b[0m \u001b 87 |\u001b   \u001b[36mreturn\u001b {\n \u001b 88 |\u001b     \u001b[36masync\u001b assertClean() {\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 89 |\u001b       \u001b[36mawait\u001b expect(errors\u001b[33m,\u001b errors\u001b[33m.\u001bjoin(\u001b[32m'\\n'\u001b))\u001b[33m.\u001btoHaveLength(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b    |\u001b                                               \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 90 |\u001b     }\u001b[33m,\u001b\n \u001b 91 |\u001b     stop() {\n \u001b 92 |\u001b       page\u001b[33m.\u001boff(\u001b[32m'console'\u001b\u001b[33m,\u001b onConsole)\u001b[33m;\u001b\u001b[0m"

"snippet": "   at utils.ts:89\n\n\u001b[0m \u001b 87 |\u001b   \u001b[36mreturn\u001b {\n \u001b 88 |\u001b     \u001b[36masync\u001b assertClean() {\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 89 |\u001b       \u001b[36mawait\u001b expect(errors\u001b[33m,\u001b errors\u001b[33m.\u001bjoin(\u001b[32m'\\n'\u001b))\u001b[33m.\u001btoHaveLength(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b    |\u001b                                               \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 90 |\u001b     }\u001b[33m,\u001b\n \u001b 91 |\u001b     stop() {\n \u001b 92 |\u001b       page\u001b[33m.\u001boff(\u001b[32m'console'\u001b\u001b[33m,\u001b onConsole)\u001b[33m;\u001b\u001b[0m"
"errors": [
"message": "Error: [console.error] ❌ ℹ️ Failed to fetch guest quota \n\n\u001bexpect(\u001b\u001b[31mrec
... (truncated)
```
      ```
File: tests/e2e/tags-folders.spec.ts:217
Error: "path": "/home/runner/work/DooDates/DooDates/test-results/tags-folders-Dashboard---T-18eb3-des-tags-à-une-conversation-chromium-retry1/error-context.md"

"path": "/home/runner/work/DooDates/DooDates/test-results/tags-folders-Dashboard---T-18eb3-des-tags-à-une-conversation-chromium-retry1/error-context.md"
"errorLocation": {
"error": {
"message": "Error: [console.error] ❌ ℹ️ Failed to fetch guest quota \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u001b\nReceived array:  \u001b[31m[\"[console.error] ❌ ℹ️ Failed to fetch guest quota \"]\u001b",
"stack": "Error: [console.error] ❌ ℹ️ Failed to fetch guest quota \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u
... (truncated)
```
      *... et 5 autre(s) erreur(s)*

---

## 📈 Résumé Global

- ❌ **Total échecs (24h):** 5
- ❌ **Total échecs (7 jours):** 5
- 📊 **Workflows monitorés:** 6

### ⚠️ Recommandations

Des échecs ont été détectés dans les 24 dernières heures. Consultez les sections ci-dessus pour plus de détails.

