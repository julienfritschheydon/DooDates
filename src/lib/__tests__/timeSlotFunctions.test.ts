import { describe, it, expect } from "vitest";
import { 
  generateTimeSlots, 
  getVisibleTimeSlots, 
  getTimeSlotBlocks,
  toggleTimeSlotForDate,
  formatSelectedDateHeader,
  isGranularityCompatible 
} from '../timeSlotFunctions';

describe('timeSlotFunctions', () => {
  describe('generateTimeSlots', () => {
    it('should generate basic time slots (8h-20h, 30min)', () => {
      const slots = generateTimeSlots(false, 30);
      
      expect(slots).toHaveLength(25); // 8h-20h en tranches de 30min
      expect(slots[0]).toEqual({ hour: 8, minute: 0, label: '08:00' });
      expect(slots[1]).toEqual({ hour: 8, minute: 30, label: '08:30' });
      expect(slots[slots.length - 1]).toEqual({ hour: 20, minute: 0, label: '20:00' });
    });

    it('should generate extended time slots (6h-23h, 15min)', () => {
      const slots = generateTimeSlots(true, 15);
      
      expect(slots).toHaveLength(69); // 6h-23h en tranches de 15min
      expect(slots[0]).toEqual({ hour: 6, minute: 0, label: '06:00' });
      expect(slots[slots.length - 1]).toEqual({ hour: 23, minute: 0, label: '23:00' });
    });

    it('should handle different granularities', () => {
      const slots60 = generateTimeSlots(false, 60);
      const slots15 = generateTimeSlots(false, 15);
      
      expect(slots60).toHaveLength(13); // 8h-20h en tranches de 1h
      expect(slots15).toHaveLength(49); // 8h-20h en tranches de 15min
    });
  });

  describe('toggleTimeSlotForDate', () => {
    it('should add new time slot when none exists', () => {
      const timeSlotsByDate = {};
      const result = toggleTimeSlotForDate('2025-07-01', 14, 0, timeSlotsByDate);
      
      expect(result['2025-07-01']).toHaveLength(1);
      expect(result['2025-07-01'][0]).toEqual({ hour: 14, minute: 0, enabled: true });
    });

    it('should toggle existing time slot', () => {
      const timeSlotsByDate = {
        '2025-07-01': [{ hour: 14, minute: 0, enabled: true }]
      };
      const result = toggleTimeSlotForDate('2025-07-01', 14, 0, timeSlotsByDate);
      
      expect(result['2025-07-01'][0].enabled).toBe(false);
    });

    it('should add to existing slots without affecting others', () => {
      const timeSlotsByDate = {
        '2025-07-01': [{ hour: 14, minute: 0, enabled: true }]
      };
      const result = toggleTimeSlotForDate('2025-07-01', 15, 0, timeSlotsByDate);
      
      expect(result['2025-07-01']).toHaveLength(2);
      expect(result['2025-07-01'][0]).toEqual({ hour: 14, minute: 0, enabled: true });
      expect(result['2025-07-01'][1]).toEqual({ hour: 15, minute: 0, enabled: true });
    });
  });

  describe('formatSelectedDateHeader', () => {
    it('should format date correctly', () => {
      const result = formatSelectedDateHeader('2025-07-01');
      
      expect(result.dayName).toBe('mar.'); // mardi
      expect(result.dayNumber).toBe(1);
      expect(result.month).toBe('juil.'); // juillet
    });

    it('should handle different dates', () => {
      const result = formatSelectedDateHeader('2025-12-25');
      
      expect(result.dayName).toBe('jeu.'); // jeudi
      expect(result.dayNumber).toBe(25);
      expect(result.month).toBe('déc.'); // décembre
    });
  });
});
