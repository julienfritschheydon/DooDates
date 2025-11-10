# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 10/11/2025 09:37:33

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

**Dernier run:** 10/11/2025 09:27:29

**Statistiques:**
- ❌ Échecs (24h): **6**
- ❌ Échecs (7 jours): **12**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #100 - 10/11/2025 08:37:32

- **Commit:** `d61312c`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19224241152)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🔗 Tests d'intégration`
    - **Erreurs détectées (10):**
      ```
File: 2025-11-10T07:38:35.5228770Z stdout | src/hooks/useAutoSave.ts:204
Error: stdout | src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts > titleGeneration + useAutoSave Integration > Error Handling Integration > should handle title generation errors gracefully

stdout | src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts > titleGeneration + useAutoSave Integration > Error Handling Integration > should handle title generation errors gracefully
stdout | src/hooks/useAutoSave.ts:204:19
[] [6b2ce14a-788d-4319-9651-f9e32cb3e208] ✅ createConversation TERMINÉ { conversationId: 'conv-123', title: 'This should cause an error' }
❌ ℹ️ Erreur lors du chargement depuis Supabase, utilisation de localStorage Error: Storage error
```
      ```
File: src/lib/error-handling.ts:136
Error: 🚨 DooDates Error: {

🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Poll not found\n' +
'    at Object.validation (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:136:5)\n' +
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

#### Run #98 - 10/11/2025 08:24:46

- **Commit:** `f183bb9`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19223957422)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🔗 Tests d'intégration`

#### Run #97 - 10/11/2025 08:10:59

- **Commit:** `4acf4c3`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19223660015)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🔗 Tests d'intégration`

#### Run #96 - 10/11/2025 07:54:11

- **Commit:** `74bf414`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19223305663)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🔗 Tests d'intégration`

#### Run #95 - 10/11/2025 07:44:51

- **Commit:** `a42710b`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19223116162)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🔗 Tests d'intégration`

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ✅ success

**Dernier run:** 10/11/2025 09:26:21

**Statistiques:**
- ❌ Échecs (24h): **0**
- ❌ Échecs (7 jours): **0**
- 📊 Total runs analysés: **20**

### ✅ Aucun échec récent

Aucun échec détecté dans les 7 derniers jours.

---

## 6️⃣ Nightly Full Regression

**Statut:** ❌ failure

**Dernier run:** 10/11/2025 09:31:03

**Statistiques:**
- ❌ Échecs (24h): **5**
- ❌ Échecs (7 jours): **11**
- 📊 Total runs analysés: **11**

### 🔴 Échecs récents (24h)

#### Run #11 - 10/11/2025 09:31:03

- **Commit:** `5637606`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19225448546)
- **Jobs en échec:**
  - ❌ `full-regression (chromium)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (chromium)`
    - **Erreurs détectées (10):**
      ```
Error: "**/error-handling-enforcement.test.ts",

"**/error-handling-enforcement.test.ts",
"**/error-handling-enforcement.test.ts",
"**/error-handling-enforcement.test.ts",
"**/error-handling-enforcement.test.ts",
```
      ```
Error: "**/error-handling-enforcement.test.ts",

"**/error-handling-enforcement.test.ts",
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      *... et 5 autre(s) erreur(s)*
  - ❌ `full-regression (webkit)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (webkit)`
    - **Erreurs détectées (10):**
      ```
Error: "**/error-handling-enforcement.test.ts",

"**/error-handling-enforcement.test.ts",
"**/error-handling-enforcement.test.ts",
"**/error-handling-enforcement.test.ts",
"**/error-handling-enforcement.test.ts",
```
      ```
Error: "**/error-handling-enforcement.test.ts",

