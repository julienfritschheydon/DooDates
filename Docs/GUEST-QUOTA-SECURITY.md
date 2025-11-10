# 🔒 Sécurité des Quotas Guests - Solution 2

### Étape 2 : Vérifier les RLS Policies

Les policies suivantes doivent être actives :

### Étape 3 : Déployer le code

```bash
# Vérifier que les nouveaux fichiers sont bien présents
git status

# Les fichiers suivants doivent apparaître :
# - src/lib/browserFingerprint.ts
# - src/lib/guestQuotaService.ts
# - sql-scripts/create-guest-quotas-table.sql
# - Docs/GUEST-QUOTA-SECURITY.md

# Commit et push
git add .
git commit -m "feat: Sécurisation quotas guests avec fingerprinting + Supabase"
git push
```

## 🧪 Tests de sécurité

### Test 1 : Vérification fingerprint

```typescript
// Dans la console du navigateur
import { generateBrowserFingerprint } from './src/lib/browserFingerprint';

const fp = await generateBrowserFingerprint();
console.log('Fingerprint:', fp.fingerprint);
console.log('Confidence:', fp.metadata.confidence);
console.log('Components:', fp.components);
```

**Résultat attendu :**
- Fingerprint unique (64 caractères hexadécimaux)
- Confidence >= 80%
- Au moins 6 composants détectés

### Test 2 : Contournement localStorage (DOIT ÉCHOUER)

**Protocole :**

1. **Créer 3 sondages en mode guest**
   ```
   - Aller sur /create
   - Créer 3 sondages de date
   - Vérifier quota = 3/5 dans le dashboard
   ```

2. **Vérifier stockage Supabase**
   ```sql
   -- Dans Supabase SQL Editor
   SELECT fingerprint, conversations_created, polls_created, total_credits_consumed
   FROM guest_quotas
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   **Attendu :** 1 ligne avec `polls_created = 3`

3. **Effacer localStorage complètement**
   ```javascript
   // Console navigateur
   localStorage.clear();
   console.log('localStorage cleared');
   ```

4. **Recharger la page**
   ```
   - F5 ou Ctrl+R
   - Vérifier que le quota affiche toujours 3/5
   ```

5. **Tenter de créer 2 sondages supplémentaires**
   ```
   - Créer sondage #4 → ✅ Doit réussir (quota 4/5)
   - Créer sondage #5 → ✅ Doit réussir (quota 5/5)
   - Créer sondage #6 → ❌ DOIT ÉCHOUER (limite atteinte)
   ```

6. **Vérifier message d'erreur**
   ```
   - Modal "Conversation Limit Reached" doit s'afficher
   - Bouton "Upgrade Now" visible
   - Impossible de créer le sondage
   ```

7. **Effacer localStorage à nouveau**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

8. **Vérifier que la limite persiste**
   ```
   - Quota toujours à 5/5
   - Impossible de créer nouveau sondage
   - ✅ CONTOURNEMENT BLOQUÉ
   ```

### Test 3 : Journal de consommation

```javascript
// Console navigateur
import { getGuestQuotaJournal } from './src/lib/guestQuotaService';

const journal = await getGuestQuotaJournal(20);
console.table(journal);
```

**Résultat attendu :**
- 5 entrées (5 polls créés)
- Action = `poll_created`
- Credits = 1 par entrée
- Métadonnées avec `pollId`

### Test 4 : Fingerprint persistant

```javascript
// Console navigateur
const fp1 = await getCachedFingerprint();
console.log('Fingerprint 1:', fp1);

// Recharger la page
location.reload();

// Après rechargement
const fp2 = await getCachedFingerprint();
console.log('Fingerprint 2:', fp2);

console.log('Match:', fp1 === fp2); // Doit être true
```

### Test 5 : Transition guest → authenticated

1. **En mode guest, créer 3 sondages**
2. **Se connecter avec un compte**
3. **Vérifier que le quota authenticated s'affiche (0/1000)**
4. **Créer 2 sondages en mode authenticated**
5. **Se déconnecter**
6. **Vérifier que le quota guest revient (3/5)**

## 📊 Limites Guest

```typescript
const GUEST_LIMITS = {
  CONVERSATIONS: 5,
  POLLS: 5,
  AI_MESSAGES: 20,
  ANALYTICS_QUERIES: 10,
  SIMULATIONS: 2,
  TOTAL_CREDITS: 50,
};
```

## 🔍 Monitoring

### Requêtes SQL utiles

**Voir tous les guests actifs :**
```sql
SELECT 
  fingerprint,
  total_credits_consumed,
  conversations_created,
  polls_created,
  last_activity_at,
  timezone,
  language
FROM guest_quotas
WHERE last_activity_at > NOW() - INTERVAL '7 days'
ORDER BY total_credits_consumed DESC;
```

**Détecter abus potentiels :**
```sql
SELECT 
  fingerprint,
  total_credits_consumed,
  COUNT(*) as action_count,
  MAX(created_at) as last_action
FROM guest_quota_journal
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY fingerprint
HAVING COUNT(*) > 50  -- Plus de 50 actions en 1h = suspect
ORDER BY action_count DESC;
```

**Nettoyage manuel des guests inactifs :**
```sql
SELECT cleanup_old_guest_quotas();
-- Retourne le nombre de quotas supprimés (>90 jours inactifs)
```

## 🐛 Troubleshooting

### Problème : Fingerprint change à chaque rechargement

**Cause :** Canvas/WebGL fingerprinting échoue  
**Solution :** Vérifier les logs dans la console

```javascript
// Activer logs debug
localStorage.setItem('doodates_log_level', 'debug');
location.reload();
```

### Problème : Quota non synchronisé

**Cause :** Erreur Supabase ou RLS policies incorrectes  
**Solution :**

1. Vérifier connexion Supabase :
   ```javascript
   import { supabase } from './src/lib/supabase';
   const { data, error } = await supabase.from('guest_quotas').select('count');
   console.log('Supabase OK:', !error);
   ```

2. Vérifier RLS policies dans Supabase Dashboard

### Problème : "Failed to fetch quota"

**Cause :** Table `guest_quotas` n'existe pas  
**Solution :** Exécuter le script SQL de création

## 📈 Métriques de succès

- ✅ Impossible de contourner quotas en effaçant localStorage
- ✅ Fingerprint stable (>95% des cas)
- ✅ Temps de réponse < 200ms pour vérification quota
- ✅ 0 faux positifs (utilisateurs légitimes bloqués)
- ✅ Détection abus (>50 actions/heure)

## 🔜 Prochaines étapes (POST-BÊTA)

Voir **Solution 3** dans `Docs/2. Planning.md` :
- Migration complète vers Supabase Functions
- Validation serveur 100% (pas de localStorage)
- Monitoring avancé et alertes
- Rate limiting intelligent
