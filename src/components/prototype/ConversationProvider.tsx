import { createContext, useContext, useState, ReactNode, useCallback, useReducer, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { addPoll, type Poll as StoragePoll } from "../../lib/pollStorage";
import { pollReducer, type PollAction } from "../../reducers/pollReducer";

/**
 * Types pour la conversation partagée
 */
interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  pollSuggestion?: any;
}

// Utiliser directement le type StoragePoll pour éviter les conflits
type Poll = StoragePoll;

interface ConversationContextType {
  // État de la conversation
  conversationId: string | null;
  messages: Message[];
  
  // État de l'éditeur
  isEditorOpen: boolean;
  currentPoll: Poll | null;
  
  // Actions conversation
  setConversationId: (id: string | null) => void;
  addMessage: (message: Message) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  clearConversation: () => void;
  
  // Actions éditeur
  openEditor: (poll: Poll) => void;
  closeEditor: () => void;
  updatePoll: (poll: Poll) => void;
  
  // Actions combinées
  createPollFromChat: (pollData: any) => void;
  
  // Reducer actions (nouveau)
  dispatchPollAction: (action: PollAction) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(
  undefined,
);

/**
 * Provider pour la conversation et l'éditeur partagés
 * 
 * Gère l'état central de l'application AI-First :
 * - Conversation avec l'IA (messages, ID)
 * - État de l'éditeur (ouvert/fermé, sondage actuel)
 * - Interactions entre chat et éditeur
 */
export function ConversationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  
  // État conversation
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(() => {
    // Restaurer les messages depuis localStorage au démarrage
    try {
      const saved = localStorage.getItem('prototype_messages');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('❌ Erreur restauration messages:', error);
      return [];
    }
  });
  
  // État éditeur avec reducer
  const [isEditorOpen, setIsEditorOpen] = useState(() => {
    // Ouvrir l'éditeur uniquement si on a des messages (= pas une nouvelle conversation)
    try {
      const savedMessages = localStorage.getItem('prototype_messages');
      const hasMessages = savedMessages && JSON.parse(savedMessages).length > 0;
      
      if (!hasMessages) {
        return false;
      }
      
      const pollsStr = localStorage.getItem('doodates_polls');
      return pollsStr && JSON.parse(pollsStr).length > 0;
    } catch {
      return false;
    }
  });
  const [currentPoll, dispatchPoll] = useReducer(pollReducer, null, () => {
    // Ne restaurer le poll que si on a des messages (= pas une nouvelle conversation)
    try {
      const savedMessages = localStorage.getItem('prototype_messages');
      const hasMessages = savedMessages && JSON.parse(savedMessages).length > 0;
      
      if (!hasMessages) {
        return null;
      }
      
      const pollsStr = localStorage.getItem('doodates_polls');
      if (!pollsStr) return null;
      
      const polls = JSON.parse(pollsStr);
      if (!Array.isArray(polls) || polls.length === 0) return null;
      
      // Trouver le poll le plus récemment modifié
      const sortedPolls = polls.sort((a: any, b: any) => {
        const dateA = new Date(a.updated_at || a.created_at).getTime();
        const dateB = new Date(b.updated_at || b.created_at).getTime();
        return dateB - dateA;
      });
      
      const latestPoll = sortedPolls[0];
      return latestPoll;
    } catch (error) {
      console.error('❌ Erreur restauration poll:', error);
      return null;
    }
  });
  
