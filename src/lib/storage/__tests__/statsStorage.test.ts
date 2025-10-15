/**
 * Tests for statsStorage module
 * DooDates - Lifetime quota management tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock error handling
vi.mock('../../error-handling', () => ({
  logError: vi.fn(),
  ErrorFactory: {
    storage: vi.fn((en, fr) => new Error(en))
  }
}));

// Mock storageUtils
vi.mock('../storageUtils', () => ({
  hasWindow: vi.fn(() => true)
}));

import {
  getLifetimeCount,
  incrementLifetimeCount,
  resetLifetimeCount,
  getAllLifetimeStats,
  canCreate,
  getQuotaUsage,
  type ContentType
} from '../statsStorage';

import { hasWindow } from '../storageUtils';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock window object
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

const mockHasWindow = vi.mocked(hasWindow);

describe('statsStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    mockHasWindow.mockReturnValue(true);
  });

  describe('getLifetimeCount', () => {
    it('should return 0 for new content type', () => {
      const count = getLifetimeCount('conversations');
      expect(count).toBe(0);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('doodates.lifetime.stats');
    });

    it('should return existing count from localStorage', () => {
      const mockStats = {
        conversations: { totalCreated: 5 },
        polls: { totalCreated: 3 }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStats));

      const conversationCount = getLifetimeCount('conversations');
      const pollCount = getLifetimeCount('polls');

      expect(conversationCount).toBe(5);
      expect(pollCount).toBe(3);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const count = getLifetimeCount('conversations');
      expect(count).toBe(0);
    });

    it('should return 0 when window is not available', () => {
      mockHasWindow.mockReturnValue(false);

      const count = getLifetimeCount('conversations');
      expect(count).toBe(0);
    });
  });

  describe('incrementLifetimeCount', () => {
    it('should increment count for new content type', () => {
      incrementLifetimeCount('conversations');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'doodates.lifetime.stats',
        JSON.stringify({
          conversations: { totalCreated: 1 },
          polls: { totalCreated: 0 }
        })
      );
    });

    it('should increment existing count', () => {
      const mockStats = {
        conversations: { totalCreated: 5 },
        polls: { totalCreated: 3 }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStats));

      incrementLifetimeCount('conversations');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'doodates.lifetime.stats',
        JSON.stringify({
          conversations: { totalCreated: 6 },
          polls: { totalCreated: 3 }
        })
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => incrementLifetimeCount('conversations')).not.toThrow();
    });

    it('should do nothing when window is not available', () => {
      mockHasWindow.mockReturnValue(false);

      incrementLifetimeCount('conversations');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('resetLifetimeCount', () => {
    it('should reset count to 0', () => {
      const mockStats = {
        conversations: { totalCreated: 10 },
        polls: { totalCreated: 5 }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStats));

      resetLifetimeCount('conversations');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'doodates.lifetime.stats',
        JSON.stringify({
          conversations: { totalCreated: 0 },
          polls: { totalCreated: 5 }
        })
      );
    });

    it('should handle non-existent stats gracefully', () => {
      resetLifetimeCount('conversations');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'doodates.lifetime.stats',
        JSON.stringify({
          conversations: { totalCreated: 0 },
          polls: { totalCreated: 0 }
        })
      );
    });
  });

  describe('getAllLifetimeStats', () => {
    it('should return default stats when no data exists', () => {
      const stats = getAllLifetimeStats();

      expect(stats).toEqual({
        conversations: { totalCreated: 0 },
        polls: { totalCreated: 0 }
      });
    });

    it('should return existing stats from localStorage', () => {
      const mockStats = {
        conversations: { totalCreated: 15 },
        polls: { totalCreated: 8 }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStats));

      const stats = getAllLifetimeStats();
      expect(stats).toEqual(mockStats);
    });

    it('should return default stats on JSON parse error', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const stats = getAllLifetimeStats();
      expect(stats).toEqual({
        conversations: { totalCreated: 0 },
        polls: { totalCreated: 0 }
      });
    });
  });

  describe('canCreate', () => {
    it('should return true when under limit', () => {
      const mockStats = {
        conversations: { totalCreated: 5 },
        polls: { totalCreated: 3 }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStats));

      expect(canCreate('conversations', 10)).toBe(true);
      expect(canCreate('polls', 5)).toBe(true);
    });

    it('should return false when at limit', () => {
      const mockStats = {
        conversations: { totalCreated: 10 },
        polls: { totalCreated: 5 }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStats));

      expect(canCreate('conversations', 10)).toBe(false);
      expect(canCreate('polls', 5)).toBe(false);
    });

    it('should return false when over limit', () => {
      const mockStats = {
        conversations: { totalCreated: 15 },
        polls: { totalCreated: 8 }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStats));

      expect(canCreate('conversations', 10)).toBe(false);
      expect(canCreate('polls', 5)).toBe(false);
    });

    it('should return true for new content type', () => {
      expect(canCreate('conversations', 10)).toBe(true);
      expect(canCreate('polls', 5)).toBe(true);
    });
  });

  describe('getQuotaUsage', () => {
    it('should calculate usage correctly when under limit', () => {
      const mockStats = {
        conversations: { totalCreated: 3 },
        polls: { totalCreated: 2 }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStats));

      const conversationUsage = getQuotaUsage('conversations', 10);
      expect(conversationUsage).toEqual({
        totalCreated: 3,
        limit: 10,
        remaining: 7,
        isAtLimit: false,
        usagePercentage: 30
      });

      const pollUsage = getQuotaUsage('polls', 5);
      expect(pollUsage).toEqual({
        totalCreated: 2,
        limit: 5,
        remaining: 3,
        isAtLimit: false,
        usagePercentage: 40
      });
    });

    it('should handle at-limit scenario', () => {
      const mockStats = {
        conversations: { totalCreated: 10 },
        polls: { totalCreated: 5 }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStats));

      const usage = getQuotaUsage('conversations', 10);
      expect(usage).toEqual({
        totalCreated: 10,
        limit: 10,
        remaining: 0,
        isAtLimit: true,
        usagePercentage: 100
      });
    });

    it('should handle over-limit scenario', () => {
      const mockStats = {
        conversations: { totalCreated: 15 },
        polls: { totalCreated: 8 }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStats));

      const usage = getQuotaUsage('conversations', 10);
      expect(usage).toEqual({
        totalCreated: 15,
        limit: 10,
        remaining: 0,
        isAtLimit: true,
        usagePercentage: 100 // Capped at 100%
      });
    });

    it('should handle zero usage', () => {
      const usage = getQuotaUsage('conversations', 10);
      expect(usage).toEqual({
        totalCreated: 0,
        limit: 10,
        remaining: 10,
        isAtLimit: false,
        usagePercentage: 0
      });
    });
  });

  describe('integration tests', () => {
    beforeEach(() => {
      // Ensure completely clean state for integration tests
      localStorageMock.getItem.mockReturnValue(null);
      localStorageMock.setItem.mockClear();
    });

    it('should maintain quota integrity through multiple operations', () => {
      // Start with clean state
      expect(getLifetimeCount('conversations')).toBe(0);
      expect(canCreate('conversations', 3)).toBe(true);

      // Create first conversation
      incrementLifetimeCount('conversations');
      
      // Mock the updated localStorage state
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        conversations: { totalCreated: 1 },
        polls: { totalCreated: 0 }
      }));
      
      expect(getLifetimeCount('conversations')).toBe(1);
      expect(canCreate('conversations', 3)).toBe(true);

      // Create second conversation
      incrementLifetimeCount('conversations');
      
      // Mock the updated localStorage state
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        conversations: { totalCreated: 2 },
        polls: { totalCreated: 0 }
      }));
      
      expect(getLifetimeCount('conversations')).toBe(2);
      expect(canCreate('conversations', 3)).toBe(true);

      // Create third conversation (at limit)
      incrementLifetimeCount('conversations');
      
      // Mock the updated localStorage state
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        conversations: { totalCreated: 3 },
        polls: { totalCreated: 0 }
      }));
      
      expect(getLifetimeCount('conversations')).toBe(3);
      expect(canCreate('conversations', 3)).toBe(false);

      // Verify quota usage
      const usage = getQuotaUsage('conversations', 3);
      expect(usage.isAtLimit).toBe(true);
      expect(usage.remaining).toBe(0);
    });

    it('should handle mixed content types independently', () => {
      // Start with clean state
      localStorageMock.getItem.mockReturnValue(null);
      
      // Create conversations
      incrementLifetimeCount('conversations');
      incrementLifetimeCount('conversations');

      // Create polls  
      incrementLifetimeCount('polls');

      // Mock final state after all operations
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        conversations: { totalCreated: 2 },
        polls: { totalCreated: 1 }
      }));

      expect(getLifetimeCount('conversations')).toBe(2);
      expect(getLifetimeCount('polls')).toBe(1);

      expect(canCreate('conversations', 5)).toBe(true);
      expect(canCreate('polls', 5)).toBe(true);

      // Reset only conversations
      resetLifetimeCount('conversations');
      
      // Mock state after reset
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        conversations: { totalCreated: 0 },
        polls: { totalCreated: 1 }
      }));
      
      expect(getLifetimeCount('conversations')).toBe(0);
      expect(getLifetimeCount('polls')).toBe(1); // Should remain unchanged
    });

    it('should persist data across function calls', () => {
      // Simulate page reload by clearing mocks but keeping localStorage data
      const persistedData = JSON.stringify({
        conversations: { totalCreated: 7 },
        polls: { totalCreated: 4 }
      });

      localStorageMock.getItem.mockReturnValue(persistedData);

      expect(getLifetimeCount('conversations')).toBe(7);
      expect(getLifetimeCount('polls')).toBe(4);
      expect(canCreate('conversations', 10)).toBe(true);
      expect(canCreate('polls', 3)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle negative limits gracefully', () => {
      expect(canCreate('conversations', -1)).toBe(false);
      expect(canCreate('conversations', 0)).toBe(false);
    });

    it('should handle very large numbers', () => {
      const mockStats = {
        conversations: { totalCreated: Number.MAX_SAFE_INTEGER },
        polls: { totalCreated: 0 }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStats));

      expect(getLifetimeCount('conversations')).toBe(Number.MAX_SAFE_INTEGER);
      expect(canCreate('conversations', Number.MAX_SAFE_INTEGER)).toBe(false);
    });

    it('should handle malformed localStorage data structures', () => {
      // Missing polls section
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        conversations: { totalCreated: 5 }
      }));

      expect(getLifetimeCount('polls')).toBe(0);
      expect(canCreate('polls', 10)).toBe(true);
    });
  });
});
