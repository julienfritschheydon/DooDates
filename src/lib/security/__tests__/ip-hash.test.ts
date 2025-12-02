/**
 * Tests IP Hash Service
 */

import { describe, it, expect } from 'vitest';
import { hashIP, isValidHash, compareIPHash, hashIPWithTimestamp, validateIP, anonymizeIP } from '../ip-hash';

describe('IP Hash Service', () => {
  describe('hashIP', () => {
    it('should hash an IPv4 address', () => {
      const ip = '192.168.1.100';
      const hash = hashIP(ip);
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/i);
      expect(hash).not.toBe(ip);
      expect(hash.length).toBe(64);
    });

    it('should hash an IPv6 address', () => {
      const ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const hash = hashIP(ip);
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/i);
      expect(hash).not.toBe(ip);
      expect(hash.length).toBe(64);
    });

    it('should return unknown for invalid input', () => {
      expect(hashIP('')).toBe('unknown');
      expect(hashIP('unknown')).toBe('unknown');
      expect(hashIP(null as any)).toBe('unknown');
      expect(hashIP(undefined as any)).toBe('unknown');
    });

    it('should be deterministic', () => {
      const ip = '192.168.1.100';
      const hash1 = hashIP(ip);
      const hash2 = hashIP(ip);
      
      expect(hash1).toBe(hash2);
    });

    it('should handle whitespace and case', () => {
      const ip1 = '192.168.1.100';
      const ip2 = ' 192.168.1.100 ';
      const ip3 = '192.168.1.100';
      
      const hash1 = hashIP(ip1);
      const hash2 = hashIP(ip2);
      const hash3 = hashIP(ip3.toUpperCase());
      
      expect(hash1).toBe(hash2);
      expect(hash1).toBe(hash3);
    });
  });

  describe('isValidHash', () => {
    it('should validate SHA-256 hash format', () => {
      const validHash = 'a1b2c3d4e5f6' + '0'.repeat(52); // 64 chars
      const invalidHash = 'invalid';
      const shortHash = 'abc123';
      
      expect(isValidHash(validHash)).toBe(true);
      expect(isValidHash(invalidHash)).toBe(false);
      expect(isValidHash(shortHash)).toBe(false);
      expect(isValidHash('unknown')).toBe(true);
    });

    it('should handle mixed case', () => {
      const lowercaseHash = 'a1b2c3d4e5f6' + '0'.repeat(52);
      const uppercaseHash = 'A1B2C3D4E5F6' + '0'.repeat(52);
      const mixedHash = 'A1b2C3d4E5f6' + '0'.repeat(52);
      
      expect(isValidHash(lowercaseHash)).toBe(true);
      expect(isValidHash(uppercaseHash)).toBe(true);
      expect(isValidHash(mixedHash)).toBe(true);
    });
  });

  describe('compareIPHash', () => {
    it('should return true for same IP', () => {
      const ip = '192.168.1.100';
      expect(compareIPHash(ip, ip)).toBe(true);
    });

    it('should return false for different IPs', () => {
      const ip1 = '192.168.1.100';
      const ip2 = '192.168.1.101';
      expect(compareIPHash(ip1, ip2)).toBe(false);
    });

    it('should handle invalid IPs', () => {
      expect(compareIPHash('unknown', 'unknown')).toBe(true);
      expect(compareIPHash('', 'unknown')).toBe(true);
      expect(compareIPHash('192.168.1.100', 'unknown')).toBe(false);
    });
  });

  describe('hashIPWithTimestamp', () => {
    it('should include timestamp in hash', () => {
      const ip = '192.168.1.100';
      const timestamp = 1234567890;
      
      const hash1 = hashIP(ip);
      const hash2 = hashIPWithTimestamp(ip, timestamp);
      
      expect(hash1).not.toBe(hash2);
      expect(hash2).toMatch(/^[a-f0-9]{64}$/i);
    });

    it('should be deterministic with same timestamp', () => {
      const ip = '192.168.1.100';
      const timestamp = 1234567890;
      
      const hash1 = hashIPWithTimestamp(ip, timestamp);
      const hash2 = hashIPWithTimestamp(ip, timestamp);
      
      expect(hash1).toBe(hash2);
    });

    it('should use current timestamp if not provided', () => {
      const ip = '192.168.1.100';
      
      const hash1 = hashIPWithTimestamp(ip);
      // Attendre un peu pour s'assurer que le timestamp change
      setTimeout(() => {
        const hash2 = hashIPWithTimestamp(ip, Date.now());
        const hash3 = hashIPWithTimestamp(ip, Date.now());
        
        // hash1 devrait être différent car le timestamp change
        expect(hash1).not.toBe(hash2);
        expect(hash1).not.toBe(hash3);
      }, 1);
    });
  });

  describe('validateIP', () => {
    it('should validate IPv4 addresses', () => {
      expect(validateIP('192.168.1.100')).toBe(true);
      expect(validateIP('127.0.0.1')).toBe(true);
      expect(validateIP('255.255.255.255')).toBe(true);
      expect(validateIP('0.0.0.0')).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      expect(validateIP('256.168.1.100')).toBe(false); // 256 > 255
      expect(validateIP('192.168.1')).toBe(false); // Missing octet
      expect(validateIP('192.168.1.100.200')).toBe(false); // Too many octets
      expect(validateIP('192.168.1.-1')).toBe(false); // Negative
      expect(validateIP('abc.def.ghi.jkl')).toBe(false); // Not numbers
    });

    it('should validate IPv6 addresses', () => {
      expect(validateIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
      expect(validateIP('::1')).toBe(true); // Loopback
      expect(validateIP('fe80::1')).toBe(true); // Link-local
    });

    it('should reject invalid IPv6 addresses', () => {
      expect(validateIP('2001:0db8:85a3:::8a2e:0370:7334')).toBe(false); // Too many :: - should fail
      expect(validateIP('2001:0db8:85a3:zzzz:0000:8a2e:0370:7334')).toBe(false); // Invalid hex
      expect(validateIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334:1234')).toBe(false); // Too many parts
      expect(validateIP('2001:0db8:85a3:0000:0000:8a2e:0370')).toBe(false); // Too few parts
    });

    it('should reject invalid inputs', () => {
      expect(validateIP('')).toBe(false);
      expect(validateIP('unknown')).toBe(false);
      expect(validateIP(null as any)).toBe(false);
      expect(validateIP(undefined as any)).toBe(false);
    });
  });

  describe('anonymizeIP', () => {
    it('should anonymize IPv4 addresses', () => {
      expect(anonymizeIP('192.168.1.100')).toBe('192.168.1.xxx');
      expect(anonymizeIP('10.0.0.1')).toBe('10.0.0.xxx');
      expect(anonymizeIP('127.0.0.1')).toBe('127.0.0.xxx');
    });

    it('should anonymize IPv6 addresses', () => {
      expect(anonymizeIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:xxxx');
      expect(anonymizeIP('::1')).toBe('::xxxx');
      expect(anonymizeIP('fe80::1')).toBe('fe80::xxxx');
    });

    it('should return unknown for invalid IPs', () => {
      expect(anonymizeIP('')).toBe('unknown');
      expect(anonymizeIP('unknown')).toBe('unknown');
      expect(anonymizeIP('invalid.ip')).toBe('unknown');
    });

    it('should preserve valid IP structure', () => {
      const ipv4 = '192.168.1.100';
      const anonymizedIPv4 = anonymizeIP(ipv4);
      expect(anonymizedIPv4).toMatch(/^\d+\.\d+\.\d+\.xxx$/);
      
      const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const anonymizedIPv6 = anonymizeIP(ipv6);
      expect(anonymizedIPv6).toMatch(/^[0-9a-fA-F:]+xxxx$/);
    });
  });

  describe('edge cases', () => {
    it('should handle special IPv4 addresses', () => {
      expect(hashIP('0.0.0.0')).toMatch(/^[a-f0-9]{64}$/i);
      expect(hashIP('255.255.255.255')).toMatch(/^[a-f0-9]{64}$/i);
      expect(hashIP('127.0.0.1')).toMatch(/^[a-f0-9]{64}$/i);
    });

    it('should handle IPv6 loopback', () => {
      expect(hashIP('::1')).toMatch(/^[a-f0-9]{64}$/i);
      expect(hashIP('0:0:0:0:0:0:0:1')).toMatch(/^[a-f0-9]{64}$/i);
    });

    it('should handle compressed IPv6', () => {
      expect(hashIP('::')).toMatch(/^[a-f0-9]{64}$/i);
      expect(hashIP('2001:db8::1')).toMatch(/^[a-f0-9]{64}$/i);
    });

    it('should maintain uniqueness', () => {
      const ips = [
        '192.168.1.1',
        '192.168.1.2',
        '192.168.1.3',
        '10.0.0.1',
        '172.16.0.1',
        '127.0.0.1',
        '::1',
        '2001:db8::1',
      ];

      const hashes = ips.map(ip => hashIP(ip));
      const uniqueHashes = new Set(hashes);
      
      expect(uniqueHashes.size).toBe(ips.length);
    });
  });

  describe('performance', () => {
    it('should handle large number of hashes efficiently', () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        hashIP(`192.168.1.${i % 255}`);
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should be fast
    });

    it('should handle concurrent hashing', () => {
      const promises = [];
      
      for (let i = 0; i < 100; i++) {
        promises.push(Promise.resolve(hashIP(`10.0.0.${i}`)));
      }
      
      return Promise.all(promises).then(hashes => {
        expect(hashes).toHaveLength(100);
        expect(new Set(hashes).size).toBe(100); // All unique
      });
    });
  });
});
