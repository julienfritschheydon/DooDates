/**
 * Analyseur de performance détaillé
 * Identifie les goulots d'étranglement dans le chargement initial
 */

import { logger } from "./logger";

interface TimingEntry {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  category: string;
}

class PerformanceAnalyzer {
  private timings: TimingEntry[] = [];
  private startTime = performance.now();
  private marks: Map<string, number> = new Map();
  private phases: Record<string, number> = {};

  /**
   * Marquer un point dans le temps
   */
  mark(name: string, category: string = "general") {
    const now = performance.now();
    this.marks.set(name, now);
    this.timings.push({
      name,
      startTime: now,
      category,
    });
  }

  /**
   * Mesurer le temps entre deux marques
   */
  measure(name: string, startMark: string, endMark: string) {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);

    if (start && end) {
      const duration = end - start;
      this.timings.push({
        name,
        startTime: start,
        endTime: end,
        duration,
        category: "measure",
      });
      return duration;
    }
    return 0;
  }

  /**
   * Analyser le chargement initial avec Performance API
   */
  analyzeInitialLoad() {
    if (!window.performance || !window.performance.timing) {
      logger.warn("Performance API non disponible", "performance");
      return;
    }

    const timing = window.performance.timing;
    const navigationStart = timing.navigationStart;

    const phases = {
      "DNS Lookup": timing.domainLookupEnd - timing.domainLookupStart,
      "TCP Connection": timing.connectEnd - timing.connectStart,
      Request: timing.responseStart - timing.requestStart,
      Response: timing.responseEnd - timing.responseStart,
      "DOM Processing": timing.domComplete - timing.domLoading,
      "DOM Content Loaded": timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
      "Load Complete": timing.loadEventEnd - timing.loadEventStart,
    };

    logger.info("🔍 Analyse détaillée du chargement", "performance", phases);

    // Stocker les phases pour l'analyse
    this.phases = phases;

    // Analyser les ressources chargées
    this.analyzeResources();
  }

  /**
   * Analyser les ressources chargées
   */
  analyzeResources() {
    if (!window.performance || !window.performance.getEntriesByType) {
      return;
    }

    const resources = window.performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];

    // Grouper par type
    const byType: Record<string, { count: number; totalSize: number; totalTime: number }> = {};

    resources.forEach((resource) => {
      const type = resource.initiatorType || "other";
      if (!byType[type]) {
        byType[type] = { count: 0, totalSize: 0, totalTime: 0 };
      }
      byType[type].count++;
      byType[type].totalSize += resource.transferSize || 0;
      byType[type].totalTime += resource.duration || 0;
    });

    // Analyser les fichiers JS spécifiquement
    const jsFiles = resources.filter(
      (r) => r.name.includes(".js") || r.initiatorType === "script",
    ) as PerformanceResourceTiming[];

    const jsAnalysis = {
      total: jsFiles.length,
      totalSize: jsFiles.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      totalTime: jsFiles.reduce((sum, r) => sum + (r.duration || 0), 0),
      largest: jsFiles
        .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
        .slice(0, 5)
        .map((r) => ({
          name: r.name.split("/").pop() || r.name,
          size: ((r.transferSize || 0) / 1024).toFixed(2) + " KB",
          time: r.duration.toFixed(2) + " ms",
        })),
      slowest: jsFiles
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .slice(0, 5)
        .map((r) => ({
          name: r.name.split("/").pop() || r.name,
          time: r.duration.toFixed(2) + " ms",
          size: ((r.transferSize || 0) / 1024).toFixed(2) + " KB",
        })),
    };

    logger.info("📦 Analyse des ressources JS", "performance", {
      "Résumé par type": byType,
      "Fichiers JS": jsAnalysis,
    });

    // Afficher un tableau dans la console
    console.group("📦 Analyse des ressources");
    console.table(byType);
    console.groupEnd();

    return { byType, jsAnalysis };
  }

  /**
   * Analyser les composants React chargés
   * Note: Ne charge pas explicitement les composants pour éviter de fausser les mesures
   */
  async analyzeReactComponents() {
    const analysis = {
      providers: [],
      pages: [],
      components: [],
      note: "Les composants lazy sont analysés via les ressources JS chargées",
    };

    // Analyser les chunks JS chargés pour identifier les composants
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];
      const jsFiles = resources.filter(
        (r) =>
          r.name.includes(".js") &&
          (r.name.includes("chunk") ||
            r.name.includes("workspace") ||
            r.name.includes("component")),
      );

      jsFiles.forEach((file) => {
        const fileName = file.name.split("/").pop() || file.name;
        analysis.pages.push({
          name: fileName,
          loadTime: file.duration.toFixed(2) + " ms",
          size: ((file.transferSize || 0) / 1024).toFixed(2) + " KB",
        });
      });
    }

    logger.info("📄 Composants React analysés", "performance", analysis);

    return analysis;
  }

  /**
   * Analyser les imports synchrones lourds
   */
  analyzeSynchronousImports() {
    const analysis: Array<{ name: string; estimatedTime: string; note: string }> = [];

    // Vérifier les imports qui pourraient être lourds
    const heavyImports = [
      { name: "react-router-dom", note: "Router - nécessaire" },
      { name: "@tanstack/react-query", note: "Query client - nécessaire" },
      { name: "framer-motion", note: "Animations - peut être lazy loaded" },
      { name: "@supabase/supabase-js", note: "Supabase - peut être lazy loaded" },
      { name: "lucide-react", note: "Icônes - peut être lazy loaded" },
    ];

    logger.info("📋 Imports synchrones potentiellement lourds", "performance", heavyImports);

    return heavyImports;
  }

  /**
   * Générer un rapport complet
   */
  async generateReport() {
    logger.info("🔍 Démarrage de l'analyse de performance", "performance");

    // Analyser le chargement initial
    this.analyzeInitialLoad();

    // Analyser les ressources
    const resources = this.analyzeResources();

    // Analyser les composants React
    const components = await this.analyzeReactComponents();

    // Analyser les imports synchrones
    const imports = this.analyzeSynchronousImports();

    // Rapport final
    const totalTime = performance.now() - this.startTime;

    const report = {
      "Temps total d'analyse": totalTime.toFixed(2) + " ms",
      phases: this.phases,
      "Ressources chargées": resources?.byType,
      jsAnalysis: resources?.jsAnalysis,
      "Composants analysés": components,
      "Imports synchrones": imports,
    };

    logger.info("📊 Rapport d'analyse complet", "performance", report);

    // Afficher dans la console
    console.group("📊 Rapport d'Analyse de Performance");
    console.table(components.pages);
    console.groupEnd();

    return report;
  }

  /**
   * Identifier les opportunités d'optimisation
   */
  identifyOptimizations(report: import("./performance-measurement").PerformanceReport) {
    const optimizations: Array<{
      type: string;
      suggestion: string;
      impact: string;
      details: string;
    }> = [];

    // Analyser les fichiers JS les plus lourds (>50 KB)
    if (report?.jsAnalysis?.largest) {
      report.jsAnalysis.largest.forEach((file: { name: string; size: string }) => {
        const sizeKB = parseFloat(file.size);
        if (sizeKB > 50) {
          const impact = sizeKB > 200 ? "Élevé" : sizeKB > 100 ? "Moyen" : "Faible";
          optimizations.push({
            type: "Bundle Size",
            suggestion: `Optimiser ${file.name}`,
            impact,
            details: `Taille: ${file.size}, Temps: ${file.time}`,
          });
        }
      });
    }

    // Analyser les fichiers JS les plus lents (>150 ms)
    if (report?.jsAnalysis?.slowest) {
      report.jsAnalysis.slowest.forEach((file: { name: string; time: string; size?: string }) => {
        const timeMs = parseFloat(file.time);
        if (timeMs > 150) {
          optimizations.push({
            type: "Load Time",
            suggestion: `Améliorer chargement ${file.name}`,
            impact: timeMs > 200 ? "Élevé" : "Moyen",
            details: `Temps: ${file.time}, Taille: ${file.size}`,
          });
        }
      });
    }

    // Analyser DOM Processing (si > 2000 ms)
    if (report?.phases?.["DOM Processing"] > 2000) {
      optimizations.push({
        type: "DOM Processing",
        suggestion: "Optimiser le rendu DOM initial",
        impact: "Élevé",
        details: `DOM Processing: ${report.phases["DOM Processing"].toFixed(2)} ms`,
      });
    }

    // Vérifier les imports synchrones
    if (report?.imports) {
      report.imports.forEach((imp: { name: string; note: string }) => {
        if (imp.note.includes("peut être lazy loaded")) {
          optimizations.push({
            type: "Lazy Loading",
            suggestion: `Lazy load ${imp.name}`,
            impact: "Élevé",
            details: imp.note,
          });
        }
      });
    }

    // Analyser les composants chargés
    if (report?.components?.pages?.length > 0) {
      const largeComponents = report.components.pages.filter(
        (comp: { name: string; size?: string; loadTime?: string }) => {
          const sizeKB = parseFloat(comp.size?.replace(" KB", "") || "0");
          return sizeKB > 100;
        },
      );

      largeComponents.forEach((comp: { name: string; size?: string; loadTime?: string }) => {
        optimizations.push({
          type: "Component Size",
          suggestion: `Code split ${comp.name}`,
          impact: "Moyen",
          details: `Taille: ${comp.size}, Temps: ${comp.loadTime}`,
        });
      });
    }

    logger.info("💡 Opportunités d'optimisation", "performance", optimizations);

    console.group("💡 Opportunités d'Optimisation");
    if (optimizations.length > 0) {
      console.table(optimizations);
    } else {
      console.log("✅ Aucune opportunité critique détectée");
    }
    console.groupEnd();

    return optimizations;
  }
}

// Instance globale
export const performanceAnalyzer = new PerformanceAnalyzer();

// Exposer dans la console pour utilisation manuelle
if (typeof window !== "undefined") {
  (
    window as Window & {
      analyzePerformance?: () => Promise<{
        report: unknown;
        optimizations: Array<{ type: string; suggestion: string; impact: string; details: string }>;
      }>;
    }
  ).analyzePerformance = () => {
    return performanceAnalyzer.generateReport().then((report) => {
      const optimizations = performanceAnalyzer.identifyOptimizations(report);
      return { report, optimizations };
    });
  };

  // Auto-analyse désactivée pour réduire les logs en console
  // Pour activer manuellement : window.analyzePerformance()
  // window.addEventListener("load", () => {
  //   setTimeout(() => {
  //     performanceAnalyzer.generateReport().then((report) => {
  //       performanceAnalyzer.identifyOptimizations(report);
  //     });
  //   }, 2000);
  // });
}
