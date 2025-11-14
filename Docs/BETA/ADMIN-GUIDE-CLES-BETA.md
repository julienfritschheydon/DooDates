# 🔑 Guide Admin - Gestion des Clés Bêta

**Documentation pratique pour générer et gérer les clés bêta**  
**Date :** Décembre 2025

---

## ⚠️ Erreur : "Seuls les administrateurs peuvent générer des clés bêta"

Si vous rencontrez cette erreur, il y a **deux causes possibles** :

1. **Votre compte n'est pas configuré comme admin** (le plus fréquent)
2. **Vous n'êtes pas authentifié** : La fonction utilise `auth.uid()` qui nécessite une session utilisateur active

### 🔍 Diagnostic

**Étape 1 : Vérifier votre statut admin**

```sql
-- Trouvez votre utilisateur
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role_meta,
  raw_app_meta_data->>'role' as role_app,
  auth.uid() as current_user_id
FROM auth.users
WHERE email = 'julien.fritsch@gmail.com';
```

**Étape 2 : Vérifier si vous êtes authentifié**

```sql
-- Vérifier l'utilisateur actuellement connecté
SELECT auth.uid() as current_user_id;

-- Si NULL, vous n'êtes pas authentifié avec un compte utilisateur
```

**Si `auth.uid()` retourne NULL** : Vous exécutez la requête depuis le SQL Editor sans être connecté avec votre compte utilisateur. La fonction ne peut pas vérifier votre statut admin.

### ✅ Solutions

#### Solution 1 : Devenir Admin ET s'authentifier (Recommandé)

**Étape A : Définir votre compte comme admin**

```sql
-- Définir comme admin via raw_user_meta_data
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'julien.fritsch@gmail.com';

-- Vérifier
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'julien.fritsch@gmail.com';
```

**Étape B : Utiliser l'interface de l'app pour générer les clés**

Au lieu d'utiliser le SQL Editor directement, utilisez l'interface de l'app DooDates :
1. Connectez-vous à l'app avec votre compte
2. Allez dans la page admin (si elle existe)
3. Utilisez le service `BetaKeyService.generateKeys()`

#### Solution 2 : Contournement temporaire (Développement uniquement)

Si vous devez absolument générer depuis le SQL Editor, vous pouvez temporairement modifier la fonction pour accepter un `user_id` en paramètre :

```sql
-- Version temporaire pour développement
CREATE OR REPLACE FUNCTION generate_beta_key_dev(
  p_count INT DEFAULT 1,
  p_notes TEXT DEFAULT NULL,
  p_duration_months INT DEFAULT 3,
  p_user_id UUID DEFAULT NULL  -- Permet de forcer un user_id
)
RETURNS TABLE (code TEXT, expires_at TIMESTAMPTZ)
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_code TEXT;
  v_expires_at TIMESTAMPTZ;
  v_user_id UUID;
BEGIN
  -- Utiliser le paramètre ou auth.uid()
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Si user_id fourni, vérifier qu'il est admin
  IF v_user_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = v_user_id
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin'
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    ) THEN
      RAISE EXCEPTION 'Seuls les administrateurs peuvent générer des clés bêta';
    END IF;
  END IF;
  
  -- Générer les clés...
  FOR i IN 1..p_count LOOP
    LOOP
      v_code := 'BETA-' || 
                upper(substr(md5(random()::text), 1, 4)) || '-' ||
                upper(substr(md5(random()::text), 1, 4)) || '-' ||
                upper(substr(md5(random()::text), 1, 4));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM beta_keys WHERE beta_keys.code = v_code);
    END LOOP;
    
    v_expires_at := NOW() + (p_duration_months || ' months')::INTERVAL;
    
    INSERT INTO beta_keys (code, status, expires_at, created_by, notes)
    VALUES (v_code, 'active', v_expires_at, v_user_id, p_notes);
    
    RETURN QUERY SELECT v_code, v_expires_at;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Utilisation avec votre user_id
SELECT code, expires_at 
FROM generate_beta_key_dev(
  p_count => 10,
  p_notes => 'Batch Décembre 2025',
  p_duration_months => 3,
  p_user_id => (SELECT id FROM auth.users WHERE email = 'julien.fritsch@gmail.com')
);
```

**⚠️ Attention :** Cette solution est pour le développement uniquement. En production, utilisez toujours l'authentification normale.

#### Solution 3 : Via Supabase Dashboard (Plus simple)

