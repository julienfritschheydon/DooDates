/**
 * Système de Métriques de Qualité pour Tests Gemini
 * Scoring, alertes et suivi de régression
 */

export interface QualityMetrics {
  totalScore: number;
  maxScore: number;
  percentage: number;
  passedTests: number;
  totalTests: number;
  categoryScores: Record<string, number>;
  regressionScore?: number;
  timestamp: string;
}

export interface QualityAlert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  threshold: number;
  currentValue: number;
}

export interface RegressionData {
  previousScore: number;
  currentScore: number;
  difference: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export class QualityTracker {
  private readonly CRITICAL_THRESHOLD = 42; // Score minimum 42/60
  private readonly WARNING_THRESHOLD = 48;  // Score d'alerte 48/60
  private readonly EXCELLENT_THRESHOLD = 54; // Score excellent 54/60

  /**
   * Calcule les métriques de qualité globales
   */
  calculateMetrics(testResults: any[], testCases: any[]): QualityMetrics {
    const totalScore = testResults.reduce((sum, result) => sum + result.score, 0);
    const maxScore = testCases.reduce((sum, testCase) => sum + testCase.weight, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);
    const passedTests = testResults.filter(r => r.passed).length;

    // Calcul des scores par catégorie
    const categoryScores: Record<string, number> = {};
    const categoryTotals: Record<string, number> = {};
    
    testResults.forEach(result => {
      const testCase = testCases.find(t => t.id === result.testId);
      if (testCase && testCase.category) {
        categoryScores[testCase.category] = (categoryScores[testCase.category] || 0) + result.score;
        categoryTotals[testCase.category] = (categoryTotals[testCase.category] || 0) + testCase.weight;
      }
    });

    // Normaliser les scores par catégorie (en pourcentage)
    Object.keys(categoryScores).forEach(category => {
      categoryScores[category] = Math.round((categoryScores[category] / categoryTotals[category]) * 100);
    });

    return {
      totalScore,
      maxScore,
      percentage,
      passedTests,
      totalTests: testResults.length,
      categoryScores,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Génère les alertes de qualité
   */
  generateAlerts(metrics: QualityMetrics): QualityAlert[] {
    const alerts: QualityAlert[] = [];

    // Alerte critique : score < 42/60
    if (metrics.totalScore < this.CRITICAL_THRESHOLD) {
      alerts.push({
        type: 'critical',
        message: 'Score critique détecté - Révision urgente du prompt Gemini requise',
        threshold: this.CRITICAL_THRESHOLD,
        currentValue: metrics.totalScore
      });
    }

    // Alerte warning : score < 48/60
    else if (metrics.totalScore < this.WARNING_THRESHOLD) {
      alerts.push({
        type: 'warning',
        message: 'Score sous le seuil d\'alerte - Améliorations recommandées',
        threshold: this.WARNING_THRESHOLD,
        currentValue: metrics.totalScore
      });
    }

    // Alerte info : score excellent
    else if (metrics.totalScore >= this.EXCELLENT_THRESHOLD) {
      alerts.push({
        type: 'info',
        message: 'Score excellent atteint - Qualité optimale maintenue',
        threshold: this.EXCELLENT_THRESHOLD,
        currentValue: metrics.totalScore
      });
    }

    // Alertes par catégorie
    Object.entries(metrics.categoryScores).forEach(([category, score]) => {
      if (score < 70) {
        alerts.push({
          type: 'warning',
          message: `Catégorie "${category}" sous-performante (${score}%)`,
          threshold: 70,
          currentValue: score
        });
      }
    });

    // Alerte taux de réussite
    const successRate = (metrics.passedTests / metrics.totalTests) * 100;
    if (successRate < 80) {
      alerts.push({
        type: 'critical',
        message: `Taux de réussite critique (${Math.round(successRate)}%)`,
        threshold: 80,
        currentValue: Math.round(successRate)
      });
    }

    return alerts;
  }

  /**
   * Analyse de régression par rapport aux tests précédents
   */
  async analyzeRegression(currentMetrics: QualityMetrics): Promise<RegressionData | null> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const historyPath = 'tests/reports/metrics-history.json';
      
      if (!fs.existsSync(historyPath)) {
        // Premier run, pas de données historiques
        await this.saveMetricsHistory(currentMetrics);
        return null;
      }

      const historyData = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      const previousMetrics = historyData.latest;
      
      if (!previousMetrics) {
        await this.saveMetricsHistory(currentMetrics);
        return null;
      }

      const difference = currentMetrics.totalScore - previousMetrics.totalScore;
      let trend: 'improving' | 'stable' | 'degrading';
      
      if (Math.abs(difference) <= 2) {
        trend = 'stable';
      } else if (difference > 0) {
        trend = 'improving';
      } else {
        trend = 'degrading';
      }

      const regressionData: RegressionData = {
        previousScore: previousMetrics.totalScore,
        currentScore: currentMetrics.totalScore,
        difference,
        trend
      };

      // Mettre à jour l'historique
      await this.saveMetricsHistory(currentMetrics, regressionData);

      return regressionData;

    } catch (error) {
      console.error('Erreur lors de l\'analyse de régression:', error);
      return null;
    }
  }

  /**
   * Sauvegarde l'historique des métriques
   */
  private async saveMetricsHistory(metrics: QualityMetrics, regression?: RegressionData): Promise<void> {
    try {
      const fs = await import('fs');
      const fsp = fs.promises;
      
      const historyPath = 'tests/reports/metrics-history.json';
      
      let historyData: any = {
        history: [],
        latest: null
      };

      // Lire l'historique existant
      if (fs.existsSync(historyPath)) {
        historyData = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      }

      // Ajouter les nouvelles métriques
      const entry = {
        ...metrics,
        regression
      };

      historyData.history.push(entry);
      historyData.latest = metrics;

      // Garder seulement les 50 derniers runs
      if (historyData.history.length > 50) {
        historyData.history = historyData.history.slice(-50);
      }

      // Créer le dossier s'il n'existe pas
      await fsp.mkdir('tests/reports', { recursive: true });
      
      await fsp.writeFile(historyPath, JSON.stringify(historyData, null, 2), 'utf8');

    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique:', error);
    }
  }

  /**
   * Génère un rapport de qualité complet
   */
  generateQualityReport(metrics: QualityMetrics, alerts: QualityAlert[], regression?: RegressionData): string {
    let report = `# 📊 Rapport de Qualité Tests Gemini\n\n`;
    
    // Score global
    report += `## 🎯 Score Global\n\n`;
    report += `**${metrics.totalScore}/${metrics.maxScore}** (${metrics.percentage}%)\n\n`;
    
    // Évaluation qualitative
    if (metrics.percentage >= 90) {
      report += `✅ **EXCELLENT** - Prêt pour production\n\n`;
    } else if (metrics.percentage >= 80) {
      report += `🟢 **TRÈS BON** - Qualité optimale\n\n`;
    } else if (metrics.percentage >= 70) {
      report += `🟡 **BON** - Améliorations mineures\n\n`;
    } else {
      report += `🔴 **INSUFFISANT** - Action requise\n\n`;
    }

    // Taux de réussite
    const successRate = Math.round((metrics.passedTests / metrics.totalTests) * 100);
    report += `**Taux de réussite:** ${metrics.passedTests}/${metrics.totalTests} (${successRate}%)\n\n`;

    // Analyse de régression
    if (regression) {
      report += `## 📈 Analyse de Tendance\n\n`;
      const trendIcon = regression.trend === 'improving' ? '📈' : 
                        regression.trend === 'degrading' ? '📉' : '➡️';
      report += `${trendIcon} **Tendance:** ${regression.trend}\n`;
      report += `**Évolution:** ${regression.difference > 0 ? '+' : ''}${regression.difference} points\n`;
      report += `**Score précédent:** ${regression.previousScore}\n\n`;
    }

    // Scores par catégorie
    report += `## 📋 Scores par Catégorie\n\n`;
    Object.entries(metrics.categoryScores).forEach(([category, score]) => {
      const icon = score >= 80 ? '✅' : score >= 70 ? '🟡' : '❌';
      report += `${icon} **${category}:** ${score}%\n`;
    });
    report += `\n`;

    // Alertes
    if (alerts.length > 0) {
      report += `## 🚨 Alertes\n\n`;
      alerts.forEach(alert => {
        const icon = alert.type === 'critical' ? '🔴' : 
                     alert.type === 'warning' ? '🟡' : '🔵';
        report += `${icon} **${alert.type.toUpperCase()}:** ${alert.message}\n`;
      });
      report += `\n`;
    }

    // Recommandations
    report += `## 💡 Recommandations\n\n`;
    if (metrics.percentage < 70) {
      report += `- 🔧 Réviser les prompts Gemini en priorité\n`;
      report += `- 📝 Analyser les tests en échec pour identifier les patterns\n`;
      report += `- 🧪 Ajouter des cas de tests spécifiques pour les zones problématiques\n`;
    } else if (metrics.percentage < 85) {
      report += `- ⚡ Optimiser les contraintes temporelles\n`;
      report += `- 🎯 Améliorer la détection des mots-clés\n`;
      report += `- 📊 Maintenir le monitoring continu\n`;
    } else {
      report += `- ✅ Qualité excellente maintenue\n`;
      report += `- 🔄 Continuer le suivi automatisé\n`;
      report += `- 📈 Envisager l'ajout de nouveaux cas de tests\n`;
    }

    return report;
  }

  /**
   * Vérifie si les seuils critiques sont atteints
   */
  checkCriticalThresholds(metrics: QualityMetrics): boolean {
    return metrics.totalScore >= this.CRITICAL_THRESHOLD && 
           (metrics.passedTests / metrics.totalTests) >= 0.8;
  }
} 