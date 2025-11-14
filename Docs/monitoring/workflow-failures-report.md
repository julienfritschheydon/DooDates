# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 14/11/2025 15:19:07

_Workflow run #303 (ID 19367325401) — génération UTC 2025-11-14T14:19:07.127Z_

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

**Dernier run:** 14/11/2025 15:13:51

**Statistiques:**
- ❌ Échecs (24h): **6**
- ❌ Échecs (7 jours): **7**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #168 - 14/11/2025 14:56:12

- **Commit:** `bc0d2a6`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19366744143)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
    - **Erreurs détectées (10):**
      ```
File: src/lib/error-handling.ts:141
Error: 🚨 DooDates Error: {

🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Erreur synchronisation Supabase (non-bloquant)\n' +
'    at Object.storage (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:141:5)\n' +
```
      ```
File: src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:54
Error: originalError: Error: Supabase not available in tests

originalError: Error: Supabase not available in tests
at /home/runner/work/DooDates/DooDates/src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:54:49
🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Erreur synchronisation Supabase (non-bloquant)\n' +
'    at Object.storage (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:141:5)\n' +
```
      ```
File: src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:54
Error: originalError: Error: Supabase not available in tests

originalError: Error: Supabase not available in tests
at /home/runner/work/DooDates/DooDates/src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:54:49
🚨 DooDates Error: {
name: 'DooDatesError',
stack: 'DooDatesError: Erreur Supabase\n' +
'    at Object.storage (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:141:5)\n' +
```
      ```
File: src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:55
Error: originalError: Error: Supabase not available in tests

originalError: Error: Supabase not available in tests
at /home/runner/work/DooDates/DooDates/src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:55:42
🚨 DooDates Error: {
name: 'DooDatesError',
stack: "DooDatesError: Erreur Supabase lors de l'ajout du message\n" +
'    at Object.storage (/home/runner/work/DooDates/DooDates/src/lib/error-handling.ts:141:5)\n' +
```
      ```
File: src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:55
Error: error: Error: Supabase not available in tests

error: Error: Supabase not available in tests
at /home/runner/work/DooDates/DooDates/src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts:55:42
errorMessage: 'Supabase not available in tests'
error: Error: Supabase not available in tests
```
      *... et 5 autre(s) erreur(s)*

#### Run #167 - 14/11/2025 14:31:35

- **Commit:** `6aab09b`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19366130310)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

#### Run #166 - 14/11/2025 13:56:57

- **Commit:** `6c30ea0`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19365259986)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

#### Run #165 - 14/11/2025 13:41:21

- **Commit:** `2c6cc2c`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19364893110)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`

#### Run #164 - 14/11/2025 13:35:15

- **Commit:** `8388b7b`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19364749935)
- **Jobs en échec:**
  - ❌ `tests-e2e` (failure)
    - Steps en échec: `Tests E2E Smoke (develop: fast validation)`
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🧪 Tests unitaires`

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ⏳ unknown

**Dernier run:** 14/11/2025 15:17:51

**Statistiques:**
- ❌ Échecs (24h): **0**
- ❌ Échecs (7 jours): **12**
- 📊 Total runs analysés: **20**

### ⚠️ Échecs récents (7 jours)

Aucun échec dans les 24 dernières heures, mais **12** échec(s) cette semaine.

---

## 📈 Résumé Global

- ❌ **Total échecs (24h):** 6
- ❌ **Total échecs (7 jours):** 13
- 📊 **Workflows monitorés:** 6

### ⚠️ Recommandations

Des échecs ont été détectés dans les 24 dernières heures. Consultez les sections ci-dessus pour plus de détails.

