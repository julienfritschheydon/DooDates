import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseAvailabilitiesWithAI } from '../availability-parser';
import { secureGeminiService } from '@/services/SecureGeminiService';

// Mock the SecureGeminiService
vi.mock('@/services/SecureGeminiService', () => ({
    secureGeminiService: {
        generateContent: vi.fn(),
    },
}));

describe('availability-parser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should parse availabilities correctly using SecureGeminiService', async () => {
        const mockResponse = {
            success: true,
            data: JSON.stringify({
                availabilities: [
                    {
                        day: 'monday',
                        timeRange: { start: '09:00', end: '12:00' },
                        confidence: 0.9,
                        originalText: 'lundi matin'
                    }
                ],
                confidence: 0.9
            })
        };

        // Setup mock return value
        vi.mocked(secureGeminiService.generateContent).mockResolvedValue(mockResponse as any);

        const text = "Je suis dispo lundi matin";
        const result = await parseAvailabilitiesWithAI(text);

        // Verify service was called
        expect(secureGeminiService.generateContent).toHaveBeenCalledTimes(1);
        expect(secureGeminiService.generateContent).toHaveBeenCalledWith(
            expect.any(String), // prompt (empty string in implementation)
            expect.stringContaining(text) // prompt content
        );

        // Verify result parsing
        expect(result.availabilities).toHaveLength(1);
        expect(result.availabilities[0].day).toBe('monday');
        expect(result.availabilities[0].timeRange.start).toBe('09:00');
        expect(result.availabilities[0].timeRange.end).toBe('12:00');
        expect(result.confidence).toBe(0.9);
    });

    it('should handle errors from SecureGeminiService', async () => {
        const mockResponse = {
            success: false,
            error: 'API Error',
            message: 'Something went wrong'
        };

        vi.mocked(secureGeminiService.generateContent).mockResolvedValue(mockResponse as any);

        const text = "Je suis dispo lundi matin";
        const result = await parseAvailabilitiesWithAI(text);

        expect(result.availabilities).toHaveLength(0);
        expect(result.errors).toContain('Something went wrong');
    });
});
