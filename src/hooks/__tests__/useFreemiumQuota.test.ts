/**
 * Tests for useFreemiumQuota hook
 * DooDates - Freemium Quota Management Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useFreemiumQuota } from '../useFreemiumQuota';
import { useAuth } from '../../contexts/AuthContext';
import { useConversations } from '../useConversations';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../useConversations');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseConversations = useConversations as jest.MockedFunction<typeof useConversations>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useFreemiumQuota', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    } as any);

    mockUseConversations.mockReturnValue({
      conversations: {
        conversations: [],
      },
    } as any);

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'dev-conversations') return JSON.stringify([]);
      if (key === 'dev-polls') return JSON.stringify([]);
      return null;
    });
  });

  describe('quota limits', () => {
    it('should return guest limits for unauthenticated users', () => {
      const { result } = renderHook(() => useFreemiumQuota());

      expect(result.current.limits).toEqual({
        conversations: 3,
        polls: 5,
        storageKB: 100,
      });
    });

    it('should return premium limits for authenticated users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1' },
        isAuthenticated: true,
      } as any);

      const { result } = renderHook(() => useFreemiumQuota());

      expect(result.current.limits).toEqual({
        conversations: 50,
        polls: 100,
        storageKB: 10000,
      });
    });
  });

  describe('usage calculation', () => {
    it('should calculate conversation usage from localStorage for guests', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'dev-conversations') {
          return JSON.stringify([
            { id: 'conv-1' },
            { id: 'conv-2' },
          ]);
        }
        return null;
      });

      const { result } = renderHook(() => useFreemiumQuota());

      expect(result.current.usage.conversations).toBe(2);
    });

    it('should calculate poll usage from localStorage', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'dev-polls') {
          return JSON.stringify([
            { id: 'poll-1' },
            { id: 'poll-2' },
            { id: 'poll-3' },
          ]);
        }
        return null;
      });

      const { result } = renderHook(() => useFreemiumQuota());

      expect(result.current.usage.polls).toBe(3);
    });

    it('should calculate storage usage from localStorage', () => {
      const largeData = 'x'.repeat(1024); // 1KB of data
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'dev-conversations') return JSON.stringify([{ data: largeData }]);
        if (key === 'dev-polls') return JSON.stringify([{ data: largeData }]);
        return null;
      });

      const { result } = renderHook(() => useFreemiumQuota());

      expect(result.current.usage.storageUsed).toBeGreaterThan(0);
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useFreemiumQuota());

      expect(result.current.usage).toEqual({
        conversations: 0,
        polls: 0,
        storageKB: 0,
      });
    });
  });

  describe('permission checks', () => {
    it('should allow actions within quota limits', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'dev-conversations') return JSON.stringify([{ id: 'conv-1' }]);
        if (key === 'dev-polls') return JSON.stringify([{ id: 'poll-1' }]);
        return null;
      });

      const { result } = renderHook(() => useFreemiumQuota());

      expect(result.current.canCreateConversation).toBe(true);
      expect(result.current.canCreatePoll).toBe(true);
    });

    it('should block actions when quota limits are reached', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'dev-conversations') {
          return JSON.stringify([
            { id: 'conv-1' },
            { id: 'conv-2' },
            { id: 'conv-3' },
          ]);
        }
        if (key === 'dev-polls') {
          return JSON.stringify([
            { id: 'poll-1' },
            { id: 'poll-2' },
            { id: 'poll-3' },
            { id: 'poll-4' },
            { id: 'poll-5' },
          ]);
        }
        return null;
      });

      const { result } = renderHook(() => useFreemiumQuota());

      expect(result.current.canCreateConversation).toBe(false);
      expect(result.current.canCreatePoll).toBe(false);
    });

    it('should always allow actions for authenticated users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1' },
        isAuthenticated: true,
      } as any);

      // Set high usage that would block guests
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'dev-conversations') {
          return JSON.stringify(Array(10).fill(0).map((_, i) => ({ id: `conv-${i}` })));
        }
        if (key === 'dev-polls') {
          return JSON.stringify(Array(20).fill(0).map((_, i) => ({ id: `poll-${i}` })));
        }
        return null;
      });

      const { result } = renderHook(() => useFreemiumQuota());

      expect(result.current.canCreateConversation).toBe(true);
      expect(result.current.canCreatePoll).toBe(true);
    });
  });

  describe('quota warnings', () => {
    it('should show warnings when approaching limits', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'dev-conversations') {
          return JSON.stringify([
            { id: 'conv-1' },
            { id: 'conv-2' },
          ]);
        }
        return null;
      });

      const { result } = renderHook(() => useFreemiumQuota());

      expect(result.current.status.conversations).toBe('warning');
      expect(result.current.status.polls).toBe('normal');
    });

    it('should not show warnings for authenticated users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1' },
        profile: null,
        session: null,
        loading: false,
        error: null,
      } as any);
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'dev-conversations') {
          return JSON.stringify([
            { id: 'conv-1' },
            { id: 'conv-2' },
            { id: 'conv-3' },
          ]);
        }
        return null;
      });

      const { result } = renderHook(() => useFreemiumQuota());

      expect(result.current.status.conversations.isNearLimit).toBe(false);
    });

    it('should trigger auth incentive modal for guests', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'dev-conversations') {
          return JSON.stringify([
            { id: 'conv-1' },
            { id: 'conv-2' },
            { id: 'conv-3' },
          ]);
        }
        return null;
      });

      const mockTrigger = jest.fn();
      const { result } = renderHook(() => useFreemiumQuota());

      act(() => {
        result.current.showAuthIncentive('conversation_limit');
      });

      expect(result.current.showAuthModal).toBe(true);
      expect(result.current.authModalTrigger).toBe('conversation_limit');
    });

    it('should not trigger modal for authenticated users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1' },
        isAuthenticated: true,
      } as any);

      const mockTrigger = jest.fn();
      const { result } = renderHook(() => useFreemiumQuota());

      act(() => {
        result.current.showAuthIncentive('conversation_limit');
      });

      expect(result.current.showAuthModal).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete freemium workflow for guest user', () => {
      // Start with empty usage
      const { result, rerender } = renderHook(() => useFreemiumQuota());

      // Initial state - can create content
      expect(result.current.canCreateConversation).toBe(true);
      expect(result.current.canCreatePoll).toBe(true);
      expect(result.current.status.conversations.isNearLimit).toBe(false);

      // Simulate creating conversations approaching limit
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'dev-conversations') {
          return JSON.stringify([
            { id: 'conv-1' },
            { id: 'conv-2' },
          ]);
        }
        return null;
      });

      rerender();

      // Should show warning but still allow creation
      expect(result.current.canCreateConversation).toBe(true);
      expect(result.current.status.conversations.isNearLimit).toBe(true);

      // Simulate reaching limit
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'dev-conversations') {
          return JSON.stringify([
            { id: 'conv-1' },
            { id: 'conv-2' },
            { id: 'conv-3' },
          ]);
        }
        return null;
      });

      rerender();

      // Should block creation
      expect(result.current.status.conversations).toBe('normal');
      expect(result.current.status.polls).toBe('normal');
    });

    it('should handle user authentication upgrade', () => {
      // Start as guest with full quota
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'dev-conversations') {
          return JSON.stringify([
            { id: 'conv-1' },
            { id: 'conv-2' },
            { id: 'conv-3' },
          ]);
        }
        return null;
      });

      const { result, rerender } = renderHook(() => useFreemiumQuota());

      // Guest is blocked
      expect(result.current.canCreateConversation).toBe(false);

      // User authenticates
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1' },
        isAuthenticated: true,
      } as any);

      rerender();

      // Now can create content
      expect(result.current.canCreateConversation).toBe(true);
      expect(result.current.status.conversations.isNearLimit).toBe(false);
    });
  });
});
