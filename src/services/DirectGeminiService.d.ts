export interface DirectGeminiResponse {
    success: boolean;
    data?: string;
    error?: string;
    message?: string;
}
export declare class DirectGeminiService {
    private static instance;
    private apiKey;
    static getInstance(): DirectGeminiService;
    private constructor();
    private initialize;
    /**
     * Appelle DIRECTEMENT l'API Gemini (bypass Edge Function)
     * @param userInput Texte de l'utilisateur
     * @param prompt Prompt optionnel (si déjà formaté)
     * @returns Réponse Gemini ou erreur
     */
    generateContent(userInput: string, prompt?: string): Promise<DirectGeminiResponse>;
}
export declare const directGeminiService: DirectGeminiService;
