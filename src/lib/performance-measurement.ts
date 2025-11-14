/**
 * Utilitaire de mesure de performance pour PollCreator
 * Permet de mesurer les gains après optimisation
 */

import { logger } from "./logger";

interface PerformanceMetrics {
  initialLoadTime: number;
  preloadTime: number | null;
  firstPaintTime: number;
  bundleSize: number | null;
  timestamp: number;
}

class PerformanceMeasurement {
  private metrics: PerformanceMetrics = {
    initialLoadTime: 0,
    preloadTime: null,
    firstPaintTime: 0,
    bundleSize: null,
    timestamp: Date.now(),
  };

  private startTime = performance.now();

  /**
   * Mesure le temps de chargement initial de l'app
   */
  measureInitialLoad() {
    const loadTime = performance.now() - this.startTime;
    this.metrics.initialLoadTime = loadTime;

    // Performance Navigation Timing API
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      const loadComplete = timing.loadEventEnd - timing.navigationStart;

      logger.info("📊 Temps de chargement initial", "performance", {
        total: loadTime.toFixed(2) + " ms",
        domContentLoaded: domContentLoaded + " ms",
        loadComplete: loadComplete + " ms",
        navigationStart: timing.navigationStart,
      });
    }

    return loadTime;
  }

  /**
   * Mesure le temps de chargement de PollCreator
   * @param loadTime - Temps de chargement déjà calculé (optionnel)
   */
  measurePollCreatorLoad(loadTime?: number): void {
    if (loadTime !== undefined) {
      // Utiliser le temps déjà calculé
      this.metrics.preloadTime = loadTime;

      const status =
        loadTime > 1000
          ? "⚠️ Lent (>1s)"
          : loadTime < 50
            ? "⚡ Cache (instantané)"
            : "✅ Rapide (<1s)";

      logger.info("⚡ PollCreator - Temps de chargement", "performance", {
        loadTime: loadTime.toFixed(2) + " ms",
        status,
      });
    } else {
      // Mesure manuelle si pas de temps fourni
      const startTime = performance.now();

      if (
        typeof (window as Window & { preloadPollCreator?: () => Promise<void> })
          .preloadPollCreator === "function"
      ) {
        (window as Window & { preloadPollCreator: () => Promise<void> })
          .preloadPollCreator()
          .then(() => {
            const measuredTime = performance.now() - startTime;
            this.metrics.preloadTime = measuredTime;

            const status =
              measuredTime > 1000
                ? "⚠️ Lent (>1s)"
                : measuredTime < 50
                  ? "⚡ Cache (instantané)"
                  : "✅ Rapide (<1s)";

            logger.info("⚡ PollCreator - Temps de chargement", "performance", {
              loadTime: measuredTime.toFixed(2) + " ms",
              status,
            });
          })
          .catch((error: unknown) => {
            logger.error("Erreur mesure PollCreator", "performance", error);
          });
      }
    }
  }

  /**
   * Mesure la taille du bundle (approximative)
   */
  measureBundleSize() {
    if (
      window.performance &&
      "memory" in window.performance &&
      (window.performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
    ) {
      const memory = (window.performance as Performance & { memory: { usedJSHeapSize: number } })
        .memory;
      const usedJSHeapSize = memory.usedJSHeapSize / 1024 / 1024; // MB
      this.metrics.bundleSize = usedJSHeapSize;

      logger.info("📦 Taille mémoire JS", "performance", {
        usedJSHeapSize: usedJSHeapSize.toFixed(2) + " MB",
        totalJSHeapSize: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + " MB",
        jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + " MB",
      });
    }
  }

  /**
   * Récupère toutes les métriques
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Affiche un rapport complet des performances
   */
  printReport() {
    const metrics = this.getMetrics();
    const report = {
      "⏱️ Temps de chargement initial": metrics.initialLoadTime.toFixed(2) + " ms",
      "⚡ Temps de chargement PollCreator": metrics.preloadTime
        ? metrics.preloadTime.toFixed(2) + " ms"
        : "Non chargé",
      "📦 Taille mémoire JS": metrics.bundleSize
        ? metrics.bundleSize.toFixed(2) + " MB"
        : "Non disponible",
      "📅 Timestamp": new Date(metrics.timestamp).toLocaleString(),
    };

    logger.info("📊 Rapport de performance complet", "performance", report);

    // Afficher aussi dans la console avec un formatage spécial
    console.group("📊 Rapport de Performance");
    console.table(report);
    console.groupEnd();

    return report;
  }

  /**
   * Compare avec les métriques stockées (baseline)
   */
  compareWithBaseline() {
    const baseline = localStorage.getItem("doodates-performance-baseline");
    if (!baseline) {
      logger.info("ℹ️ Aucune baseline trouvée - sauvegarde de la baseline actuelle", "performance");
      localStorage.setItem("doodates-performance-baseline", JSON.stringify(this.metrics));
      return;
    }

    try {
      const baselineMetrics = JSON.parse(baseline) as PerformanceMetrics;
      const currentMetrics = this.getMetrics();

      const improvements = {
        "Initial Load": {
          baseline: baselineMetrics.initialLoadTime.toFixed(2) + " ms",
          current: currentMetrics.initialLoadTime.toFixed(2) + " ms",
          improvement:
            ((baselineMetrics.initialLoadTime - currentMetrics.initialLoadTime) /
              baselineMetrics.initialLoadTime) *
            100,
        },
        "PollCreator Load": {
          baseline: baselineMetrics.preloadTime
            ? baselineMetrics.preloadTime.toFixed(2) + " ms"
            : "N/A",
          current: currentMetrics.preloadTime
            ? currentMetrics.preloadTime.toFixed(2) + " ms"
            : "N/A",
          improvement:
            baselineMetrics.preloadTime && currentMetrics.preloadTime
              ? ((baselineMetrics.preloadTime - currentMetrics.preloadTime) /
                  baselineMetrics.preloadTime) *
                100
              : null,
        },
      };

      logger.info("📈 Comparaison avec baseline", "performance", improvements);
      console.group("📈 Comparaison Performance");
      console.table(improvements);
      console.groupEnd();
    } catch (error) {
      logger.error("Erreur comparaison baseline", "performance", error);
    }
  }
}

// Instance globale
export const performanceMeasurement = new PerformanceMeasurement();

// Mesure automatique désactivée pour réduire les logs en console
// Les mesures sont toujours disponibles via l'instance performanceMeasurement
// if (typeof window !== "undefined") {
//   window.addEventListener("load", () => {
//     setTimeout(() => {
//       performanceMeasurement.measureInitialLoad();
//       performanceMeasurement.measureBundleSize();
//     }, 100);
//   });
// }

/**
 * Helper pour mesurer une fonction spécifique
 */
export function measurePerformance<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
  const startTime = performance.now();
  const result = fn();

  if (result instanceof Promise) {
    return result.then((value) => {
      const duration = performance.now() - startTime;
      logger.info(`⏱️ ${name}`, "performance", {
        duration: duration.toFixed(2) + " ms",
      });
      return value;
    });
  } else {
    const duration = performance.now() - startTime;
    logger.info(`⏱️ ${name}`, "performance", {
      duration: duration.toFixed(2) + " ms",
    });
    return Promise.resolve(result);
  }
}
