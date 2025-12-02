# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 02/12/2025 17:06:12

_Workflow run #700 (ID 19865157493) — génération UTC 2025-12-02T16:06:12.571Z_

## 🎯 Focus: Commit `664fb17`

**Branche:** `main`
**Workflow déclencheur:** `unknown`

> Ce rapport analyse **UNIQUEMENT** les échecs du commit actuel.

> Il peut être consulté par l'IA pour comprendre l'état de santé du CI/CD.

---

## 1️⃣ PR Complete Validation

**Statut:** ❌ failure

**Dernier run:** 02/12/2025 16:44:01

**Statistiques:**
- 📊 **Total runs pour ce commit:** **0**
- ❌ **Échecs pour ce commit:** **0**
### ✅ Aucun échec pour ce commit

Tous les workflows surveillés ont réussi pour le commit `664fb17`.

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ❌ failure

**Dernier run:** 02/12/2025 10:02:41

**Statistiques:**
- 📊 **Total runs pour ce commit:** **1**
- ❌ **Échecs pour ce commit:** **1**
### 🔴 Échecs du commit actuel

#### Run #119 - 02/12/2025 10:02:41

- **Commit:** `664fb17`
- **Auteur:** julienfritsch44
- **Branche:** `main`
- **Statut:** failure
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19852944112)
- **Jobs en échec:**
  - ❌ `🔥 E2E Smoke Tests (1)` (failure)
    - Steps en échec: `🔥 Run Smoke Tests (Shard 1/2)`
    - **Erreurs détectées (10):**
      ```
Error: "errors": [],

"errors": [],
"title": "e2e/console-errors.spec.ts",
"file": "e2e/console-errors.spec.ts",
"title": "Console Errors & React Warnings",
"file": "e2e/console-errors.spec.ts",
```
      ```
File: tests/e2e/console-errors.spec.ts:178
Error: "error": {

"error": {
"message": "Error: Erreurs console trouvées:\n❌ 🌐 VITE_GEMINI_API_KEY manquante \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u001b\nReceived array:  \u001b[31m[\"❌ 🌐 VITE_GEMINI_API_KEY manquante \"]\u001b",
"stack": "Error: Erreurs console trouvées:\n❌ 🌐 VITE_GEMINI_API_KEY manquante \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u001b\nReceived array:  \u001b[31m[\"❌ 🌐 VITE_GEMINI_API_KEY manquante \"]\u001b\n    at /home/runner/work/DooDates/DooDates/tests/e2e/console-errors.spec.ts:17
... (truncated)
```
      ```
File: tests/e2e/console-errors.spec.ts:178
Error: "snippet": "\u001b[0m \u001b 176 |\u001b\n \u001b 177 |\u001b     \u001b// Vérifier qu'il n'y a pas d'erreurs\u001b\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 178 |\u001b     expect(filteredErrors\u001b[33m,\u001b \u001b[32m`Erreurs console trouvées:\\n${filteredErrors.join('\\n')}`\u001b)\u001b[33m.\u001btoHaveLength(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b     |\u001b                                                                                       \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 179 |\u001b     \n \u001b 180 |\u001b     \u001b// Log des warnings (non bloquant)\u001b\n \u001b 181 |\u001b     \u001b[36mif\u001b (filteredWarnings\u001b[33m.\u001blength \u001b[33m>\u001b \u001b[35m0\u001b) {\u001b[0m"

"snippet": "\u001b[0m \u001b 176 |\u001b\n \u001b 177 |\u001b     \u001b// Vérifier qu'il n'y a pas d'erreurs\u001b\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 178 |\u001b     expect(filteredErrors\u001b[33m,\u001b \u001b[32m`Erreurs console trouvées:\\n${filteredErrors.join('\\n')}`\u001b)\u001b[33m.\u001btoHaveLength(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b     |\u001b                                                                                       \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 179 |\u001b     \n \u001b 180 |\u001b     \u001b// Log des warnings (non bloquant)\u001b\n \u001b 181 |\u001b     \u001b[36mif\u001b (filteredWarnings\u001b[33m.\u001blength \u001b[33m>\u001b \u001b[35m0\u001b) {\u001b[0m"
"errors": [
"file": "/home/runner/work/DooDates/DooDates/tests/e2e/console-
... (truncated)
```
      ```
Error: "path": "/home/runner/work/DooDates/DooDates/test-results/e2e-console-errors-Console-baf2f-sur-la-page-d-accueil-smoke-chromium/test-failed-1.png"

"path": "/home/runner/work/DooDates/DooDates/test-results/e2e-console-errors-Console-baf2f-sur-la-page-d-accueil-smoke-chromium/test-failed-1.png"
"name": "error-context",
"path": "/home/runner/work/DooDates/DooDates/test-results/e2e-console-errors-Console-baf2f-sur-la-page-d-accueil-smoke-chromium/error-context.md"
"errorLocation": {
"file": "/home/runner/work/DooDates/DooDates/tests/e2e/console-errors.spec.ts",
```
      ```
File: tests/e2e/console-errors.spec.ts:178
Error: "error": {

"error": {
"message": "Error: Erreurs console trouvées:\n❌ 🌐 VITE_GEMINI_API_KEY manquante \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u001b\nReceived array:  \u001b[31m[\"❌ 🌐 VITE_GEMINI_API_KEY manquante \"]\u001b",
"stack": "Error: Erreurs console trouvées:\n❌ 🌐 VITE_GEMINI_API_KEY manquante \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m1\u001b\nReceived array:  \u001b[31m[\"❌ 🌐 VITE_GEMINI_API_KEY manquante \"]\u001b\n    at /home/runner/work/DooDates/DooDates/tests/e2e/console-errors.spec.ts:17
... (truncated)
```
      *... et 5 autre(s) erreur(s)*

---

## 📈 Résumé Global

- 🎯 **Focus: Commit actuel** `664fb17`
- ❌ **Échecs pour ce commit:** 1
- 📊 **Workflows monitorés:** 6

### ⚠️ Recommandations

Des échecs ont été détectés pour le commit actuel. Consultez les sections ci-dessus pour corriger les problèmes avant de pousser d'autres changements.

## 📊 Analyse des 1 échec(s) détecté(s)

**Statistiques :**
- 🔴 Critiques : 1
- 📂 Catégories : unknown (1)

### 🚨 1. 3️⃣ Main Post-Merge E2E

**Résumé :** Échec 3️⃣ Main Post-Merge E2E - unknown (high)

**Cause identifiée :** Erreur non cataloguée - nécessite analyse manuelle

**Solutions suggérées :**
1. Consulter les logs détaillés du workflow

**⚠️ Action requise :** Résoudre immédiatement - bloque le déploiement

---

## 🚨 Actions prioritaires

**1 échec(s) critique(s) détecté(s) :**

1. **3️⃣ Main Post-Merge E2E** - Consulter les logs détaillés du workflow

**Impact :** Ces échecs bloquent potentiellement le déploiement en production.

## 💡 Améliorations suggérées

- **Monitoring :** Ajouter des métriques de performance

## 🔮 Analyse Prédictive (Indisponible)

⚠️ **Service Gemini non configuré**
- Définir la variable `GEMINI_API_KEY` pour activer l'analyse prédictive
- L'analyse de risque et les recommandations proactives seront disponibles

---

*Rapport généré automatiquement par l'analyseur IA - 2025-12-02T16:06:17.075Z*
---

