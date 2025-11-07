# 🧪 Guide de Test - Vérification de Sauvegarde

Guide simple pour vérifier que vos données sont bien sauvegardées en base Supabase.

---


## 📊 **2. Créer un Sondage**

### Étapes
1. Allez sur `http://localhost:8080/create`
2. Sélectionnez **"Sondage de dates"**
3. Remplissez les informations :
   - Titre : `Julien`
   - Ajoutez 2-3 dates
4. Cliquez sur **"Créer le sondage"**

### Vérification dans la Console

Vous devriez voir dans la console :
```
💾 Sauvegarde dans Supabase (table conversations)
✅ Conversation créée dans Supabase
✅ Sondage créé avec succès
```

Si vous n'êtes pas connecté :
```
⚠️ Utilisateur non connecté, sauvegarde en localStorage
```

### ✅ Succès
- Vous voyez un lien de partage
- **Aucune erreur 400 dans la console** ✅
- Le sondage est sauvegardé dans Supabase (si connecté) ou localStorage (si invité)
- Le sondage apparaît dans votre historique

---

## 🗄️ **3. Vérifier le Sondage en Base**

### ✅ **Architecture V2 : Table `conversations`**

Les sondages créés manuellement sont maintenant **sauvegardés dans Supabase** (table `conversations`).

**Note** : Assurez-vous d'avoir exécuté le script SQL `upgrade-conversations-for-polls.sql` avant de tester.

### Option A : Via Supabase Dashboard

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **"Table Editor"** dans le menu
4. ⚠️ Ouvrez la table `conversations` (PAS `polls`)
5. Vérifiez que votre sondage apparaît avec :
   - `title` = "Julien" (votre titre)
   - `user_id` = votre ID utilisateur
   - `poll_type` = "date"
   - `poll_status` = "active"
   - `poll_slug` = slug généré
   - `poll_data` = objet JSON avec dates, timeSlots, settings
   - `status` = "completed"
   - `created_at` = date/heure récente

### Option B : Via Console SQL

1. Dans Supabase Dashboard → **"SQL Editor"**
2. Exécutez cette requête :

```sql
SELECT 
  id,
  title,
  poll_type,
  poll_status,
  poll_slug,
  poll_data,
  user_id,
  created_at,
  updated_at
FROM conversations
WHERE user_id = auth.uid()
  AND poll_data IS NOT NULL  -- Filtre conversations avec sondage
ORDER BY created_at DESC
LIMIT 5;
```

### Option C : Via localStorage (Cache Local)

Les données sont aussi cachées localement. Copiez dans la console :

```javascript
// Vérifier le cache local
const polls = JSON.parse(localStorage.getItem('doodates-polls-unified') || '[]');
console.table(polls.map(p => ({
  title: p.title,
  type: p.type,
  dates: p.dates?.length || 0,
  source: p.conversationId ? 'Supabase' : 'Local',
  created: new Date(p.created_at).toLocaleString()
})));
```

### ✅ Succès
- ✅ Vous voyez votre conversation avec le sondage dans Supabase
- ✅ Le `user_id` correspond à votre utilisateur
- ✅ Le champ `poll_data` contient les dates et paramètres
- ✅ Le sondage apparaît dans votre historique sur la page d'accueil
- ✅ Les données sont synchronisées entre appareils

---

## 📝 **4. Créer un Formulaire**

### Étapes
1. Allez sur `http://localhost:8080/create`
2. Sélectionnez **"Formulaire personnalisé"**
3. Remplissez les informations :
   - Titre : `Test Formulaire DB`
   - Description : `Test de sauvegarde formulaire`
   - Ajoutez 2-3 questions :
     - Question texte
     - Question choix multiple
     - Question date
4. Cliquez sur **"Créer le formulaire"**

### Vérification dans la Console

✅ **Architecture V2** : Les formulaires utilisent la même logique que les sondages

Vous devriez voir (si connecté) :
```
💾 Formulaire sauvegardé
✅ Conversation créée avec formulaire
```

### ✅ Succès
- Vous voyez un lien de partage
- Aucune erreur 400 dans la console ✅
- Le formulaire apparaît dans votre historique
- Il est sauvegardé dans Supabase (si connecté)

