#!/usr/bin/env node

/**
 * Script simple pour générer le rapport après les tests
 */

import { QualityTracker } from './quality-metrics.js';
import * as fs from 'fs';

async function generateSimpleReport() {
  try {
    console.log('📊 Génération du rapport de qualité...');
    
    const qualityTracker = new QualityTracker();
    
    // Simuler des résultats pour la démonstration
    const mockResults = Array.from({ length: 15 }, (_, i) => ({
      testId: i + 1,
      passed: Math.random() > 0.3, // 70% de succès simulé
      score: Math.random() * 4,
      details: `Test ${i + 1} - Simulation`
    }));

    const mockTestCases = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      category: i < 5 ? 'Réunions' : i < 10 ? 'Événements' : 'Formations',
      weight: 4
    }));

    const metrics = qualityTracker.calculateMetrics(mockResults, mockTestCases);
    const alerts = qualityTracker.generateAlerts(metrics);
    const regression = await qualityTracker.analyzeRegression(metrics);

    const report = qualityTracker.generateQualityReport(metrics, alerts, regression || undefined);

    // Créer le dossier s'il n'existe pas
    await fs.promises.mkdir('tests/reports', { recursive: true });
    
    // Sauvegarder le rapport
    await fs.promises.writeFile('tests/reports/quality-report.md', report, 'utf8');

    console.log('✅ Rapport généré : tests/reports/quality-report.md');
    console.log(`📊 Score : ${metrics.totalScore}/${metrics.maxScore} (${metrics.percentage}%)`);

  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  generateSimpleReport();
} 