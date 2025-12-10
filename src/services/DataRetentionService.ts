import { toast } from "@/hooks/use-toast";

export interface DeletionWarning {
  type: 'chat' | 'poll' | 'account';
  daysUntilDeletion: number;
  itemCount: number;
  deletionDate: Date;
  userId: string;
  userEmail?: string;
}

export interface RetentionSettings {
  chatRetention: '30-days' | '12-months' | 'indefinite';
  pollRetention: '12-months' | '6-years' | 'indefinite';
  autoDeleteEnabled: boolean;
  emailNotifications: boolean;
  allowDataForImprovement?: boolean;
}

export class DataRetentionService {
  private static instance: DataRetentionService;
  
  static getInstance(): DataRetentionService {
    if (!DataRetentionService.instance) {
      DataRetentionService.instance = new DataRetentionService();
    }
    return DataRetentionService.instance;
  }

  /**
   * Calcule les suppressions à venir pour un utilisateur
   */
  async calculateUpcomingDeletions(userId: string, settings: RetentionSettings): Promise<DeletionWarning[]> {
    const warnings: DeletionWarning[] = [];
    const now = new Date();

    // Simuler les données (à remplacer avec vraies requêtes Supabase)
    const userData = await this.getUserData(userId);

    // Conversations IA
    if (settings.chatRetention !== 'indefinite' && settings.autoDeleteEnabled) {
      const retentionDays = this.getRetentionDays(settings.chatRetention);
      const oldConversations = userData.conversations.filter(conv => {
        const daysSinceCreation = this.getDaysSince(conv.createdAt);
        return daysSinceCreation > retentionDays - 30; // Alertes 30j avant
      });

      if (oldConversations.length > 0) {
        warnings.push({
          type: 'chat',
          daysUntilDeletion: Math.max(1, retentionDays - this.getDaysSince(oldConversations[0].createdAt)),
          itemCount: oldConversations.length,
          deletionDate: new Date(oldConversations[0].createdAt.getTime() + (retentionDays * 24 * 60 * 60 * 1000)),
          userId,
          userEmail: userData.email
        });
      }
    }

    // Sondages et formulaires
    if (settings.pollRetention !== 'indefinite' && settings.autoDeleteEnabled) {
      const retentionDays = this.getRetentionDays(settings.pollRetention);
      const oldPolls = userData.polls.filter(poll => {
        const daysSinceCreation = this.getDaysSince(poll.createdAt);
        return daysSinceCreation > retentionDays - 30; // Alertes 30j avant
      });

      if (oldPolls.length > 0) {
        warnings.push({
          type: 'poll',
          daysUntilDeletion: Math.max(1, retentionDays - this.getDaysSince(oldPolls[0].createdAt)),
          itemCount: oldPolls.length,
          deletionDate: new Date(oldPolls[0].createdAt.getTime() + (retentionDays * 24 * 60 * 60 * 1000)),
          userId,
          userEmail: userData.email
        });
      }
    }

    return warnings;
  }

  /**
   * Envoie les alertes email pour les suppressions à venir
   */
  async sendDeletionWarnings(warnings: DeletionWarning[]): Promise<void> {
    for (const warning of warnings) {
      try {
        await this.sendEmailWarning(warning);
        console.log(`Email de suppression envoyé à ${warning.userEmail} pour ${warning.type}`);
      } catch (error) {
        console.error(`Erreur envoi email à ${warning.userEmail}:`, error);
      }
    }
  }

