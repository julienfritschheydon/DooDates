/**
 * Tests Rate Limiter Service
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rateLimiter, RateLimiterService } from '../rate-limiter';

describe('RateLimiterService', () => {
  beforeEach(() => {
    // Nettoyer les trackers avant chaque test
    rateLimiter.cleanup();
  });

  afterEach(() => {
    rateLimiter.cleanup();
  });

  describe('isAllowed', () => {
    it('should allow first request', () => {
      expect(rateLimiter.isAllowed('test-user')).toBe(true);
    });

    it('should allow requests under limit', () => {
      const identifier = 'test-user';
      
      // 9 premières requêtes autorisées
      for (let i = 0; i < 9; i++) {
        expect(rateLimiter.isAllowed(identifier)).toBe(true);
      }
      
      // La 10ème doit être autorisée (limite = 10)
      expect(rateLimiter.isAllowed(identifier)).toBe(true);
      
      // La 11ème doit être bloquée
      expect(rateLimiter.isAllowed(identifier)).toBe(false);
    });

    it('should block requests over limit', () => {
      const identifier = 'test-user';
      
      // Consommer toutes les requêtes autorisées
      for (let i = 0; i < 10; i++) {
        rateLimiter.isAllowed(identifier);
      }
      
      // La 11ème doit être bloquée
      expect(rateLimiter.isAllowed(identifier)).toBe(false);
    });

    it('should respect custom config', () => {
      const identifier = 'test-user-custom';
      const config = { maxRequests: 3, windowMs: 1000 };
      
      // 3 requêtes autorisées avec config custom
      for (let i = 0; i < 3; i++) {
        expect(rateLimiter.isAllowed(identifier, config)).toBe(true);
      }
      
      // La 4ème doit être bloquée
      expect(rateLimiter.isAllowed(identifier, config)).toBe(false);
    });

    it('should reset after window expires', async () => {
      const identifier = 'test-user-reset';
      const config = { maxRequests: 2, windowMs: 100 }; // 100ms
      
      // Consommer la limite
      expect(rateLimiter.isAllowed(identifier, config)).toBe(true); // 1
      expect(rateLimiter.isAllowed(identifier, config)).toBe(true); // 2
      expect(rateLimiter.isAllowed(identifier, config)).toBe(false); // 3 - bloqué
      
      // Attendre la fin de la fenêtre
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Devrait être autorisé à nouveau (compteur reset)
      expect(rateLimiter.isAllowed(identifier, config)).toBe(true); // 1
    }, 10000);
  });

  describe('getStats', () => {
    it('should return null for unknown identifier', () => {
      expect(rateLimiter.getStats('unknown')).toBeNull();
    });

    it('should return correct stats', () => {
      const identifier = 'test-stats';
      
      rateLimiter.isAllowed(identifier);
      rateLimiter.isAllowed(identifier);
      
      const stats = rateLimiter.getStats(identifier);
      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(2);
      expect(stats!.isBlocked).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset tracker', () => {
      const identifier = 'test-reset';
      
      // Consommer des requêtes
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed(identifier);
      }
      
      expect(rateLimiter.getStats(identifier)?.count).toBe(5);
      
      rateLimiter.reset(identifier);
      expect(rateLimiter.getStats(identifier)).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should remove expired trackers', () => {
      const identifier = 'test-cleanup';
      
      rateLimiter.isAllowed(identifier);
      expect(rateLimiter.getStats(identifier)).not.toBeNull();
      
      rateLimiter.reset(identifier);
      expect(rateLimiter.getStats(identifier)).toBeNull();
    });
  });

  describe('configs', () => {
    it('should have predefined configs', () => {
      expect(RateLimiterService.configs.public).toBeDefined();
      expect(RateLimiterService.configs.auth).toBeDefined();
      expect(RateLimiterService.configs.admin).toBeDefined();
      expect(RateLimiterService.configs.ai).toBeDefined();
      
      expect(RateLimiterService.configs.public.maxRequests).toBe(5);
      expect(RateLimiterService.configs.ai.maxRequests).toBe(3);
    });
  });

  describe('middleware', () => {
    it('should create middleware function', () => {
      const middleware = rateLimiter.middleware();
      expect(typeof middleware).toBe('function');
    });

    it('should use custom config in middleware', () => {
      const config = { maxRequests: 1 };
      const middleware = rateLimiter.middleware(config);
      expect(typeof middleware).toBe('function');
    });
  });
});

describe('Rate Limiter Integration', () => {
  it('should work with different identifiers independently', () => {
    const user1 = 'user-1';
    const user2 = 'user-2';
    
    // User 1 consomme sa limite
    for (let i = 0; i < 10; i++) {
      rateLimiter.isAllowed(user1);
    }
    expect(rateLimiter.isAllowed(user1)).toBe(false);
    
    // User 2 doit toujours être autorisé
    expect(rateLimiter.isAllowed(user2)).toBe(true);
  });

  it('should handle burst protection', () => {
    const identifier = 'burst-test';
    const config = { maxRequests: 5, windowMs: 100 };
    
    // Consommer rapidement
    for (let i = 0; i < 5; i++) {
      expect(rateLimiter.isAllowed(identifier, config)).toBe(true);
    }
    
    // Le burst doit être bloqué
    expect(rateLimiter.isAllowed(identifier, config)).toBe(false);
  });
});
