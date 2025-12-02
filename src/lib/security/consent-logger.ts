/**
 * Consent Logger Service
 * Logging RGPD des consentements et actions utilisateur
 * Conforme aux exigences GDPR/CCPA
 */

import { logger } from '../logger';
import { hashIP } from './ip-hash';

export interface ConsentLogEntry {
  id?: string;
  timestamp: string;
  action: 'consent_given' | 'consent_withdrawn' | 'api_request' | 'data_access' | 'data_deletion' | 'cookie_consent';
  endpoint?: string;
  method?: string;
  userId?: string;
  ipHash?: string;
  userAgent?: string;
  consentType?: 'essential' | 'analytics' | 'marketing' | 'functional';
  consentValue?: boolean;
  metadata?: Record<string, any>;
  retentionDays?: number;
}

export interface ConsentStorage {
  logs: ConsentLogEntry[];
  maxSize: number;
  retentionDays: number;
}

class ConsentLoggerService {
  private storage: ConsentStorage = {
    logs: [],
    maxSize: 10000, // 10k logs max
    retentionDays: 365, // 1 an de rétention
  };

  /**
   * Enregistre une action de consentement
   */
  logConsent(entry: Omit<ConsentLogEntry, 'id' | 'timestamp'>): void {
    const logEntry: ConsentLogEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    try {
      // Validation
      this.validateLogEntry(logEntry);

      // Ajouter au storage
      this.storage.logs.push(logEntry);

      // Nettoyer si nécessaire
      this.cleanupStorage();

      // Logger système
      logger.info('Consent log recorded', 'gdpr', {
        action: logEntry.action,
        userId: logEntry.userId,
        endpoint: logEntry.endpoint,
        ipHash: logEntry.ipHash?.substring(0, 16) + '...',
      });

    } catch (error) {
      logger.error('Failed to log consent', 'gdpr', { 
        entry: logEntry, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Enregistre un consentement de cookies
   */
  logCookieConsent(
    userId: string, 
    ip: string, 
    userAgent: string, 
    consents: Record<string, boolean>
  ): void {
    Object.entries(consents).forEach(([type, value]) => {
      this.logConsent({
        action: 'cookie_consent',
        userId,
        ipHash: hashIP(ip),
        userAgent,
        consentType: type as any,
        consentValue: value,
        metadata: { allConsents: consents },
      });
    });
  }

  /**
   * Enregistre une demande d'accès aux données (GDPR Article 15)
   */
  logDataAccessRequest(userId: string, ip: string, userAgent: string): void {
    this.logConsent({
      action: 'data_access',
      userId,
      ipHash: hashIP(ip),
      userAgent,
      metadata: { requestType: 'gdpr_access_request' },
    });
  }

  /**
   * Enregistre une demande de suppression (GDPR Article 17)
   */
  logDataDeletionRequest(userId: string, ip: string, userAgent: string): void {
    this.logConsent({
      action: 'data_deletion',
      userId,
      ipHash: hashIP(ip),
      userAgent,
      metadata: { requestType: 'gdpr_deletion_request' },
    });
  }

  /**
   * Enregistre un retrait de consentement
   */
  logConsentWithdrawal(
    userId: string, 
    consentType: string, 
    ip: string, 
    userAgent: string
  ): void {
    this.logConsent({
      action: 'consent_withdrawn',
      userId,
      ipHash: hashIP(ip),
      userAgent,
      consentType: consentType as any,
      consentValue: false,
      metadata: { withdrawalReason: 'user_request' },
    });
  }

  /**
   * Récupère les logs d'un utilisateur
   */
  getUserLogs(userId: string, limit: number = 100): ConsentLogEntry[] {
    return this.storage.logs
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Récupère les logs par action
   */
  getLogsByAction(action: ConsentLogEntry['action'], limit: number = 100): ConsentLogEntry[] {
    return this.storage.logs
      .filter(log => log.action === action)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Exporte les données utilisateur (GDPR)
   */
  exportUserData(userId: string): Record<string, any> {
    const userLogs = this.getUserLogs(userId);
    
    return {
      userId,
      exportDate: new Date().toISOString(),
      consentLogs: userLogs.map(log => ({
        timestamp: log.timestamp,
        action: log.action,
        consentType: log.consentType,
        consentValue: log.consentValue,
        metadata: log.metadata,
      })),
      summary: {
        totalLogs: userLogs.length,
        consentGiven: userLogs.filter(log => log.action === 'consent_given').length,
        consentWithdrawn: userLogs.filter(log => log.action === 'consent_withdrawn').length,
        dataAccessRequests: userLogs.filter(log => log.action === 'data_access').length,
        dataDeletionRequests: userLogs.filter(log => log.action === 'data_deletion').length,
      },
    };
  }

  /**
   * Supprime les données utilisateur (GDPR Right to be Forgotten)
   */
  deleteUserData(userId: string): { deletedCount: number; success: boolean } {
    const initialCount = this.storage.logs.length;
    this.storage.logs = this.storage.logs.filter(log => log.userId !== userId);
    const deletedCount = initialCount - this.storage.logs.length;

    logger.info('User data deleted', 'gdpr', {
      userId,
      deletedCount,
      success: true,
    });

    return { deletedCount, success: true };
  }

  /**
   * Statistiques de consentement
   */
  getConsentStats(): Record<string, any> {
    const totalLogs = this.storage.logs.length;
    const actionStats = this.storage.logs.reduce((stats, log) => {
      stats[log.action] = (stats[log.action] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    const consentTypeStats = this.storage.logs.reduce((stats, log) => {
      if (log.consentType) {
        stats[log.consentType] = (stats[log.consentType] || 0) + 1;
      }
      return stats;
    }, {} as Record<string, number>);

    return {
      totalLogs,
      actionStats,
      consentTypeStats,
      storageSize: this.storage.logs.length,
      maxSize: this.storage.maxSize,
      utilizationRate: (this.storage.logs.length / this.storage.maxSize * 100).toFixed(2) + '%',
    };
  }

  /**
   * Génère un ID unique pour le log
   */
  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Valide une entrée de log
   */
  private validateLogEntry(entry: ConsentLogEntry): void {
    if (!entry.action) {
      throw new Error('Action is required');
    }

    if (!entry.timestamp) {
      throw new Error('Timestamp is required');
    }

    const validActions = ['consent_given', 'consent_withdrawn', 'api_request', 'data_access', 'data_deletion', 'cookie_consent'];
    if (!validActions.includes(entry.action)) {
      throw new Error(`Invalid action: ${entry.action}`);
    }

    if (entry.consentType) {
      const validTypes = ['essential', 'analytics', 'marketing', 'functional'];
      if (!validTypes.includes(entry.consentType)) {
        throw new Error(`Invalid consent type: ${entry.consentType}`);
      }
    }
  }

  /**
   * Nettoie le storage (logs anciens et taille max)
   */
  private cleanupStorage(): void {
    const now = Date.now();
    const retentionMs = this.storage.retentionDays * 24 * 60 * 60 * 1000;

    // Supprimer les logs anciens
    this.storage.logs = this.storage.logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      return now - logTime <= retentionMs;
    });

    // Si encore trop de logs, supprimer les plus anciens
    if (this.storage.logs.length > this.storage.maxSize) {
      this.storage.logs = this.storage.logs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, this.storage.maxSize);
    }
  }

  /**
   * Réinitialise le storage (pour tests)
   */
  reset(): void {
    this.storage.logs = [];
  }

  /**
   * Exporte tous les logs (admin)
   */
  exportAllLogs(): ConsentLogEntry[] {
    return [...this.storage.logs];
  }
}

// Instance singleton
export const consentLogger = new ConsentLoggerService();

// Fonction helper pour compatibilité
export function logConsent(entry: Omit<ConsentLogEntry, 'id' | 'timestamp'>): void {
  consentLogger.logConsent(entry);
}
