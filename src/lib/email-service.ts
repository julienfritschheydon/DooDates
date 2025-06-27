import { Poll, Vote } from '../types/poll';

/**
 * Service d'envoi d'emails via fonction serverless
 * Remplace l'appel direct à Resend pour des raisons de sécurité
 */
export class EmailService {
  private static readonly API_ENDPOINT = import.meta.env.DEV 
    ? 'http://localhost:3001/api/send-email'  // Serveur de dev local
    : '/api/send-email';  // Fonction serverless en production

  /**
   * Appel générique à la fonction serverless
   */
  private static async sendEmail(type: string, data: any): Promise<any> {
    try {
      console.log(`📧 [EmailService] Envoi email type: ${type}`, data);

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, data })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log(`✅ [EmailService] Email ${type} envoyé avec succès:`, result);
      
      return result;
    } catch (error: any) {
      console.error(`❌ [EmailService] Erreur envoi email ${type}:`, error);
      throw error;
    }
  }

  /**
   * Envoie un email de confirmation de création de sondage
   */
  static async sendPollCreatedEmail(poll: Poll, creatorEmail: string): Promise<void> {
    if (!creatorEmail) {
      console.warn('⚠️ [EmailService] Pas d\'email créateur fourni');
      return;
    }

    const pollUrl = `${window.location.origin}/poll/${poll.id}`;
    
    await this.sendEmail('poll_created', {
      creatorEmail,
      pollTitle: poll.title,
      pollUrl,
      selectedDates: poll.dates,
      pollId: poll.id
    });
  }

  /**
   * Envoie un email de confirmation de vote
   */
  static async sendVoteConfirmationEmail(poll: Poll, vote: Vote): Promise<void> {
    if (!vote.email) {
      console.warn('⚠️ [EmailService] Pas d\'email votant fourni');
      return;
    }

    const pollUrl = `${window.location.origin}/poll/${poll.id}`;
    
    await this.sendEmail('vote_confirmation', {
      voterEmail: vote.email,
      voterName: vote.name,
      pollTitle: poll.title,
      pollUrl,
      selectedSlots: vote.selectedSlots,
      pollId: poll.id
    });
  }

  /**
   * Envoie une notification de nouveau vote au créateur
   */
  static async sendVoteNotificationEmail(poll: Poll, vote: Vote, totalVotes: number): Promise<void> {
    if (!poll.creatorEmail) {
      console.warn('⚠️ [EmailService] Pas d\'email créateur dans le sondage');
      return;
    }

    const pollUrl = `${window.location.origin}/poll/${poll.id}`;
    
    await this.sendEmail('vote_notification', {
      creatorEmail: poll.creatorEmail,
      voterName: vote.name,
      pollTitle: poll.title,
      pollUrl,
      selectedSlots: vote.selectedSlots,
      totalVotes,
      pollId: poll.id
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
      if (result.status === 'rejected') {
        console.error(`❌ [EmailService] Erreur email batch ${index}:`, result.reason);
      }
    });
  }

  /**
   * Test de connectivité avec la fonction serverless
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'OPTIONS'
      });
      return response.ok;
    } catch (error) {
      console.error('❌ [EmailService] Test de connectivité échoué:', error);
      return false;
    }
  }

  // Méthodes de compatibilité avec l'ancien service
  static async sendPollCreated(pollTitle: string, pollSlug: string, creatorName: string, participantEmails: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      if (!participantEmails || participantEmails.length === 0) {
        console.warn('⚠️ [EmailService] Aucun email participant fourni');
        return { success: true };
      }

      const pollUrl = `${window.location.origin}/poll/${pollSlug}`;
      
      await this.sendEmail('poll_created', {
        creatorEmail: participantEmails[0], // Premier email comme créateur
        pollTitle,
        pollUrl,
        selectedDates: [],
        pollId: pollSlug
      });

      return { success: true };
    } catch (error: any) {
      console.error('❌ [EmailService] Erreur sendPollCreated:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendVoteNotification(pollTitle: string, pollSlug: string, creatorEmail: string, voterName: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!creatorEmail) {
        console.warn('⚠️ [EmailService] Pas d\'email créateur fourni');
        return { success: true };
      }

      const pollUrl = `${window.location.origin}/poll/${pollSlug}`;
      
      await this.sendEmail('vote_notification', {
        creatorEmail,
        voterName,
        pollTitle,
        pollUrl,
        selectedSlots: [],
        totalVotes: 1,
        pollId: pollSlug
      });

      return { success: true };
    } catch (error: any) {
      console.error('❌ [EmailService] Erreur sendVoteNotification:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendVoteConfirmation(pollTitle: string, pollSlug: string, voterName: string, voterEmail: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 🧪 TEST: Hardcode email for testing with authorized Resend account
      const testEmail = 'julien.fritsch@gmail.com';
      
      if (!voterEmail && !testEmail) {
        console.warn('⚠️ [EmailService] Pas d\'email votant fourni');
        return { success: true };
      }

      const pollUrl = `${window.location.origin}/poll/${pollSlug}`;
      
      console.log(`📧 [TEST] Envoi email confirmation vote vers: ${testEmail}`);
      
      await this.sendEmail('vote_confirmation', {
        voterEmail: testEmail, // Use test email instead of voterEmail
        voterName: voterName || 'Votant DooDates',
        pollTitle: pollTitle || 'Sondage DooDates',
        pollUrl,
        selectedSlots: [],
        pollId: pollSlug
      });

      console.log('✅ [EmailService] Email de confirmation de vote envoyé');
      return { success: true };
    } catch (error) {
      console.error('❌ [EmailService] Erreur envoi email confirmation vote:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
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
    selectedDates: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 🧪 TEST: Hardcode email for testing with authorized Resend account
      const testEmail = 'julien.fritsch@gmail.com';
      
      if (!creatorEmail && !testEmail) {
        console.warn('⚠️ [EmailService] Pas d\'email créateur fourni');
        return { success: true };
      }

      const pollUrl = `${window.location.origin}/poll/${pollSlug}`;
      
      console.log(`📧 [TEST] Envoi email création sondage vers: ${testEmail}`);
      
      await this.sendEmail('poll_created', {
        creatorEmail: testEmail, // Use test email instead of creatorEmail
        pollTitle: pollTitle || 'Sondage DooDates',
        pollUrl,
        selectedDates
      });

      console.log('✅ [EmailService] Email de création de sondage envoyé');
      return { success: true };
    } catch (error) {
      console.error('❌ [EmailService] Erreur envoi email création:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }
}