# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 12/11/2025 19:40:14

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

**Dernier run:** 12/11/2025 19:32:19

**Statistiques:**
- ❌ Échecs (24h): **2**
- ❌ Échecs (7 jours): **7**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #135 - 12/11/2025 19:32:19

- **Commit:** `c20b809`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19307945441)
- **Jobs en échec:**
  - ❌ `production-smoke-pre-merge` (failure)
    - Steps en échec: `🔥 Run production smoke tests`
    - **Erreurs détectées (10):**
      ```
File: tests/e2e/production-smoke.spec.ts:57
Error: "error": {

"error": {
"message": "Error: BASE_URL (http://localhost:4173) ne doit pas pointer vers localhost en CI\n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoBeFalsy\u001b()\u001b\n\nReceived: \u001b[31mtrue\u001b",
"stack": "Error: BASE_URL (http://localhost:4173) ne doit pas pointer vers localhost en CI\n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoBeFalsy\u001b()\u001b\n\nReceived: \u001b[31mtrue\u001b\n    at /home/runner/work/DooDates/DooDates/tests/e2e/production-smoke.spec.ts:57:102",
"errors": [
```
      ```
File: tests/e2e/production-smoke.spec.ts:57
Error: "message": "Error: BASE_URL (http://localhost:4173) ne doit pas pointer vers localhost en CI\n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoBeFalsy\u001b()\u001b\n\nReceived: \u001b[31mtrue\u001b\n\n  55 |     const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);\n  56 |     if (process.env.CI) {\n> 57 |       expect(isLocalhost, `BASE_URL (${baseUrl}) ne doit pas pointer vers ${parsed.hostname} en CI`).toBeFalsy();\n     |                                                                                                      ^\n  58 |     }\n  59 |\n  60 |     const response = await request.get(baseUrl, { maxRedirects: 3 });\n    at /home/runner/work/DooDates/DooDates/tests/e2e/production-smoke.spec.ts:57:102"

"message": "Error: BASE_URL (http://localhost:4173) ne doit pas pointer vers localhost en CI\n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoBeFalsy\u001b()\u001b\n\nReceived: \u001b[31mtrue\u001b\n\n  55 |     const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);\n  56 |     if (process.env.CI) {\n> 57 |       expect(isLocalhost, `BASE_URL (${baseUrl}) ne doit pas pointer vers ${parsed.hostname} en CI`).toBeFalsy();\n     |                                                                                                      ^\n  58 |     }\n  59 |\n  60 |     const response = await request.get(baseUrl, { maxRedirects: 3 });\n    at /home/runner/work/DooDates/DooDates/tests/e2e/production-smoke.spec.ts:57:102"
"errorLocation": {
"error": {
"messa
... (truncated)
```
      ```
File: tests/e2e/production-smoke.spec.ts:57
Error: "errors": [

"errors": [
"message": "Error: BASE_URL (http://localhost:4173) ne doit pas pointer vers localhost en CI\n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoBeFalsy\u001b()\u001b\n\nReceived: \u001b[31mtrue\u001b\n\n  55 |     const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);\n  56 |     if (process.env.CI) {\n> 57 |       expect(isLocalhost, `BASE_URL (${baseUrl}) ne doit pas pointer vers ${parsed.hostname} en CI`).toBeFalsy();\n     |                                                                                                      ^\n  58 |     }\n  59 |\n  60 |     const response = await request.get(baseUrl, { maxRedirects: 3 });\n    at /home/runner/work/DooDates/DooDates/tests/e2e/production-smoke.spec.ts:57:102"
"errorLocation": {
"erro
... (truncated)
```
      ```
File: tests/e2e/production-smoke.spec.ts:57
Error: "errors": [

"errors": [
"message": "Error: BASE_URL (http://localhost:4173) ne doit pas pointer vers localhost en CI\n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoBeFalsy\u001b()\u001b\n\nReceived: \u001b[31mtrue\u001b\n\n  55 |     const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);\n  56 |     if (process.env.CI) {\n> 57 |       expect(isLocalhost, `BASE_URL (${baseUrl}) ne doit pas pointer vers ${parsed.hostname} en CI`).toBeFalsy();\n     |                                                                                                      ^\n  58 |     }\n  59 |\n  60 |     const response = await request.get(baseUrl, { maxRedirects: 3 });\n    at /home/runner/work/DooDates/DooDates/tests/e2e/production-smoke.spec.ts:57:102"
"errorLocation": {
"erro
... (truncated)
```
      ```
File: tests/e2e/production-smoke.spec.ts:249
Error: "errors": [],

"errors": [],
"error": {
"message": "Error: 1 requête(s) critique(s) échouée(s)\n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoBe\u001b(\u001b\u001b[32mexpected\u001b\u001b) // Object.is equality\u001b\n\nExpected: \u001b[32m0\u001b\nReceived: \u001b[31m1\u001b",
"stack": "Error: 1 requête(s) critique(s) échouée(s)\n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoBe\u001b(\u001b\u001b[32mexpected\u001b\u001b) // Object.is equality\u001b\n\nExpected: \u001b[32m0\u001b\nReceived: \u001b[31m1\u001b\n    at /home/runner/work/DooDates/DooDates/tests/e2e/production-smoke.spec.ts:249:97",
```
      *... et 5 autre(s) erreur(s)*

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

**Dernier run:** 11/11/2025 22:34:01

**Statistiques:**
- ❌ Échecs (24h): **0**
- ❌ Échecs (7 jours): **2**
- 📊 Total runs analysés: **20**

### ⚠️ Échecs récents (7 jours)

Aucun échec dans les 24 dernières heures, mais **2** échec(s) cette semaine.

---

## 📈 Résumé Global

- ❌ **Total échecs (24h):** 2
- ❌ **Total échecs (7 jours):** 6
- 📊 **Workflows monitorés:** 6

### ⚠️ Recommandations

Des échecs ont été détectés dans les 24 dernières heures. Consultez les sections ci-dessus pour plus de détails.