---

## 🗄️ **5. Vérifier le Formulaire en Base**

### ✅ **Même Architecture que les Sondages**

Les formulaires sont sauvegardés exactement comme les sondages, dans la table `conversations`.

### Requête SQL Supabase

```sql
SELECT 
  id,
  title,
  poll_type,
  poll_status,
  poll_slug,
  poll_data->>'questions' as questions_json,
  jsonb_array_length(poll_data->'questions') as question_count,
  created_at,
  updated_at
FROM conversations
WHERE user_id = auth.uid()
  AND poll_type = 'form'
ORDER BY created_at DESC
LIMIT 5;
```

### Vérification via Console JavaScript

```javascript
// Récupérer tous les polls (sondages + formulaires)
const polls = JSON.parse(localStorage.getItem('doodates-polls-unified') || '[]');
const forms = polls.filter(p => p.type === 'form');
console.table(forms.map(f => ({
  title: f.title,
  questions: f.questions?.length || 0,
  source: f.conversationId ? 'Supabase' : 'Local',
  created: new Date(f.created_at).toLocaleString()
})));
```

### ✅ Succès
- ✅ Vous voyez votre formulaire dans Supabase (`conversations`)
- ✅ Il a `poll_type: "form"` et `poll_data.questions`
- ✅ Le formulaire apparaît dans votre historique
- ✅ Les données sont synchronisées

---

## 🔍 **6. Tests Supplémentaires Recommandés**

### A. Test de Conversation IA
1. Utilisez le chat IA sur la page d'accueil
2. Tapez quelques messages (ex: "Crée un sondage pour demain")
3. Vérifiez dans Supabase → table `conversations`
4. Les messages sont dans le champ `messages` (JSONB)

```sql
-- Voir vos conversations avec messages IA
SELECT 
  id,
  title,
  first_message,
  message_count,
  jsonb_array_length(messages) as nb_messages,
  poll_type,
  created_at,
  updated_at
FROM conversations 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- Voir les messages d'une conversation spécifique
SELECT 
  id,
  title,
  messages,
  poll_data
FROM conversations
WHERE id = 'VOTRE_CONVERSATION_ID'
  AND user_id = auth.uid();
```

### B. Test de Poll complet (dates + votes)
```sql
-- Voir un sondage avec ses statistiques
SELECT 
  c.id,
  c.title,
  c.poll_slug,
  c.poll_type,
  c.poll_status,
  c.poll_data->'dates' as dates,
  c.poll_data->'settings' as settings,
  COUNT(v.id) as vote_count,
  COUNT(DISTINCT v.voter_email) as unique_voters,
  c.created_at
FROM conversations c
LEFT JOIN votes v ON v.conversation_id = c.id
WHERE c.user_id = auth.uid()
  AND c.poll_type = 'date'
GROUP BY c.id
ORDER BY c.created_at DESC;
```

### C. Test de Profil
```sql
-- Vérifier votre profil
SELECT 
  id,
  email,
  full_name,
  timezone,
  plan_type,
  preferences,
  created_at
FROM profiles 
WHERE id = auth.uid();
```

### D. Test de Permissions (RLS)
```sql
-- Essayer de voir TOUTES les conversations (devrait échouer)
-- Seules VOS conversations doivent apparaître
SELECT COUNT(*) as my_conversations
FROM conversations 
WHERE user_id = auth.uid();

-- Vérifier qu'on ne peut pas voir les conversations des autres
-- Cette requête doit retourner 0
SELECT COUNT(*) as other_conversations
FROM conversations 
WHERE user_id != auth.uid();
```

Si la dernière requête retourne 0, ✅ RLS fonctionne correctement !

### E. Test d'Intégrité des Données
```sql
-- Vérifier que tous vos polls ont bien poll_data
SELECT 
  id,
  title,
  poll_type,
  CASE 
    WHEN poll_data IS NULL THEN '❌ Manquant'
    WHEN poll_data::text = '{}'::text THEN '⚠️ Vide'
    ELSE '✅ OK'
  END as poll_data_status,
  poll_status,
  created_at
FROM conversations
WHERE user_id = auth.uid()
  AND poll_type IS NOT NULL
ORDER BY created_at DESC;
```