  // Ref pour debounce de la persistance
  const persistenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Persistance des messages dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem('prototype_messages', JSON.stringify(messages));
    } catch (error) {
      console.error('❌ Erreur sauvegarde messages:', error);
    }
  }, [messages]);

  // Actions conversation
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const clearConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    localStorage.removeItem('prototype_messages');
    setIsEditorOpen(false);
    dispatchPoll({ type: 'REPLACE_POLL', payload: null as any });
    // Note: On ne supprime PAS doodates_polls car il contient tous les polls sauvegardés
    // On vide juste currentPoll pour ne pas le restaurer au prochain refresh
  }, []);

  // Actions éditeur
  const openEditor = useCallback((poll: Poll) => {
    dispatchPoll({ type: 'REPLACE_POLL', payload: poll as any });
    setIsEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setIsEditorOpen(false);
    // Garder currentPoll pour pouvoir rouvrir
  }, []);

  const updatePoll = useCallback((poll: Poll) => {
    // Remplacer complètement le poll (utilisé pour l'ouverture initiale)
    dispatchPoll({ type: 'REPLACE_POLL', payload: poll as any });
  }, []);
  
  // Action pour dispatcher des modifications via le reducer
  const dispatchPollAction = useCallback((action: PollAction) => {
    dispatchPoll(action);
  }, []);
  
  // Persistance automatique avec debounce (500ms)
  useEffect(() => {
    if (!currentPoll) return;
    
    // Annuler le timer précédent
    if (persistenceTimerRef.current) {
      clearTimeout(persistenceTimerRef.current);
    }
    
    // Créer un nouveau timer
    persistenceTimerRef.current = setTimeout(() => {
      try {
        // addPoll remplace si l'ID existe déjà
        addPoll(currentPoll as StoragePoll);
      } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
      }
    }, 500);
    
    // Cleanup
    return () => {
      if (persistenceTimerRef.current) {
        clearTimeout(persistenceTimerRef.current);
      }
    };
  }, [currentPoll]);

  // Action combinée : créer ou modifier sondage depuis le chat
  const createPollFromChat = useCallback((pollData: any) => {
    console.log("🔍 createPollFromChat appelé avec:", pollData);
    
    // Créer un nouveau sondage complet avec tous les champs requis
    const now = new Date().toISOString();
    const slug = `poll-${Date.now()}`;
    const uid = () => Math.random().toString(36).slice(2, 10);
    
    // Convertir timeSlots si présents
    let timeSlotsByDate = {};
    if (pollData.timeSlots && pollData.timeSlots.length > 0) {
      timeSlotsByDate = pollData.timeSlots.reduce((acc: any, slot: any) => {
        const targetDates = slot.dates && slot.dates.length > 0 
          ? slot.dates 
          : pollData.dates || [];
        
        targetDates.forEach((date: string) => {
          if (!acc[date]) acc[date] = [];
          
          // Calculer la durée en minutes entre start et end
          const startHour = parseInt(slot.start.split(':')[0]);
          const startMinute = parseInt(slot.start.split(':')[1]);
          const endHour = parseInt(slot.end.split(':')[0]);
          const endMinute = parseInt(slot.end.split(':')[1]);
          
          const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
          
          acc[date].push({
            hour: startHour,
            minute: startMinute,
            duration: durationMinutes,
            enabled: true
          });
        });
        return acc;
      }, {});
    }
    
    // Convertir les questions Gemini en format FormPollCreator
    let convertedQuestions = pollData.questions || [];
    if (pollData.type === "form" && pollData.questions) {
      console.log("🔍 Conversion questions Gemini:", pollData.questions);
      convertedQuestions = pollData.questions.map((q: any) => {
        const baseQuestion = {
          id: uid(),
          title: q.title,
          required: q.required || false,
          type: q.type,
        };

        if (q.type === "single" || q.type === "multiple") {
          const options = (q.options || [])
            .filter((opt: any) => opt && typeof opt === 'string' && opt.trim())
            .map((opt: string) => ({
              id: uid(),
              label: opt.trim(),
            }));
          console.log("🔍 Options converties:", options);

          return {
            ...baseQuestion,
            options,
            ...(q.maxChoices && { maxChoices: q.maxChoices }),
          };
        } else {
          return {
            ...baseQuestion,
            ...(q.placeholder && { placeholder: q.placeholder }),
            ...(q.maxLength && { maxLength: q.maxLength }),
          };
        }
      });
      console.log("🔍 Questions converties:", convertedQuestions);
    }
    
    const poll: StoragePoll = {
      id: slug,
      slug: slug,
      title: pollData.title || "Nouveau sondage",
      type: pollData.type || "date",
      dates: pollData.dates || [],
      questions: convertedQuestions,
      created_at: now,
      updated_at: now,
      creator_id: "guest",
      status: "draft" as const,
      settings: {
        selectedDates: pollData.dates || [],
        timeSlotsByDate: timeSlotsByDate
      }
    };
    
    // Sauvegarder dans pollStorage
    try {
      addPoll(poll);
      
      // Ouvrir l'éditeur dans le panneau de droite
      openEditor(poll as any);
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde:", error);
    }
  }, [openEditor]);

  const value: ConversationContextType = {
    // État
    conversationId,
    messages,
    isEditorOpen,
    currentPoll,
    
    // Actions conversation
    setConversationId,
    addMessage,
    setMessages,
    clearConversation,
    
    // Actions éditeur
    openEditor,
    closeEditor,
    updatePoll,
    
    // Actions combinées
    createPollFromChat,
    
    // Reducer actions
    dispatchPollAction,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

/**
 * Hook pour accéder au context conversation
 */
export function useConversation() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error("useConversation must be used within ConversationProvider");
  }
  return context;
}
