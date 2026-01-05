# Fix Supabase Edge Function - Gemini Tests

## 🔴 Problème Identifié

L'Edge Function `hyper-task` utilisait le modèle **Gemini expérimental** (`gemini-2.0-flash-exp`) qui n'est plus disponible ou nécessite des permissions spéciales.

### Symptômes

- Tests Gemini échouent avec `NETWORK_ERROR` / `API_ERROR`
- Tous les secrets GitHub sont présents ✅
- Configuration détectée correctement ✅
- Mais les appels à l'Edge Function échouent ❌

## ✅ Solution Appliquée

### 1. Mise à Jour du Modèle Gemini

**Fichier modifié** : `supabase/functions/hyper-task/index.ts`

```typescript
// ❌ AVANT (modèle expérimental)
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

// ✅ APRÈS (modèle stable)
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
```

**Pourquoi ce changement ?**

- `gemini-2.0-flash-exp` : Modèle expérimental, peut être désactivé sans préavis
- `gemini-1.5-flash` : Modèle stable, garanti disponible, performant et fiable

## 🚀 Déploiement Requis

### Étape 1 : Vérifier la Variable d'Environnement Supabase

L'Edge Function utilise la variable **`GEMINI_API_KEY`** (pas `[DEPRECATED_KEY]`).

**Vérifiez dans Supabase Dashboard :**

1. Allez sur : https://supabase.com/dashboard/project/[votre-project-id]
2. Naviguez vers : **Settings** → **Edge Functions** → **Environment Variables**
3. Vérifiez que `GEMINI_API_KEY` existe avec la même valeur que votre secret GitHub `[DEPRECATED_KEY]`

**Si la variable manque, ajoutez-la :**

```bash
# Via Supabase CLI
supabase secrets set GEMINI_API_KEY=votre_cle_api_gemini

# OU via Dashboard
Settings → Edge Functions → Add secret
Name: GEMINI_API_KEY
Value: [votre clé API Gemini]
```

### Étape 2 : Déployer l'Edge Function Mise à Jour

**Option A : Via Supabase CLI (Recommandé)**

```bash
# 1. Installer Supabase CLI (si pas déjà fait)
npm install -g supabase

# 2. Login
supabase login

# 3. Link au projet
supabase link --project-ref [votre-project-id]

# 4. Déployer la fonction
supabase functions deploy hyper-task
```

**Option B : Via Supabase Dashboard**

1. Allez sur : https://supabase.com/dashboard/project/[votre-project-id]
2. Naviguez vers : **Edge Functions**
3. Sélectionnez `hyper-task`
4. Click **Deploy new version**
5. Copiez/collez le contenu de `supabase/functions/hyper-task/index.ts`

### Étape 3 : Vérifier le Déploiement

**Test via curl :**

```bash
# Remplacez [VOTRE_SUPABASE_URL] et [VOTRE_ANON_KEY]
curl -X POST "https://[VOTRE_SUPABASE_URL]/functions/v1/hyper-task" \
  -H "Content-Type: application/json" \
  -H "apikey: [VOTRE_ANON_KEY]" \
  -d '{"userInput": "test", "prompt": "Say hello"}'
```

**Réponse attendue :**

```json
{
  "success": true,
  "data": "Hello! ..."
}
```

## 📊 Diagnostic Complet

### Configuration GitHub Actions ✅

| Secret                   | Statut                | Utilisation    |
| ------------------------ | --------------------- | -------------- |
| `[DEPRECATED_KEY]`    | ✅ Présent (5 months) | Workflow tests |
| `VITE_SUPABASE_URL`      | ✅ Présent (3 days)   | Workflow tests |
| `VITE_SUPABASE_ANON_KEY` | ✅ Présent (3 days)   | Workflow tests |

### Configuration Supabase Edge Function ❓

| Variable                    | Statut          | Action Requise                   |
| --------------------------- | --------------- | -------------------------------- |
| `GEMINI_API_KEY`            | ❓ À vérifier   | Vérifier dans Supabase Dashboard |
| `SUPABASE_URL`              | ✅ Auto-injecté | Rien à faire                     |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Auto-injecté | Rien à faire                     |

## 🔄 Après le Déploiement

### Test Local

```bash
# Tester localement avec les vraies variables
npm run test:gemini
```

**Output attendu :**

```
📋 Configuration détectée:
  - [DEPRECATED_KEY]: ✅ Présente
  - VITE_SUPABASE_URL: ✅ Présente
  - VITE_SUPABASE_ANON_KEY: ✅ Présente
  - Mode: EDGE FUNCTION
✅ Configuration validée

Test 1: Réunions - Organise une réunion d'équipe...
  ✅ RÉUSSI
```

### Test CI/CD

Une fois l'Edge Function déployée :

1. Relancez le workflow GitHub Actions (7-monthly-gemini.yml)
2. Vérifiez les logs pour voir le nouveau diagnostic
3. Les tests devraient maintenant passer ✅

## 📝 Checklist de Déploiement

- [ ] ✅ Fichier `supabase/functions/hyper-task/index.ts` mis à jour (modèle stable)
- [ ] ❓ Vérifier variable `GEMINI_API_KEY` dans Supabase Dashboard
- [ ] ❓ Déployer l'Edge Function via CLI ou Dashboard
- [ ] ❓ Tester avec curl pour vérifier le déploiement
- [ ] ❓ Relancer les tests localement
- [ ] ❓ Relancer le workflow GitHub Actions
- [ ] ❓ Vérifier que tous les tests passent ✅

## 🎯 Résumé

**Cause racine :** Edge Function utilisait un modèle Gemini expérimental non disponible

**Solution :**

1. ✅ Mise à jour vers modèle stable `gemini-1.5-flash`
2. ❓ Déploiement de l'Edge Function sur Supabase requis

**Prochaine étape :** Déployer l'Edge Function mise à jour sur Supabase

---

**Date** : 10 Novembre 2025
