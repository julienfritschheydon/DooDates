# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 10/11/2025 17:59:46

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

**Dernier run:** 10/11/2025 17:56:00

**Statistiques:**
- ❌ Échecs (24h): **2**
- ❌ Échecs (7 jours): **2**
- 📊 Total runs analysés: **20**

### 🔴 Échecs récents (24h)

#### Run #122 - 10/11/2025 17:56:00

- **Commit:** `4b55150`
- **Auteur:** julienfritschheydon
- **Branche:** `develop`
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19239398123)
- **Jobs en échec:**
  - ❌ `tests-unit` (failure)
    - Steps en échec: `🔗 Tests d'intégration`
    - **Erreurs détectées (10):**
      ```
File: src/components/polls/PollAnalyticsPanel.tsx:24
Error: stdout | src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts > titleGeneration + useAutoSave Integration > Error Handling Integration > should handle title generation errors gracefully

stdout | src/lib/services/__tests__/titleGeneration.useAutoSave.test.ts > titleGeneration + useAutoSave Integration > Error Handling Integration > should handle title generation errors gracefully
at PollAnalyticsPanel (/home/runner/work/DooDates/DooDates/src/components/polls/PollAnalyticsPanel.tsx:24:31)
❌ ℹ️ Erreur lors du chargement depuis Supabase, utilisation de localStorage Error: Storage error
❌ ℹ️ Erreur lors du chargement depuis Supabase, utilisation de localStorage Error: Storage error
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
      *... et 5 autre(s) erreur(s)*

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

**Dernier run:** 10/11/2025 15:24:50

**Statistiques:**
- ❌ Échecs (24h): **0**
- ❌ Échecs (7 jours): **0**
- 📊 Total runs analysés: **20**

### ✅ Aucun échec récent

Aucun échec détecté dans les 7 derniers jours.

---

## 📈 Résumé Global

- ❌ **Total échecs (24h):** 2
- ❌ **Total échecs (7 jours):** 2
- 📊 **Workflows monitorés:** 6

### ⚠️ Recommandations

Des échecs ont été détectés dans les 24 dernières heures. Consultez les sections ci-dessus pour plus de détails.

