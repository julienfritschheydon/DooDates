import { Poll } from '../types/poll';
import { FormPoll } from '../types/form.ts';
import { Conversation } from '../types/conversation';
import * as pollStorage from '../lib/pollStorage';
import * as formPollStorage from '../lib/formPollStorage.ts';
import { conversationStorage } from '../lib/conversationStorage.ts';
import { logger } from '../lib/logger';

type EntityType = 'poll' | 'form' | 'conversation';
type Entity = Poll | FormPoll | Conversation;

/**
 * Service centralisé pour la gestion des titres dans l'application
 * Fournit des méthodes pour générer et mettre à jour les titres de manière cohérente
 */
class TitleService {
  /**
   * Génère un titre à partir d'un contenu de message
   * @param content Le contenu à partir duquel générer le titre
   * @returns Le titre généré ou une valeur par défaut
   */
  static generateTitle(content: string): string {
    if (!content) return 'Sans titre';
    
    // Prend la première ligne non vide comme titre
    const firstLine = content.split('\n').find(line => line.trim().length > 0);
    return firstLine?.trim() || 'Sans titre';
  }

  /**
   * Met à jour le titre d'une entité de manière atomique
   * @param entityType Le type d'entité à mettre à jour
   * @param entityId L'identifiant de l'entité
   * @param title Le nouveau titre
   * @returns Une promesse résolue lorsque la mise à jour est terminée
   */
  static async updateEntityTitle(
    entityType: EntityType,
    entityId: string,
    title: string
  ): Promise<void> {
    if (!entityId || !title) return;

    try {
      switch (entityType) {
        case 'poll': {
          const poll = pollStorage.getPollBySlugOrId(entityId);
          if (poll) {
            const polls = pollStorage.getPolls();
            const updatedPolls = polls.map(p => 
              p.id === poll.id ? { ...p, title } : p
            );
            pollStorage.savePolls(updatedPolls);
          }
          break;
        }
        case 'form':
          formPollStorage.formPollStorage.updateFormPoll(entityId, { title });
          break;
        case 'conversation':
          conversationStorage.updateConversation(entityId, { title });
          break;
        default:
          console.warn(`Type d'entité non géré: ${entityType}`);
      }
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du titre pour ${entityType} ${entityId}`, 'general', { entityType, entityId, error });
      throw error;
    }
  }

  /**
   * Récupère le titre d'une entité
   * @param entity L'entité dont on veut le titre
   * @returns Le titre de l'entité ou une valeur par défaut
   */
  static getEntityTitle(entity: Entity | null | undefined): string {
    if (!entity) return 'Sans titre';
    return entity.title || 'Sans titre';
  }

  /**
   * Vérifie si un titre est le titre par défaut
   * @param title Le titre à vérifier
   * @returns true si c'est un titre par défaut, false sinon
   */
  static isDefaultTitle(title: string): boolean {
    return !title || ['Nouvelle conversation', 'Sans titre'].includes(title);
  }
}

export { TitleService };
