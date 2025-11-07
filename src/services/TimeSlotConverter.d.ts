/**
 * Service de conversion des créneaux horaires
 * Réutilise la logique de conversion de Gemini → Format interne
 */
export interface GeminiTimeSlot {
    start: string;
    end: string;
    dates?: string[];
}
export interface InternalTimeSlot {
    hour: number;
    minute: number;
    duration: number;
    enabled: boolean;
}
/**
 * Convertit un créneau au format Gemini vers le format interne
 * Cette fonction réutilise la logique testée et validée de PollCreator
 */
export declare function convertGeminiSlotToInternal(geminiSlot: GeminiTimeSlot): InternalTimeSlot;
/**
 * Convertit plusieurs créneaux Gemini vers le format timeSlotsByDate
 * GÉNÈRE TOUS LES SLOTS INTERMÉDIAIRES (code d'hier restauré)
 */
export declare function convertGeminiSlotsToTimeSlotsByDate(geminiSlots: GeminiTimeSlot[], defaultDates?: string[], granularity?: number): Record<string, InternalTimeSlot[]>;
/**
 * Calcule la granularité optimale basée sur les slots
 * Utilise le PGCD (Plus Grand Commun Diviseur) des minutes de début
 */
export declare function calculateOptimalGranularity(timeSlotsByDate: Record<string, InternalTimeSlot[]>): number;
