export interface SecureGeminiResponse {
  success: boolean;
  data?: string;
  error?: string;
  message?: string;
  creditsRemaining?: number;
}
export declare class SecureGeminiService {
  private static instance;
  private supabaseUrl;
  static getInstance(): SecureGeminiService;
  private constructor();
  /**
   * Appelle Gemini API via Edge Function sécurisée
   * @param userInput Texte de l'utilisateur
   * @param prompt Prompt optionnel (si déjà formaté)
   * @returns Réponse Gemini ou erreur
   */
  generateContent(userInput: string, prompt?: string): Promise<SecureGeminiResponse>;
  /**
   * Teste la connexion à l'Edge Function
   */
  testConnection(): Promise<boolean>;
}
export declare const secureGeminiService: SecureGeminiService;
