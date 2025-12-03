# Fix: Erreur 403 Forbidden sur POST /rest/v1/guest_quotas

**Date:** 2025-01-XX  
**Environnement:** Production  
**Sévérité:** Haute (bloque la création de polls pour les guests)

## 🔴 Problème

En production, une erreur 403 Forbidden se produit lors de la création d'un poll par un utilisateur guest:

```
POST https://outmbbisrrdiumlweira.supabase.co/rest/v1/guest_quotas 403 (Forbidden)
```

**Stack trace:**
```
incrementPollCreated @ quotaTracking-CusTncKf.js:1
```

## 🔍 Analyse

### Cause probable

1. **Ancien code en production**: Un build précédent contient encore du code qui fait des appels directs à la table `guest_quotas` au lieu de passer par l'Edge Function.

2. **Politiques RLS trop strictes**: Les politiques RLS nécessitent le header `x-dd-fingerprint`, mais les appels directs depuis le client ne l'incluent pas.

3. **Edge Function non déployée**: L'Edge Function `quota-tracking` n'est peut-être pas déployée en production.

### Architecture attendue

```
Client → Edge Function (/functions/v1/quota-tracking) → Supabase (service_role) → guest_quotas
```

**NE PAS:**
```
Client → Supabase REST API (anon) → guest_quotas ❌
```

## ✅ Solution

### 1. Script SQL: Désactiver l'accès anon

Exécuter le script `sql-scripts/fix-guest-quotas-403-forbidden.sql` en production:

```sql
-- Supprime toutes les politiques anon
-- Force l'utilisation de l'Edge Function uniquement
-- L'Edge Function utilise service_role et bypass RLS
```

### 2. Déployer l'Edge Function

**Option A: Automatique via GitHub Actions (Recommandé)**

Le workflow `.github/workflows/deploy-edge-functions.yml` déploie automatiquement les Edge Functions quand:
- On push sur `main` ou `pre-prod`
- Les fichiers dans `supabase/functions/**` changent

**Donc un simple commit & push suffit !** ✅

**Option B: Manuel (si nécessaire)**

Si vous devez déployer manuellement:

```bash
# 1. Se connecter à Supabase CLI
npx supabase login

# 2. Lier le projet (si pas déjà fait)
npx supabase link --project-ref outmbbisrrdiumlweira

# 3. Déployer l'Edge Function
npx supabase functions deploy quota-tracking
```

**Vérifier les secrets GitHub Actions:**
- `SUPABASE_ACCESS_TOKEN` (dans GitHub Secrets)
- `SUPABASE_PROJECT_ID` (dans GitHub Secrets)

### 3. Vérifier les variables d'environnement de l'Edge Function

Dans Supabase Dashboard → Edge Functions → quota-tracking → Settings:
- `SUPABASE_URL` (automatique)
- `SUPABASE_SERVICE_ROLE_KEY` (automatique)

### 4. Rebuild et redéploiement de l'application

**Oui, commit & push suffit !** ✅

Le workflow `.github/workflows/deploy-production.yml` build et déploie automatiquement sur GitHub Pages quand on push sur `main`.

**Vérification:**
1. Commit & push sur `pre-prod` ou `main`
2. Vérifier que les workflows GitHub Actions se déclenchent
3. Attendre la fin du déploiement
4. Tester en production

## 🧪 Tests

### Vérifier que l'Edge Function fonctionne

```bash
curl -X POST https://outmbbisrrdiumlweira.supabase.co/functions/v1/quota-tracking \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "endpoint": "checkQuota",
    "fingerprint": "test-fingerprint",
    "action": "poll_created",
    "credits": 1
  }'
```

### Vérifier que les appels directs sont bloqués

```bash
curl -X POST https://outmbbisrrdiumlweira.supabase.co/rest/v1/guest_quotas \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"fingerprint": "test"}'
```

**Résultat attendu:** 403 Forbidden ✅

## 📝 Fichiers modifiés

- `sql-scripts/fix-guest-quotas-403-forbidden.sql` (nouveau)
- `Docs/BUGFIXES/2025-01-XX-FIX-403-GUEST-QUOTAS.md` (ce fichier)

## 🔗 Références

- Architecture: `Docs/ARCHITECTURE/2025-11-12-FINGERPRINT-QUOTAS.md`
- Edge Function: `supabase/functions/quota-tracking/index.ts`
- Client: `src/lib/guestQuotaService.ts`
- Quota Tracking: `src/lib/quotaTracking.ts`

