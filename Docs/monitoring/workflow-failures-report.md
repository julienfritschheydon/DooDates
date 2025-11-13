# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 12/11/2025 23:14:41

_Workflow run #224 (ID 19313524449) — génération UTC 2025-11-12T22:14:41.499Z_

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

**Dernier run:** 12/11/2025 23:10:22

**Statistiques:**
- ❌ Échecs (24h): **5**
- ❌ Échecs (7 jours): **9**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #141 - 12/11/2025 23:10:22

- **Commit:** `79c7e97`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19313448871)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
    - **Erreurs détectées (10):**
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
      ```
File: src/lib/error-handling.ts:136
Error: 🚨 DooDates Error: {

🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Poll not found\n' +
'    at Object.validation (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:136:5)\n' +
```
      *... et 5 autre(s) erreur(s)*

#### Run #139 - 12/11/2025 22:58:12

- **Commit:** `eef92a0`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19313146058)
- **Jobs en échec:**
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

#### Run #136 - 12/11/2025 19:55:16

- **Commit:** `ce380bd`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19308534578)
- **Jobs en échec:**
  - ❌ `production-smoke-pre-merge` (failure)
    - Steps en échec: `🔥 Run production smoke tests`

#### Run #135 - 12/11/2025 19:32:19

- **Commit:** `c20b809`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19307945441)
- **Jobs en échec:**
  - ❌ `production-smoke-pre-merge` (failure)
    - Steps en échec: `🔥 Run production smoke tests`

#### Run #134 - 12/11/2025 19:25:58

- **Commit:** `aa68234`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19307769624)
- **Jobs en échec:**
  - ❌ `build-validation` (failure)
    - Steps en échec: `🧹 Lint (warnings allowed on develop)`

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ✅ success

**Dernier run:** 12/11/2025 21:27:21

**Statistiques:**
- ❌ Échecs (24h): **1**
- ❌ Échecs (7 jours): **3**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #66 - 12/11/2025 21:12:40

- **Commit:** `94e0a55`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19310524495)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (1)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 1/2)`
    - **Erreurs détectées (10):**
      ```
File: tests/e2e/dashboard-complete.spec.ts:52
Error: "error": {

"error": {
"message": "Error: [console.error] ❌ ℹ️ Erreur chargement Supabase, utilisation localStorage SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON\n[console.error] ❌ ℹ️ Erreur chargement Supabase, utilisation localStorage SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON\n[console.error] ❌ ℹ️ Erreur chargement Supabase, utilisation localStorage SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON\n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m3\u001b\nReceived array:  \u001b[31m[\"[console.error] ❌ ℹ️ Erreur chargement Supabase, utilisation localStorage SyntaxError: Unexpected token '
... (truncated)
```
      ```
File: tests/e2e/dashboard-complete.spec.ts:52
Error: "errors": [

"errors": [
"message": "Error: [console.error] ❌ ℹ️ Erreur chargement Supabase, utilisation localStorage SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON\n[console.error] ❌ ℹ️ Erreur chargement Supabase, utilisation localStorage SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON\n[console.error] ❌ ℹ️ Erreur chargement Supabase, utilisation localStorage SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON\n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m3\u001b\nReceived array:  \u001b[31m[\"[console.error] ❌ ℹ️ Erreur chargement Supabase, utilisation localStorage SyntaxError: Unexpected token 
... (truncated)
```
      ```
File: tests/e2e/dashboard-complete.spec.ts:52
Error: "errorLocation": {

"errorLocation": {
"error": {
"message": "Error: [console.error] ❌ ℹ️ Erreur chargement Supabase, utilisation localStorage SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON\n[console.error] ❌ ℹ️ Erreur chargement Supabase, utilisation localStorage SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON\n[console.error] ❌ ℹ️ Erreur chargement Supabase, utilisation localStorage SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON\n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m3\u001b\nReceived array:  \u001b[31m[\"[console.error] ❌ ℹ️ Erreur chargement Supabase, utilisation localStorage SyntaxError:
... (truncated)
```
      ```
File: tests/e2e/dashboard-complete.spec.ts:52
Error: "snippet": "   at utils.ts:90\n\n\u001b[0m \u001b 88 |\u001b   \u001b[36mreturn\u001b {\n \u001b 89 |\u001b     \u001b[36masync\u001b assertClean() {\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 90 |\u001b       \u001b[36mawait\u001b expect(errors\u001b[33m,\u001b errors\u001b[33m.\u001bjoin(\u001b[32m'\\n'\u001b))\u001b[33m.\u001btoHaveLength(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b    |\u001b                                               \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 91 |\u001b     }\u001b[33m,\u001b\n \u001b 92 |\u001b     stop() {\n \u001b 93 |\u001b       page\u001b[33m.\u001boff(\u001b[32m'console'\u001b\u001b[33m,\u001b onConsole)\u001b[33m;\u001b\u001b[0m"

"snippet": "   at utils.ts:90\n\n\u001b[0m \u001b 88 |\u001b   \u001b[36mreturn\u001b {\n \u001b 89 |\u001b     \u001b[36masync\u001b assertClean() {\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 90 |\u001b       \u001b[36mawait\u001b expect(errors\u001b[33m,\u001b errors\u001b[33m.\u001bjoin(\u001b[32m'\\n'\u001b))\u001b[33m.\u001btoHaveLength(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b    |\u001b                                               \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 91 |\u001b     }\u001b[33m,\u001b\n \u001b 92 |\u001b     stop() {\n \u001b 93 |\u001b       page\u001b[33m.\u001boff(\u001b[32m'console'\u001b\u001b[33m,\u001b onConsole)\u001b[33m;\u001b\u001b[0m"
"errors": [
"message": "Error: [console.error] ❌ ℹ️ Erreur chargement Supabase, utilisation localStorage SyntaxError
... (truncated)
```
      ```
File: tests/e2e/dashboard-complete.spec.ts:52
Error: "path": "/home/runner/work/DooDates/DooDates/test-results/dashboard-complete-Dashboa-e4b7e--un-utilisateur-authentifié-chromium-retry1/error-context.md"

"path": "/home/runner/work/DooDates/DooDates/test-results/dashboard-complete-Dashboa-e4b7e--un-utilisateur-authentifié-chromium-retry1/error-context.md"
"errorLocation": {
"error": {
"message": "Error: [console.error] ❌ ℹ️ Erreur chargement Supabase, utilisation localStorage SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON\n[console.error] ❌ ℹ️ Erreur chargement Supabase, utilisation localStorage SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON\n[console.error] ❌ ℹ️ Erreur chargement Supabase, utilisation localStorage SyntaxError: Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON\n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\
... (truncated)
```
      *... et 5 autre(s) erreur(s)*

---

## 📈 Résumé Global

- ❌ **Total échecs (24h):** 6
- ❌ **Total échecs (7 jours):** 8
- 📊 **Workflows monitorés:** 6

### ⚠️ Recommandations

Des échecs ont été détectés dans les 24 dernières heures. Consultez les sections ci-dessus pour plus de détails.

