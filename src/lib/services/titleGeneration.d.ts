/**
 * Title Generation Service
 * DooDates - Intelligent conversation title generation
 */
import type { ConversationMessage } from "../../types/conversation";
export interface TitleGenerationOptions {
    /** Minimum character length for generated title */
    minLength?: number;
    /** Maximum character length for generated title */
    maxLength?: number;
    /** Maximum number of message turns to analyze */
    maxTurns?: number;
    /** Language for title generation */
    language?: "fr" | "en";
}
export interface TitleGenerationResult {
    /** Generated title */
    title: string;
    /** Whether generation was successful */
    success: boolean;
    /** Source messages used for generation */
    sourceMessages: string[];
    /** Reason if generation failed */
    failureReason?: string;
}
/**
 * Generate intelligent title from conversation messages
 * Analyzes first 2-4 message turns to create meaningful title
 */
export declare function generateConversationTitle(messages: ConversationMessage[], options?: TitleGenerationOptions): TitleGenerationResult;
/**
 * Check if a title should be regenerated (e.g., after new messages)
 */
export declare function shouldRegenerateTitle(currentTitle: string, isCustomTitle: boolean, messageCount: number): boolean;
/**
 * Generate fallback title based on date
 */
export declare function generateFallbackTitle(language?: "fr" | "en"): string;