### F. Test de Synchronisation localStorage ↔ Supabase
```javascript
// Dans la console du navigateur
// Comparer les données locales avec Supabase
const localPolls = JSON.parse(localStorage.getItem('doodates-polls-unified') || '[]');
const withConversationId = localPolls.filter(p => p.conversationId);
const withoutConversationId = localPolls.filter(p => !p.conversationId);

console.log('📊 Synchronisation localStorage ↔ Supabase:');
console.log('✅ Sondages synchronisés avec Supabase:', withConversationId.length);
console.log('⚠️ Sondages uniquement en local:', withoutConversationId.length);
console.table(localPolls.map(p => ({
  title: p.title,
  type: p.type,
  sync: p.conversationId ? '✅ Supabase' : '⚠️ Local only',
  created: new Date(p.created_at).toLocaleString()
})));
```

---

## ❌ **Problèmes Courants**

### Erreur 400 "Bad Request" sur `/rest/v1/polls`
**Cause** : Ancien code qui essayait de charger depuis la table `polls` (obsolète)

**Solution** : ✅ **CORRIGÉ** - Le code utilise maintenant l'architecture centrée conversations
- Les données sont dans la table `conversations`, pas `polls`
- Voir `Docs/Database/DATABASE-SCHEMA-COMPLETE.md` pour l'architecture complète

**Note** : Si vous voyez encore cette erreur, rechargez la page (Ctrl+R)

### "Mode invité actif" dans les logs
**Cause** : Vous n'êtes pas connecté ou la session a expiré

**Solution** :
1. Déconnectez-vous complètement
2. Videz le cache du navigateur (Ctrl+Shift+Delete)
3. Reconnectez-vous

### Données sauvegardées seulement en localStorage
**Cause** : Variable d'environnement mal configurée ou problème Supabase

**Vérifiez** :
```javascript
// Dans la console du navigateur
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log(import.meta.env.VITE_DISABLE_SUPABASE_CONVERSATIONS);
```

Les deux premières doivent avoir des valeurs, la dernière doit être `undefined` ou `"false"`.

---

## 📊 **Résumé de Vérification Rapide**

| Élément | Où vérifier | Table Supabase |
|---------|-------------|----------------|
| Connexion | Console logs | `profiles` |
| Sondage | Dashboard / SQL | `conversations` (poll_type='date') |
| Formulaire | Dashboard / SQL | `conversations` (poll_type='form') |
| Conversation | Dashboard / SQL | `conversations` |
| Messages IA | Champ messages | `conversations.messages` (JSONB) |

**Note** : Tout est dans `conversations` ! La table `polls` est obsolète.

---

## ✅ **Test Complet Réussi Si...**

### Tests de Base (Obligatoires)
- ✅ **Connexion** : Authentification fonctionne, profil créé dans `profiles`
- ✅ **Sondage** : Visible dans `conversations` avec `poll_type='date'`
- ✅ **Formulaire** : Visible dans `conversations` avec `poll_type='form'`
- ✅ **Structure** : Champ `poll_data` contient les données complètes (dates/questions)
- ✅ **Console** : Aucune erreur 400 (table `polls` obsolète désactivée)

### Tests Avancés (Recommandés)
- ✅ **Messages IA** : Historique visible dans `conversations.messages` (JSONB)
- ✅ **Votes** : Table `votes` liée correctement via `conversation_id`
- ✅ **RLS** : Impossible de voir les conversations d'autres utilisateurs
- ✅ **Synchronisation** : localStorage contient `conversationId` pour polls Supabase
- ✅ **Intégrité** : Tous les polls ont `poll_data` non vide
- ✅ **Slugs** : Chaque poll actif a un `poll_slug` unique

