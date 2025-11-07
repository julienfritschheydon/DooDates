export interface TemporalContext {
  currentDate: Date;
  userTimezone: string;
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: number[];
}
export interface ParsedTemporal {
  originalText: string;
  confidence: number;
  temporalType: "date" | "datetime" | "recurring" | "duration" | "relative";
  extracted: {
    dates: string[];
    times: string[];
    durations: string[];
    recurring: {
      pattern?: string;
      frequency?: string;
      weekdays?: string[];
    };
    constraints: {
      beforeTime?: string;
      afterTime?: string;
      workingHours?: boolean;
      weekendsOnly?: boolean;
      weekdaysOnly?: boolean;
    };
  };
  counterfactualChecks: {
    passed: boolean;
    conflicts: string[];
    suggestions: string[];
  };
}
export declare class AdvancedTemporalParser {
  private context;
  constructor(context?: Partial<TemporalContext>);
  /**
   * Parse le texte avec plusieurs techniques combinées
   */
  parseText(text: string): Promise<ParsedTemporal>;
  /**
   * Normalise le texte pour améliorer le parsing
   */
  private normalizeText;
  /**
   * Parse avec Serina pour les dates et heures
   */
  private parseWithSerina;
  /**
   * Parse les patterns récurrents avec SoonerOrLater
   */
  private parseRecurring;
  /**
   * Extraction des contraintes implicites
   */
  private extractConstraints;
  /**
   * Résout les références temporelles relatives avec précision
   */
  private resolveRelativeReferences;
  /**
   * Vérifications de cohérence counterfactual
   * Inspiré des techniques de "Counterfactual-Consistency Prompting"
   */
  private performCounterfactualChecks;
  /**
   * Fusion intelligente des résultats de parsing
   */
  private mergeResults;
  /**
   * Calcule un score de confiance basé sur les vérifications
   */
  private calculateConfidence;
  /**
   * Détermine le type temporel principal
   */
  private determineTemporalType;
  /**
   * Utilitaire pour obtenir le nom du jour
   */
  private getDayName;
  /**
   * Génère des suggestions d'amélioration basées sur l'analyse
   */
  generateSuggestions(parsed: ParsedTemporal): string[];
}
export declare const temporalParser: AdvancedTemporalParser;
