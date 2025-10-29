/**
 * ConversationStateProvider
 * 
 * Contexte dédié pour gérer l'état des conversations (Business Logic)
 * Extrait de ConversationProvider pour éviter re-renders inutiles
 * 
 * Responsabilités :
 * - État conversation (ID, messages)
 * - Persistence dans localStorage
 * - Synchronisation avec l'historique
 * 
 * @see Docs/Architecture-ConversationProvider.md
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ErrorFactory, logError } from "@/lib/error-handling";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ConversationStateContextType {
  // État conversation
  conversationId: string | null;
  messages: Message[];
  
  // Actions
  setConversationId: (id: string | null) => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  setMessages: (messages: Message[]) => void;
  clearMessages: () => void;
}

const ConversationStateContext = createContext<ConversationStateContextType | undefined>(undefined);

const STORAGE_KEY = "prototype_messages";

interface ConversationStateProviderProps {
  children: ReactNode;
}

export function ConversationStateProvider({ children }: ConversationStateProviderProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Charger les messages depuis localStorage au démarrage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Failed to load messages from localStorage",
          "Impossible de charger l'historique de conversation"
        ),
        { component: "ConversationStateProvider", operation: "loadMessages", metadata: { error } }
      );
    }
  }, []);

  // Sauvegarder les messages dans localStorage à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Failed to save messages to localStorage",
          "Impossible de sauvegarder l'historique de conversation"
        ),
        { component: "ConversationStateProvider", operation: "saveMessages", metadata: { error } }
      );
    }
  }, [messages]);

  // Ajouter un message
  const addMessage = useCallback((message: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Effacer tous les messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: ConversationStateContextType = {
    conversationId,
    messages,
    setConversationId,
    addMessage,
    setMessages,
    clearMessages
  };

  return (
    <ConversationStateContext.Provider value={value}>
      {children}
    </ConversationStateContext.Provider>
  );
}

/**
 * Hook pour accéder à l'état conversation
 * 
 * @throws Error si utilisé hors du ConversationStateProvider
 */
export function useConversationState(): ConversationStateContextType {
  const context = useContext(ConversationStateContext);
  
  if (!context) {
    throw ErrorFactory.validation(
      "useConversationState must be used within ConversationStateProvider",
      "Une erreur s'est produite lors de l'initialisation de la conversation"
    );
  }
  
  return context;
}

/**
 * Hooks spécialisés pour éviter re-renders inutiles
 */

/**
 * Hook pour accéder uniquement aux messages
 * Le composant ne re-render que si messages change
 */
export function useConversationMessages() {
  const { messages } = useConversationState();
  return messages;
}

/**
 * Hook pour accéder uniquement à l'ID de conversation
 * Le composant ne re-render que si conversationId change
 */
export function useConversationId() {
  const { conversationId } = useConversationState();
  return conversationId;
}

/**
 * Hook pour accéder uniquement aux actions
 * Le composant ne re-render jamais (actions stables)
 */
export function useConversationActions() {
  const { addMessage, setMessages, clearMessages, setConversationId } = useConversationState();
  return { addMessage, setMessages, clearMessages, setConversationId };
}
