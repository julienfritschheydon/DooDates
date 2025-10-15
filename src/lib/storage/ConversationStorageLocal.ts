import { compress, decompress } from "lz-string";
import {
  Conversation,
  ConversationMessage,
  ConversationError,
  CONVERSATION_LIMITS,
} from "../../types/conversation";
import {
  validateConversation,
  validateConversationMessage,
  ConversationQuotaSchema,
} from "../validation/conversation";
import { handleError, ErrorFactory, logError } from "../error-handling";

/**
 * Interface pour les métadonnées de stockage localStorage
 */
interface StorageMetadata {
  version: string;
  createdAt: string;
  lastAccessed: string;
  expiresAt: string;
  isGuest: boolean;
}

/**
 * Structure des données stockées dans localStorage
 */
interface StorageData {
  conversations: Record<string, Conversation>;
  messages: Record<string, ConversationMessage[]>;
  metadata: StorageMetadata;
}

/**
 * Gestionnaire de stockage localStorage pour les conversations
 * Avec compression LZ-string, gestion des quotas et expiration automatique
 */
export class ConversationStorageLocal {
  private static readonly STORAGE_KEY = "doodates_conversations";
  private static readonly STORAGE_VERSION = "1.0.0";
  private static readonly EXPIRATION_DAYS = 30;
  private static readonly GUEST_QUOTA_LIMIT = 10;

  /**
   * Initialise le stockage localStorage
   */
  static initialize(isGuest: boolean = true): void {
    try {
      const existing = this.getStorageData();
      if (!existing) {
        const initialData: StorageData = {
          conversations: {},
          messages: {},
          metadata: {
            version: this.STORAGE_VERSION,
            createdAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            expiresAt: new Date(
              Date.now() + this.EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
            ).toISOString(),
            isGuest,
          },
        };
        this.saveStorageData(initialData);
      }
    } catch (error) {
      throw new ConversationError(
        "Impossible d'initialiser le stockage localStorage",
        "STORAGE_INIT_ERROR",
        { originalError: error },
      );
    }
  }

