# Diagnostic de Synchronisation des Conversations

Ce document fournit des outils pour diagnostiquer les différences de synchronisation entre le localStorage et Supabase.

## 🔐 Informations de session actuelle

**User ID:** `3b1802f9-db46-48c7-86b0-199830f56f53`  
**Email:** `julien.fritsch+doodates2@gmail.com`  
**Date du diagnostic:** 07/11/2025

### 🚀 Commandes rapides pour cette session

```javascript
// Récupérer votre User ID
const authData = JSON.parse(localStorage.getItem('sb-outmbbisrrdiumlweira-auth-token'));
const userId = authData.user?.id; // 3b1802f9-db46-48c7-86b0-199830f56f53
console.log('User ID:', userId);
```

```sql
-- Requête SQL Supabase pour vos conversations
SELECT id, title, created_at, updated_at, user_id, status
FROM conversations
WHERE user_id = '3b1802f9-db46-48c7-86b0-199830f56f53'
ORDER BY updated_at DESC;
```

---

## 1. Interroger le localStorage (Console du navigateur)

### Script 1: Voir toutes les conversations dans localStorage

```javascript
// À exécuter dans la console de chaque navigateur
const conversations = JSON.parse(localStorage.getItem('doodates_conversations') || '[]');
console.table(conversations.map(c => ({
  id: c.id,
  title: c.title,
  userId: c.userId,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
  status: c.status
})));

console.log(`Total conversations dans localStorage: ${conversations.length}`);
```

### Script 2: Comparer localStorage avec les IDs uniques

```javascript
// Navigateur 1 - Exécuter ceci et copier le résultat
const convs1 = JSON.parse(localStorage.getItem('doodates_conversations') || '[]');
const ids1 = convs1.map(c => c.id).sort();
console.log('IDs des conversations (Navigateur 1):');
console.log(JSON.stringify(ids1, null, 2));
console.log(`Total: ${ids1.length}`);

// Navigateur 2 - Exécuter ceci et comparer avec Navigateur 1
const convs2 = JSON.parse(localStorage.getItem('doodates_conversations') || '[]');
const ids2 = convs2.map(c => c.id).sort();
console.log('IDs des conversations (Navigateur 2):');
console.log(JSON.stringify(ids2, null, 2));
console.log(`Total: ${ids2.length}`);
```

### Script 3: Trouver les conversations manquantes

```javascript
// Après avoir copié les IDs des deux navigateurs, utilisez ce script
const ids1 = [/* Coller les IDs du navigateur 1 */];
const ids2 = [/* Coller les IDs du navigateur 2 */];

const uniqueToNav1 = ids1.filter(id => !ids2.includes(id));
const uniqueToNav2 = ids2.filter(id => !ids1.includes(id));

console.log('Conversations uniquement dans Navigateur 1:', uniqueToNav1);
console.log('Conversations uniquement dans Navigateur 2:', uniqueToNav2);
```

### Script 4: Voir les détails d'une conversation spécifique

```javascript
// Remplacer 'CONVERSATION_ID' par l'ID de la conversation
const convId = 'CONVERSATION_ID';
const conversations = JSON.parse(localStorage.getItem('doodates_conversations') || '[]');
const conv = conversations.find(c => c.id === convId);

if (conv) {
  console.log('Détails de la conversation:', conv);
  console.log('Titre:', conv.title);
  console.log('UserId:', conv.userId);
  console.log('CreatedAt:', new Date(conv.createdAt));
  console.log('UpdatedAt:', new Date(conv.updatedAt));
} else {
  console.log('Conversation non trouvée dans localStorage');
}
```

### Script 5: Vérifier l'utilisateur connecté

```javascript
// Vérifier quel utilisateur est connecté
const authKey = Object.keys(localStorage).find(k => k.includes('supabase.auth.token'));
if (authKey) {
  const authData = JSON.parse(localStorage.getItem(authKey));
  console.log('User ID:', authData?.user?.id);
  console.log('Email:', authData?.user?.email);
} else {
  console.log('Aucun utilisateur connecté');
}
```

### Script 6: Export complet pour analyse

```javascript
// Exporter toutes les données pour analyse détaillée
const exportData = {
  conversations: JSON.parse(localStorage.getItem('doodates_conversations') || '[]'),
  messages: JSON.parse(localStorage.getItem('doodates_messages') || '{}'),
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href
};

// Afficher les conversations avec leurs détails
console.log('=== EXPORT COMPLET ===');
console.log(JSON.stringify(exportData, null, 2));

// Télécharger en fichier JSON
const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `doodates-export-${Date.now()}.json`;
a.click();
```

## 2. Interroger Supabase (SQL)

### Requête 1: Voir toutes les conversations de l'utilisateur

```sql
-- Remplacer 'USER_ID' par votre ID utilisateur
SELECT 
  id,
  title,
  user_id,
  status,
  created_at,
  updated_at,
  message_count,
  related_poll_id
FROM conversations
WHERE user_id = '3b1802f9-db46-48c7-86b0-199830f56f53'
ORDER BY updated_at DESC;
```

### Requête 2: Comparer avec les IDs du localStorage

```sql
-- Après avoir récupéré les IDs du localStorage, vérifier leur présence dans Supabase
SELECT 
  id,
  title,
  user_id,
  created_at,
  updated_at
FROM conversations
WHERE id IN (
  -- Coller ici les IDs du localStorage, par exemple:
  '123e4567-e89b-12d3-a456-426614174000',
  '223e4567-e89b-12d3-a456-426614174001'
)
ORDER BY updated_at DESC;
```

### Requête 3: Trouver les conversations récentes

