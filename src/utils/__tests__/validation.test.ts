import { describe, it, expect } from 'vitest';
import { 
  validateEmail, 
  validatePollTitle, 
  isValidDate, 
  isFutureDate,
  validateEmailList,
  validateTimeSlot,
  validateTimeRange
} from '../validation';

describe('validation', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
      expect(validateEmail('123@test.fr')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
    });

    it('should handle emails with whitespace', () => {
      expect(validateEmail(' test@example.com ')).toBe(true);
      expect(validateEmail('test @example.com')).toBe(false);
    });
  });

  describe('validatePollTitle', () => {
    it('should validate correct titles', () => {
      expect(validatePollTitle('Réunion équipe')).toBe(true);
      expect(validatePollTitle('Meeting')).toBe(true);
      expect(validatePollTitle('A')).toBe(true); // Minimum 1 caractère
    });

    it('should reject invalid titles', () => {
      expect(validatePollTitle('')).toBe(false);
      expect(validatePollTitle('   ')).toBe(false); // Espaces uniquement
      expect(validatePollTitle('a'.repeat(256))).toBe(false); // Trop long
    });

    it('should handle titles with whitespace', () => {
      expect(validatePollTitle(' Valid Title ')).toBe(true);
    });
  });

  describe('isValidDate', () => {
    it('should validate correct date formats', () => {
      expect(isValidDate('2025-07-01')).toBe(true);
      expect(isValidDate('2025-12-31')).toBe(true);
      expect(isValidDate('2024-02-29')).toBe(true); // Année bissextile
    });

    it('should reject invalid date formats', () => {
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('2025-13-01')).toBe(false); // Mois invalide
      expect(isValidDate('2025-02-30')).toBe(false); // Jour invalide
      expect(isValidDate('25-07-01')).toBe(false); // Format incorrect
      expect(isValidDate('2025/07/01')).toBe(false); // Mauvais séparateur
    });

    it('should handle edge cases', () => {
      expect(isValidDate('2025-02-29')).toBe(false); // Pas une année bissextile
      expect(isValidDate('2025-04-31')).toBe(false); // Avril n'a que 30 jours
    });
  });

  describe('validateTimeSlot', () => {
    it('should validate correct time formats', () => {
      expect(validateTimeSlot('09:00')).toBe(true);
      expect(validateTimeSlot('14:30')).toBe(true);
      expect(validateTimeSlot('00:00')).toBe(true);
      expect(validateTimeSlot('23:59')).toBe(true);
    });

    it('should reject invalid time formats', () => {
      expect(validateTimeSlot('24:00')).toBe(false); // Heure invalide
      expect(validateTimeSlot('12:60')).toBe(false); // Minute invalide
      expect(validateTimeSlot('9:00')).toBe(false); // Format sans 0 initial
      expect(validateTimeSlot('invalid')).toBe(false);
      expect(validateTimeSlot('')).toBe(false);
    });
  });

  describe('validateTimeRange', () => {
    it('should validate correct time ranges', () => {
      expect(validateTimeRange('09:00', '10:00')).toBe(true);
      expect(validateTimeRange('14:00', '17:30')).toBe(true);
      expect(validateTimeRange('08:15', '08:45')).toBe(true);
    });

    it('should reject invalid time ranges', () => {
      expect(validateTimeRange('10:00', '09:00')).toBe(false); // Fin avant début
      expect(validateTimeRange('14:00', '14:00')).toBe(false); // Même heure
      expect(validateTimeRange('invalid', '10:00')).toBe(false); // Format invalide
      expect(validateTimeRange('09:00', 'invalid')).toBe(false); // Format invalide
    });

    it('should handle edge cases', () => {
      expect(validateTimeRange('23:59', '00:00')).toBe(false); // Passage minuit
      expect(validateTimeRange('00:00', '23:59')).toBe(true); // Journée complète
    });
  });
}); 