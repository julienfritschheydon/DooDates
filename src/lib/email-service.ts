import { Poll, Vote } from "./pollStorage";
import { handleError, ErrorFactory, logError } from "./error-handling";
import { logger } from "./logger";

/**
 * Service d'envoi d'emails via fonction serverless
 * Remplace l'appel direct à Resend pour des raisons de sécurité
 */
export class EmailService {
  private static readonly API_ENDPOINT = import.meta.env.DEV
    ? "http://localhost:3001/api/send-email" // Serveur de dev local
    : "/api/send-email"; // Fonction serverless en production

  /**
   * Appel générique à la fonction serverless
   */
  private static async sendEmail(type: string, data: any): Promise<any> {
    try {
      // Sending email of type: ${type}

      const response = await fetch(this.API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, data }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw ErrorFactory.network(
          `HTTP ${response.status}: ${errorData.error || "Unknown error"}`,
          "Erreur lors de l'envoi de l'email. Vérifiez votre connexion.",
        );
      }

      const result = await response.json();
      // Email sent successfully

      return result;
    } catch (error: any) {
      throw handleError(
        error,
        {
          component: "EmailService",
          operation: "sendEmail",
        },
        "Erreur lors de l'envoi de l'email",
      );
    }
  }

  /**
   * Envoie un email de confirmation de création de sondage
   */
  static async sendPollCreatedEmail(poll: Poll, creatorEmail: string): Promise<void> {
    if (!creatorEmail) {
      logger.warn("Pas d'email créateur fourni", "api");
      return;
    }

    const pollUrl = `${window.location.origin}/poll/${poll.id}`;

    await this.sendEmail("poll_created", {
      creatorEmail,
      pollTitle: poll.title,
      pollUrl,
      selectedDates: poll.dates,
      pollId: poll.id,
    });
  }

  /**
   * Envoie un email de confirmation de vote
   */
  static async sendVoteConfirmationEmail(poll: Poll, vote: Vote): Promise<void> {
    if (!vote.email) {
      logger.warn("Pas d'email votant fourni", "api");
      return;
    }

    const pollUrl = `${window.location.origin}/poll/${poll.id}`;

    await this.sendEmail("vote_confirmation", {
      voterEmail: vote.email,
      voterName: vote.name,
      pollTitle: poll.title,
      pollUrl,
      selectedSlots: vote.selectedSlots,
      pollId: poll.id,
    });
  }

  /**
   * Envoie une notification de nouveau vote au créateur
   */
  static async sendVoteNotificationEmail(
    poll: Poll,
    vote: Vote,
    totalVotes: number,
  ): Promise<void> {
    if (!poll.creatorEmail) {
      logger.warn("No creator email in poll", "api");
      return;
    }

    const pollUrl = `${window.location.origin}/poll/${poll.id}`;

    await this.sendEmail("vote_notification", {
      creatorEmail: poll.creatorEmail,
      voterName: vote.name,
      pollTitle: poll.title,
      pollUrl,
      selectedSlots: vote.selectedSlots,
      totalVotes,
      pollId: poll.id,
    });
  }

  /**
   * Envoie les emails de confirmation et notification en batch
   */
  static async sendVoteEmails(poll: Poll, vote: Vote, totalVotes: number): Promise<void> {
    const promises: Promise<void>[] = [];

    // Email de confirmation au votant
    if (vote.email) {
      promises.push(this.sendVoteConfirmationEmail(poll, vote));
    }

    // Email de notification au créateur
    if (poll.creatorEmail && poll.creatorEmail !== vote.email) {
      promises.push(this.sendVoteNotificationEmail(poll, vote, totalVotes));
    }

    // Exécution en parallèle avec gestion d'erreur non-bloquante
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        logError(
          handleError(
            result.reason,
            {
              component: "EmailService",
              operation: "sendBatchEmails",
            },
            "Erreur lors de l'envoi d'email en lot",
          ),
          { component: "EmailService", operation: "sendBatchEmails" },
        );
      }
    });
  }

  /**
   * Test de connectivité avec la fonction serverless
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: "OPTIONS",
      });
      return response.ok;
    } catch (error) {
      logError(
        handleError(
          error,
          {
            component: "EmailService",
            operation: "testConnection",
          },
          "Test de connectivité échoué",
        ),
        { component: "EmailService", operation: "testConnection" },
      );
      return false;
    }
  }

  // Méthodes de compatibilité avec l'ancien service
  static async sendPollCreated(
    pollTitle: string,
    pollSlug: string,
    creatorName: string,
    participantEmails: string[],
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!participantEmails || participantEmails.length === 0) {
        logError(
          ErrorFactory.validation(
            "No participant emails provided",
            "Aucun email de participant fourni",
          ),
          { component: "EmailService" },
        );
        return { success: true };
      }

      const pollUrl = `${window.location.origin}/poll/${pollSlug}`;

      await this.sendEmail("poll_created", {
        creatorEmail: participantEmails[0], // Premier email comme créateur
        pollTitle,
        pollUrl,
        selectedDates: [],
        pollId: pollSlug,
      });

      return { success: true };
    } catch (error: any) {
      logError(
        ErrorFactory.api(
          "Failed to send poll created email",
          "Erreur lors de l'envoi de l'email de création de sondage",
        ),
        { metadata: { originalError: error } },
      );
      return { success: false, error: error.message };
    }
  }

  static async sendVoteNotification(
    pollTitle: string,
    pollSlug: string,
    creatorEmail: string,
    voterName: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!creatorEmail) {
        logger.warn("Pas d'email créateur fourni", "api");
        return { success: true };
      }

      const pollUrl = `${window.location.origin}/poll/${pollSlug}`;

      await this.sendEmail("vote_notification", {
        creatorEmail,
        voterName,
        pollTitle,
        pollUrl,
        selectedSlots: [],
        totalVotes: 1,
        pollId: pollSlug,
      });

      return { success: true };
    } catch (error: any) {
      logError(
        ErrorFactory.api(
          "Failed to send vote notification email",
          "Erreur lors de l'envoi de la notification de vote",
        ),
        { metadata: { originalError: error } },
      );
      return { success: false, error: error.message };
    }
  }

  static async sendVoteConfirmation(
    pollTitle: string,
    pollSlug: string,
    voterName: string,
    voterEmail: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 🧪 TEST: Hardcode email for testing with authorized Resend account
      const testEmail = "julien.fritsch@gmail.com";

      if (!voterEmail && !testEmail) {
        logger.warn("No voter email provided", "api");
        return { success: true };
      }

      const pollUrl = `${window.location.origin}/poll/${pollSlug}`;

      // Sending vote confirmation email to test address

      await this.sendEmail("vote_confirmation", {
        voterEmail: testEmail, // Use test email instead of voterEmail
        voterName: voterName || "Votant DooDates",
        pollTitle: pollTitle || "Sondage DooDates",
        pollUrl,
        selectedSlots: [],
        pollId: pollSlug,
      });

      // Vote confirmation email sent successfully
      return { success: true };
    } catch (error) {
      logError(
        ErrorFactory.api(
          "Failed to send vote confirmation email",
          "Erreur lors de l'envoi de la confirmation de vote",
        ),
        { metadata: { originalError: error } },
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Envoie une notification de création de sondage
   */
  static async sendPollCreatedNotification(
    creatorEmail: string,
    pollTitle: string,
    pollSlug: string,
    selectedDates: string[],
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 🧪 TEST: Hardcode email for testing with authorized Resend account
      const testEmail = "julien.fritsch@gmail.com";

      if (!creatorEmail && !testEmail) {
        logger.warn("No creator email provided", "api");
        return { success: true };
      }

      const pollUrl = `${window.location.origin}/poll/${pollSlug}`;

      // Sending poll creation email to test address

      await this.sendEmail("poll_created", {
        creatorEmail: testEmail, // Use test email instead of creatorEmail
        pollTitle: pollTitle || "Sondage DooDates",
        pollUrl,
        selectedDates,
      });

      // Poll creation email sent successfully
      return { success: true };
    } catch (error) {
      logError(
        ErrorFactory.api(
          "Failed to send poll creation email",
          "Erreur lors de l'envoi de l'email de création",
        ),
        { metadata: { originalError: error } },
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }
}
