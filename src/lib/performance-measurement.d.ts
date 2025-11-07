/**
 * Utilitaire de mesure de performance pour PollCreator
 * Permet de mesurer les gains après optimisation
 */
interface PerformanceMetrics {
    initialLoadTime: number;
    preloadTime: number | null;
    firstPaintTime: number;
    bundleSize: number | null;
    timestamp: number;
}
declare class PerformanceMeasurement {
    private metrics;
    private startTime;
    /**
     * Mesure le temps de chargement initial de l'app
     */
    measureInitialLoad(): number;
    /**
     * Mesure le temps de chargement de PollCreator
     * @param loadTime - Temps de chargement déjà calculé (optionnel)
     */
    measurePollCreatorLoad(loadTime?: number): void;
    /**
     * Mesure la taille du bundle (approximative)
     */
    measureBundleSize(): void;
    /**
     * Récupère toutes les métriques
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Affiche un rapport complet des performances
     */
    printReport(): {
        "\u23F1\uFE0F Temps de chargement initial": string;
        "\u26A1 Temps de chargement PollCreator": string;
        "\uD83D\uDCE6 Taille m\u00E9moire JS": string;
        "\uD83D\uDCC5 Timestamp": string;
    };
    /**
     * Compare avec les métriques stockées (baseline)
     */
    compareWithBaseline(): void;
}
export declare const performanceMeasurement: PerformanceMeasurement;
/**
 * Helper pour mesurer une fonction spécifique
 */
export declare function measurePerformance<T>(name: string, fn: () => T | Promise<T>): Promise<T>;
export {};