1. Ouvrez **Supabase Dashboard** → Votre projet
2. Allez dans **Authentication** → **Users**
3. Trouvez votre utilisateur (recherchez par email)
4. Cliquez sur l'utilisateur pour ouvrir les détails
5. Dans la section **User Metadata**, ajoutez/modifiez :
   ```json
   {
     "role": "admin"
   }
   ```
6. Cliquez sur **Save**
7. **Ensuite, utilisez l'interface de l'app** (pas le SQL Editor directement) pour générer les clés

---

## 📝 Générer des Clés Bêta

**⚠️ Important :** Pour générer des clés depuis le SQL Editor, vous devez :
1. Être configuré comme admin (voir section ci-dessus)
2. **ET** être authentifié avec votre compte utilisateur (pas juste admin du projet Supabase)

**Si vous obtenez toujours l'erreur**, utilisez la **Solution 2** (fonction `generate_beta_key_dev`) ou générez les clés via l'interface de l'app.

### Méthode 1 : Via SQL Editor (Nécessite authentification)

**Générer une seule clé :**
```sql
SELECT code, expires_at 
FROM generate_beta_key(
  p_count => 1,
  p_notes => 'Testeur bêta - Nom du testeur',
  p_duration_months => 3
);
```

**Générer plusieurs clés (batch) :**
```sql
-- Générer 10 clés pour un batch
SELECT code, expires_at 
FROM generate_beta_key(
  p_count => 10,
  p_notes => 'Batch Décembre 2025',
  p_duration_months => 3
);
```

**Paramètres :**
- `p_count` : Nombre de clés à générer (1-100 recommandé)
- `p_notes` : Notes descriptives (optionnel, ex: "Batch Nov 2025", "Testeur - Pierre")
- `p_duration_months` : Durée de validité en mois (défaut: 3)

**Format des clés générées :**
- Format : `BETA-XXXX-XXXX-XXXX` (12 caractères alphanumériques)
- Statut initial : `active`
- Crédits mensuels : 1000 crédits/mois
- Expiration : Date actuelle + durée spécifiée

### Méthode 2 : Via l'Interface (BetaKeyService)

Si vous avez une interface admin dans l'app :

```typescript
import { BetaKeyService } from '@/services/BetaKeyService';

// Générer 10 clés
const keys = await BetaKeyService.generateKeys(
  10,                    // nombre de clés
  'Batch Décembre 2025', // notes
  3                      // durée en mois
);

// Télécharger en CSV
BetaKeyService.downloadCSV(keys, 'beta-keys-decembre-2025.csv');
```

---

## 📊 Consulter les Clés Générées

**Voir toutes les clés :**
```sql
SELECT 
  code,
  status,
  credits_monthly,
  expires_at,
  assigned_to,
  redeemed_at,
  created_at,
  notes
FROM beta_keys
ORDER BY created_at DESC;
```

**Voir uniquement les clés actives (non utilisées) :**
```sql
SELECT 
  code,
  expires_at,
  notes,
  created_at
FROM beta_keys
WHERE status = 'active'
ORDER BY created_at DESC;
```

**Voir les clés utilisées :**
```sql
SELECT 
  code,
  assigned_to,
  redeemed_at,
  expires_at,
  bugs_reported,
  feedback_score
FROM beta_keys
WHERE status = 'used'
ORDER BY redeemed_at DESC;
```

**Voir les clés expirées :**
```sql
SELECT 
  code,
  expires_at,
  status
FROM beta_keys
WHERE expires_at < NOW()
ORDER BY expires_at DESC;
```

---

## 📤 Exporter les Clés en CSV

**Méthode 1 : Via Supabase Dashboard**
1. Exécutez la requête SQL ci-dessus
2. Cliquez sur **Export** dans le SQL Editor
3. Choisissez **CSV**

**Méthode 2 : Via SQL (format CSV)**
```sql
-- Exporter toutes les clés actives
SELECT 
  code,
  status,
  expires_at,
  notes,
  created_at
FROM beta_keys
WHERE status = 'active'
ORDER BY created_at DESC;
-- Puis exporter le résultat en CSV
```

**Méthode 3 : Via Code (BetaKeyService)**
```typescript
const keys = await BetaKeyService.getAllKeys();
BetaKeyService.downloadCSV(keys, 'beta-keys-export.csv');
```

---

## 🔍 Vérifier l'Activation d'une Clé

