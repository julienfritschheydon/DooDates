/**
 * Analyseur de performance détaillé
 * Identifie les goulots d'étranglement dans le chargement initial
 */
declare class PerformanceAnalyzer {
  private timings;
  private startTime;
  private marks;
  private phases;
  /**
   * Marquer un point dans le temps
   */
  mark(name: string, category?: string): void;
  /**
   * Mesurer le temps entre deux marques
   */
  measure(name: string, startMark: string, endMark: string): number;
  /**
   * Analyser le chargement initial avec Performance API
   */
  analyzeInitialLoad(): void;
  /**
   * Analyser les ressources chargées
   */
  analyzeResources(): {
    byType: Record<
      string,
      {
        count: number;
        totalSize: number;
        totalTime: number;
      }
    >;
    jsAnalysis: {
      total: number;
      totalSize: number;
      totalTime: number;
      largest: {
        name: string;
        size: string;
        time: string;
      }[];
      slowest: {
        name: string;
        time: string;
        size: string;
      }[];
    };
  };
  /**
   * Analyser les composants React chargés
   * Note: Ne charge pas explicitement les composants pour éviter de fausser les mesures
   */
  analyzeReactComponents(): Promise<{
    providers: Array<{ name: string; size?: string; loadTime?: string }>;
    pages: Array<{ name: string; size?: string; loadTime?: string }>;
    components: Array<{ name: string; size?: string; loadTime?: string }>;
    note: string;
  }>;
  /**
   * Analyser les imports synchrones lourds
   */
  analyzeSynchronousImports(): {
    name: string;
    note: string;
  }[];
  /**
   * Générer un rapport complet
   */
  generateReport(): Promise<{
    "Temps total d'analyse": string;
    phases: Record<string, number>;
    "Ressources charg\u00E9es": Record<
      string,
      {
        count: number;
        totalSize: number;
        totalTime: number;
      }
    >;
    jsAnalysis: {
      total: number;
      totalSize: number;
      totalTime: number;
      largest: {
        name: string;
        size: string;
        time: string;
      }[];
      slowest: {
        name: string;
        time: string;
        size: string;
      }[];
    };
    "Composants analys\u00E9s": {
      providers: Array<{ name: string; size?: string; loadTime?: string }>;
      pages: Array<{ name: string; size?: string; loadTime?: string }>;
      components: Array<{ name: string; size?: string; loadTime?: string }>;
      note: string;
    };
    "Imports synchrones": {
      name: string;
      note: string;
    }[];
  }>;
  /**
   * Identifier les opportunités d'optimisation
   */
  identifyOptimizations(report: {
    "Temps total d'analyse": string;
    phases: Record<string, number>;
    "Ressources charg\u00E9es": Record<
      string,
      { count: number; totalSize: number; totalTime: number }
    >;
    jsAnalysis: {
      total: number;
      totalSize: number;
      totalTime: number;
      largest: Array<{ name: string; size: string; time: string }>;
      slowest: Array<{ name: string; time: string; size: string }>;
    };
    "Composants analys\u00E9s": {
      providers: Array<{ name: string; size?: string; loadTime?: string }>;
      pages: Array<{ name: string; size?: string; loadTime?: string }>;
      components: Array<{ name: string; size?: string; loadTime?: string }>;
      note: string;
    };
    "Imports synchrones": Array<{ name: string; note: string }>;
  }): {
    type: string;
    suggestion: string;
    impact: string;
    details: string;
  }[];
}
export declare const performanceAnalyzer: PerformanceAnalyzer;
export {};
