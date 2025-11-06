import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BetaKeyService, isValidBetaKeyFormat, formatBetaKey } from '../BetaKeyService';
import type { BetaKey, RedemptionResult } from '../BetaKeyService';

// Mock du module supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Mock du logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock des error handlers
vi.mock('@/lib/error-handling', () => ({
  ErrorFactory: {
    storage: (msg: string, userMsg: string) => new Error(userMsg),
    validation: (msg: string, userMsg: string) => new Error(userMsg),
  },
  logError: vi.fn(),
}));

describe('BetaKeyService', () => {
  const mockAccessToken = 'mock-access-token-12345';
  const mockUserId = 'test-user-id';
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configuration des variables d'environnement pour les tests
    vi.stubGlobal('import.meta', {
      env: {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('redeemKey', () => {
    it('should redeem a valid beta key successfully', async () => {
      // Mock de la réponse fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          tier: 'beta',
          credits: 1000,
          expires_at: '2025-12-31T23:59:59Z',
        }),
      });

      const result = await BetaKeyService.redeemKey(
        mockUserId,
        'BETA-TEST-XXXX-YYYY',
        mockAccessToken
      );

      expect(result.success).toBe(true);
      expect(result.tier).toBe('beta');
      expect(result.credits).toBe(1000);
      expect(fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/rest/v1/rpc/redeem_beta_key',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'apikey': 'test-anon-key',
            'Authorization': `Bearer ${mockAccessToken}`,
          }),
          body: JSON.stringify({
            p_user_id: mockUserId,
            p_code: 'BETA-TEST-XXXX-YYYY',
          }),
        })
      );
    });

    it('should reject an invalid beta key', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Clé bêta invalide ou déjà utilisée',
      });

      const result = await BetaKeyService.redeemKey(
        mockUserId,
        'INVALID-KEY',
        mockAccessToken
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject an already used beta key', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        text: async () => 'Clé déjà utilisée',
      });

      const result = await BetaKeyService.redeemKey(
        mockUserId,
        'BETA-USED-XXXX-YYYY',
        mockAccessToken
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erreur HTTP 409');
    });

    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await BetaKeyService.redeemKey(
        mockUserId,
        'BETA-TEST-XXXX-YYYY',
        mockAccessToken
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should normalize beta key codes (uppercase and trim)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, tier: 'beta', credits: 1000 }),
      });

      await BetaKeyService.redeemKey(
        mockUserId,
        '  beta-test-xxxx-yyyy  ',
        mockAccessToken
      );

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('BETA-TEST-XXXX-YYYY'),
        })
      );
    });

    it('should return error when no access token is available', async () => {
      const result = await BetaKeyService.redeemKey(
        mockUserId,
        'BETA-TEST-XXXX-YYYY'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('session');
    });

    it('should handle 401 unauthorized error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const result = await BetaKeyService.redeemKey(
        mockUserId,
        'BETA-TEST-XXXX-YYYY',
        mockAccessToken
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Non autorisé');
    });

    it('should handle 403 forbidden error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      });

      const result = await BetaKeyService.redeemKey(
        mockUserId,
        'BETA-TEST-XXXX-YYYY',
        mockAccessToken
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Accès refusé');
    });

    it('should handle 404 not found error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      const result = await BetaKeyService.redeemKey(
        mockUserId,
        'BETA-TEST-XXXX-YYYY',
        mockAccessToken
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Fonction RPC introuvable');
    });
  });

  describe('generateKeys', () => {
    it('should generate beta keys successfully', async () => {
      const mockKeys = [
        { code: 'BETA-1234-5678-9012', expires_at: '2025-12-31T23:59:59Z' },
        { code: 'BETA-ABCD-EFGH-IJKL', expires_at: '2025-12-31T23:59:59Z' },
      ];

      // Mock de la session
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: mockAccessToken } as any },
        error: null,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockKeys,
      });

      const result = await BetaKeyService.generateKeys(2, 'Test batch', 3);

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('BETA-1234-5678-9012');
      expect(fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/rest/v1/rpc/generate_beta_key',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            p_count: 2,
            p_notes: 'Test batch',
            p_duration_months: 3,
          }),
        })
      );
    });

    it('should throw error when no session is available', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(
        BetaKeyService.generateKeys(1)
      ).rejects.toThrow('Aucune session active');
    });

    it('should handle empty response from server', async () => {
      const { supabase } = await import('@/lib/supabase');
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: mockAccessToken } as any },
        error: null,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await expect(
        BetaKeyService.generateKeys(1)
      ).rejects.toThrow();
    });
  });

  describe('exportToCSV', () => {
    it('should export beta keys to CSV format correctly', () => {
      const mockKeys: BetaKey[] = [
        {
          id: '1',
          code: 'BETA-1234-5678-9012',
          status: 'used',
          credits_monthly: 1000,
          max_polls: 50,
          duration_months: 3,
          assigned_to: 'user@example.com',
          redeemed_at: '2025-11-01T10:00:00Z',
          expires_at: '2026-02-01T10:00:00Z',
          created_by: 'admin@example.com',
          created_at: '2025-10-01T10:00:00Z',
          notes: 'Test user',
          last_feedback_at: null,
          bugs_reported: 5,
          feedback_score: 4,
        },
        {
          id: '2',
          code: 'BETA-ABCD-EFGH-IJKL',
          status: 'active',
          credits_monthly: 1000,
          max_polls: 50,
          duration_months: 3,
          assigned_to: null,
          redeemed_at: null,
          expires_at: '2026-02-01T10:00:00Z',
          created_by: 'admin@example.com',
          created_at: '2025-10-01T10:00:00Z',
          notes: null,
          last_feedback_at: null,
          bugs_reported: 0,
          feedback_score: null,
        },
      ];

      const csv = BetaKeyService.exportToCSV(mockKeys);

      expect(csv).toContain('Code,Status,Utilisateur');
      expect(csv).toContain('BETA-1234-5678-9012');
      expect(csv).toContain('BETA-ABCD-EFGH-IJKL');
      expect(csv).toContain('user@example.com');
      expect(csv).toContain('Non assignée');
      expect(csv).toContain('"5"');
      expect(csv).toContain('"4"');
      expect(csv).toContain('N/A');
    });

    it('should handle empty keys array', () => {
      const csv = BetaKeyService.exportToCSV([]);

      expect(csv).toContain('Code,Status,Utilisateur');
      const lines = csv.split('\n');
      expect(lines.length).toBe(1); // Only headers
    });
  });
});

