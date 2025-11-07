import { Poll, Vote } from "./pollStorage";
/**
 * Service d'envoi d'emails via fonction serverless
 * Remplace l'appel direct à Resend pour des raisons de sécurité
 */
export declare class EmailService {
  private static readonly API_ENDPOINT;
  /**
   * Appel générique à la fonction serverless
   */
  private static sendEmail;
  /**
   * Envoie un email de confirmation de création de sondage
   */
  static sendPollCreatedEmail(poll: Poll, creatorEmail: string): Promise<void>;
  /**
   * Envoie un email de confirmation de vote
   */
  static sendVoteConfirmationEmail(poll: Poll, vote: Vote): Promise<void>;
  /**
   * Envoie une notification de nouveau vote au créateur
   */
  static sendVoteNotificationEmail(poll: Poll, vote: Vote, totalVotes: number): Promise<void>;
  /**
   * Envoie les emails de confirmation et notification en batch
   */
  static sendVoteEmails(poll: Poll, vote: Vote, totalVotes: number): Promise<void>;
  /**
   * Test de connectivité avec la fonction serverless
   */
  static testConnection(): Promise<boolean>;
  static sendPollCreated(
    pollTitle: string,
    pollSlug: string,
    creatorName: string,
    participantEmails: string[],
  ): Promise<{
    success: boolean;
    error?: string;
  }>;
  static sendVoteNotification(
    pollTitle: string,
    pollSlug: string,
    creatorEmail: string,
    voterName: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }>;
  static sendVoteConfirmation(
    pollTitle: string,
    pollSlug: string,
    voterName: string,
    voterEmail: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }>;
  /**
   * Envoie une notification de création de sondage
   */
  static sendPollCreatedNotification(
    creatorEmail: string,
    pollTitle: string,
    pollSlug: string,
    selectedDates: string[],
  ): Promise<{
    success: boolean;
    error?: string;
  }>;
}
