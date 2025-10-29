/**
 * QuotaService - Business logic for quota management
 * Extracted from quota hooks to improve separation of concerns
 */

import { logError, ErrorFactory } from "../lib/error-handling";

export type AuthIncentiveType =
  | "quota_warning"
  | "quota_exceeded"
  | "feature_unlock"
  | "conversation_limit"
  | "poll_limit"
  | "storage_full";

export interface QuotaLimits {
  conversations: number;
  polls: number;
  storageSize: number; // in MB
}

export interface QuotaUsage {
  conversations: number;
  polls: number;
  storageUsed: number; // in MB
}

export interface QuotaStatus {
  used: number;
  limit: number;
  percentage: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
}

export class QuotaService {
  static readonly GUEST_LIMITS: QuotaLimits = {
    conversations: 10,
    polls: 5,
    storageSize: 50, // 50MB for guests
  };

  static readonly AUTHENTICATED_LIMITS: QuotaLimits = {
    conversations: 100,
    polls: 50,
    storageSize: 500, // 500MB for authenticated users
  };

  /**
   * Calculate quota status for a specific resource
   */
  static calculateStatus(used: number, limit: number): QuotaStatus {
    const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

    return {
      used,
      limit,
      percentage,
      isNearLimit: percentage >= 80,
      isAtLimit: percentage >= 100,
    };
  }

  /**
   * Get storage size from localStorage
   */
  static getStorageSize(): number {
    try {
      let totalSize = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const value = localStorage.getItem(key) || "";
          totalSize += key.length + value.length;
        }
      }
      return totalSize / (1024 * 1024); // Convert to MB
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Error calculating storage size",
          "Erreur de calcul de taille de stockage",
        ),
        {
          component: "QuotaService",
          operation: "calculateTotalStorageSize",
          originalError: error,
        },
      );
      return 0;
    }
  }

  /**
   * Get conversation count from storage
   */
  static getConversationCount(): number {
    try {
      const storageData = localStorage.getItem("doodates_conversations");
      if (!storageData) return 0;

      if (storageData.startsWith("{") || storageData.startsWith("[")) {
        const parsed = JSON.parse(storageData);
        return Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
      }

      return storageData.split("\n").filter((line) => line.trim()).length;
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Error counting conversations",
          "Erreur de comptage des conversations",
        ),
        {
          component: "QuotaService",
          operation: "countConversations",
          originalError: error,
        },
      );
      return 0;
    }
  }

  /**
   * Get poll count from storage
   */
  static getPollCount(): number {
    try {
      const storageData = localStorage.getItem("doodates_polls");
      if (!storageData) return 0;

      const parsed = JSON.parse(storageData);
      return Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
    } catch (error) {
      logError(ErrorFactory.storage("Error counting polls", "Erreur de comptage des sondages"), {
        component: "QuotaService",
        operation: "countPolls",
        originalError: error,
      });
      return 0;
    }
  }

  /**
   * Calculate current usage
   */
  static calculateUsage(): QuotaUsage {
    return {
      conversations: this.getConversationCount(),
      polls: this.getPollCount(),
      storageUsed: this.getStorageSize(),
    };
  }

  /**
   * Check if user can create new conversation
   */
  static canCreateConversation(isAuthenticated: boolean): boolean {
    const limits = isAuthenticated ? this.AUTHENTICATED_LIMITS : this.GUEST_LIMITS;
    const usage = this.calculateUsage();
    return usage.conversations < limits.conversations;
  }

  /**
   * Check if user can create new poll
   */
  static canCreatePoll(isAuthenticated: boolean): boolean {
    const limits = isAuthenticated ? this.AUTHENTICATED_LIMITS : this.GUEST_LIMITS;
    const usage = this.calculateUsage();
    return usage.polls < limits.polls;
  }

  /**
   * Get appropriate auth incentive type based on quota status
   */
  static getAuthIncentiveType(isAuthenticated: boolean): AuthIncentiveType {
    if (isAuthenticated) return "feature_unlock";

    const usage = this.calculateUsage();
    const limits = this.GUEST_LIMITS;

    if (usage.conversations >= limits.conversations) return "conversation_limit";
    if (usage.polls >= limits.polls) return "poll_limit";
    if (usage.storageUsed >= limits.storageSize) return "storage_full";

    return "conversation_limit"; // Default to conversation_limit for guests
  }

  /**
   * Find old conversations for auto-deletion
   */
  static findOldConversations(dayThreshold: number = 30): string[] {
    try {
      const storageData = localStorage.getItem("doodates_conversations");
      if (!storageData) return [];

      const conversations = JSON.parse(storageData);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dayThreshold);

      const oldConversationIds: string[] = [];

      if (Array.isArray(conversations)) {
        conversations.forEach((conv) => {
          if (conv.lastModified && new Date(conv.lastModified) < cutoffDate) {
            oldConversationIds.push(conv.id);
          }
        });
      } else {
        Object.entries(conversations).forEach(([id, conv]: [string, any]) => {
          if (conv.lastModified && new Date(conv.lastModified) < cutoffDate) {
            oldConversationIds.push(id);
          }
        });
      }

      return oldConversationIds;
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Error finding old conversations",
          "Erreur de recherche d'anciennes conversations",
        ),
        {
          component: "QuotaService",
          operation: "findOldConversations",
          originalError: error,
        },
      );
      return [];
    }
  }

  /**
   * Delete conversations by IDs
   */
  static async deleteConversations(conversationIds: string[]): Promise<number> {
    try {
      const storageData = localStorage.getItem("doodates_conversations");
      if (!storageData) return 0;

      const conversations = JSON.parse(storageData);
      let deletedCount = 0;

      if (Array.isArray(conversations)) {
        const filtered = conversations.filter((conv) => {
          if (conversationIds.includes(conv.id)) {
            deletedCount++;
            return false;
          }
          return true;
        });
        localStorage.setItem("doodates_conversations", JSON.stringify(filtered));
      } else {
        conversationIds.forEach((id) => {
          if (conversations[id]) {
            delete conversations[id];
            deletedCount++;
          }
        });
        localStorage.setItem("doodates_conversations", JSON.stringify(conversations));
      }

      return deletedCount;
    } catch (error) {
      logError(
        ErrorFactory.storage(
          "Error deleting conversations",
          "Erreur de suppression des conversations",
        ),
        {
          component: "QuotaService",
          operation: "deleteConversations",
          originalError: error,
        },
      );
      return 0;
    }
  }
}
