import { Poll, SwipeOption, SwipeVote, VoterInfo } from "../utils/types";
import { pollsApi, pollOptionsApi, votesApi } from "../../../lib/supabase-fetch";
import { EmailService } from "../../../lib/email-service";

/**
 * Service for handling voting API calls
 */

// Fetch poll data
export const fetchPoll = async (pollIdOrSlug: string): Promise<Poll> => {
  try {
    let poll;
    
    // Vérifier si c'est un UUID (format d'ID Supabase)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pollIdOrSlug);
    
    if (isUUID) {
      // Si c'est un UUID, on construit une requête directe à l'API
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/polls?id=eq.${pollIdOrSlug}`,
        { 
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const polls = await response.json();
      poll = polls.length > 0 ? polls[0] : null;
    } else {
      // Sinon, on suppose que c'est un slug
      poll = await pollsApi.getBySlug(pollIdOrSlug);
    }
    
    if (poll) {
      // Adapter le format de l'API Supabase au format attendu par notre application
      const pollData: Poll = {
        id: poll.id,
        title: poll.title,
        description: poll.description || "",
        status: poll.status,
        creator_id: poll.creator_id || "",
        created_at: poll.created_at,
        expires_at: poll.expires_at, // Utiliser le vrai champ expires_at
      };
      return pollData;
    }
    
    throw new Error(`Poll not found: ${pollIdOrSlug}`);
  } catch (error) {
    console.error("Error fetching poll:", error);
    throw new Error("Failed to fetch poll data");
  }
};

// Fetch poll options
export const fetchPollOptions = async (pollId: string): Promise<SwipeOption[]> => {
  try {
    const options = await pollOptionsApi.getByPollId(pollId);
    
    // Transformer les options de l'API en SwipeOption pour notre composant
    return options.map((option): SwipeOption => ({
      id: option.id,
      poll_id: option.poll_id,
      option_date: option.option_date,
      time_slots: option.time_slots,
      display_order: option.display_order
    }));
  } catch (error) {
    console.error("Error fetching poll options:", error);
    throw new Error("Failed to fetch poll options");
  }
};

// Fetch votes for a poll
export const fetchPollVotes = async (pollId: string): Promise<SwipeVote[]> => {
  try {
    const votes = await votesApi.getByPollId(pollId);
    
    // Les votes de l'API correspondent déjà à notre format SwipeVote
    return votes as SwipeVote[];
  } catch (error) {
    console.error("Error fetching poll votes:", error);
    throw new Error("Failed to fetch poll votes");
  }
};

// Submit a vote
export const submitVote = async (
  pollId: string,
  voterInfo: VoterInfo,
  selections: Record<string, "yes" | "no" | "maybe">
): Promise<SwipeVote> => {
  try {
    const newVote = await votesApi.create({
      poll_id: pollId,
      voter_email: voterInfo.email || "", // Gérer le cas où l'email est vide
      voter_name: voterInfo.name,
      selections: selections
    });
    
    // Envoyer les notifications de vote si l'email est fourni
    if (voterInfo.email) {
      try {
        // Récupérer les données du sondage pour les notifications
        const poll = await fetchPoll(pollId);
        
        // Récupérer l'email du créateur (si disponible)
        let creatorEmail = '';
        if (poll.creator_id) {
          // Pour l'instant, on utilise un email par défaut ou on skip la notification créateur
          // TODO: Récupérer l'email du créateur depuis la base de données
          creatorEmail = ''; // Sera implémenté quand on aura la table users
        }
        
        // Envoyer les notifications (confirmation + notification créateur si applicable)
        const emailResult = await EmailService.sendVoteNotification(
          poll.title,
          pollId, // Utiliser l'ID comme slug pour l'instant
          creatorEmail || voterInfo.email, // Fallback pour éviter les erreurs
          voterInfo.name
        );
        
        if (!emailResult.success) {
          console.warn('Échec envoi notifications vote:', emailResult.error);
        }
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi des notifications de vote:', emailError);
        // Ne pas faire échouer le vote si l'email échoue
      }
    }
    
    return newVote as SwipeVote;
  } catch (error: any) {
    console.error("Error submitting vote:", error);
    
    // Gérer spécifiquement l'erreur 409 (conflit - vote déjà existant)
    if (error.message && error.message.includes("409")) {
      throw new Error("409: Vote already exists for this email");
    }
    
    // Gérer les autres erreurs
    throw new Error("Failed to submit your vote");
  }
};
