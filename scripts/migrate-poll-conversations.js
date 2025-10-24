/**
 * Script de migration : Lier les sondages existants à leurs conversations
 * 
 * Ce script parcourt tous les sondages et conversations dans localStorage
 * et crée les liens manquants entre eux.
 */

// Fonction pour lire les données depuis localStorage
function getAllPolls() {
  const polls = JSON.parse(localStorage.getItem('doodates_polls') || '[]');
  console.log(`📊 ${polls.length} sondages trouvés`);
  return polls;
}

function getAllConversations() {
  const conversations = JSON.parse(localStorage.getItem('doodates-conversations') || '[]');
  console.log(`💬 ${conversations.length} conversations trouvées`);
  return conversations;
}

// Fonction pour sauvegarder les données
function savePolls(polls) {
  localStorage.setItem('doodates_polls', JSON.stringify(polls));
  console.log(`✅ ${polls.length} sondages sauvegardés`);
}

function saveConversations(conversations) {
  localStorage.setItem('doodates-conversations', JSON.stringify(conversations));
  console.log(`✅ ${conversations.length} conversations sauvegardées`);
}

// Fonction de migration
function migratePollConversations() {
  console.log('🚀 Démarrage de la migration...\n');
  
  const polls = getAllPolls();
  const conversations = getAllConversations();
  
  let pollsUpdated = 0;
  let conversationsUpdated = 0;
  
  // Pour chaque sondage sans relatedConversationId
  polls.forEach(poll => {
    if (poll.relatedConversationId) {
      console.log(`⏭️  Sondage "${poll.title}" déjà lié`);
      return;
    }
    
    // Chercher une conversation avec le même titre de sondage
    const matchingConversation = conversations.find(conv => {
      const metadata = conv.metadata || {};
      return metadata.pollGenerated && 
             metadata.pollTitle?.toLowerCase() === poll.title.toLowerCase();
    });
    
    if (matchingConversation) {
      // Lier le sondage à la conversation
      poll.relatedConversationId = matchingConversation.id;
      pollsUpdated++;
      console.log(`✅ Sondage "${poll.title}" lié à conversation ${matchingConversation.id}`);
    } else {
      console.log(`⚠️  Aucune conversation trouvée pour "${poll.title}"`);
    }
  });
  
  // Pour chaque conversation sans métadonnées pollTitle
  conversations.forEach(conv => {
    const metadata = conv.metadata || {};
    if (metadata.pollGenerated && !metadata.pollTitle) {
      // Chercher un sondage créé à peu près au même moment
      const matchingPoll = polls.find(poll => {
        const pollTime = new Date(poll.created_at).getTime();
        const convTime = new Date(conv.createdAt).getTime();
        const timeDiff = Math.abs(pollTime - convTime);
        // Moins de 5 minutes de différence
        return timeDiff < 5 * 60 * 1000;
      });
      
      if (matchingPoll) {
        conv.metadata = {
          ...metadata,
          pollTitle: matchingPoll.title,
        };
        conversationsUpdated++;
        console.log(`✅ Conversation ${conv.id} mise à jour avec titre "${matchingPoll.title}"`);
      }
    }
  });
  
  // Sauvegarder les modifications
  if (pollsUpdated > 0) {
    savePolls(polls);
  }
  if (conversationsUpdated > 0) {
    saveConversations(conversations);
  }
  
  console.log('\n📊 Résumé de la migration:');
  console.log(`   - ${pollsUpdated} sondages liés`);
  console.log(`   - ${conversationsUpdated} conversations mises à jour`);
  console.log('\n✅ Migration terminée !');
  console.log('🔄 Rafraîchis la page pour voir les changements.');
}

// Exécuter la migration
migratePollConversations();