describe('BetaKey Helper Functions', () => {
  describe('isValidBetaKeyFormat', () => {
    it('should validate correct beta key format', () => {
      expect(isValidBetaKeyFormat('BETA-1234-5678-9012')).toBe(true);
      expect(isValidBetaKeyFormat('BETA-ABCD-EFGH-IJKL')).toBe(true);
      expect(isValidBetaKeyFormat('beta-1234-5678-9012')).toBe(true); // lowercase (normalized)
      expect(isValidBetaKeyFormat('  BETA-1234-5678-9012  ')).toBe(true); // with spaces
    });

    it('should reject invalid formats', () => {
      expect(isValidBetaKeyFormat('INVALID')).toBe(false);
      expect(isValidBetaKeyFormat('BETA-123')).toBe(false);
      expect(isValidBetaKeyFormat('BETA-1234-5678')).toBe(false);
      expect(isValidBetaKeyFormat('1234-5678-9012')).toBe(false); // missing BETA prefix
      expect(isValidBetaKeyFormat('BETA-1234-5678-901')).toBe(false); // too short
      expect(isValidBetaKeyFormat('BETA-1234-5678-90123')).toBe(false); // too long
      expect(isValidBetaKeyFormat('BETA-123!-5678-9012')).toBe(false); // special chars
    });

    it('should reject empty or whitespace strings', () => {
      expect(isValidBetaKeyFormat('')).toBe(false);
      expect(isValidBetaKeyFormat('   ')).toBe(false);
    });
  });

  describe('formatBetaKey', () => {
    it('should format raw key input correctly', () => {
      expect(formatBetaKey('123456789012')).toBe('BETA-1234-5678-9012');
      expect(formatBetaKey('ABCDEFGHIJKL')).toBe('BETA-ABCD-EFGH-IJKL');
    });

    it('should handle input with BETA prefix', () => {
      expect(formatBetaKey('BETA123456789012')).toBe('BETA-1234-5678-9012');
      expect(formatBetaKey('beta123456789012')).toBe('BETA-1234-5678-9012');
    });

    it('should strip non-alphanumeric characters', () => {
      expect(formatBetaKey('12-34-56-78-90-12')).toBe('BETA-1234-5678-9012');
      expect(formatBetaKey('12.34.56.78.90.12')).toBe('BETA-1234-5678-9012');
      expect(formatBetaKey('12 34 56 78 90 12')).toBe('BETA-1234-5678-9012');
    });

    it('should convert to uppercase', () => {
      expect(formatBetaKey('abcdefghijkl')).toBe('BETA-ABCD-EFGH-IJKL');
      expect(formatBetaKey('AbCdEfGhIjKl')).toBe('BETA-ABCD-EFGH-IJKL');
    });

    it('should limit to 12 characters after BETA prefix', () => {
      expect(formatBetaKey('123456789012345678')).toBe('BETA-1234-5678-9012');
    });

    it('should handle partial input gracefully', () => {
      expect(formatBetaKey('1234')).toBe('BETA-1234');
      expect(formatBetaKey('12345678')).toBe('BETA-1234-5678');
      expect(formatBetaKey('123')).toBe('BETA-123');
    });

    it('should handle empty input', () => {
      expect(formatBetaKey('')).toBe('BETA-');
    });

    it('should handle already formatted keys', () => {
      expect(formatBetaKey('BETA-1234-5678-9012')).toBe('BETA-1234-5678-9012');
    });
  });
});

