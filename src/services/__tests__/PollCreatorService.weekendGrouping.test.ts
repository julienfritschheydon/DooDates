import { describe, it, expect, beforeEach } from 'vitest';
import { PollCreatorService } from '../PollCreatorService';

describe.skip('PollCreatorService - Weekend Grouping', () => {
  describe('initializeWithGeminiData', () => {
    it('should initialize with empty state when no initial data', () => {
      const result = PollCreatorService.initializeWithGeminiData();
      
      expect(result).toHaveProperty('dateGroups', undefined);
      expect(result.selectedDates).toEqual([]);
    });

    it('should initialize with date groups when provided', () => {
      const mockWeekendGroup = {
        dates: ['2025-12-06', '2025-12-07'],
        label: 'Week-end du 6-7 décembre',
        type: 'weekend' as const
      };

      const result = PollCreatorService.initializeWithGeminiData({
        title: 'Test Weekend',
        dates: ['2025-12-06', '2025-12-07'],
        dateGroups: [mockWeekendGroup]
      });

      expect(result).toHaveProperty('dateGroups', [mockWeekendGroup]);
      expect(result.pollTitle).toBe('Test Weekend');
      expect(result.selectedDates).toEqual(['2025-12-06', '2025-12-07']);
    });

    it('should handle empty date groups array', () => {
      const result = PollCreatorService.initializeWithGeminiData({
        title: 'Test Empty Groups',
        dates: [],
        dateGroups: []
      });

      expect(result).toHaveProperty('dateGroups', []);
      expect(result.selectedDates).toEqual([]);
    });
  });

  describe('hasGroupedDates', () => {
    it('should detect weekend groups', () => {
      const state = PollCreatorService.initializeWithGeminiData({
        dateGroups: [{
          dates: ['2025-12-06', '2025-12-07'],
          label: 'Week-end du 6-7 décembre',
          type: 'weekend'
        }]
      });

      expect(state.dateGroups?.some(g => g.type === 'weekend')).toBe(true);
    });
  });
});
