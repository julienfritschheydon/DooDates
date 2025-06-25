/**
 * Tests Automatisés Gemini - Suite Complète
 * Validation de l'IA conversationnelle avec métriques de qualité
 */

import { GeminiService } from '../src/lib/gemini';

interface TestCase {
  id: number;
  category: string;
  input: string;
  expectedType: string;
  expectedDayConstraints?: string[];
  expectedTimeConstraints?: { start?: string; end?: string };
  requiredWords?: string[];
  weight: number;
}

interface TestResult {
  testId: number;
  passed: boolean;
  score: number;
  details: string;
  response?: any;
}

describe('Tests Automatisés Gemini', () => {
  let geminiService: GeminiService;
  let testResults: TestResult[] = [];

  // 15 cas de tests définis selon les spécifications
  const testCases: TestCase[] = [
    // Tests prompts IA - Réunions (5 tests)
    {
      id: 1,
      category: 'Réunions',
      input: 'Organise une réunion d\'équipe lundi matin la semaine prochaine',
      expectedType: 'datetime',
      expectedDayConstraints: ['lundi'],
      expectedTimeConstraints: { start: '08:00', end: '12:00' },
      requiredWords: ['réunion', 'équipe'],
      weight: 4
    },
    {
      id: 2,
      category: 'Réunions',
      input: 'Créé un sondage pour un point mensuel mardi ou mercredi après-midi',
      expectedType: 'datetime',
      expectedDayConstraints: ['mardi', 'mercredi'],
      expectedTimeConstraints: { start: '12:00', end: '18:00' },
      requiredWords: ['point', 'mensuel'],
      weight: 4
    },
    {
      id: 3,
      category: 'Réunions',
      input: 'Planifie un entretien client vendredi entre 14h et 17h',
      expectedType: 'datetime',
      expectedDayConstraints: ['vendredi'],
      expectedTimeConstraints: { start: '14:00', end: '17:00' },
      requiredWords: ['entretien', 'client'],
      weight: 4
    },
    {
      id: 4,
      category: 'Réunions',
      input: 'Trouve un créneau pour une visioconférence avec les partenaires cette semaine',
      expectedType: 'datetime',
      expectedDayConstraints: ['semaine'],
      requiredWords: ['visioconférence', 'partenaires'],
      weight: 4
    },
    {
      id: 5,
      category: 'Réunions',
      input: 'Organise une réunion de suivi projet tous les jeudis matin',
      expectedType: 'datetime',
      expectedDayConstraints: ['jeudi'],
      expectedTimeConstraints: { start: '08:00', end: '12:00' },
      requiredWords: ['suivi', 'projet'],
      weight: 4
    },

    // Tests prompts IA - Événements (5 tests)
    {
      id: 6,
      category: 'Événements',
      input: 'Créé un sondage pour un déjeuner d\'équipe ce weekend',
      expectedType: 'date',
      expectedDayConstraints: ['samedi', 'dimanche'],
      requiredWords: ['déjeuner', 'équipe'],
      weight: 4
    },
    {
      id: 7,
      category: 'Événements',
      input: 'Planifie une soirée entre amis samedi soir',
      expectedType: 'datetime',
      expectedDayConstraints: ['samedi'],
      expectedTimeConstraints: { start: '18:00', end: '23:59' },
      requiredWords: ['soirée', 'amis'],
      weight: 4
    },
    {
      id: 8,
      category: 'Événements',
      input: 'Organise un événement de team building la semaine prochaine',
      expectedType: 'date',
      expectedDayConstraints: ['semaine'],
      requiredWords: ['team building'],
      weight: 4
    },
    {
      id: 9,
      category: 'Événements',
      input: 'Trouve une date pour célébrer l\'anniversaire de Marie en décembre',
      expectedType: 'date',
      requiredWords: ['anniversaire', 'Marie'],
      weight: 4
    },
    {
      id: 10,
      category: 'Événements',
      input: 'Créé un sondage pour un barbecue dimanche après-midi',
      expectedType: 'datetime',
      expectedDayConstraints: ['dimanche'],
      expectedTimeConstraints: { start: '12:00', end: '18:00' },
      requiredWords: ['barbecue'],
      weight: 4
    },

    // Tests prompts IA - Formations (5 tests)
    {
      id: 11,
      category: 'Formations',
      input: 'Planifie une formation sécurité mardi matin 2h',
      expectedType: 'datetime',
      expectedDayConstraints: ['mardi'],
      expectedTimeConstraints: { start: '08:00', end: '12:00' },
      requiredWords: ['formation', 'sécurité'],
      weight: 4
    },
    {
      id: 12,
      category: 'Formations',
      input: 'Organise un atelier créatif mercredi après-midi 3h',
      expectedType: 'datetime',
      expectedDayConstraints: ['mercredi'],
      expectedTimeConstraints: { start: '12:00', end: '18:00' },
      requiredWords: ['atelier', 'créatif'],
      weight: 4
    },
    {
      id: 13,
      category: 'Formations',
      input: 'Créé un sondage pour une session de brainstorming vendredi',
      expectedType: 'date',
      expectedDayConstraints: ['vendredi'],
      requiredWords: ['brainstorming'],
      weight: 4
    },
    {
      id: 14,
      category: 'Formations',
      input: 'Planifie un webinaire technique lundi ou mardi entre 10h et 12h',
      expectedType: 'datetime',
      expectedDayConstraints: ['lundi', 'mardi'],
      expectedTimeConstraints: { start: '10:00', end: '12:00' },
      requiredWords: ['webinaire', 'technique'],
      weight: 4
    },
    {
      id: 15,
      category: 'Formations',
      input: 'Trouve un créneau pour une formation Excel cette semaine',
      expectedType: 'datetime',
      expectedDayConstraints: ['semaine'],
      expectedTimeConstraints: { start: '08:00', end: '18:00' },
      requiredWords: ['formation', 'Excel'],
      weight: 4
    }
  ];

  beforeAll(async () => {
    geminiService = GeminiService.getInstance();
    console.log('🚀 Initialisation des tests automatisés Gemini');
  });

  afterAll(async () => {
    // Générer le rapport final
    await generateReport();
  });

  // Tests individuels
  testCases.forEach((testCase) => {
    test(`Test ${testCase.id}: ${testCase.category} - ${testCase.input.substring(0, 50)}...`, async () => {
      const result = await runSingleTest(testCase);
      testResults.push(result);
      
      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(2.8); // 70% minimum par test
    }, 30000);
  });

  async function runSingleTest(testCase: TestCase): Promise<TestResult> {
    try {
      const response = await geminiService.generatePollFromText(testCase.input);
      
      if (!response.success || !response.data) {
        return {
          testId: testCase.id,
          passed: false,
          score: 0,
          details: `Échec génération: ${response.message}`
        };
      }

      const score = calculateTestScore(testCase, response.data);
      const passed = score >= 2.8; // 70% du score max (4 points)

      return {
        testId: testCase.id,
        passed,
        score,
        details: `Score: ${score}/4 - ${passed ? 'RÉUSSI' : 'ÉCHEC'}`,
        response: response.data
      };

    } catch (error) {
      return {
        testId: testCase.id,
        passed: false,
        score: 0,
        details: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  function calculateTestScore(testCase: TestCase, response: any): number {
    let score = 0;
    const maxScore = testCase.weight;

    // 1. Validation du type (1 point)
    if (response.type === testCase.expectedType) {
      score += 1;
    }

    // 2. Validation des contraintes de jours (1 point)
    if (testCase.expectedDayConstraints) {
      const dayScore = validateDayConstraints(testCase, response);
      score += dayScore;
    } else {
      score += 1; // Pas de contrainte = point accordé
    }

    // 3. Validation des contraintes horaires (1 point)
    if (testCase.expectedTimeConstraints) {
      const timeScore = validateTimeConstraints(testCase, response);
      score += timeScore;
    } else {
      score += 1; // Pas de contrainte = point accordé
    }

    // 4. Validation du contenu du titre (1 point)
    if (testCase.requiredWords) {
      const contentScore = validateRequiredWords(testCase, response);
      score += contentScore;
    }

    return Math.min(score, maxScore);
  }

  function validateDayConstraints(testCase: TestCase, response: any): number {
    if (!testCase.expectedDayConstraints || !response.dates) return 0;

    const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    let validDays = 0;
    let totalDays = response.dates.length;

    for (const dateStr of response.dates) {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      const dayName = dayNames[dayOfWeek];

      if (testCase.expectedDayConstraints.includes(dayName) || 
          testCase.expectedDayConstraints.includes('semaine') && dayOfWeek >= 1 && dayOfWeek <= 5) {
        validDays++;
      }
    }

    return totalDays > 0 ? (validDays / totalDays) : 0;
  }

  function validateTimeConstraints(testCase: TestCase, response: any): number {
    if (!testCase.expectedTimeConstraints || !response.timeSlots) return 1;

    let validSlots = 0;
    let totalSlots = response.timeSlots.length;

    for (const slot of response.timeSlots) {
      const startHour = parseInt(slot.start.split(':')[0]);
      const endHour = parseInt(slot.end.split(':')[0]);

      const expectedStart = testCase.expectedTimeConstraints.start ? 
        parseInt(testCase.expectedTimeConstraints.start.split(':')[0]) : 0;
      const expectedEnd = testCase.expectedTimeConstraints.end ? 
        parseInt(testCase.expectedTimeConstraints.end.split(':')[0]) : 24;

      if (startHour >= expectedStart && endHour <= expectedEnd) {
        validSlots++;
      }
    }

    return totalSlots > 0 ? (validSlots / totalSlots) : 0;
  }

  function validateRequiredWords(testCase: TestCase, response: any): number {
    if (!testCase.requiredWords || !response.title) return 0;

    const title = response.title.toLowerCase();
    let foundWords = 0;

    for (const word of testCase.requiredWords) {
      if (title.includes(word.toLowerCase())) {
        foundWords++;
      }
    }

    return foundWords / testCase.requiredWords.length;
  }

  async function generateReport(): Promise<void> {
    const totalScore = testResults.reduce((sum, result) => sum + result.score, 0);
    const maxPossibleScore = testCases.reduce((sum, testCase) => sum + testCase.weight, 0);
    const percentage = Math.round((totalScore / maxPossibleScore) * 100);
    
    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;

    console.log('\n📊 RAPPORT FINAL DES TESTS AUTOMATISÉS GEMINI');
    console.log('='.repeat(60));
    console.log(`Score final: ${totalScore}/${maxPossibleScore} (${percentage}%)`);
    console.log(`Tests réussis: ${passedTests}/${totalTests}`);
    console.log(`Objectif minimum: 42/60 (70%) - ${percentage >= 70 ? '✅ ATTEINT' : '❌ NON ATTEINT'}`);

    // Générer le rapport Markdown
    const reportPath = 'tests/reports/gemini-test-report.md';
    await generateMarkdownReport(reportPath, testResults, totalScore, maxPossibleScore);
  }

  async function generateMarkdownReport(path: string, results: TestResult[], totalScore: number, maxScore: number): Promise<void> {
    const fs = await import('fs');
    const fsp = fs.promises;
    
    const percentage = Math.round((totalScore / maxScore) * 100);
    const timestamp = new Date().toISOString();
    
    let reportContent = `# Rapport Tests Automatisés Gemini\n\n`;
    reportContent += `**Date:** ${timestamp}\n`;
    reportContent += `**Score Final:** ${totalScore}/${maxScore} (${percentage}%)\n`;
    reportContent += `**Tests réussis:** ${results.filter(r => r.passed).length}/${results.length}\n\n`;
    
    reportContent += `## 🎯 Évaluation Qualité\n\n`;
    if (percentage >= 90) {
      reportContent += `✅ **EXCELLENT** (${percentage}%) - Prêt pour production\n\n`;
    } else if (percentage >= 80) {
      reportContent += `🟢 **TRÈS BON** (${percentage}%) - Quelques ajustements mineurs\n\n`;
    } else if (percentage >= 70) {
      reportContent += `🟡 **BON** (${percentage}%) - Améliorations nécessaires\n\n`;
    } else {
      reportContent += `🔴 **INSUFFISANT** (${percentage}%) - Révision du prompt requise\n\n`;
    }
    
    reportContent += `## 📋 Détail des Tests\n\n`;
    reportContent += `| Test | Catégorie | Score | Status | Détails |\n`;
    reportContent += `|------|-----------|--------|--------|---------|\n`;
    
    for (const result of results) {
      const testCase = testCases.find(t => t.id === result.testId);
      const status = result.passed ? '✅' : '❌';
      reportContent += `| ${result.testId} | ${testCase?.category || 'N/A'} | ${result.score}/4 | ${status} | ${result.details} |\n`;
    }
    
    reportContent += `\n## 📈 Recommandations\n\n`;
    if (percentage < 70) {
      reportContent += `- Réviser les prompts Gemini pour améliorer la précision\n`;
      reportContent += `- Analyser les tests en échec pour identifier les patterns\n`;
      reportContent += `- Tester avec des variations de formulation\n`;
    } else if (percentage < 90) {
      reportContent += `- Peaufiner les contraintes temporelles\n`;
      reportContent += `- Améliorer la détection des mots-clés\n`;
    }
    reportContent += `- Continuer le monitoring automatisé\n`;
    
    // Créer le dossier reports s'il n'existe pas
    try {
      await fsp.mkdir('tests/reports', { recursive: true });
    } catch (error) {
      // Le dossier existe déjà
    }
    
    await fsp.writeFile(path, reportContent, 'utf8');
    console.log(`📄 Rapport généré: ${path}`);
  }
}); 