  /**
   * Crée une nouvelle conversation
   */
  static async createConversation(
    conversation: Omit<Conversation, "id" | "createdAt" | "updatedAt">,
  ): Promise<Conversation> {
    const newConversation: Conversation = {
      ...conversation,
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.saveConversation(newConversation);

    // Verify the conversation was actually saved
    const savedConversation = this.getConversation(newConversation.id);
    if (!savedConversation) {
      throw new ConversationError(
        `Failed to verify conversation creation: ${newConversation.id}`,
        "CONVERSATION_CREATION_VERIFICATION_FAILED",
        { conversationId: newConversation.id },
      );
    }

    return newConversation;
  }

  /**
   * Sauvegarde une conversation
   */
  static async saveConversation(conversation: Conversation): Promise<void> {
    try {
      // Validation des données
      const validationResult = validateConversation(conversation);
      if (!validationResult.success) {
        throw new ConversationError(
          "Données de conversation invalides",
          "VALIDATION_ERROR",
          { errors: validationResult.error?.issues },
        );
      }

      const data = this.getStorageData();
      if (!data) {
        throw new ConversationError(
          "Stockage non initialisé",
          "STORAGE_NOT_INITIALIZED",
        );
      }

      // Vérification du quota pour les invités
      if (data.metadata.isGuest) {
        const existingCount = Object.keys(data.conversations).length;
        const isUpdate = conversation.id in data.conversations;

        if (!isUpdate && existingCount >= this.GUEST_QUOTA_LIMIT) {
          throw new ConversationError(
            `Quota dépassé: maximum ${this.GUEST_QUOTA_LIMIT} conversation(s) pour les invités`,
            "QUOTA_EXCEEDED",
            {
              currentCount: existingCount,
              limit: this.GUEST_QUOTA_LIMIT,
              isGuest: true,
            },
          );
        }
      }

      // Vérification de l'expiration
      if (this.isExpired(data.metadata)) {
        this.clearExpiredData();
        throw new ConversationError(
          "Données expirées, stockage réinitialisé",
          "DATA_EXPIRED",
        );
      }

      // Sauvegarde
      data.conversations[conversation.id] = conversation;
      data.metadata.lastAccessed = new Date().toISOString();

      this.saveStorageData(data);
    } catch (error) {
      if (error instanceof ConversationError) {
        throw error;
      }
      throw new ConversationError(
        "Erreur lors de la sauvegarde de la conversation",
        "SAVE_ERROR",
        { originalError: error },
      );
    }
  }

  /**
   * Sauvegarde les messages d'une conversation
   */
  static async saveMessages(
    conversationId: string,
    messages: ConversationMessage[],
  ): Promise<void> {
    try {
      // Validation des messages
      for (const message of messages) {
        const validationResult = validateConversationMessage(message);
        if (!validationResult.success) {
          throw new ConversationError(
            "Données de message invalides",
            "VALIDATION_ERROR",
            { errors: validationResult.error?.issues },
          );
        }
      }

      const data = this.getStorageData();
      if (!data) {
        throw new ConversationError(
          "Stockage non initialisé",
          "STORAGE_NOT_INITIALIZED",
        );
      }

      // Vérification de l'expiration
      if (this.isExpired(data.metadata)) {
        this.clearExpiredData();
        throw new ConversationError(
          "Données expirées, stockage réinitialisé",
          "DATA_EXPIRED",
        );
      }

      // Vérification que la conversation parente existe
      if (!data.conversations[conversationId]) {
        const notFoundError = ErrorFactory.storage(
          `Conversation parente introuvable: ${conversationId}`,
          "Conversation non trouvée dans le stockage local",
        );

        logError(notFoundError, {
          component: "ConversationStorageLocal",
          operation: "addMessages",
        });

        throw new ConversationError(
          `Conversation parente introuvable: ${conversationId}`,
          "CONVERSATION_NOT_FOUND",
          {
            conversationId,
            availableConversations: Object.keys(data.conversations),
            storageDataKeys: Object.keys(data),
            conversationsCount: Object.keys(data.conversations).length,
          },
        );
      }

      // Append messages instead of replacing them
      if (!data.messages[conversationId]) {
        data.messages[conversationId] = [];
      }
      data.messages[conversationId] = [
        ...data.messages[conversationId],
        ...messages,
      ];
      data.metadata.lastAccessed = new Date().toISOString();

      this.saveStorageData(data);
    } catch (error) {
      if (error instanceof ConversationError) {
        throw error;
      }
      throw new ConversationError(
        "Erreur lors de la sauvegarde des messages",
        "SAVE_ERROR",
        { originalError: error },
      );
    }
  }

  /**
   * Récupère toutes les conversations
   */
  static async getConversations(): Promise<Conversation[]> {
    try {
      const data = this.getStorageData();
      if (!data) {
        return [];
      }

      // Vérification de l'expiration
      if (this.isExpired(data.metadata)) {
        this.clearExpiredData();
        return [];
      }

      // Mise à jour du lastAccessed
      data.metadata.lastAccessed = new Date().toISOString();
      this.saveStorageData(data);

      return Object.values(data.conversations);
    } catch (error) {
      throw new ConversationError(
        "Erreur lors de la récupération des conversations",
        "FETCH_ERROR",
        { originalError: error },
      );
    }
  }

  /**
   * Récupère une conversation par ID
   */
  static async getConversation(id: string): Promise<Conversation | null> {
    try {
      const data = this.getStorageData();
      if (!data) {
        return null;
      }

      // Vérification de l'expiration
      if (this.isExpired(data.metadata)) {
        this.clearExpiredData();
        return null;
      }

      const conversation = data.conversations[id] || null;

      if (conversation) {
        // Mise à jour du lastAccessed
        data.metadata.lastAccessed = new Date().toISOString();
        this.saveStorageData(data);
      }

      return conversation;
    } catch (error) {
      throw new ConversationError(
        "Erreur lors de la récupération de la conversation",
        "FETCH_ERROR",
        { originalError: error },
      );
    }
  }

  /**
   * Récupère une conversation avec ses messages
   */
  static async getConversationWithMessages(id: string): Promise<{
    conversation: Conversation;
    messages: ConversationMessage[];
  } | null> {
    try {
      const data = this.getStorageData();
      if (!data) {
        return null;
      }

      // Vérification de l'expiration
      if (this.isExpired(data.metadata)) {
        this.clearExpiredData();
        return null;
      }

      const conversation = data.conversations[id];
      const messages = data.messages[id] || [];

      if (!conversation) {
        return null;
      }

      // Mise à jour du lastAccessed
      data.metadata.lastAccessed = new Date().toISOString();
      this.saveStorageData(data);

      return { conversation, messages };
    } catch (error) {
      throw new ConversationError(
        "Erreur lors de la récupération de la conversation avec messages",
        "FETCH_ERROR",
        { originalError: error },
      );
    }
  }

  /**
   * Récupère les messages d'une conversation
   */
  static async getMessages(
    conversationId: string,
  ): Promise<ConversationMessage[]> {
    try {
      const data = this.getStorageData();
      if (!data) {
        return [];
      }

      // Vérification de l'expiration
      if (this.isExpired(data.metadata)) {
        this.clearExpiredData();
        return [];
      }

      const messages = data.messages[conversationId] || [];

      // Mise à jour du lastAccessed
      data.metadata.lastAccessed = new Date().toISOString();
      this.saveStorageData(data);

      return messages;
    } catch (error) {
      throw new ConversationError(
        "Erreur lors de la récupération des messages",
        "FETCH_ERROR",
        { originalError: error },
      );
    }
  }

  /**
   * Supprime une conversation et ses messages
   */
  static async deleteConversation(id: string): Promise<void> {
    try {
      const data = this.getStorageData();
      if (!data) {
        return;
      }

      delete data.conversations[id];
      delete data.messages[id];
      data.metadata.lastAccessed = new Date().toISOString();

      this.saveStorageData(data);
    } catch (error) {
      throw new ConversationError(
        "Erreur lors de la suppression de la conversation",
        "DELETE_ERROR",
        { originalError: error },
      );
    }
  }

  /**
   * Vide complètement le stockage
   */
  static async clearAll(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      throw new ConversationError(
        "Erreur lors du vidage du stockage",
        "CLEAR_ERROR",
        { originalError: error },
      );
    }
  }

