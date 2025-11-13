# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 13/11/2025 11:21:42

_Workflow run #246 (ID 19328233283) — génération UTC 2025-11-13T10:21:42.901Z_

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

**Statut:** ⏳ unknown

**Dernier run:** 13/11/2025 11:20:27

**Statistiques:**
- ❌ Échecs (24h): **12**
- ❌ Échecs (7 jours): **12**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #148 - 13/11/2025 09:25:57

- **Commit:** `d5ee9bf`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19325188826)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
    - **Erreurs détectées (10):**
      ```
File: src/hooks/__tests__/useConversations.favorites.test.ts:74
Error: [] [4e7c4c22-bce6-405f-ad5c-e906a5073ba0] 🟢 Réponse geminiBackend reçue { success: true, hasData: true, error: undefined }

[] [4e7c4c22-bce6-405f-ad5c-e906a5073ba0] 🟢 Réponse geminiBackend reçue { success: true, hasData: true, error: undefined }
[] [d641b63a-8dcd-4ff8-b8be-61f6a0b609f9] 🟢 Réponse geminiBackend reçue { success: true, hasData: true, error: undefined }
❌ ℹ️ Erreur lors du chargement depuis Supabase, utilisation de localStorage Error: Storage error
at /home/runner/work/DooDates/DooDates/src/hooks/__tests__/useConversations.favorites.test.ts:74:72
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

#### Run #144 - 12/11/2025 23:48:47

- **Commit:** `b3f7f09`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19314345846)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ❌ failure

**Dernier run:** 13/11/2025 10:45:13

**Statistiques:**
- ❌ Échecs (24h): **4**
- ❌ Échecs (7 jours): **6**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #70 - 13/11/2025 10:45:13

- **Commit:** `da3ef56`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19327261607)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (1)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 1/2)`
    - **Erreurs détectées (10):**
      ```
File: tests/e2e/analytics-ai-optimized.spec.ts:363
Error: "error": {

"error": {
"message": "Error: L'IA a retourné une erreur: Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?",
"stack": "Error: L'IA a retourné une erreur: Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?\n    at createPollWithVotesAndClose (/home/runner/work/DooDates/DooDates/tests/e2e/analytics-ai-optimized.spec.ts:72:11)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/analytics-ai-optimized.spec.ts:363:25",
"snippet": "\u001b[0m \u001b 70 |\u001b   \u001b[36mif\u001b (hasError) {\n \u001b 71 |\u001b     \u001b[36mconst\u001b errorContent \u001b[33m=\u001b \u001b[36mawait\u001b errorText\u001b[33m.\u001btextContent()\u001b[33m;\u001b\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 72 |\u001b     \u001b[36mthrow\u001b \u001
... (truncated)
```
      ```
Error: "errors": [

"errors": [
"message": "Error: L'IA a retourné une erreur: Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?\n\n  70 |   if (hasError) {\n  71 |     const errorContent = await errorText.textContent();\n> 72 |     throw new Error(`L'IA a retourné une erreur: ${errorContent}`);\n     |           ^\n  73 |   }\n  74 |   \n  75 |   await expect(successText).toBeVisible({ timeout: 5000 });\n    at createPollWithVotesAndClose (/home/runner/work/DooDates/DooDates/tests/e2e/analytics-ai-optimized.spec.ts:72:11)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/analytics-ai-optimized.spec.ts:363:25"
"name": "error-context",
"path": "/home/runner/work/DooDates/DooDates/test-results/analytics-ai-optimized-Ana-36fae-ée-combiné-smoke-functional-chromium/error-conte
... (truncated)
```
      ```
