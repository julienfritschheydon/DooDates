# Troubleshooting Gemini Test Failures

## Symptômes
Les tests Gemini échouent avec des erreurs répétées :
- `NETWORK_ERROR`
- `API_ERROR`
- `CONFIG_ERROR`

## Diagnostic Actuel

### Configuration Requise
Les tests utilisent maintenant **Edge Function** (comme en production) au lieu d'appels directs à l'API Gemini.

**Mode actuel :** Edge Function via Supabase
**Endpoint :** `${VITE_SUPABASE_URL}/functions/v1/hyper-task`

### Secrets GitHub Requis

Pour que les tests fonctionnent, ces secrets doivent être configurés dans GitHub Actions :

| Secret | Statut | Description |
|--------|--------|-------------|
| `VITE_GEMINI_API_KEY` | ✅ Présent | Clé API Gemini (utilisée par l'Edge Function) |
| `VITE_SUPABASE_URL` | ❓ À vérifier | URL de votre projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | ❓ À vérifier | Clé anonyme Supabase |

## Comment Vérifier les Secrets

1. **Accéder aux secrets GitHub :**
   - Allez sur : https://github.com/julienfritschheydon/DooDates
   - Naviguez vers : **Settings** → **Secrets and variables** → **Actions**

2. **Vérifier que ces 3 secrets existent :**
   - `VITE_GEMINI_API_KEY` ✅
   - `VITE_SUPABASE_URL` ❓
   - `VITE_SUPABASE_ANON_KEY` ❓

## Solution Possible 1 : Ajouter les Secrets Supabase

Si `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont manquants :

1. **Trouver vos valeurs Supabase locales :**
   ```bash
   # Dans votre .env.local (ne PAS commit ce fichier)
   cat .env.local | grep SUPABASE
   ```

2. **Ajouter les secrets dans GitHub :**
   - Settings → Secrets and variables → Actions
   - Click **"New repository secret"**
   - Nom : `VITE_SUPABASE_URL`
   - Valeur : Votre URL Supabase (ex: `https://xxxxx.supabase.co`)
   - Répéter pour `VITE_SUPABASE_ANON_KEY`

## Solution Possible 2 : Utiliser le Mode Direct

Si vous ne voulez pas configurer Supabase dans les tests, vous pouvez forcer le mode Direct :

**Avantages :**
- Plus simple (1 seul secret requis)
- Tests plus rapides

**Inconvénients :**
- Ne teste pas le comportement réel de production
- Nécessite une clé API Gemini sans restriction de domaine

**Comment faire :**

1. **Créer une nouvelle clé API Gemini pour les tests :**
   - Allez sur : https://aistudio.google.com/app/apikey
   - Créez une clé **sans restrictions de domaine**
   - Ajoutez-la comme secret : `VITE_GEMINI_API_KEY_TEST`

2. **Modifier le workflow :**
   ```yaml
   # .github/workflows/7-monthly-gemini.yml
   - name: Run Gemini tests
     env:
       VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY_TEST }}
       VITE_USE_DIRECT_GEMINI: "true"  # Force mode direct
     run: npm run test:gemini
   ```

## Améliorations Apportées

### 1. Validation de Configuration (beforeAll)
Le test vérifie maintenant la configuration avant de démarrer et affiche clairement ce qui manque :

```typescript
✅ Configuration validée
  - VITE_GEMINI_API_KEY: ✅ Présente
  - VITE_SUPABASE_URL: ❌ Manquante  ← PROBLÈME ICI
  - VITE_SUPABASE_ANON_KEY: ❌ Manquante  ← PROBLÈME ICI
  - Mode: EDGE FUNCTION
```

### 2. Retry Logic
Les appels réseau incluent maintenant :
- **3 tentatives automatiques** avec backoff exponentiel (1s, 2s, 4s)
- **Logging détaillé** de chaque tentative
- **Gestion spécifique** des erreurs NETWORK_ERROR et API_ERROR

### 3. Logging Amélioré
Les erreurs affichent maintenant :
- Le mode utilisé (DIRECT vs EDGE_FUNCTION)
- L'état de la configuration
- Le message d'erreur complet

## Next Steps

1. **Vérifier les secrets GitHub** (voir section "Comment Vérifier les Secrets")
2. **Choisir une solution :**
   - Solution 1 : Ajouter secrets Supabase (recommandé, teste la prod)
   - Solution 2 : Forcer mode Direct (plus simple, moins réaliste)
3. **Relancer le workflow** et vérifier les logs détaillés

## Logs à Surveiller

Quand vous relancez le workflow, regardez le output du `beforeAll` :

```
🚀 Initialisation des tests automatisés Gemini
📋 Configuration détectée:
  - VITE_GEMINI_API_KEY: ✅ Présente
  - VITE_SUPABASE_URL: ? (à vérifier)
  - VITE_SUPABASE_ANON_KEY: ? (à vérifier)
  - Mode: EDGE FUNCTION
```

Si un secret manque, le test échouera immédiatement avec un message clair au lieu de 25 erreurs mystérieuses.

