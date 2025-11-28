# 📊 Rapport de Monitoring des Workflows GitHub Actions

**Dernière mise à jour:** 28/11/2025 13:40:52

_Workflow run #596 (ID 19764098422) — génération UTC 2025-11-28T12:40:52.113Z_

## 🎯 Focus: Commit `e205dcd`

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

Tous les workflows surveillés ont réussi pour le commit `e205dcd`.

---

## 2️⃣ Develop → Main (Auto-merge)

**Statut:** ✅ success

**Dernier run:** 28/11/2025 13:32:59

**Statistiques:**
- 📊 **Total runs pour ce commit:** **0**
- ❌ **Échecs pour ce commit:** **0**
### ✅ Aucun échec pour ce commit

Tous les workflows surveillés ont réussi pour le commit `e205dcd`.

---

## 3️⃣ Main Post-Merge E2E

**Statut:** ❌ failure

**Dernier run:** 28/11/2025 13:37:41

**Statistiques:**
- 📊 **Total runs pour ce commit:** **1**
- ❌ **Échecs pour ce commit:** **1**
### 🔴 Échecs du commit actuel

#### Run #104 - 28/11/2025 13:37:41

- **Commit:** `e205dcd`
- **Auteur:** julienfritschheydon
- **Branche:** `main`
- **Statut:** failure
- **Lien:** [Voir les détails](https://github.com/julienfritschheydon/DooDates/actions/runs/19764047229)
- **Jobs en échec:**
  - ❌ `⚡ E2E Functional Tests (2)` (failure)
    - Steps en échec: `⚡ Run Functional Tests (Shard 2/2)`
    - **Erreurs détectées (8):**
      ```
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"errors": [],
```
      ```
File: tests/e2e/ultra-simple-form.spec.ts:53
Error: "errors": [],

"errors": [],
"errors": [],
"errors": [],
"error": {
"message": "Error: [console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u001b\u001b)\u001b\n\nExpected length: \u001b[32m0\u001b\nReceived length: \u001b[31m10\u001b\nReceived array:  \u001b[31m[\"
... (truncated)
```
      ```
File: tests/e2e/ultra-simple-form.spec.ts:53
Error: "snippet": "   at utils.ts:155\n\n\u001b[0m \u001b 153 |\u001b   \u001b[36mreturn\u001b {\n \u001b 154 |\u001b     \u001b[36masync\u001b assertClean() {\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 155 |\u001b       \u001b[36mawait\u001b expect(errors\u001b[33m,\u001b errors\u001b[33m.\u001bjoin(\u001b[32m'\\n'\u001b))\u001b[33m.\u001btoHaveLength(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b     |\u001b                                               \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 156 |\u001b     }\u001b[33m,\u001b\n \u001b 157 |\u001b     stop() {\n \u001b 158 |\u001b       page\u001b[33m.\u001boff(\u001b[32m'console'\u001b\u001b[33m,\u001b onConsole)\u001b[33m;\u001b\u001b[0m"

"snippet": "   at utils.ts:155\n\n\u001b[0m \u001b 153 |\u001b   \u001b[36mreturn\u001b {\n \u001b 154 |\u001b     \u001b[36masync\u001b assertClean() {\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 155 |\u001b       \u001b[36mawait\u001b expect(errors\u001b[33m,\u001b errors\u001b[33m.\u001bjoin(\u001b[32m'\\n'\u001b))\u001b[33m.\u001btoHaveLength(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b     |\u001b                                               \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 156 |\u001b     }\u001b[33m,\u001b\n \u001b 157 |\u001b     stop() {\n \u001b 158 |\u001b       page\u001b[33m.\u001boff(\u001b[32m'console'\u001b\u001b[33m,\u001b onConsole)\u001b[33m;\u001b\u001b[0m"
"errors": [
"message": "Error: [console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur
... (truncated)
```
      ```
File: tests/e2e/ultra-simple-form.spec.ts:53
Error: "path": "/home/runner/work/DooDates/DooDates/test-results/ultra-simple-form-DooDates-0b3b5--dashboard-smoke-functional-chromium/error-context.md"

"path": "/home/runner/work/DooDates/DooDates/test-results/ultra-simple-form-DooDates-0b3b5--dashboard-smoke-functional-chromium/error-context.md"
"errorLocation": {
"error": {
"message": "Error: [console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur chargement messages \n\n\u001bexpect(\u001b\u001b[31mreceived\u001b\u001b).\u001btoHaveLength\u001b(\u001b\u001b[32mexpected\u0
... (truncated)
```
      ```
File: tests/e2e/ultra-simple-form.spec.ts:53
Error: "snippet": "   at utils.ts:155\n\n\u001b[0m \u001b 153 |\u001b   \u001b[36mreturn\u001b {\n \u001b 154 |\u001b     \u001b[36masync\u001b assertClean() {\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 155 |\u001b       \u001b[36mawait\u001b expect(errors\u001b[33m,\u001b errors\u001b[33m.\u001bjoin(\u001b[32m'\\n'\u001b))\u001b[33m.\u001btoHaveLength(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b     |\u001b                                               \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 156 |\u001b     }\u001b[33m,\u001b\n \u001b 157 |\u001b     stop() {\n \u001b 158 |\u001b       page\u001b[33m.\u001boff(\u001b[32m'console'\u001b\u001b[33m,\u001b onConsole)\u001b[33m;\u001b\u001b[0m"

"snippet": "   at utils.ts:155\n\n\u001b[0m \u001b 153 |\u001b   \u001b[36mreturn\u001b {\n \u001b 154 |\u001b     \u001b[36masync\u001b assertClean() {\n\u001b[31m\u001b[1m>\u001b\u001b\u001b 155 |\u001b       \u001b[36mawait\u001b expect(errors\u001b[33m,\u001b errors\u001b[33m.\u001bjoin(\u001b[32m'\\n'\u001b))\u001b[33m.\u001btoHaveLength(\u001b[35m0\u001b)\u001b[33m;\u001b\n \u001b     |\u001b                                               \u001b[31m\u001b[1m^\u001b\u001b\n \u001b 156 |\u001b     }\u001b[33m,\u001b\n \u001b 157 |\u001b     stop() {\n \u001b 158 |\u001b       page\u001b[33m.\u001boff(\u001b[32m'console'\u001b\u001b[33m,\u001b onConsole)\u001b[33m;\u001b\u001b[0m"
"errors": [
"message": "Error: [console.error] ❌ ℹ️ Erreur chargement messages \n[console.error] ❌ ℹ️ Erreur
... (truncated)
```
      *... et 3 autre(s) erreur(s)*

---

## 📈 Résumé Global

- 🎯 **Focus: Commit actuel** `e205dcd`
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

*Rapport généré automatiquement par l'analyseur IA - 2025-11-28T12:40:55.359Z*
---