### Checklist Technique
```sql
-- Exécuter cette requête pour vérifier tout d'un coup
SELECT 
  'Profile' as test,
  CASE WHEN EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid()) 
    THEN '✅ OK' ELSE '❌ MANQUANT' END as status
UNION ALL
SELECT 
  'Conversations',
  CASE WHEN EXISTS(SELECT 1 FROM conversations WHERE user_id = auth.uid()) 
    THEN '✅ OK (' || COUNT(*)::text || ')' ELSE '⚠️ Aucune' END
FROM conversations WHERE user_id = auth.uid()
UNION ALL
SELECT 
  'Polls',
  CASE WHEN EXISTS(SELECT 1 FROM conversations WHERE user_id = auth.uid() AND poll_data IS NOT NULL) 
    THEN '✅ OK (' || COUNT(*)::text || ')' ELSE '⚠️ Aucun' END
FROM conversations WHERE user_id = auth.uid() AND poll_data IS NOT NULL
UNION ALL
SELECT 
  'Votes',
  CASE WHEN EXISTS(SELECT 1 FROM votes v JOIN conversations c ON v.conversation_id = c.id WHERE c.user_id = auth.uid()) 
    THEN '✅ OK (' || COUNT(*)::text || ')' ELSE '⚠️ Aucun' END
FROM votes v JOIN conversations c ON v.conversation_id = c.id WHERE c.user_id = auth.uid();
```

---

## 🆘 **Besoin d'Aide ?**

Si un test échoue :
1. Notez le numéro de l'étape qui échoue
2. Copiez le message d'erreur exact de la console
3. Vérifiez la table Supabase concernée
4. Exécutez le script SQL de correction si nécessaire

---

## 📝 **Historique des Tests**

### 🧪 Tests du 7 Novembre 2025 - Architecture V2

#### ✅ Tests Réussis

**1. Migration Documentation**
- ✅ Fusion de `ARCHITECTURE-MODELE-DONNEES.md` dans `DATABASE-SCHEMA-COMPLETE.md`
- ✅ Mise à jour de toutes les références (8 fichiers)
- ✅ Un seul document de référence, plus complet et mieux structuré

**2. Structure Base de Données**
- ✅ Table `conversations` : Architecture conversation-centric confirmée
- ✅ Champs `poll_data`, `poll_type`, `poll_status`, `poll_slug` présents
- ✅ Index GIN sur `poll_data` pour recherches JSON performantes
- ✅ RLS policies configurées et fonctionnelles

**3. Guide de Test Mis à Jour**
- ✅ Section 2 : Instructions sauvegarde Supabase (vs localStorage)
- ✅ Section 3 : Requêtes SQL pour table `conversations`
- ✅ Section 4-5 : Formulaires utilisant même architecture
- ✅ Section 6 : Tests avancés (IA, votes, RLS, intégrité)

#### 📋 Tests à Effectuer Prochainement

**Flux Complet Création Sondage**
- [ ] Connexion utilisateur
- [ ] Création sondage manuel via `/create`
- [ ] Vérification dans Supabase (`conversations` table)
- [ ] Vérification champ `poll_data` bien rempli
- [ ] Test du slug généré et accessibilité publique
- [ ] Test vote sur le sondage créé
- [ ] Vérification table `votes` avec `conversation_id`

**Flux Complet Création via IA**
- [ ] Démarrage conversation avec assistant IA
- [ ] Génération sondage via fonction IA
- [ ] Vérification sauvegarde dans `conversations`
- [ ] Vérification champ `messages` (JSONB)
- [ ] Test reprise conversation existante

**Tests de Synchronisation**
- [ ] Vérifier `conversationId` dans localStorage
- [ ] Tester création hors ligne (mode invité)
- [ ] Tester synchronisation après connexion
- [ ] Vérifier cohérence localStorage ↔ Supabase

**Tests de Performance**
- [ ] Temps de chargement liste polls
- [ ] Performance requêtes avec index GIN
- [ ] Test avec 50+ conversations/polls
- [ ] Test pagination si nécessaire

#### 🔧 Améliorations Recommandées

1. **Migration Automatique**
   - Script pour migrer anciennes données `polls` → `conversations`
   - Vérification intégrité post-migration

2. **Tests E2E**
   - Playwright/Cypress pour tester flux complet
   - Tests de non-régression architecture V2

3. **Monitoring**
   - Logs Sentry pour erreurs Supabase
   - Dashboard analytics utilisation architecture V2

---

**Dernière mise à jour** : 7 Novembre 2025  
**Architecture** : V2 - Conversation-Centric  
**Statut** : ✅ Documentation à jour, tests en attente d'exécution

