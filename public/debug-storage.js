/**
 * Script de diagnostic de stockage DooDates
 * 
 * UTILISATION:
 * 1. Ouvrez la console du navigateur (F12)
 * 2. Copiez-collez ce fichier entier dans la console
 * 3. Tapez: await debugStorage()
 */

async function debugStorage() {
  console.log('%c=== 🔍 DIAGNOSTIC STOCKAGE DOODATES ===', 'background: #222; color: #bada55; font-size: 16px; font-weight: bold; padding: 10px;');
  console.log('\n');

  // 1. Vérifier localStorage
  console.log('%c1️⃣ LOCALSTORAGE', 'background: #3498db; color: white; font-size: 14px; font-weight: bold; padding: 5px;');
  
  try {
    const conversations = JSON.parse(localStorage.getItem('doodates_conversations') || '[]');
    const polls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
    const messages = JSON.parse(localStorage.getItem('doodates_messages') || '{}');
    
    console.log('📦 Conversations:', conversations.length, 'items');
    console.table(conversations.map(c => ({
      id: c.id,
      titre: c.title?.substring(0, 50) + (c.title?.length > 50 ? '...' : ''),
      userId: c.userId,
      createdAt: c.createdAt
    })));
    
    console.log('📋 Polls/Formulaires:', polls.length, 'items');
    console.table(polls.map(p => ({
      id: p.id,
      titre: p.title,
      type: p.type,
      status: p.status,
      creatorId: p.creator_id
    })));
    
    console.log('💬 Messages:', Object.keys(messages).length, 'conversations avec messages');
    Object.entries(messages).forEach(([convId, msgs]) => {
      console.log(`  - ${convId}: ${msgs.length} messages`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lecture localStorage:', error);
  }

  console.log('\n');

  // 2. Vérifier Supabase
  console.log('%c2️⃣ SUPABASE', 'background: #2ecc71; color: white; font-size: 14px; font-weight: bold; padding: 5px;');
  
  try {
    // Essayer d'importer le client Supabase
    let supabase;
    
    // Méthode 1: depuis le module
    try {
      const module = await import('/src/lib/supabase.ts');
      supabase = module.supabase;
      console.log('✅ Client Supabase importé');
    } catch (e) {
      console.warn('⚠️ Impossible d\'importer le client Supabase:', e.message);
      
      // Méthode 2: depuis la fenêtre globale (si exposé)
      if (window.supabase) {
        supabase = window.supabase;
        console.log('✅ Client Supabase trouvé dans window');
      } else {
        throw new Error('Client Supabase non disponible');
      }
    }

    // Vérifier l'utilisateur connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Erreur récupération utilisateur:', userError);
    } else if (!user) {
      console.log('👤 Utilisateur: NON CONNECTÉ (mode invité)');
      console.log('%c➡️ RAISON: Les données ne sont PAS sauvegardées en base car vous n\'êtes pas connecté', 'background: #e74c3c; color: white; font-weight: bold; padding: 5px;');
    } else {
      console.log('👤 Utilisateur connecté:', {
        id: user.id,
        email: user.email,
        createdAt: user.created_at
      });
    }

    // Vérifier les conversations en base
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (convError) {
      console.error('❌ Erreur conversations Supabase:', convError);
      console.log('%cℹ️ Code erreur:', 'font-weight: bold;', convError.code);
      console.log('%cℹ️ Message:', 'font-weight: bold;', convError.message);
      
      if (convError.code === 'PGRST116') {
        console.log('%c➡️ RAISON: La table "conversations" n\'existe pas dans Supabase', 'background: #e74c3c; color: white; font-weight: bold; padding: 5px;');
      } else if (convError.code === '42501') {
        console.log('%c➡️ RAISON: RLS (Row Level Security) bloque l\'accès à la table', 'background: #e74c3c; color: white; font-weight: bold; padding: 5px;');
      }
    } else {
      console.log('🗄️ Conversations en base:', conversations?.length || 0, 'items');
      if (conversations && conversations.length > 0) {
        console.table(conversations.map(c => ({
          id: c.id,
          titre: c.title?.substring(0, 50) + (c.title?.length > 50 ? '...' : ''),
          userId: c.user_id,
          status: c.status,
          createdAt: c.created_at
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
      console.error('❌ Erreur messages Supabase:', msgError);
    } else {
      console.log('💬 Messages en base:', messages?.length || 0, 'items (derniers 10)');
    }

    // Vérifier le profil utilisateur
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Erreur profil Supabase:', profileError);
        if (profileError.code === 'PGRST116') {
          console.log('%c➡️ PROBLÈME: Votre profil n\'existe pas dans la table "profiles"', 'background: #e74c3c; color: white; font-weight: bold; padding: 5px;');
          console.log('💡 Solution: Créer le profil manquant (voir DEBUG_STORAGE_CHECK.md)');
        }
      } else {
        console.log('👤 Profil utilisateur:', profile);
      }
    }

  } catch (error) {
    console.error('❌ Erreur Supabase:', error);
    console.log('%c➡️ RAISON: Supabase n\'est pas configuré ou accessible', 'background: #e74c3c; color: white; font-weight: bold; padding: 5px;');
  }

  console.log('\n');

  // 3. Vérifier les variables d'environnement
  console.log('%c3️⃣ CONFIGURATION', 'background: #9b59b6; color: white; font-size: 14px; font-weight: bold; padding: 5px;');
  
  console.log('🔧 Variables d\'environnement:');
  console.log('  - VITE_SUPABASE_URL:', import.meta.env?.VITE_SUPABASE_URL ? '✅ Configuré' : '❌ Manquant');
  console.log('  - VITE_SUPABASE_ANON_KEY:', import.meta.env?.VITE_SUPABASE_ANON_KEY ? '✅ Configuré' : '❌ Manquant');
  console.log('  - VITE_DISABLE_SUPABASE_CONVERSATIONS:', import.meta.env?.VITE_DISABLE_SUPABASE_CONVERSATIONS || 'false');
  
  if (import.meta.env?.VITE_DISABLE_SUPABASE_CONVERSATIONS === 'true') {
    console.log('%c➡️ ATTENTION: Les conversations Supabase sont DÉSACTIVÉES', 'background: #e74c3c; color: white; font-weight: bold; padding: 5px;');
  }

  console.log('\n');

  // 4. Résumé et recommandations
  console.log('%c4️⃣ RÉSUMÉ', 'background: #e67e22; color: white; font-size: 14px; font-weight: bold; padding: 5px;');
  
  const localConversations = JSON.parse(localStorage.getItem('doodates_conversations') || '[]');
  const localPolls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
  
  if (localConversations.length > 0 || localPolls.length > 0) {
    console.log('%c✅ VOS DONNÉES SONT SAUVEGARDÉES DANS LE NAVIGATEUR (localStorage)', 'background: #27ae60; color: white; font-weight: bold; padding: 8px; font-size: 12px;');
    console.log('   ├─ Conversations:', localConversations.length);
    console.log('   └─ Formulaires:', localPolls.length);
    console.log('\n   ⚠️ ATTENTION: Ces données seront perdues si vous:');
    console.log('      - Videz le cache du navigateur');
    console.log('      - Changez d\'appareil');
    console.log('      - Utilisez un autre navigateur');
  } else {
    console.log('%c⚠️ AUCUNE DONNÉE TROUVÉE', 'background: #e74c3c; color: white; font-weight: bold; padding: 8px; font-size: 12px;');
  }

  console.log('\n');
  console.log('%c💡 RECOMMANDATIONS:', 'background: #34495e; color: white; font-weight: bold; padding: 5px;');
  console.log('');
  
  try {
    const module = await import('/src/lib/supabase.ts');
    const supabase = module.supabase;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('1️⃣ Connectez-vous pour sauvegarder vos données en base de données Supabase');
      console.log('2️⃣ Vos données actuelles seront migrées automatiquement');
    } else {
      console.log('1️⃣ Vérifiez que votre profil existe dans la table "profiles"');
      console.log('2️⃣ Vérifiez les RLS policies dans le dashboard Supabase');
      console.log('3️⃣ Consultez DEBUG_STORAGE_CHECK.md pour plus de détails');
    }
  } catch (e) {
    console.log('1️⃣ Configurez Supabase (VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY)');
    console.log('2️⃣ Redémarrez le serveur de développement');
  }

  console.log('\n');
  console.log('%c=== FIN DU DIAGNOSTIC ===', 'background: #222; color: #bada55; font-size: 16px; font-weight: bold; padding: 10px;');
}

// Exposer la fonction globalement
window.debugStorage = debugStorage;

console.log('%c✅ Script de diagnostic chargé !', 'background: #27ae60; color: white; font-weight: bold; padding: 5px;');
console.log('%cTapez: await debugStorage()', 'background: #3498db; color: white; font-weight: bold; padding: 5px;');