"**/error-handling-enforcement.test.ts",
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      *... et 5 autre(s) erreur(s)*
  - ❌ `full-regression (firefox)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (firefox)`
    - **Erreurs détectées (10):**
      ```
Error: "**/error-handling-enforcement.test.ts",

"**/error-handling-enforcement.test.ts",
"**/error-handling-enforcement.test.ts",
"**/error-handling-enforcement.test.ts",
"**/error-handling-enforcement.test.ts",
```
      ```
Error: "**/error-handling-enforcement.test.ts",

"**/error-handling-enforcement.test.ts",
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      *... et 5 autre(s) erreur(s)*
  - ❌ `full-regression (Mobile Safari)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (Mobile Safari)`
    - **Erreurs détectées (10):**
      ```
Error: "**/error-handling-enforcement.test.ts",

"**/error-handling-enforcement.test.ts",
"**/error-handling-enforcement.test.ts",
"**/error-handling-enforcement.test.ts",
"**/error-handling-enforcement.test.ts",
```
      ```
Error: "**/error-handling-enforcement.test.ts",

"**/error-handling-enforcement.test.ts",
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      *... et 5 autre(s) erreur(s)*
  - ❌ `full-regression (Mobile Chrome)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (Mobile Chrome)`
    - **Erreurs détectées (10):**
      ```
Error: "**/error-handling-enforcement.test.ts",

"**/error-handling-enforcement.test.ts",
"**/error-handling-enforcement.test.ts",
"**/error-handling-enforcement.test.ts",
"**/error-handling-enforcement.test.ts",
```
      ```
Error: "**/error-handling-enforcement.test.ts",

"**/error-handling-enforcement.test.ts",
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      *... et 5 autre(s) erreur(s)*

#### Run #10 - 10/11/2025 09:03:48

- **Commit:** `7e73c7b`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19224798622)
- **Jobs en échec:**
  - ❌ `full-regression (webkit)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (webkit)`
  - ❌ `full-regression (firefox)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (firefox)`
  - ❌ `full-regression (Mobile Chrome)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (Mobile Chrome)`
  - ❌ `full-regression (Mobile Safari)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (Mobile Safari)`
  - ❌ `full-regression (chromium)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (chromium)`

#### Run #9 - 10/11/2025 08:39:31

- **Commit:** `d61312c`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19224289319)
- **Jobs en échec:**
  - ❌ `full-regression (Mobile Safari)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (Mobile Safari)`
  - ❌ `full-regression (Mobile Chrome)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (Mobile Chrome)`
  - ❌ `full-regression (webkit)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (webkit)`
  - ❌ `full-regression (chromium)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (chromium)`
  - ❌ `full-regression (firefox)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (firefox)`

#### Run #8 - 10/11/2025 08:18:31

- **Commit:** `4acf4c3`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19223822206)
- **Jobs en échec:**
  - ❌ `full-regression (Mobile Safari)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (Mobile Safari)`
  - ❌ `full-regression (webkit)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (webkit)`
  - ❌ `full-regression (firefox)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (firefox)`
  - ❌ `full-regression (Mobile Chrome)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (Mobile Chrome)`
  - ❌ `full-regression (chromium)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (chromium)`

#### Run #7 - 10/11/2025 04:11:25

- **Commit:** `323b6a5`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19219370765)
- **Jobs en échec:**
  - ❌ `full-regression (webkit)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (webkit)`
  - ❌ `full-regression (Mobile Safari)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (Mobile Safari)`
  - ❌ `full-regression (chromium)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (chromium)`
  - ❌ `full-regression (Mobile Chrome)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (Mobile Chrome)`
  - ❌ `full-regression (firefox)` (failure)
    - Steps en échec: `🔍 Run Full Regression Suite (firefox)`

---

## 📈 Résumé Global

- ❌ **Total échecs (24h):** 10
- ❌ **Total échecs (7 jours):** 15
- 📊 **Workflows monitorés:** 6

### ⚠️ Recommandations

Des échecs ont été détectés dans les 24 dernières heures. Consultez les sections ci-dessus pour plus de détails.

