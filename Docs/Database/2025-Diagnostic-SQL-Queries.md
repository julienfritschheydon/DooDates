# 🔍 Requêtes SQL de Diagnostic - DooDates

Guide rapide des requêtes SQL utiles pour diagnostiquer et vérifier les données en base Supabase.

---

## 📊 Conversations & Sondages

### Voir toutes vos conversations

```sql
SELECT
  id,
  title,
  poll_type,
  poll_status,
  poll_slug,
  message_count,
  jsonb_array_length(messages) as nb_messages,
  created_at,
  updated_at
FROM conversations
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### Voir une conversation spécifique avec messages

```sql
SELECT
  id,
  title,
  messages,
  poll_data,
  message_count,
  jsonb_array_length(messages) as nb_messages_reel
FROM conversations
WHERE id = 'VOTRE_CONVERSATION_ID'
  AND user_id = auth.uid();
```

### Voir seulement les sondages de dates

```sql
SELECT
  id,
  title,
  poll_type,
  poll_status,
  poll_slug,
  poll_data->'dates' as dates,
  poll_data->'settings' as settings,
  created_at
FROM conversations
WHERE user_id = auth.uid()
  AND poll_type = 'date'
ORDER BY created_at DESC;
```

### Voir seulement les formulaires

```sql
SELECT
  id,
  title,
  poll_slug,
  poll_data->>'questions' as questions_json,
  jsonb_array_length(poll_data->'questions') as question_count,
  created_at
FROM conversations
WHERE user_id = auth.uid()
  AND poll_type = 'form'
ORDER BY created_at DESC;
```

### Sondages avec statistiques de votes

```sql
SELECT
  c.id,
  c.title,
  c.poll_slug,
  c.poll_type,
  c.poll_status,
  c.poll_data->'dates' as dates,
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

---

## 👤 Profil Utilisateur

### Voir votre profil

```sql
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

---

## 🔒 Tests RLS (Row Level Security)

### Vérifier vos permissions (doit retourner vos conversations)

```sql
SELECT COUNT(*) as my_conversations
FROM conversations
WHERE user_id = auth.uid();
```

### Vérifier isolation (doit retourner 0)

```sql
-- Cette requête doit retourner 0 si RLS fonctionne
SELECT COUNT(*) as other_conversations
FROM conversations
WHERE user_id != auth.uid();
```

---

## 🧪 Vérification Intégrité

### Vérifier que tous les polls ont poll_data

```sql
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

### Vérifier cohérence message_count

```sql
SELECT
  id,
  title,
  message_count,
  jsonb_array_length(messages) as actual_message_count,
  CASE
    WHEN message_count = jsonb_array_length(messages) THEN '✅ OK'
    ELSE '❌ Incohérence'
  END as status
FROM conversations
WHERE user_id = auth.uid()
  AND messages IS NOT NULL
ORDER BY created_at DESC;
```

### Diagnostic complet (checklist)

```sql
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

## 🔧 Scripts JavaScript (Console Navigateur)

### Vérifier le cache local

```javascript
const polls = JSON.parse(localStorage.getItem("doodates-polls-unified") || "[]");
console.table(
  polls.map((p) => ({
    title: p.title,
    type: p.type,
    dates: p.dates?.length || 0,
    source: p.conversationId ? "Supabase" : "Local",
    created: new Date(p.created_at).toLocaleString(),
  })),
);
```

### Comparer localStorage ↔ Supabase

```javascript
const localPolls = JSON.parse(localStorage.getItem("doodates-polls-unified") || "[]");
const withConversationId = localPolls.filter((p) => p.conversationId);
const withoutConversationId = localPolls.filter((p) => !p.conversationId);

console.log("📊 Synchronisation localStorage ↔ Supabase:");
console.log("✅ Sondages synchronisés avec Supabase:", withConversationId.length);
console.log("⚠️ Sondages uniquement en local:", withoutConversationId.length);
console.table(
  localPolls.map((p) => ({
    title: p.title,
    type: p.type,
    sync: p.conversationId ? "✅ Supabase" : "⚠️ Local only",
    created: new Date(p.created_at).toLocaleString(),
  })),
);
```

### Vérifier configuration Supabase

```javascript
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
console.log(
  "Supabase Key:",
  import.meta.env.VITE_SUPABASE_ANON_KEY ? "✅ Configured" : "❌ Missing",
);
console.log("Disable Conversations:", import.meta.env.VITE_DISABLE_SUPABASE_CONVERSATIONS);
```

---

## ❌ Problèmes Courants

### 1. Aucune conversation dans la DB malgré utilisation du chat

**Diagnostic :**

```sql
-- Vérifier si des conversations existent
SELECT COUNT(*) FROM conversations WHERE user_id = auth.uid();

-- Si 0, vérifier toutes les conversations (bypass RLS temporairement en mode admin)
SELECT user_id, COUNT(*)
FROM conversations
GROUP BY user_id;
```

**Solutions :**

- Vérifier que `VITE_DISABLE_SUPABASE_CONVERSATIONS` n'est PAS à `true`
- Vérifier que vous êtes connecté (session Supabase active)
- Voir `TROUBLESHOOTING-CONVERSATIONS.md` pour diagnostic complet

### 2. Messages non sauvegardés (message_count = 0)

**Diagnostic :**

```sql
SELECT
  id,
  title,
  message_count,
  jsonb_array_length(messages) as nb_messages_reel
FROM conversations
WHERE user_id = auth.uid()
  AND message_count = 0
  AND jsonb_array_length(messages) = 0;
```

**Solutions :**

- Vérifier token JWT dans localStorage
- Vérifier logs console pour erreurs d'authentification
- Exécuter `diagnostic-conversations.sql`

### 3. Erreur 400 "Bad Request"

**Cause :** Ancien code essayant d'accéder à table `polls` (obsolète)

**Solution :** Tout est maintenant dans `conversations` - recharger la page (Ctrl+R)

---

## 📋 Référence Rapide

| Besoin                   | Requête/Script                                           |
| ------------------------ | -------------------------------------------------------- |
| Toutes mes conversations | `SELECT * FROM conversations WHERE user_id = auth.uid()` |
| Sondages seulement       | Ajouter `AND poll_type = 'date'`                         |
| Formulaires seulement    | Ajouter `AND poll_type = 'form'`                         |
| Avec messages IA         | Ajouter `AND jsonb_array_length(messages) > 0`           |
| Avec votes               | JOIN avec `votes` sur `conversation_id`                  |
| Vérifier RLS             | Compter `WHERE user_id != auth.uid()` (doit = 0)         |
| Cache local              | `localStorage.getItem('doodates-polls-unified')`         |

---

**Dernière mise à jour** : 7 Novembre 2025  
**Architecture** : V2 - Conversation-Centric
