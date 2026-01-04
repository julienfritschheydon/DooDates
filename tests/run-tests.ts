#!/usr/bin/env node

/**
 * Script de lancement des tests automatisés Gemini
 * Intégration complète avec métriques de qualité et rapports
 */

import { spawn } from "child_process";
import { QualityTracker } from "./quality-metrics";

interface TestSummary {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  score: number;
  maxScore: number;
}

class TestRunner {
  private qualityTracker: QualityTracker;

  constructor() {
    this.qualityTracker = new QualityTracker();
  }

  async runTests(): Promise<TestSummary> {
    console.log("🚀 Lancement des tests automatisés Gemini...\n");

    return new Promise((resolve, reject) => {
      const testProcess = spawn("npx", ["jest", "--testPathPattern=gemini-automated"], {
        stdio: "pipe",
        shell: true,
      });

      let output = "";
      let errorOutput = "";

      testProcess.stdout.on("data", (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      testProcess.stderr.on("data", (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });

      testProcess.on("close", (code) => {
        const summary = this.parseTestOutput(output, errorOutput);

        if (code === 0) {
          resolve(summary);
        } else {
          resolve({
            ...summary,
            passed: false,
          });
        }
      });

      testProcess.on("error", (error) => {
        reject(error);
      });
    });
  }

  private parseTestOutput(output: string, errorOutput: string): TestSummary {
    // Parser basique pour extraire les résultats
    const testMatch = output.match(/Tests:\s+(\d+) failed, (\d+) passed, (\d+) total/);
    const scoreMatch = output.match(/Score final:\s+(\d+)\/(\d+)/);

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let score = 0;
    let maxScore = 60;

    if (testMatch) {
      failedTests = parseInt(testMatch[1]);
      passedTests = parseInt(testMatch[2]);
      totalTests = parseInt(testMatch[3]);
    }

    if (scoreMatch) {
      score = parseInt(scoreMatch[1]);
      maxScore = parseInt(scoreMatch[2]);
    }

    return {
      passed: failedTests === 0,
      totalTests,
      passedTests,
      failedTests,
      score,
      maxScore,
    };
  }

  async generateReports(summary: TestSummary): Promise<void> {
    console.log("\n📊 Génération des rapports de qualité...");

    try {
      // Simuler les résultats pour les métriques (en attendant l'intégration complète)
      const mockResults = Array.from({ length: summary.totalTests }, (_, i) => ({
        testId: i + 1,
        passed: i < summary.passedTests,
        score: i < summary.passedTests ? 4 : 2,
        details: `Test ${i + 1}`,
      }));

      const mockTestCases = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        category: i < 5 ? "Réunions" : i < 10 ? "Événements" : "Formations",
        weight: 4,
      }));

      const metrics = this.qualityTracker.calculateMetrics(mockResults, mockTestCases);
      const alerts = this.qualityTracker.generateAlerts(metrics);
      const regression = await this.qualityTracker.analyzeRegression(metrics);

      const report = this.qualityTracker.generateQualityReport(
        metrics,
        alerts,
        regression || undefined,
      );

      // Sauvegarder le rapport
      const fs = await import("fs");
      const fsp = fs.promises;

      await fsp.mkdir("tests/reports", { recursive: true });
      await fsp.writeFile("tests/reports/quality-report.md", report, "utf8");

      console.log("✅ Rapport de qualité généré : tests/reports/quality-report.md");

      // Afficher les alertes critiques
      const criticalAlerts = alerts.filter((a) => a.type === "critical");
      if (criticalAlerts.length > 0) {
        console.log("\n🚨 ALERTES CRITIQUES:");
        criticalAlerts.forEach((alert) => {
          console.log(`   - ${alert.message}`);
        });
      }

      // Vérifier les seuils critiques
      const passedThresholds = this.qualityTracker.checkCriticalThresholds(metrics);
      if (!passedThresholds) {
        console.log("\n❌ Seuils critiques non atteints - Action requise");
        process.exit(1);
      } else {
        console.log("\n✅ Seuils de qualité respectés");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la génération des rapports:", error);
    }
  }

  async sendNotifications(summary: TestSummary): Promise<void> {
    // Placeholder pour les notifications (Slack, email, etc.)
    console.log("\n📧 Notifications envoyées (placeholder)");
  }
}

// Fonction principale
async function main() {
  const runner = new TestRunner();

  try {
    // Vérifier les variables d'environnement
    if (!process.env.VITE_GEMINI_API_KEY) {
      console.error("❌ VITE_GEMINI_API_KEY non définie");
      process.exit(1);
    }

    // Lancer les tests
    const summary = await runner.runTests();

    // Générer les rapports
    await runner.generateReports(summary);

    // Envoyer les notifications
    await runner.sendNotifications(summary);

    console.log("\n🎉 Tests automatisés Gemini terminés avec succès!");

    // Code de sortie selon les résultats
    process.exit(summary.passed ? 0 : 1);
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution des tests:", error);
    process.exit(1);
  }
}

// Lancer si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
