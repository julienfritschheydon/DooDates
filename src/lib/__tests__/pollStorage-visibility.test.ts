import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  getCurrentUserId, 
  checkIfUserHasVoted, 
  getFormResponses,
  addFormResponse,
  getDeviceId,
  getRespondentId
} from '../pollStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Poll Storage Helpers - Visibility Features', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('getCurrentUserId()', () => {
    test('retourne device ID pour utilisateur non authentifié', () => {
      const userId = getCurrentUserId();
      
      expect(userId).toBeDefined();
      expect(typeof userId).toBe('string');
      expect(userId.length).toBeGreaterThan(0);
      
      // Vérifier que c'est un device ID (commence par 'device:')
      expect(userId).toMatch(/^device:/);
    });

    test('retourne authenticated user ID si fourni', () => {
      const authenticatedUserId = 'auth-user-123';
      const userId = getCurrentUserId(authenticatedUserId);
      
      expect(userId).toBe(authenticatedUserId);
      expect(userId).not.toMatch(/^device:/);
    });

    test('retourne device ID si authenticated user ID est null', () => {
      const userId = getCurrentUserId(null);
      
      expect(userId).toBeDefined();
      expect(typeof userId).toBe('string');
      expect(userId).toMatch(/^device:/);
    });

    test('retourne device ID si authenticated user ID est vide', () => {
      const userId = getCurrentUserId('');
      
      expect(userId).toBeDefined();
      expect(typeof userId).toBe('string');
      expect(userId).toMatch(/^device:/);
    });
  });

  describe('checkIfUserHasVoted()', () => {
    test('retourne false pour un poll sans réponses', () => {
      const hasVoted = checkIfUserHasVoted('poll-123');
      expect(hasVoted).toBe(false);
    });

    test('détecte un vote via deviceId stocké dans la réponse', () => {
      const pollId = 'poll-123';
      const deviceId = getDeviceId();
      
      // Ajouter une réponse avec deviceId
      addFormResponse({
        pollId,
        respondentName: 'Test User',
        items: [{ questionId: 'q1', value: 'answer1' }],
        deviceId,
      });

      const hasVoted = checkIfUserHasVoted(pollId);
      expect(hasVoted).toBe(true);
    });

    test('détecte un vote via respondentId anonyme contenant deviceId', () => {
      const pollId = 'poll-456';
      const deviceId = getDeviceId();
      
      // Simuler une réponse ancienne sans deviceId mais avec respondentId contenant deviceId
      const responses = [
        {
          id: 'response-1',
          pollId,
          respondentId: `anon:${deviceId}:123456789`,
          respondentName: 'Anonymous',
          items: [{ questionId: 'q1', value: 'answer1' }],
          created_at: new Date().toISOString(),
        }
      ];
      
      localStorageMock.setItem('doodates_form_responses', JSON.stringify(responses));

      const hasVoted = checkIfUserHasVoted(pollId);
      expect(hasVoted).toBe(true);
    });

    test('retourne false pour un vote avec un autre deviceId', () => {
      const pollId = 'poll-789';
      const otherDeviceId = 'device:other-device-123';
      
      // Ajouter une réponse avec un autre deviceId
      addFormResponse({
        pollId,
        respondentName: 'Other User',
        items: [{ questionId: 'q1', value: 'answer1' }],
        deviceId: otherDeviceId,
      });

      const hasVoted = checkIfUserHasVoted(pollId);
      expect(hasVoted).toBe(false);
    });

    test('retourne false pour un vote avec respondentId anonyme différent', () => {
      const pollId = 'poll-999';
      
      // Simuler une réponse avec un autre respondentId anonyme
      const responses = [
        {
          id: 'response-2',
          pollId,
          respondentId: 'anon:other-device:987654321',
          respondentName: 'Anonymous',
          items: [{ questionId: 'q1', value: 'answer1' }],
          created_at: new Date().toISOString(),
        }
      ];
      
      localStorageMock.setItem('doodates_form_responses', JSON.stringify(responses));

      const hasVoted = checkIfUserHasVoted(pollId);
      expect(hasVoted).toBe(false);
    });

    test('gère correctement les réponses mixtes (avec et sans deviceId)', () => {
      const pollId = 'poll-mixed';
      const deviceId = getDeviceId();
      
      // Réponse 1: avec deviceId (nouveau format)
      addFormResponse({
        pollId,
        respondentName: 'User 1',
        items: [{ questionId: 'q1', value: 'answer1' }],
        deviceId,
      });

      // Réponse 2: sans deviceId mais avec respondentId (ancien format)
      const responses = JSON.parse(localStorageMock.getItem('doodates_form_responses') || '[]');
      responses.push({
        id: 'response-old',
        pollId,
        respondentId: `anon:${deviceId}:123456789`,
        respondentName: 'Anonymous',
        items: [{ questionId: 'q2', value: 'answer2' }],
        created_at: new Date().toISOString(),
      });
      localStorageMock.setItem('doodates_form_responses', JSON.stringify(responses));

      const hasVoted = checkIfUserHasVoted(pollId);
      expect(hasVoted).toBe(true);
    });

    test('retourne false pour les réponses authentifiées d autres utilisateurs', () => {
      const pollId = 'poll-auth';
      
      // Simuler une réponse d'utilisateur authentifié
      const responses = [
        {
          id: 'response-auth',
          pollId,
          respondentId: 'user:other-auth-user',
          respondentName: 'Other Auth User',
          items: [{ questionId: 'q1', value: 'answer1' }],
          created_at: new Date().toISOString(),
        }
      ];
      
      localStorageMock.setItem('doodates_form_responses', JSON.stringify(responses));

      const hasVoted = checkIfUserHasVoted(pollId);
      expect(hasVoted).toBe(false);
    });
  });

  describe('getDeviceId()', () => {
    test('génère un device ID cohérent', () => {
      const deviceId1 = getDeviceId();
      const deviceId2 = getDeviceId();
      
      expect(deviceId1).toBe(deviceId2);
      expect(deviceId1).toMatch(/^device:/);
      expect(deviceId1.length).toBeGreaterThan(7); // 'device:' + UUID
    });

    test('persiste le device ID dans localStorage', () => {
      const deviceId = getDeviceId();
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('doodates_device_id');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'doodates_device_id',
        deviceId
      );
    });
  });

  describe('getRespondentId()', () => {
    test('génère un respondentId anonyme à partir du deviceId', () => {
      const deviceId = 'device:test-device-123';
      const response = { created_at: new Date().toISOString() };
      
      const respondentId = getRespondentId(response as any);
      
      expect(respondentId).toMatch(/^anon:device:test-device-123:/);
    });

    test('génère un respondentId authentifié si userId fourni', () => {
      const userId = 'user:auth-user-456';
      const response = { created_at: new Date().toISOString() };
      
      const respondentId = getRespondentId(response as any, userId);
      
      expect(respondentId).toBe(userId);
    });
  });
});