File: tests/e2e/analytics-ai-optimized.spec.ts:363
Error: "errorLocation": {

"errorLocation": {
"error": {
"message": "Error: L'IA a retourné une erreur: Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?",
"stack": "Error: L'IA a retourné une erreur: Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?\n    at createPollWithVotesAndClose (/home/runner/work/DooDates/DooDates/tests/e2e/analytics-ai-optimized.spec.ts:72:11)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/analytics-ai-optimized.spec.ts:363:25",
```
      ```
Error: "snippet": "\u001b[0m \u001b 70 |\u001b   \u001b[36mif\u001b (hasError) {\n \u001b 71 |\u001b     \u001b[36mconst\u001b errorContent \u001b[33m=\u001b \u001b[36mawait\u001b errorText\u001b[33m.\u001btextContent()\u001b[33m;\u001b\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 72 |\u001b     \u001b[36mthrow\u001b \u001b[36mnew\u001b \u001b[33mError\u001b(\u001b[32m`L'IA a retourné une erreur: ${errorContent}`\u001b)\u001b[33m;\u001b\n \u001b    |\u001b           \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 73 |\u001b   }\n \u001b 74 |\u001b   \n \u001b 75 |\u001b   \u001b[36mawait\u001b expect(successText)\u001b[33m.\u001btoBeVisible({ timeout\u001b[33m:\u001b \u001b[35m5000\u001b })\u001b[33m;\u001b\u001b[0m"

"snippet": "\u001b[0m \u001b 70 |\u001b   \u001b[36mif\u001b (hasError) {\n \u001b 71 |\u001b     \u001b[36mconst\u001b errorContent \u001b[33m=\u001b \u001b[36mawait\u001b errorText\u001b[33m.\u001btextContent()\u001b[33m;\u001b\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 72 |\u001b     \u001b[36mthrow\u001b \u001b[36mnew\u001b \u001b[33mError\u001b(\u001b[32m`L'IA a retourné une erreur: ${errorContent}`\u001b)\u001b[33m;\u001b\n \u001b    |\u001b           \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 73 |\u001b   }\n \u001b 74 |\u001b   \n \u001b 75 |\u001b   \u001b[36mawait\u001b expect(successText)\u001b[33m.\u001btoBeVisible({ timeout\u001b[33m:\u001b \u001b[35m5000\u001b })\u001b[33m;\u001b\u001b[0m"
"errors": [
"message": "Error: L'IA a retourné une erreur: Désolé, je n'ai pas pu traiter v
... (truncated)
```
      ```
File: tests/e2e/analytics-ai-optimized.spec.ts:363
Error: "path": "/home/runner/work/DooDates/DooDates/test-results/analytics-ai-optimized-Ana-36fae-ée-combiné-smoke-functional-chromium-retry1/error-context.md"

"path": "/home/runner/work/DooDates/DooDates/test-results/analytics-ai-optimized-Ana-36fae-ée-combiné-smoke-functional-chromium-retry1/error-context.md"
"errorLocation": {
"error": {
"message": "Error: L'IA a retourné une erreur: Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?",
"stack": "Error: L'IA a retourné une erreur: Désolé, je n'ai pas pu traiter votre demande. Pouvez-vous reformuler ou réessayer ?\n    at createPollWithVotesAndClose (/home/runner/work/DooDates/DooDates/tests/e2e/analytics-ai-optimized.spec.ts:72:11)\n    at /home/runner/work/DooDates/DooDates/tests/e2e/analytics-ai-optimized.spec.ts:363:25",
```
      *... et 5 autre(s) erreur(s)*

#### Run #69 - 13/11/2025 10:31:59

- **Commit:** `d27a1eb`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19326906981)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (1)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 1/2)`

#### Run #68 - 13/11/2025 09:56:15

- **Commit:** `eab47d1`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19325930430)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (1)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 1/2)`

#### Run #66 - 12/11/2025 21:12:40

- **Commit:** `94e0a55`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19310524495)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (1)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 1/2)`

---

## 📈 Résumé Global

- ❌ **Total échecs (24h):** 9
- ❌ **Total échecs (7 jours):** 11
- 📊 **Workflows monitorés:** 6

### ⚠️ Recommandations

Des échecs ont été détectés dans les 24 dernières heures. Consultez les sections ci-dessus pour plus de détails.