```sql
-- Voir les conversations créées dans les dernières 24 heures
SELECT 
  id,
  title,
  user_id,
  created_at,
  updated_at
FROM conversations
WHERE user_id = '3b1802f9-db46-48c7-86b0-199830f56f53'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Requête 4: Vérifier les doublons

```sql
-- Vérifier s'il y a des doublons de conversations
SELECT 
  title,
  user_id,
  COUNT(*) as count,
  ARRAY_AGG(id) as ids,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM conversations
WHERE user_id = '3b1802f9-db46-48c7-86b0-199830f56f53'
GROUP BY title, user_id
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

### Requête 5: Statistiques par utilisateur

```sql
-- Vue d'ensemble des conversations par utilisateur
SELECT 
  user_id,
  COUNT(*) as total_conversations,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
  COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived,
  MIN(created_at) as first_conversation,
  MAX(updated_at) as last_update
FROM conversations
WHERE user_id = '3b1802f9-db46-48c7-86b0-199830f56f53'
GROUP BY user_id;
```

## 3. Script de diagnostic complet (Console)

```javascript
// Script de diagnostic complet à exécuter dans chaque navigateur
async function diagnosticComplet() {
  console.log('=== DIAGNOSTIC DE SYNCHRONISATION ===\n');
  
  // 1. localStorage
  const localConvs = JSON.parse(localStorage.getItem('doodates_conversations') || '[]');
  console.log('📦 localStorage:');
  console.log(`   Total: ${localConvs.length} conversations`);
  console.log('   IDs:', localConvs.map(c => c.id));
  
  // 2. User info
  const authKey = Object.keys(localStorage).find(k => k.includes('supabase.auth.token'));
  let userId = null;
  if (authKey) {
    const authData = JSON.parse(localStorage.getItem(authKey));
    userId = authData?.user?.id;
    console.log('\n👤 Utilisateur:');
    console.log(`   ID: ${userId}`);
    console.log(`   Email: ${authData?.user?.email}`);
  }
  
  // 3. Supabase
  if (userId && window.supabase) {
    console.log('\n☁️ Supabase:');
    try {
      const { data, error } = await window.supabase
        .from('conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('   Erreur:', error.message);
      } else {
        console.log(`   Total: ${data.length} conversations`);
        console.log('   IDs:', data.map(c => c.id));
        
        // 4. Comparaison
        console.log('\n🔍 Comparaison:');
        const localIds = localConvs.map(c => c.id);
        const supabaseIds = data.map(c => c.id);
        
        const onlyLocal = localIds.filter(id => !supabaseIds.includes(id));
        const onlySupabase = supabaseIds.filter(id => !localIds.includes(id));
        
        console.log(`   Uniquement dans localStorage: ${onlyLocal.length}`, onlyLocal);
        console.log(`   Uniquement dans Supabase: ${onlySupabase.length}`, onlySupabase);
        
        if (onlyLocal.length === 0 && onlySupabase.length === 0) {
          console.log('   ✅ Parfaitement synchronisé!');
        } else {
          console.log('   ⚠️ Désynchronisation détectée!');
        }
      }
    } catch (error) {
      console.error('   Erreur lors de la requête Supabase:', error);
    }
  } else {
    console.log('\n☁️ Supabase: Non disponible ou non connecté');
  }
  
  // 5. Cache info
  console.log('\n🗄️ Cache:');
  const cacheKeys = Object.keys(localStorage).filter(k => k.includes('doodates'));
  console.log('   Clés:', cacheKeys);
}

// Exécuter le diagnostic
diagnosticComplet();
```

## 4. Utilisation via l'interface Supabase

1. **Aller dans le Dashboard Supabase**: https://supabase.com/dashboard
2. **Sélectionner votre projet**
3. **Aller dans Table Editor** → `conversations`
4. **Appliquer un filtre**: `user_id` = votre ID utilisateur
5. **Comparer avec les résultats du localStorage**

## 5. Actions correctives

### Si une conversation manque dans localStorage:

```javascript
// Forcer la synchronisation depuis Supabase
async function syncFromSupabase() {
  if (window.queryClient) {
    await window.queryClient.invalidateQueries(['conversations']);
    console.log('Cache invalidé, rechargement...');
    window.location.reload();
  }
}
```

### Si une conversation manque dans Supabase:

```javascript
// Identifier la conversation manquante
const convId = 'CONVERSATION_ID_MANQUANT';
const localConvs = JSON.parse(localStorage.getItem('doodates_conversations') || '[]');
const missingConv = localConvs.find(c => c.id === convId);

if (missingConv) {
  console.log('Conversation manquante dans Supabase:', missingConv);
  // Il faudra la re-créer ou vérifier pourquoi elle n'a pas été synchronisée
}
```

### Forcer une resynchronisation complète:

```javascript
// ⚠️ ATTENTION: Ceci va recharger toutes les données depuis Supabase
async function forceFullSync() {
  // Vider le cache React Query
  if (window.queryClient) {
    window.queryClient.clear();
  }
  
  // Recharger la page
  window.location.reload();
}
```

## 6. Points de vérification

- [ ] Les deux navigateurs sont connectés avec le même utilisateur
- [ ] Les IDs des conversations sont identiques entre localStorage et Supabase
- [ ] Les timestamps `updatedAt` sont cohérents
- [ ] Pas de conversations "orphelines" (userId = null ou différent)
- [ ] Les messages sont également synchronisés
- [ ] La connexion réseau est stable
- [ ] Pas d'erreurs dans la console

## 7. Logs utiles

```javascript
// Activer les logs de debug
localStorage.setItem('debug', 'doodates:*');

// Voir les logs dans la console
// Recharger la page pour voir tous les logs de synchronisation
```