  /**
   * Récupère les informations de quota
   */
  static getQuotaInfo(): { used: number; limit: number; isGuest: boolean } {
    try {
      const data = this.getStorageData();
      if (!data) {
        return { used: 0, limit: this.GUEST_QUOTA_LIMIT, isGuest: true };
      }

      const used = Object.keys(data.conversations).length;
      const limit = data.metadata.isGuest ? this.GUEST_QUOTA_LIMIT : -1; // -1 = illimité

      return {
        used,
        limit,
        isGuest: data.metadata.isGuest,
      };
    } catch (error) {
      return { used: 0, limit: this.GUEST_QUOTA_LIMIT, isGuest: true };
    }
  }

  /**
   * Exporte toutes les données pour migration vers Supabase
   */
  static exportForMigration(): {
    conversations: Conversation[];
    messages: Record<string, ConversationMessage[]>;
  } | null {
    try {
      const data = this.getStorageData();
      if (!data) {
        return null;
      }

      return {
        conversations: Object.values(data.conversations),
        messages: data.messages,
      };
    } catch (error) {
      throw new ConversationError(
        "Erreur lors de l'export des données",
        "EXPORT_ERROR",
        { originalError: error },
      );
    }
  }

  /**
   * Récupère et décompresse les données du localStorage
   */
  private static getStorageData(): StorageData | null {
    try {
      const compressed = localStorage.getItem(this.STORAGE_KEY);
      if (!compressed) {
        return null;
      }

      const decompressed = decompress(compressed);
      if (!decompressed) {
        throw ErrorFactory.storage(
          "Échec de la décompression des données",
          "Erreur lors de la lecture des données sauvegardées",
        );
      }

      const data = JSON.parse(decompressed) as StorageData;

      // Validation de la structure
      if (!data.conversations || !data.messages || !data.metadata) {
        throw ErrorFactory.storage(
          "Structure de données invalide dans le stockage",
          "Données corrompues détectées",
        );
      }

      return data;
    } catch (error) {
      // En cas de corruption, on supprime les données corrompues
      localStorage.removeItem(this.STORAGE_KEY);

      const corruptionError = handleError(
        error,
        {
          component: "ConversationStorageLocal",
          operation: "getStorageData",
        },
        "Données corrompues détectées et supprimées",
      );

      logError(corruptionError, {
        component: "ConversationStorageLocal",
        operation: "getStorageData",
      });

      throw new ConversationError(
        "Données corrompues détectées et supprimées",
        "DATA_CORRUPTION",
        { originalError: error },
      );
    }
  }

  /**
   * Compresse et sauvegarde les données dans localStorage
   */
  private static saveStorageData(data: StorageData): void {
    try {
      const serialized = JSON.stringify(data);
      const compressed = compress(serialized);
      localStorage.setItem(this.STORAGE_KEY, compressed);
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        throw new ConversationError(
          "Quota de stockage localStorage dépassé",
          "STORAGE_QUOTA_EXCEEDED",
          { originalError: error },
        );
      }
      throw new ConversationError(
        "Erreur lors de la sauvegarde",
        "SAVE_ERROR",
        { originalError: error },
      );
    }
  }

  /**
   * Vérifie si les données ont expiré
   */
  private static isExpired(metadata: StorageMetadata): boolean {
    const expirationDate = new Date(metadata.expiresAt);
    return new Date() > expirationDate;
  }

  /**
   * Supprime les données expirées et réinitialise
   */
  private static clearExpiredData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
