# Guide de Configuration Supabase pour Bêta

**Date :** 05/11/2025  
**Objectif :** Configurer Supabase pour la bêta (auth + quotas)

---

## 📋 Checklist de Configuration

### 7. Créer des Clés Bêta

**Générer des clés bêta directement dans Supabase SQL Editor :**

```sql
-- Générer une clé bêta (retourne le code et la date d'expiration)
SELECT code, expires_at FROM generate_beta_key(
  p_count => 1,
  p_notes => 'Testeur bêta - Pierre',
  p_duration_months => 3
);
```

**Générer plusieurs clés en une fois :**
```sql
-- Générer 10 clés pour un batch de testeurs
SELECT code, expires_at FROM generate_beta_key(
  p_count => 10,
  p_notes => 'Batch Nov 2025',
  p_duration_months => 3
);
```

**Voir toutes les clés générées :**
```sql
SELECT 
  code,
  status,
  credits_monthly,
  expires_at,
  created_at,
  notes
FROM beta_keys
ORDER BY created_at DESC;
```

**Exporter les clés en CSV :**
1. Exécutez la requête ci-dessus
2. Cliquez sur "Export" dans Supabase SQL Editor
3. Choisissez "CSV"

**Génération manuelle (sans fonction) :**

```sql
INSERT INTO beta_keys (code, status, credits_monthly, expires_at, notes)
VALUES (
  'BETA-' || upper(substring(md5(random()::text) from 1 for 4)) || '-' || 
           upper(substring(md5(random()::text) from 1 for 4)) || '-' || 
           upper(substring(md5(random()::text) from 1 for 4)),
  'active',
  1000,
  NOW() + INTERVAL '3 months',
  'Testeur bêta - Nom du testeur'
)
RETURNING code;
```

**Activer une clé bêta (dans l'app) :**
- L'utilisateur doit entrer le code dans l'interface (bouton "Clé bêta" dans le menu de gauche)
- Le code doit être validé et assigné à `user.id`
- Les quotas doivent être créés dans `user_quotas`

**✅ Vérifier que la clé bêta est activée :**

**Méthode 1 : Dans Supabase Dashboard**

1. **Vérifier la clé dans `beta_keys` :**
   ```sql
   SELECT 
     code,
     status,
     assigned_to,
     redeemed_at,
     expires_at,
     credits_monthly
   FROM beta_keys
   WHERE code = 'BETA-XXXX-XXXX-XXXX'  -- Remplacez par votre code
   ORDER BY created_at DESC;
   ```
   
   **Résultat attendu :**
   - `status`: `'used'` (au lieu de `'active'`)
   - `assigned_to`: votre `user.id` (UUID)
   - `redeemed_at`: date/heure d'activation

2. **Vérifier les quotas dans `user_quotas` :**
   ```sql
   SELECT 
     uq.user_id,
     au.email,
     uq.tier,
     uq.credits_total,
     uq.credits_remaining,
     uq.max_polls,
     uq.period_end
   FROM user_quotas uq
   JOIN auth.users au ON uq.user_id = au.id
   WHERE uq.user_id = 'VOTRE_USER_ID'  -- Remplacez par votre user.id
   ```
   
   **Résultat attendu :**
   - `tier`: `'beta'`
   - `credits_total`: `1000`
   - `credits_remaining`: `1000`
   - `max_polls`: `999999`

**Méthode 2 : Dans l'application**

1. **Rechargez la page** après l'activation
2. **Vérifiez dans la sidebar** : vous devriez voir votre statut mis à jour
3. **Vérifiez les quotas** : si vous avez une page de quotas/statut, elle devrait afficher "Beta" avec 1000 crédits

**📊 Comparaison des quotas :**

| Tier | Crédits IA | Sondages max | Support |
|------|------------|--------------|---------|
| **Free** (sans clé bêta) | 20/mois | 20 total | Non garanti |
| **Beta** (avec clé bêta) | 1000/mois | 999999 (illimité) | Prioritaire ✅ |

**Note :** Un utilisateur connecté sans clé bêta aura automatiquement le tier `free` avec :
- `credits_total`: `20`
- `credits_remaining`: `20`
- `max_polls`: `20`
- `tier`: `free`

Les quotas sont créés automatiquement lors de la première connexion ou lors de l'activation d'une clé bêta.

**Méthode 3 : Via la console du navigateur**

```javascript
// Vérifier les quotas dans localStorage (si stockés localement)
// Note: Les quotas sont stockés dans Supabase, pas dans localStorage

// Vérifier votre user.id
// Dans la sidebar, votre email est affiché - c'est votre compte
// Vous pouvez aussi vérifier dans Supabase Dashboard → Authentication → Users
```

---

### 8. Vérifier les Quotas

```sql
-- Vérifier les quotas créés
SELECT 
  uq.user_id,
  au.email,
  uq.tier,
  uq.credits_total,
  uq.credits_used,
  uq.credits_remaining,
  uq.max_polls
FROM user_quotas uq
JOIN auth.users au ON uq.user_id = au.id
ORDER BY uq.created_at DESC;
```

## 📚 Ressources

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [SQL Scripts](./sql-scripts/)
- [Planning Jour 5](./2.%20Planning.md#jour-5)

---

