# 🔍 Comment vérifier si vos données sont en base de données

## ✅ BONNE NOUVELLE (7 Nov 2025)

D'après vos derniers logs, **vos données SONT maintenant sauvegardées en Supabase** ! 🎉

Preuve dans les logs :
```
✅ ConversationStorageSupabase.createConversation TERMINÉ
ℹ️ Conversation créée dans Supabase
💾 Sauvegarde Supabase terminée
🐛 ℹ️ Messages sauvegardés dans Supabase
```

**Cependant**, il reste des erreurs 400 à corriger (voir section "Correction des erreurs 400" ci-dessous).

---

## Méthode 1 : Via la console du navigateur

### A. Vérifier localStorage (données locales)

```javascript
// Voir toutes les conversations locales
const conversations = JSON.parse(localStorage.getItem('doodates_conversations') || '[]');
console.log('💾 Conversations localStorage:', conversations);

// Voir tous les polls/formulaires locaux
const polls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
console.log('📋 Polls localStorage:', polls);

// Voir les messages d'une conversation
const messages = JSON.parse(localStorage.getItem('doodates_messages') || '{}');
console.log('💬 Messages localStorage:', messages);
```

### B. Vérifier Supabase (base de données)

```javascript
// Dans la console, après avoir importé votre client Supabase
import { supabase } from './lib/supabase';

// Vérifier les conversations en base
const { data: conversations, error } = await supabase
  .from('conversations')
  .select('*')
  .order('created_at', { ascending: false });

console.log('🗄️ Conversations Supabase:', conversations, error);

// Vérifier les messages en base
const { data: messages, error: msgError } = await supabase
  .from('messages')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);

console.log('💬 Messages Supabase:', messages, msgError);
```

## Méthode 2 : Via le dashboard Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet : `outmbbisrrdiumlweira`
3. Cliquez sur "Table Editor" dans le menu de gauche
4. Vérifiez les tables :
   - `conversations` : liste des conversations
   - `messages` : messages des conversations
   - `polls` : sondages/formulaires créés
   - `profiles` : profils utilisateurs

## Méthode 3 : Activer les logs détaillés

Ajoutez ceci dans votre console pour voir les sauvegardes en temps réel :

```javascript
// Intercepter les appels localStorage
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  if (key.startsWith('doodates_')) {
    console.log('💾 localStorage.setItem:', key, JSON.parse(value || '{}'));
  }
  return originalSetItem.apply(this, arguments);
};
```

## 🚨 Problèmes identifiés dans vos logs

### 1. Mode invité actif
```
🐛 ℹ️ Using localStorage for guest user
💾 Pas de sauvegarde Supabase (guest ou pas de user)
```
**Solution** : Connectez-vous avec un compte utilisateur authentifié

### 2. Erreurs 400 Bad Request vers Supabase
```
GET https://outmbbisrrdiumlweira.supabase.co/rest/v1/profiles?select=...&id=eq.dev-mhosmcqw-05f3rv 400 (Bad Request)
```
**Causes possibles** :
- L'ID utilisateur `dev-mhosmcqw-05f3rv` n'existe pas dans la table `profiles`
- Les Row Level Security (RLS) policies bloquent l'accès
- La table `profiles` n'est pas configurée correctement

### 3. Incohérence d'ID utilisateur
- Parfois : `userId: 'guest'`
- Parfois : `userId: 'dev-mhosmcqw-05f3rv'`

**Solution** : Vérifier l'authentification

## ✅ Comment résoudre le problème

### Solution 1 : Vérifier l'authentification
Ajoutez ce code dans votre console pour vérifier l'état d'authentification :

```javascript
import { supabase } from './lib/supabase';

const { data: { user }, error } = await supabase.auth.getUser();
console.log('👤 User actuel:', user, error);
```

### Solution 2 : Créer le profil utilisateur manquant

Si le profil n'existe pas dans la base :

```javascript
const { data, error } = await supabase
  .from('profiles')
  .insert([
    {
      id: 'dev-mhosmcqw-05f3rv',
      created_at: new Date().toISOString(),
      subscription_expires_at: null
    }
  ])
  .select();

console.log('✅ Profil créé:', data, error);
```

### Solution 3 : Vérifier les RLS policies

Dans le dashboard Supabase :
1. Allez dans "Table Editor" > "profiles"
2. Cliquez sur "RLS Policies"
3. Vérifiez que les policies permettent l'accès

### Solution 4 : Forcer la sauvegarde en Supabase

Vérifiez le fichier `.env` :

```bash
# Ne PAS avoir cette ligne, ou la mettre à false
VITE_DISABLE_SUPABASE_CONVERSATIONS=false
```

## 📝 Test rapide

Copiez-collez ceci dans la console pour un diagnostic complet :

```javascript
console.log('=== DIAGNOSTIC STOCKAGE ===');
console.log('1. localStorage conversations:', JSON.parse(localStorage.getItem('doodates_conversations') || '[]').length);
console.log('2. localStorage polls:', JSON.parse(localStorage.getItem('doodates_polls') || '[]').length);
console.log('3. localStorage messages:', Object.keys(JSON.parse(localStorage.getItem('doodates_messages') || '{}')).length);

// Test Supabase
import { supabase } from './lib/supabase';
const { data: user } = await supabase.auth.getUser();
console.log('4. User Supabase:', user?.user?.id || 'NON CONNECTÉ');

const { data: convs } = await supabase.from('conversations').select('count');
console.log('5. Conversations Supabase:', convs);
```