**Vérifier qu'une clé a été activée par un utilisateur :**
```sql
SELECT 
  bk.code,
  bk.status,
  bk.assigned_to,
  au.email as user_email,
  bk.redeemed_at,
  bk.expires_at,
  uq.tier,
  uq.credits_total,
  uq.credits_used
FROM beta_keys bk
LEFT JOIN auth.users au ON bk.assigned_to = au.id
LEFT JOIN user_quotas uq ON bk.assigned_to = uq.user_id
WHERE bk.code = 'BETA-XXXX-XXXX-XXXX';  -- Remplacez par le code
```

**Résultat attendu après activation :**
- `status` : `'used'` (au lieu de `'active'`)
- `assigned_to` : UUID de l'utilisateur
- `redeemed_at` : Date/heure d'activation
- `tier` : `'beta'` dans `user_quotas`
- `credits_total` : `1000`

---

## 🛠️ Gestion Avancée

### Révoquer une Clé

```sql
UPDATE beta_keys
SET 
  status = 'revoked',
  notes = COALESCE(notes, '') || ' - Révoquée le ' || NOW()::text
WHERE code = 'BETA-XXXX-XXXX-XXXX';
```

### Prolonger une Clé

```sql
UPDATE beta_keys
SET expires_at = expires_at + INTERVAL '3 months'
WHERE code = 'BETA-XXXX-XXXX-XXXX';
```

### Voir les Statistiques

```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'active') as actives,
  COUNT(*) FILTER (WHERE status = 'used') as utilisees,
  COUNT(*) FILTER (WHERE status = 'expired') as expirees,
  COUNT(*) FILTER (WHERE status = 'revoked') as revoquees,
  AVG(bugs_reported) FILTER (WHERE status = 'used') as avg_bugs,
  AVG(feedback_score) FILTER (WHERE status = 'used' AND feedback_score IS NOT NULL) as avg_feedback
FROM beta_keys;
```

---

## 🐛 Troubleshooting

### Erreur : "Seuls les administrateurs peuvent générer des clés bêta"

**Cause :** Votre compte n'est pas configuré comme admin.

**Solution :** Voir section "Devenir Administrateur" ci-dessus.

### Erreur : "Function generate_beta_key does not exist"

**Cause :** La fonction SQL n'a pas été créée.

**Solution :**
1. Exécutez le script SQL complet : `sql-scripts/create-beta-keys-and-quotas.sql`
2. Vérifiez que la fonction existe :
   ```sql
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'generate_beta_key';
   ```

### Erreur : "RLS policy violation"

**Cause :** Les politiques RLS bloquent l'accès.

**Solution :** Vérifiez que vous êtes bien admin et que les RLS policies sont correctement configurées.

### Clé générée mais non visible dans l'app

**Vérifications :**
1. Vérifiez le statut de la clé : `SELECT status FROM beta_keys WHERE code = 'XXX';`
2. Vérifiez que la clé n'est pas expirée : `SELECT expires_at FROM beta_keys WHERE code = 'XXX';`
3. Vérifiez les permissions RLS sur la table `beta_keys`

---

## 📋 Checklist Rapide

**Avant de générer des clés :**
- [ ] Vérifier que vous êtes admin (voir section "Devenir Administrateur")
- [ ] Vérifier que la fonction `generate_beta_key` existe
- [ ] Décider du nombre de clés et de la durée

**Après génération :**
- [ ] Copier les codes générés
- [ ] Exporter en CSV pour sauvegarde
- [ ] Distribuer les clés aux testeurs (email, Discord, etc.)

**Suivi :**
- [ ] Vérifier régulièrement les clés activées
- [ ] Suivre les bugs reportés (`bugs_reported`)
- [ ] Collecter les feedbacks (`feedback_score`)

---

## 💡 Exemples d'Utilisation

### Générer 20 clés pour un batch de testeurs

```sql
SELECT code, expires_at 
FROM generate_beta_key(
  p_count => 20,
  p_notes => 'Batch Décembre 2025 - Testeurs initiaux',
  p_duration_months => 3
);
```

### Générer une clé pour un testeur spécifique

```sql
SELECT code, expires_at 
FROM generate_beta_key(
  p_count => 1,
  p_notes => 'Testeur - Pierre Dupont',
  p_duration_months => 6
);
```

### Voir toutes les clés actives non utilisées

```sql
SELECT 
  code,
  expires_at,
  notes,
  created_at
FROM beta_keys
WHERE status = 'active' 
  AND expires_at > NOW()
ORDER BY created_at DESC;
```

---

**Document créé pour :** Julien Fritsch  
**Dernière mise à jour :** Décembre 2025

