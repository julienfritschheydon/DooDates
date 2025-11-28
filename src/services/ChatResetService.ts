/**
 * ChatResetService - Service de reset intelligent du chat
 *
 * Détermine quand et comment reset le chat selon le contexte de navigation
 * Distingue nouvelle création (reset) vs refresh (préservation)
 */

import { logger } from "../lib/logger";

export type NavigationAction = "PUSH" | "POP" | "REPLACE";

export interface ResetStrategy {
  shouldReset: boolean;
  preserveConversation?: boolean;
  resetType: "full" | "chat-only" | "context-only" | "none";
  reason: string;
}

export interface NavigationContext {
  fromPath: string;
  toPath: string;
  action: NavigationAction;
  searchParams: URLSearchParams;
  timestamp: number;
}

/**
 * Service central pour déterminer la stratégie de reset du chat
 */
export class ChatResetService {
  /**
   * Détermine la stratégie de reset selon la navigation
   */
  static determineResetStrategy(
    fromLocation: Location | null,
    toLocation: Location,
    action: NavigationAction = "PUSH",
  ): ResetStrategy {
    const fromPath = fromLocation?.pathname || "";
    const toPath = toLocation.pathname;
    const searchParams = new URLSearchParams(toLocation.search);

    const context: NavigationContext = {
      fromPath,
      toPath,
      action,
      searchParams,
      timestamp: Date.now(),
    };

    logger.debug("Navigation context analyzed", "conversation", context);

    // 1. Mode édition - préserver et charger contexte
    if (this.isEditMode(context)) {
      return {
        shouldReset: false,
        preserveConversation: true,
        resetType: "none",
        reason: "edit-mode-preserve-context",
      };
    }

    // 2. Changement de type de sondage - reset contexte uniquement
    if (this.isTypeChange(context)) {
      return {
        shouldReset: true,
        preserveConversation: false,
        resetType: "context-only",
        reason: "type-change-reset-context",
      };
    }

    // 3. Nouvelle création - reset complet
    if (this.isNewCreation(context)) {
      return {
        shouldReset: true,
        preserveConversation: false,
        resetType: "full",
        reason: "new-creation-full-reset",
      };
    }

    // 4. Navigation temporaire - préserver tout
    if (this.isTemporaryNavigation(context)) {
      return {
        shouldReset: false,
        preserveConversation: true,
        resetType: "none",
        reason: "temporary-navigation-preserve",
      };
    }

    // 5. Par défaut - préserver (sécurité)
    return {
      shouldReset: false,
      preserveConversation: true,
      resetType: "none",
      reason: "default-preserve",
    };
  }

  /**
   * Vérifie si on est en mode édition
   */
  private static isEditMode(context: NavigationContext): boolean {
    const editId = context.searchParams.get("edit");
    const hasEditId = editId && editId.length > 0;

    logger.debug("Edit mode check", "conversation", {
      hasEditId,
      editId,
      path: context.toPath,
    });

    return hasEditId;
  }

  /**
   * Vérifie si c'est un changement de type de sondage
   */
  private static isTypeChange(context: NavigationContext): boolean {
    // Changement entre workspace/date et workspace/form
    const fromIsDate = context.fromPath.includes("/workspace/date");
    const fromIsForm = context.fromPath.includes("/workspace/form");
    const toIsDate = context.toPath.includes("/workspace/date");
    const toIsForm = context.toPath.includes("/workspace/form");

    const isTypeChange = (fromIsDate && toIsForm) || (fromIsForm && toIsDate);

    logger.debug("Type change check", "conversation", {
      isTypeChange,
      fromPath: context.fromPath,
      toPath: context.toPath,
    });

    return isTypeChange;
  }

  /**
   * Vérifie si c'est une nouvelle création
   */
  private static isNewCreation(context: NavigationContext): boolean {
    // Navigation vers workspace/date ou workspace/form sans params
    const isWorkspaceTarget =
      context.toPath.includes("/workspace/date") || context.toPath.includes("/workspace/form");
    const hasNoParams = context.searchParams.toString().length === 0;
    const isFromOutside = !context.fromPath.includes("/workspace");

    const isNewCreation = isWorkspaceTarget && hasNoParams && isFromOutside;

    logger.debug("New creation check", "conversation", {
      isNewCreation,
      isWorkspaceTarget,
      hasNoParams,
      isFromOutside,
      fromPath: context.fromPath,
      toPath: context.toPath,
    });

    return isNewCreation;
  }

  /**
   * Vérifie si c'est une navigation temporaire (dashboard, settings, etc.)
   */
  private static isTemporaryNavigation(context: NavigationContext): boolean {
    // Navigation depuis/vers des pages non-workspace
    const nonWorkspacePaths = ["/dashboard", "/settings", "/profile", "/docs", "/pricing"];
    const isFromNonWorkspace = nonWorkspacePaths.some((path) => context.fromPath.startsWith(path));
    const isToWorkspace = context.toPath.includes("/workspace");

    const isTemporaryNavigation = isFromNonWorkspace && isToWorkspace;

    logger.debug("Temporary navigation check", "conversation", {
      isTemporaryNavigation,
      isFromNonWorkspace,
      isToWorkspace,
      fromPath: context.fromPath,
      toPath: context.toPath,
    });

    return isTemporaryNavigation;
  }

  /**
   * Applique la stratégie de reset
   */
  static async applyResetStrategy(strategy: ResetStrategy): Promise<void> {
    logger.info("Applying reset strategy", "conversation", strategy);

    try {
      // Émettre un événement custom pour que les composants écoutent
      const event = new CustomEvent("chat-reset", {
        detail: strategy,
      });

      window.dispatchEvent(event);

      logger.info("Reset event dispatched", "conversation", {
        resetType: strategy.resetType,
        reason: strategy.reason,
      });
    } catch (error) {
      logger.error("Failed to apply reset strategy", "conversation", error);
      throw error;
    }
  }

  /**
   * Vérifie si une URL est une page de création
   */
  static isCreationPage(pathname: string): boolean {
    return pathname.includes("/workspace/date") || pathname.includes("/workspace/form");
  }

  /**
   * Extrait le type de sondage depuis l'URL
   */
  static extractPollType(pathname: string): "date" | "form" | null {
    if (pathname.includes("/workspace/date")) return "date";
    if (pathname.includes("/workspace/form")) return "form";
    return null;
  }

  /**
   * Génère une clé de cache pour la conversation courante
   */
  static generateCacheKey(pathname: string, searchParams: URLSearchParams): string {
    const pollType = this.extractPollType(pathname) || "unknown";
    const editId = searchParams.get("edit") || "no-edit";
    return `chat-${pollType}-${editId}`;
  }
}

// Export par défaut pour faciliter l'import
export default ChatResetService;
