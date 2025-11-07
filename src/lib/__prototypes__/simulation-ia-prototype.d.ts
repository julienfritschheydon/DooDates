/**
 * PROTOTYPE : Simulation IA des Réponses
 *
 * Objectif : Valider la faisabilité de générer des réponses réalistes
 * sans utiliser Gemini (coût $0)
 *
 * Durée : 2-3h
 * Date : 02/11/2025
 *
 * Critères de validation :
 * - Réponses contextuelles (pas génériques)
 * - Détection contexte > 80% précision
 * - Performance < 1s pour 50 réponses
 */
interface Persona {
    id: string;
    name: string;
    context: "b2b" | "b2c" | "event" | "feedback" | "research";
    traits: {
        responseRate: number;
        attentionSpan: number;
        detailLevel: "low" | "medium" | "high";
        biasTowardPositive: number;
        skipProbability: number;
    };
}
interface Question {
    id: string;
    title: string;
    type: "single" | "multiple" | "text";
    options?: {
        id: string;
        label: string;
    }[];
}
interface SimulatedResponse {
    questionId: string;
    value: string | string[] | null;
    timeSpent: number;
}
declare const PERSONAS: Persona[];
declare function detectContext(title: string, description?: string): string;
declare function extractKeywords(text: string): string[];
declare function generateTextResponse(question: Question, persona: Persona): string;
declare function generateResponse(question: Question, persona: Persona, questionIndex: number): SimulatedResponse;
declare function simulateResponses(questions: Question[], context: string, volume: number): SimulatedResponse[][];
export { detectContext, extractKeywords, generateTextResponse, generateResponse, simulateResponses, PERSONAS, };
export type { Persona, Question, SimulatedResponse };
