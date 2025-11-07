# 🔍 Diagnostic de Stockage DooDates

## ✨ **NOUVEAU : Page de Test Interactive !**

### **Option 1 : Page de diagnostic visuelle** ⭐ RECOMMANDÉ

Une page web complète avec interface graphique pour diagnostiquer votre stockage.

**Comment y accéder :**

1. Lancez votre application : `npm run dev`
2. Ouvrez votre navigateur
3. Naviguez vers : **`http://localhost:8080/diagnostic/storage`**

**Fonctionnalités :**
- ✅ Interface visuelle claire et moderne
- ✅ Vérification automatique localStorage + Supabase
- ✅ Affichage des erreurs avec solutions
- ✅ Liste des conversations et formulaires
- ✅ Bouton pour actualiser le diagnostic
- ✅ Recommandations personnalisées
- ✅ Liens directs vers les solutions

---

## Option 2 : Script de console (alternative)

Si vous préférez utiliser la console du navigateur, copiez-collez ce code dans la console (F12) :

```javascript
(async function debugStorage() {
  console.clear();
  console.log('%c=== 🔍 DIAGNOSTIC STOCKAGE DOODATES ===', 'background: #222; color: #bada55; font-size: 16px; font-weight: bold; padding: 10px;');
  console.log('\n');

  // ================================================
  // 1️⃣ LOCALSTORAGE
  // ================================================
  console.log('%c1️⃣ LOCALSTORAGE', 'background: #3498db; color: white; font-size: 14px; font-weight: bold; padding: 5px;');
  
  try {
    const conversations = JSON.parse(localStorage.getItem('doodates_conversations') || '[]');
    const polls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
    const messages = JSON.parse(localStorage.getItem('doodates_messages') || '{}');
    
    console.log('📦 Conversations:', conversations.length, 'items');
    if (conversations.length > 0) {
      console.table(conversations.map(c => ({
        id: c.id?.substring(0, 20) + '...',
        titre: c.title?.substring(0, 50) + (c.title?.length > 50 ? '...' : ''),
        userId: c.userId,
        createdAt: c.createdAt
      })));
    }
    
    console.log('📋 Polls/Formulaires:', polls.length, 'items');
    if (polls.length > 0) {
      console.table(polls.map(p => ({
        id: p.id?.substring(0, 20) + '...',
        titre: p.title,
        type: p.type,
        status: p.status,
        creatorId: p.creator_id
      })));
    }
    
    console.log('💬 Messages:', Object.keys(messages).length, 'conversations avec messages');
    Object.entries(messages).forEach(([convId, msgs]) => {
      console.log(`  - ${convId.substring(0, 30)}...: ${msgs.length} messages`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lecture localStorage:', error);
  }

  console.log('\n');

  // ================================================
  // 2️⃣ SUPABASE
  // ================================================
  console.log('%c2️⃣ SUPABASE', 'background: #2ecc71; color: white; font-size: 14px; font-weight: bold; padding: 5px;');
  
  let supabase = null;
  let user = null;
  
  try {
    // Méthode 1: Essayer window.__SUPABASE_CLIENT__
    if (window.__SUPABASE_CLIENT__) {
      supabase = window.__SUPABASE_CLIENT__;
      console.log('✅ Client Supabase trouvé dans window.__SUPABASE_CLIENT__');
    }
    // Méthode 2: Essayer d'importer dynamiquement
    else {
      try {
        const module = await import('/src/lib/supabase.ts');
        supabase = module.supabase;
        console.log('✅ Client Supabase importé depuis /src/lib/supabase.ts');
      } catch (importError) {
        console.warn('⚠️ Impossible d\'importer le client Supabase:', importError.message);
      }
    }

    if (!supabase) {
      throw new Error('Client Supabase non disponible');
    }

    // Vérifier l'utilisateur connecté
    const { data: authData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Erreur récupération utilisateur:', userError.message);
    } else if (!authData?.user) {
      console.log('👤 Utilisateur: NON CONNECTÉ (mode invité)');
      console.log('%c➡️ RAISON: Les données ne sont PAS sauvegardées en base car vous n\'êtes pas connecté', 'background: #e74c3c; color: white; font-weight: bold; padding: 5px;');
    } else {
      user = authData.user;
      console.log('👤 Utilisateur connecté:');
      console.log('   - ID:', user.id);
      console.log('   - Email:', user.email);
      console.log('   - Créé le:', new Date(user.created_at).toLocaleString());
    }

    // Vérifier les conversations en base
    console.log('\n📊 Requêtes Supabase:');
    
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (convError) {
      console.error('❌ Erreur conversations Supabase:', convError.message);
      console.log('   Code erreur:', convError.code);
      console.log('   Détails:', convError.details || 'N/A');
      console.log('   Hint:', convError.hint || 'N/A');
      
      if (convError.code === 'PGRST116') {
        console.log('%c➡️ RAISON: La table "conversations" n\'existe pas dans Supabase', 'background: #e74c3c; color: white; font-weight: bold; padding: 5px;');
        console.log('%c💡 SOLUTION: Exécutez sql-scripts/fix-400-errors.sql', 'background: #f39c12; color: white; font-weight: bold; padding: 5px;');
      } else if (convError.code === '42501') {
        console.log('%c➡️ RAISON: RLS (Row Level Security) bloque l\'accès', 'background: #e74c3c; color: white; font-weight: bold; padding: 5px;');
        console.log('%c💡 SOLUTION: Exécutez sql-scripts/fix-400-errors.sql', 'background: #f39c12; color: white; font-weight: bold; padding: 5px;');
      }
    } else {
      console.log('✅ Conversations en base:', conversations?.length || 0, 'items');
      if (conversations && conversations.length > 0) {
        console.table(conversations.map(c => ({
          id: c.id?.substring(0, 20) + '...',
          titre: c.title?.substring(0, 50) + (c.title?.length > 50 ? '...' : ''),
          userId: c.user_id?.substring(0, 20) + '...',
          status: c.status,
          messages: c.message_count || 0,
          createdAt: new Date(c.created_at).toLocaleString()
        })));
      }
    }

    // Vérifier les messages en base
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (msgError) {
      console.error('❌ Erreur messages Supabase:', msgError.message);
    } else {
      console.log('✅ Messages en base:', messages?.length || 0, 'items (derniers 10)');
    }

    // Vérifier le profil utilisateur
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Erreur profil Supabase:', profileError.message);
        console.log('   Code erreur:', profileError.code);
        
        if (profileError.code === 'PGRST116') {
          console.log('%c➡️ PROBLÈME: Votre profil n\'existe pas dans la table "profiles"', 'background: #e74c3c; color: white; font-weight: bold; padding: 5px;');
          console.log('%c💡 SOLUTION: Exécutez sql-scripts/fix-400-errors.sql', 'background: #f39c12; color: white; font-weight: bold; padding: 5px;');
        }
      } else if (!profile) {
        console.log('%c⚠️ Profil utilisateur introuvable dans la base', 'background: #e74c3c; color: white; font-weight: bold; padding: 5px;');
        console.log('%c💡 SOLUTION: Exécutez sql-scripts/fix-400-errors.sql', 'background: #f39c12; color: white; font-weight: bold; padding: 5px;');
      } else {
        console.log('✅ Profil utilisateur trouvé:');
        console.log('   - Email:', profile.email);
        console.log('   - Nom:', profile.full_name || 'Non défini');
        console.log('   - Plan:', profile.plan_type || 'free');
        console.log('   - Créé le:', new Date(profile.created_at).toLocaleString());
      }
    }

  } catch (error) {
    console.error('❌ Erreur Supabase:', error.message);
    console.log('%c➡️ RAISON: Supabase n\'est pas configuré ou accessible', 'background: #e74c3c; color: white; font-weight: bold; padding: 5px;');
  }

  console.log('\n');

  // ================================================
  // 3️⃣ RÉSUMÉ
  // ================================================
  console.log('%c3️⃣ RÉSUMÉ', 'background: #e67e22; color: white; font-size: 14px; font-weight: bold; padding: 5px;');
  
  const localConversations = JSON.parse(localStorage.getItem('doodates_conversations') || '[]');
  const localPolls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
  
  if (localConversations.length > 0 || localPolls.length > 0) {
    console.log('%c✅ VOS DONNÉES SONT DANS LE NAVIGATEUR (localStorage)', 'background: #27ae60; color: white; font-weight: bold; padding: 8px; font-size: 12px;');
    console.log('   ├─ Conversations:', localConversations.length);
    console.log('   └─ Formulaires:', localPolls.length);
    console.log('\n   ⚠️ ATTENTION: Ces données seront perdues si vous:');
    console.log('      - Videz le cache du navigateur');
    console.log('      - Changez d\'appareil');
    console.log('      - Utilisez un autre navigateur');
  }

  if (user) {
    console.log('\n%c✅ VOUS ÊTES CONNECTÉ', 'background: #27ae60; color: white; font-weight: bold; padding: 8px; font-size: 12px;');
    console.log('   → Les nouvelles conversations SONT sauvegardées en Supabase');
  } else {
    console.log('\n%c⚠️ VOUS N\'ÊTES PAS CONNECTÉ', 'background: #e74c3c; color: white; font-weight: bold; padding: 8px; font-size: 12px;');
    console.log('   → Les conversations sont UNIQUEMENT dans localStorage');
  }

  console.log('\n');
  console.log('%c💡 RECOMMANDATIONS:', 'background: #34495e; color: white; font-weight: bold; padding: 5px;');
  console.log('');
  
  if (supabase && user) {
    console.log('1️⃣ Vérifiez que votre profil existe dans la table "profiles"');
    console.log('2️⃣ Si vous avez des erreurs 400, exécutez: sql-scripts/fix-400-errors.sql');
    console.log('3️⃣ Vérifiez les RLS policies dans le dashboard Supabase');
    console.log('4️⃣ Consultez DEBUG_STORAGE_CHECK.md pour plus de détails');
  } else if (supabase && !user) {
    console.log('1️⃣ Connectez-vous pour sauvegarder vos données en base Supabase');
    console.log('2️⃣ Vos données actuelles seront migrées automatiquement');
  } else {
    console.log('1️⃣ Le client Supabase n\'est pas disponible');
    console.log('2️⃣ Consultez DEBUG_STORAGE_CHECK.md pour plus de détails');
  }

  console.log('\n');
  console.log('%c=== FIN DU DIAGNOSTIC ===', 'background: #222; color: #bada55; font-size: 16px; font-weight: bold; padding: 10px;');
  
  return {
    localStorage: {
      conversations: localConversations.length,
      polls: localPolls.length
    },
    supabase: {
      connected: !!user,
      userId: user?.id
    }
  };
})();
```

## 🎯 Résultat attendu

Le script affichera :
- ✅ Nombre de conversations et formulaires en localStorage
- ✅ État de connexion Supabase
- ✅ Données présentes en base de données
- ✅ Diagnostic complet avec recommandations
- ✅ Messages d'erreur détaillés si problèmes

## 🚨 Si vous voyez des erreurs 400

Cela signifie que les tables Supabase ont besoin d'être corrigées.

**Solution** : Exécutez le script SQL `sql-scripts/fix-400-errors.sql` dans le dashboard Supabase.

## 📚 Documentation complète

Pour plus de détails, consultez : `DEBUG_STORAGE_CHECK.md`

