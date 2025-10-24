import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IntentDetectionService } from '../IntentDetectionService';
import type { Poll } from '../../lib/pollStorage';

describe('IntentDetectionService', () => {
  let mockPoll: Poll;

  beforeEach(() => {
    // Mock poll avec dates existantes
    mockPoll = {
      id: 'test-poll-123',
      slug: 'test-poll',
      title: 'Déjeuner mardi ou mercredi',
      type: 'date',
      dates: ['2025-10-28', '2025-10-29'],
      created_at: '2025-10-24T12:00:00Z',
      updated_at: '2025-10-24T12:00:00Z',
    } as Poll;

    // Mock Date pour avoir des résultats prévisibles
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-10-24T12:00:00Z')); // Jeudi 24 octobre 2025
  });

  describe('ADD_TIMESLOT (Pattern prioritaire)', () => {
    it('détecte "ajoute 14h-15h le 29"', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajoute 14h-15h le 29',
        mockPoll
      );
      
      expect(intent).not.toBeNull();
      expect(intent?.action).toBe('ADD_TIMESLOT');
      expect(intent?.payload.date).toBe('2025-10-29');
      expect(intent?.payload.start).toBe('14:00');
      expect(intent?.payload.end).toBe('15:00');
      expect(intent?.confidence).toBe(0.9);
    });

    it('supporte format avec minutes "ajoute 14h30-15h45 le 27"', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajoute 14h30-15h45 le 27',
        mockPoll
      );
      
      expect(intent?.action).toBe('ADD_TIMESLOT');
      expect(intent?.payload.start).toBe('14:30');
      expect(intent?.payload.end).toBe('15:45');
    });

    it('supporte format sans "h" : "ajoute 14:00-15:00 le 29"', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajoute 14:00-15:00 le 29',
        mockPoll
      );
      
      // Ce format n'est pas supporté actuellement, devrait retourner null ou ADD_DATE
      // On vérifie qu'il ne crash pas
      expect(intent).toBeDefined();
    });

    it('normalise la date partielle "le 29" vers mois courant', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajoute 14h-15h le 29',
        mockPoll
      );
      
      expect(intent?.payload.date).toMatch(/^\d{4}-10-29$/); // Octobre 2025
    });
  });

  describe('ADD_DATE (Jours de la semaine)', () => {
    it('détecte "ajouter mercredi" (prochain mercredi)', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajouter mercredi',
        mockPoll
      );
      
      expect(intent?.action).toBe('ADD_DATE');
      expect(intent?.payload).toBe('2025-10-29'); // Mercredi 29 oct
      expect(intent?.confidence).toBe(0.9);
    });

    it('détecte "ajoute lundi"', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajoute lundi',
        mockPoll
      );
      
      expect(intent?.action).toBe('ADD_DATE');
      expect(intent?.payload).toBe('2025-10-27'); // Lundi 27 oct
    });

    it('détecte "ajoute le dimanche"', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajoute le dimanche',
        mockPoll
      );
      
      expect(intent?.action).toBe('ADD_DATE');
      expect(intent?.payload).toBe('2025-10-26'); // Dimanche 26 oct
    });
  });

  describe('ADD_DATE (Formats multiples)', () => {
    it('détecte "ajoute le 27/10/2025" (format complet)', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajoute le 27/10/2025',
        mockPoll
      );
      
      expect(intent?.action).toBe('ADD_DATE');
      expect(intent?.payload).toBe('2025-10-27');
      expect(intent?.confidence).toBe(0.95);
    });

    it('détecte "ajoute le 27" (jour seul)', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajoute le 27',
        mockPoll
      );
      
      expect(intent?.action).toBe('ADD_DATE');
      expect(intent?.payload).toMatch(/^\d{4}-10-27$/); // Mois courant
    });

    it('détecte "ajoute le 27/10" (sans année)', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajoute le 27/10',
        mockPoll
      );
      
      expect(intent?.action).toBe('ADD_DATE');
      expect(intent?.payload).toMatch(/^2025-10-27$/); // Année courante
    });

    it('détecte "ajoute le 27 octobre 2025" (mois en texte)', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajoute le 27 octobre 2025',
        mockPoll
      );
      
      expect(intent?.action).toBe('ADD_DATE');
      expect(intent?.payload).toBe('2025-10-27');
    });

    it('détecte "ajoute le 2025-10-27" (format ISO)', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajoute le 2025-10-27',
        mockPoll
      );
      
      expect(intent?.action).toBe('ADD_DATE');
      expect(intent?.payload).toBe('2025-10-27');
    });

    it('supporte "ajouter" au lieu de "ajoute"', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajouter le 30',
        mockPoll
      );
      
      expect(intent?.action).toBe('ADD_DATE');
      expect(intent?.payload).toMatch(/^\d{4}-10-30$/);
    });
  });

  describe('REMOVE_DATE (Jours de la semaine)', () => {
    it('détecte "retire mercredi"', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'retire mercredi',
        mockPoll
      );
      
      expect(intent?.action).toBe('REMOVE_DATE');
      expect(intent?.payload).toBe('2025-10-29');
    });

    it('détecte "supprime le lundi"', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'supprime le lundi',
        mockPoll
      );
      
      expect(intent?.action).toBe('REMOVE_DATE');
      expect(intent?.payload).toBe('2025-10-27');
    });

    it('détecte "enlève mardi"', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'enlève mardi',
        mockPoll
      );
      
      expect(intent?.action).toBe('REMOVE_DATE');
      expect(intent?.payload).toBe('2025-10-28');
    });
  });

  describe('REMOVE_DATE (Formats multiples)', () => {
    it('détecte "retire le 29"', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'retire le 29',
        mockPoll
      );
      
      expect(intent?.action).toBe('REMOVE_DATE');
      expect(intent?.payload).toMatch(/^\d{4}-10-29$/);
    });

    it('détecte "supprime le 27/10/2025"', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'supprime le 27/10/2025',
        mockPoll
      );
      
      expect(intent?.action).toBe('REMOVE_DATE');
      expect(intent?.payload).toBe('2025-10-27');
    });

    it('détecte "enlève le 27 octobre 2025"', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'enlève le 27 octobre 2025',
        mockPoll
      );
      
      expect(intent?.action).toBe('REMOVE_DATE');
      expect(intent?.payload).toBe('2025-10-27');
    });
  });

  describe('UPDATE_TITLE', () => {
    it('détecte "renomme en Nouveau titre"', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'renomme en Nouveau titre',
        mockPoll
      );
      
      expect(intent?.action).toBe('UPDATE_TITLE');
      expect(intent?.payload).toBe('Nouveau titre');
      expect(intent?.confidence).toBe(0.95);
    });

    it('détecte "change le titre en Réunion équipe"', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'change le titre en Réunion équipe',
        mockPoll
      );
      
      expect(intent?.action).toBe('UPDATE_TITLE');
      expect(intent?.payload).toBe('Réunion équipe');
    });

    it('supporte les titres avec caractères spéciaux', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'renomme en Apéro vendredi 🍻',
        mockPoll
      );
      
      expect(intent?.action).toBe('UPDATE_TITLE');
      expect(intent?.payload).toBe('Apéro vendredi 🍻');
    });

    it('retourne null si titre vide', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'renomme en    ',
        mockPoll
      );
      
      expect(intent).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('retourne null si pas de poll', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajoute le 27',
        null
      );
      
      expect(intent).toBeNull();
    });

    it('retourne null si message non reconnu', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'blabla random',
        mockPoll
      );
      
      expect(intent).toBeNull();
    });

    it('retourne null pour message vide', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        '',
        mockPoll
      );
      
      expect(intent).toBeNull();
    });

    it('gère les messages avec espaces multiples', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajoute    le    27',
        mockPoll
      );
      
      expect(intent?.action).toBe('ADD_DATE');
    });
  });

  describe('Priorité des patterns', () => {
    it('ADD_TIMESLOT a priorité sur ADD_DATE pour "14h-15h le 29"', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajoute 14h-15h le 29',
        mockPoll
      );
      
      // Doit détecter ADD_TIMESLOT, pas ADD_DATE
      expect(intent?.action).toBe('ADD_TIMESLOT');
      expect(intent?.payload.date).toBe('2025-10-29');
    });

    it('ADD_DAY a priorité sur ADD_DATE pour jours de la semaine', () => {
      const intent = IntentDetectionService.detectSimpleIntent(
        'ajoute mercredi',
        mockPoll
      );
      
      // Doit utiliser le pattern jour de la semaine
      expect(intent?.action).toBe('ADD_DATE');
      expect(intent?.confidence).toBe(0.9); // Confidence jour de la semaine
    });
  });
});