---

## 🔧 **Correction des erreurs 400 (IMPORTANT)**

Vos données SONT sauvegardées, mais vous avez des **erreurs 400** qui indiquent des problèmes dans le schéma de base de données.

### Erreurs identifiées dans vos logs :

1. **Erreur 400 sur `profiles`** :
   ```
   GET .../rest/v1/profiles?select=subscription_expires_at,created_at&id=eq.dev-mhosmcqw-05f3rv
   Failed to load resource: the server responded with a status of 400
   ```

2. **Erreur 400 sur `conversations`** (lors de l'update) :
   ```
   GET .../rest/v1/conversations?id=eq.22d4459c-8a85-47ef-84b1-d993b881529f
   Failed to load resource: the server responded with a status of 400
   ```

3. **Erreur lors de la mise à jour du titre** :
   ```
   ❌ Erreur lors de la mise à jour du titre dans Supabase DooDatesError
   ```

### Causes possibles :

- ❌ Colonnes manquantes dans les tables
- ❌ RLS Policies trop restrictives
- ❌ Types de données incompatibles
- ❌ Tables non créées

### ✅ Solution : Exécuter le script SQL de correction

J'ai créé un script SQL complet pour corriger tous ces problèmes : **`sql-scripts/fix-400-errors.sql`**

#### Comment l'exécuter :

##### **Option 1 : Via le Dashboard Supabase** (RECOMMANDÉ)

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet : `outmbbisrrdiumlweira`
3. Cliquez sur **"SQL Editor"** dans le menu de gauche
4. Cliquez sur **"New query"**
5. Copiez-collez le contenu du fichier **`sql-scripts/fix-400-errors.sql`**
6. Cliquez sur **"Run"** (ou Ctrl+Enter)
7. Vérifiez les messages dans la console (devrait afficher "Script terminé avec succès !")

##### **Option 2 : Via psql (si vous avez accès direct)**

```bash
psql -h db.outmbbisrrdiumlweira.supabase.co -U postgres -d postgres -f sql-scripts/fix-400-errors.sql
```

### Ce que fait le script :

✅ **Diagnostic** : Vérifie les colonnes existantes
✅ **Ajoute les colonnes manquantes** dans `profiles`, `conversations`, `messages`
✅ **Crée/corrige les RLS Policies** pour permettre l'accès aux utilisateurs authentifiés
✅ **Crée les index** pour optimiser les performances
✅ **Configure les triggers** pour `updated_at`

### Après avoir exécuté le script :

1. **Rechargez votre application** (Ctrl+R)
2. **Créez un nouveau formulaire** pour tester
3. **Vérifiez les logs** : les erreurs 400 devraient avoir disparu
4. **Vérifiez dans le dashboard Supabase** :
   - Table `conversations` : devrait contenir vos conversations
   - Table `messages` : devrait contenir vos messages
   - Table `profiles` : devrait contenir votre profil

### Vérification post-correction :

Dans la console du navigateur :

```javascript
// Vérifier que les erreurs 400 ont disparu
import { supabase } from './lib/supabase';

// Test 1 : Vérifier le profil
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .single();

console.log('✅ Profil:', profile || 'OK', profileError || 'Aucune erreur');

// Test 2 : Vérifier les conversations
const { data: convs, error: convsError } = await supabase
  .from('conversations')
  .select('*')
  .limit(5);

console.log('✅ Conversations:', convs?.length || 0, 'items', convsError || 'Aucune erreur');

// Test 3 : Créer une conversation test
const { data: newConv, error: createError } = await supabase
  .from('conversations')
  .insert([{
    title: 'Test conversation',
    first_message: 'Test message',
    status: 'active'
  }])
  .select()
  .single();

console.log('✅ Création conversation:', newConv?.id || 'Erreur', createError || 'Aucune erreur');
```

Si tout fonctionne correctement, vous ne devriez avoir **aucune erreur** et voir vos données s'afficher.

---

## 🎯 **Résumé**

### État actuel ✅

| Élément | État | Action requise |
|---------|------|----------------|
| **Connexion utilisateur** | ✅ OK | Vous êtes connecté |
| **Sauvegarde conversations** | ✅ OK | Données sauvegardées en Supabase |
| **Sauvegarde messages** | ✅ OK | Messages sauvegardés en Supabase |
| **Sauvegarde formulaires** | ⚠️ localStorage | À migrer (TODO) |
| **Erreurs 400 profiles** | ❌ ERREUR | Exécuter `fix-400-errors.sql` |
| **Erreurs 400 conversations** | ❌ ERREUR | Exécuter `fix-400-errors.sql` |
| **Update titre conversation** | ❌ ERREUR | Exécuter `fix-400-errors.sql` |

### Prochaines étapes 📋

1. **URGENT** : Exécuter le script `sql-scripts/fix-400-errors.sql` dans le dashboard Supabase
2. Recharger l'application et vérifier que les erreurs 400 ont disparu
3. Créer un nouveau formulaire pour tester la sauvegarde complète
4. (Optionnel) Implémenter la migration automatique des formulaires localStorage → Supabase

### Besoin d'aide ?

Si vous rencontrez des problèmes :
1. Vérifiez les logs de la console (F12)
2. Vérifiez les logs de Supabase (Dashboard > Logs)
3. Consultez les messages d'erreur détaillés dans le SQL Editor

---

**Dernière mise à jour** : 7 Novembre 2025