  /**
   * Envoie un email d'alerte de suppression
   */
  private async sendEmailWarning(warning: DeletionWarning): Promise<void> {
    // Simuler l'envoi d'email (à implémenter avec Supabase Functions ou Resend)
    const emailContent = this.generateEmailContent(warning);
    
    // TODO: Implémenter avec vraie fonction d'envoi d'email
    console.log('ENVOI EMAIL:', {
      to: warning.userEmail,
      subject: emailContent.subject,
      html: emailContent.html
    });

    // Simulation de l'envoi
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Génère le contenu de l'email d'alerte
   */
  private generateEmailContent(warning: DeletionWarning) {
    const typeLabels = {
      chat: 'conversations IA',
      poll: 'sondages et formulaires'
    };

    const subject = `⚠️ Alerte DooDates : Suppression de vos ${typeLabels[warning.type]} dans ${warning.daysUntilDeletion} jours`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .button-secondary { background: #6b7280; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Alerte de Suppression de Données</h1>
            <p>DooDates - Votre vie privée, vos règles</p>
          </div>
          
          <div class="content">
            <div class="alert">
              <h2>⚠️ Action requise : ${warning.daysUntilDeletion} jours restants</h2>
              <p><strong>${warning.itemCount}</strong> ${typeLabels[warning.type]} seront automatiquement supprimées le <strong>${warning.deletionDate.toLocaleDateString('fr-FR')}</strong>.</p>
            </div>

            <h3>📋 Que se passe-t-il ?</h3>
            <p>Selon vos paramètres de conservation, vos données arrivent en fin de période de rétention. Pour protéger votre vie privée, elles seront automatiquement supprimées.</p>

            <h3>🎯 Vos options :</h3>
            <div style="margin: 20px 0;">
              <a href="https://doodates.com/data-control" class="button">
                🔧 Gérer mes données
              </a>
              <a href="https://doodates.com/data-control?action=postpone&type=${warning.type}" class="button button-secondary">
                ⏰ Reporter de 30 jours
              </a>
            </div>

            <h3>💡 Pourquoi cette alerte ?</h3>
            <p>Chez DooDates, nous croyons en la transparence totale. Cette alerte vous permet de garder le contrôle sur vos données personnelles.</p>

            <div style="background: #e0f2fe; border: 1px solid #0284c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3>📧 Besoin d'aide ?</h3>
              <p>Contactez notre DPO (Data Protection Officer) : <strong>privacy@doodates.com</strong></p>
            </div>

            <div class="footer">
              <p>Cet email est automatique. Vous pouvez désactiver les notifications dans vos paramètres.</p>
              <p>DooDates - 2025 | <a href="https://doodates.com/privacy">Politique de confidentialité</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  }

  /**
   * Reporte une suppression de 30 jours
   */
  async postponeDeletion(userId: string, type: 'chat' | 'poll'): Promise<boolean> {
    try {
      // TODO: Implémenter avec Supabase
      console.log(`Suppression ${type} reportée de 30 jours pour l'utilisateur ${userId}`);
      
      // Simuler le report
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    } catch (error) {
      console.error('Erreur lors du report de suppression:', error);
      return false;
    }
  }

  /**
   * Planifie l'envoi des alertes email (job quotidien)
   */
  async scheduleDailyWarnings(): Promise<void> {
    console.log('🔄 Démarrage du job quotidien d\'alertes de suppression...');
    
    // TODO: Récupérer tous les utilisateurs avec suppression automatique activée
    const users = await this.getActiveUsers();
    
    for (const user of users) {
      const settings = await this.getUserSettings(user.id);
      if (settings.autoDeleteEnabled && settings.emailNotifications) {
        const warnings = await this.calculateUpcomingDeletions(user.id, settings);
        const imminentWarnings = warnings.filter(w => w.daysUntilDeletion <= 30);
        
        if (imminentWarnings.length > 0) {
          await this.sendDeletionWarnings(imminentWarnings);
        }
      }
    }
    
    console.log(`✅ Job terminé : ${users.length} utilisateurs vérifiés`);
  }

  /**
   * Utilitaires
   */
  private getRetentionDays(retention: string): number {
    const retentionMap = {
      '30-days': 30,
      '12-months': 365,
      '6-years': 365 * 6,
      'indefinite': 999999
    };
    return retentionMap[retention as keyof typeof retentionMap] || 365;
  }

  private getDaysSince(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async getUserData(userId: string) {
    // TODO: Implémenter avec Supabase
    return {
      email: 'user@example.com',
      conversations: [
        { id: '1', createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
        { id: '2', createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) }
      ],
      polls: [
        { id: '1', createdAt: new Date(Date.now() - 350 * 24 * 60 * 60 * 1000) }
      ]
    };
  }

  private async getUserSettings(userId: string): Promise<RetentionSettings> {
    // TODO: Implémenter avec Supabase
    return {
      chatRetention: '30-days',
      pollRetention: '12-months',
      autoDeleteEnabled: true,
      emailNotifications: true
    };
  }

  private async getActiveUsers() {
    // TODO: Implémenter avec Supabase
    return [
      { id: 'user1', email: 'user1@example.com' },
      { id: 'user2', email: 'user2@example.com' }
    ];
  }
}

export default DataRetentionService;
