import { Poll as StoragePoll } from "@/lib/pollStorage";

// Interface pour les sondages du dashboard avec statistiques
export interface DashboardPoll extends StoragePoll {
  votes_count?: number;
  participants_count?: number;
  topDates?: { date: string; score: number }[];
  relatedConversationId?: string;
}

// Interface pour les items unifiés du dashboard (conversation + poll optionnel)
export interface ConversationItem {
  id: string; // ID de la conversation
  conversationTitle: string;
  conversationDate: Date;
  poll?: DashboardPoll; // Poll associé (optionnel)
  hasAI: boolean; // Créé par IA
  tags?: string[]; // Tags assignés
  folderId?: string; // ID du dossier (optionnel)
}

// Type pour les filtres
export type FilterType = "all" | "draft" | "active" | "closed" | "archived";

// Type pour les filtres par type de contenu
export type ContentTypeFilter = "all" | "conversations" | "date" | "availability" | "form";
