/**
 * Tests Automatisés Gemini - Suite Complète
 * Validation de l'IA conversationnelle avec métriques de qualité
 */

import { GeminiService } from "../src/lib/gemini";

interface TestCase {
  id: number;
  category: string;
  input: string;
  expectedType: string; // 'date' | 'datetime' | 'form'
  // Pour Date Polls
  expectedDayConstraints?: string[];
  expectedTimeConstraints?: { start?: string; end?: string };
  // Pour Form Polls
  expectedQuestionTypes?: string[]; // Types de questions attendus (single, multiple, text, rating, nps, matrix)
  minQuestions?: number;
  maxQuestions?: number;
  expectedValidationTypes?: string[]; // email, phone, url, etc.
  // Commun
  requiredWords?: string[];
  weight: number;
}

interface TestResult {
  testId: number;
  passed: boolean;
  score: number;
  details: string;
  response?: any;
  scoreBreakdown?: {
    type: { passed: boolean; expected: string; actual: string };
    dayConstraints: { passed: boolean; score: number; expected?: string[]; actual?: string[] };
    timeConstraints: {
      passed: boolean;
      score: number;
      expected?: { start?: string; end?: string };
      actual?: any;
    };
    requiredWords: {
      passed: boolean;
      score: number;
      expected?: string[];
      found?: string[];
      missing?: string[];
    };
  };
}

describe("Tests Automatisés Gemini", () => {
  let geminiService: GeminiService;
  const testResults: TestResult[] = [];

  // Tests Gemini : Date Polls + Form Polls
  const testCases: TestCase[] = [
    // 🔥 TESTS BUG #1: Parsing dates avec mois explicite (Tests du jour - 20/11/2025)
    {
      id: 1,
      category: "Bug #1 - Mois Explicite",
      input: "Crée un sondage pour un week-end jeux. Ajoute tous les samedis de mars 2026",
      expectedType: "date",
      expectedDayConstraints: ["samedi"],
      requiredWords: ["week-end", "jeux"],
      weight: 4,
    },
    {
      id: 2,
      category: "Bug #1 - Mois Explicite",
      input: "Organise une réunion le 7 mars 2026",
      expectedType: "date",
      expectedDayConstraints: [],
      requiredWords: ["réunion"],
      weight: 4,
    },
    {
      id: 3,
      category: "Bug #1 - Mois Explicite",
      input: "Planifie un événement tous les samedis de mai 2026",
      expectedType: "date",
      expectedDayConstraints: ["samedi"],
      requiredWords: ["événement"],
      weight: 4,
    },
    {
      id: 4,
      category: "Bug #1 - Mois Explicite",
      input: "Crée un sondage pour les dimanches de décembre 2025",
      expectedType: "date",
      expectedDayConstraints: ["dimanche"],
      requiredWords: [],
      weight: 4,
    },
    {
      id: 5,
      category: "Bug #1 - Référence Correcte",
      input: "Ajoute le 15 janvier 2026",
      expectedType: "date",
      expectedDayConstraints: [],
      requiredWords: [],
      weight: 4,
    },

    /* TESTS ORIGINAUX COMMENTÉS - À réactiver après validation des corrections
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
      input: 'Trouve un créneau horaire pour une formation Excel cette semaine entre 8h et 18h',
      expectedType: 'datetime',
      expectedDayConstraints: ['semaine'],
      expectedTimeConstraints: { start: '08:00', end: '18:00' },
      requiredWords: ['formation', 'Excel'],
      weight: 4
    },

    // Tests prompts IA - Form Polls (Questionnaires) - 10 tests
    {
      id: 16,
      category: 'Form Polls - Simples',
      input: 'Crée un questionnaire de satisfaction client avec au moins 3 questions : une question à choix unique, une à choix multiples, et une question de réponse libre',
      expectedType: 'form',
      expectedQuestionTypes: ['single', 'multiple', 'text'],
      minQuestions: 3,
      maxQuestions: 10,
      requiredWords: ['satisfaction', 'client'],
      weight: 4
    },
    {
      id: 17,
      category: 'Form Polls - Simples',
      input: 'Fais un sondage d\'opinion sur notre nouveau produit',
      expectedType: 'form',
      expectedQuestionTypes: ['single', 'multiple'],
      minQuestions: 3,
      maxQuestions: 8,
      requiredWords: ['produit'],
      weight: 4
    },
    {
      id: 18,
      category: 'Form Polls - Rating',
      input: 'Crée un questionnaire avec des notes de 1 à 5 pour évaluer notre service',
      expectedType: 'form',
      expectedQuestionTypes: ['rating'],
      minQuestions: 1,
      maxQuestions: 10,
      requiredWords: ['service'],
      weight: 4
    },
    {
      id: 19,
      category: 'Form Polls - NPS',
      input: 'Crée un questionnaire avec une question de type NPS (Net Promoter Score) demandant la probabilité de recommandation de notre service sur une échelle de 0 à 10',
      expectedType: 'form',
      expectedQuestionTypes: ['nps'],
      minQuestions: 1,
      maxQuestions: 5,
      requiredWords: ['recommandation'],
      weight: 4
    },
    {
      id: 20,
      category: 'Form Polls - Matrix',
      input: 'Crée une matrice d\'évaluation pour noter la qualité, le prix et le service',
      expectedType: 'form',
      expectedQuestionTypes: ['matrix'],
      minQuestions: 1,
      maxQuestions: 5,
      requiredWords: ['qualité', 'prix', 'service'],
      weight: 4
    },
    {
      id: 21,
      category: 'Form Polls - Validation',
      input: 'Crée un formulaire de contact avec validation email et téléphone',
      expectedType: 'form',
      expectedQuestionTypes: ['text'],
      expectedValidationTypes: ['email', 'phone'],
      minQuestions: 2,
      maxQuestions: 8,
      requiredWords: ['contact'],
      weight: 4
    },
    {
      id: 22,
      category: 'Form Polls - Mix Types',
      input: 'Crée un questionnaire complet avec choix unique, choix multiples et réponse libre',
      expectedType: 'form',
      expectedQuestionTypes: ['single', 'multiple', 'text'],
      minQuestions: 3,
      maxQuestions: 10,
      requiredWords: [],
      weight: 4
    },
    {
      id: 23,
      category: 'Form Polls - Event',
      input: 'Crée un questionnaire pour recueillir les préférences des participants : type de nourriture préféré, horaire préféré, et allergies alimentaires',
      expectedType: 'form',
      expectedQuestionTypes: ['single', 'multiple', 'text'],
      minQuestions: 3,
      maxQuestions: 8,
      requiredWords: [],
      weight: 4
    },
    {
      id: 24,
      category: 'Form Polls - Feedback',
      input: 'Crée un formulaire de feedback avec évaluation par étoiles et commentaires',
      expectedType: 'form',
      expectedQuestionTypes: ['rating', 'text'],
      minQuestions: 2,
      maxQuestions: 6,
      requiredWords: ['feedback'],
      weight: 4
    },
    {
      id: 25,
      category: 'Form Polls - Complex',
      input: 'Crée un questionnaire d\'enquête client avec : une matrice d\'évaluation pour noter plusieurs aspects, des questions de choix multiples avec maximum 3 réponses, et une question email avec validation',
      expectedType: 'form',
      expectedQuestionTypes: ['matrix', 'multiple', 'text'],
      expectedValidationTypes: ['email'],
      minQuestions: 3,
      maxQuestions: 10,
      requiredWords: ['client'],
      weight: 4
    }
    */ // FIN DES TESTS ORIGINAUX COMMENTÉS
  ];

  beforeAll(async () => {
    geminiService = GeminiService.getInstance();
    console.log("🚀 Initialisation des tests automatisés Gemini");

    // Vérifier la configuration
    const geminiApiKey = process.env.VITE_GEMINI_API_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const useDirectGemini = process.env.VITE_USE_DIRECT_GEMINI === "true";

    console.log("📋 Configuration détectée:");
    console.log(`  - VITE_GEMINI_API_KEY: ${geminiApiKey ? "✅ Présente" : "❌ Manquante"}`);
    console.log(`  - VITE_SUPABASE_URL: ${supabaseUrl ? "✅ Présente" : "❌ Manquante"}`);
    console.log(`  - VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "✅ Présente" : "❌ Manquante"}`);
    console.log(`  - Mode: ${useDirectGemini ? "DIRECT API" : "EDGE FUNCTION"}`);

    // En mode Edge Function, vérifier que Supabase est configuré
    if (!useDirectGemini && (!supabaseUrl || !supabaseAnonKey)) {
      throw new Error(
        "❌ CONFIGURATION MANQUANTE: VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont requis en mode Edge Function",
      );
    }

    // En mode Direct, vérifier que la clé Gemini est présente
    if (useDirectGemini && !geminiApiKey) {
      throw new Error("❌ CONFIGURATION MANQUANTE: VITE_GEMINI_API_KEY est requise en mode Direct");
    }

    console.log("✅ Configuration validée");
  }, 10000);

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
    }, 45000); // 45s pour Form Polls (plus complexes)
  });

  async function runSingleTest(testCase: TestCase): Promise<TestResult> {
    try {
      const response = await geminiService.generatePollFromText(testCase.input);

      if (!response.success || !response.data) {
        return {
          testId: testCase.id,
          passed: false,
          score: 0,
          details: `Échec génération: ${response.message}`,
        };
      }

      const { totalScore, breakdown } = calculateTestScore(testCase, response.data);
      const passed = totalScore >= 2.8; // 70% du score max (4 points)

      // Construire les détails pour les échecs
      let details = `Score: ${totalScore.toFixed(1)}/4 - ${passed ? "RÉUSSI" : "ÉCHEC"}`;
      if (!passed && breakdown) {
        const failures: string[] = [];
        if (!breakdown.type.passed)
          failures.push(
            `Type: attendu "${breakdown.type.expected}" mais obtenu "${breakdown.type.actual}"`,
          );

        // Détails spécifiques Date Polls
        if (testCase.expectedType !== "form") {
          if (!breakdown.dayConstraints.passed && testCase.expectedDayConstraints) {
            failures.push(
              `Jours: ${breakdown.dayConstraints.score.toFixed(1)}/1 (attendu: ${testCase.expectedDayConstraints.join(", ")})`,
            );
          }
          if (!breakdown.timeConstraints.passed && testCase.expectedTimeConstraints) {
            failures.push(`Horaires: ${breakdown.timeConstraints.score.toFixed(1)}/1`);
          }
        }

        // Détails spécifiques Form Polls
        if (testCase.expectedType === "form" && response.data && response.data.type === "form") {
          const formData = response.data as { questions?: any[] };
          const questionsCount = formData.questions?.length || 0;
          if (testCase.minQuestions && questionsCount < testCase.minQuestions) {
            failures.push(
              `Questions: ${questionsCount} (minimum attendu: ${testCase.minQuestions})`,
            );
          }
          if (testCase.maxQuestions && questionsCount > testCase.maxQuestions) {
            failures.push(
              `Questions: ${questionsCount} (maximum attendu: ${testCase.maxQuestions})`,
            );
          }
          if (testCase.expectedQuestionTypes && testCase.expectedQuestionTypes.length > 0) {
            const actualTypes = formData.questions?.map((q: any) => q.type).filter(Boolean) || [];
            const uniqueActualTypes = [...new Set(actualTypes)];
            const missingTypes = testCase.expectedQuestionTypes.filter(
              (t) => !uniqueActualTypes.includes(t),
            );
            if (missingTypes.length > 0) {
              failures.push(
                `Types de questions manquants: ${missingTypes.join(", ")} (obtenus: ${uniqueActualTypes.join(", ") || "aucun"})`,
              );
            }
          }
          if (testCase.expectedValidationTypes && testCase.expectedValidationTypes.length > 0) {
            const questionsWithValidation =
              formData.questions?.filter(
                (q: any) =>
                  q.validationType && testCase.expectedValidationTypes?.includes(q.validationType),
              ) || [];
            if (questionsWithValidation.length === 0) {
              failures.push(
                `Validations attendues manquantes: ${testCase.expectedValidationTypes.join(", ")}`,
              );
            }
          }
        }

        if (!breakdown.requiredWords.passed && testCase.requiredWords) {
          const missing = breakdown.requiredWords.missing || [];
          if (missing.length > 0) failures.push(`Mots-clés manquants: ${missing.join(", ")}`);
        }
        if (failures.length > 0) {
          details += `\n  - ${failures.join("\n  - ")}`;
        }
      }

      return {
        testId: testCase.id,
        passed,
        score: totalScore,
        details,
        response: response.data,
        scoreBreakdown: breakdown,
      };
    } catch (error) {
      return {
        testId: testCase.id,
        passed: false,
        score: 0,
        details: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      };
    }
  }

  function calculateTestScore(
    testCase: TestCase,
    response: any,
  ): { totalScore: number; breakdown: NonNullable<TestResult["scoreBreakdown"]> } {
    let score = 0;
    const maxScore = testCase.weight;

    // 1. Validation du type (1 point)
    const typePassed = response.type === testCase.expectedType;
    if (typePassed) {
      score += 1;
    }

    // Logique différente selon le type de poll
    if (testCase.expectedType === "form") {
      // VALIDATION FORM POLLS
      let dayConstraints: NonNullable<TestResult["scoreBreakdown"]>["dayConstraints"] = {
        passed: true,
        score: 1,
      };
      let timeConstraints: NonNullable<TestResult["scoreBreakdown"]>["timeConstraints"] = {
        passed: true,
        score: 1,
      };

      // 2. Validation nombre de questions (1 point)
      const questionsCount = response.questions?.length || 0;
      let questionsScore = 1;
      if (testCase.minQuestions || testCase.maxQuestions) {
        const minOk = testCase.minQuestions ? questionsCount >= testCase.minQuestions : true;
        const maxOk = testCase.maxQuestions ? questionsCount <= testCase.maxQuestions : true;
        questionsScore = minOk && maxOk ? 1 : minOk ? 0.5 : 0;
      }
      score += questionsScore;

      // 3. Validation types de questions (1 point)
      let questionTypesScore = 1;
      if (testCase.expectedQuestionTypes && testCase.expectedQuestionTypes.length > 0) {
        const actualTypes = response.questions?.map((q: any) => q.type).filter(Boolean) || [];
        const uniqueActualTypes = [...new Set(actualTypes)];
        const foundTypes = testCase.expectedQuestionTypes.filter((expectedType) =>
          uniqueActualTypes.includes(expectedType),
        );
        questionTypesScore = foundTypes.length / testCase.expectedQuestionTypes.length;
      }
      score += questionTypesScore;

      // 4. Validation validationTypes (email, phone, etc.) - 0.5 point
      let validationScore = 0.5;
      if (testCase.expectedValidationTypes && testCase.expectedValidationTypes.length > 0) {
        const questionsWithValidation =
          response.questions?.filter(
            (q: any) =>
              q.validationType && testCase.expectedValidationTypes?.includes(q.validationType),
          ) || [];
        validationScore = questionsWithValidation.length > 0 ? 0.5 : 0;
      }
      score += validationScore;

      // 5. Validation mots-clés dans le titre (0.5 point)
      let contentScore = 0.5;
      let requiredWords: NonNullable<TestResult["scoreBreakdown"]>["requiredWords"];
      if (testCase.requiredWords && testCase.requiredWords.length > 0) {
        const title = (response.title || "").toLowerCase();
        const found = testCase.requiredWords.filter((w) => title.includes(w.toLowerCase()));
        const missing = testCase.requiredWords.filter((w) => !title.includes(w.toLowerCase()));
        contentScore = (found.length / testCase.requiredWords.length) * 0.5;
        requiredWords = {
          passed: contentScore >= 0.4,
          score: contentScore * 2, // Normaliser sur 1 pour l'affichage
          expected: testCase.requiredWords,
          found: found,
          missing: missing,
        };
      } else {
        requiredWords = { passed: true, score: 1 };
        contentScore = 0.5;
      }
      score += contentScore;

      return {
        totalScore: Math.min(score, maxScore),
        breakdown: {
          type: {
            passed: typePassed,
            expected: testCase.expectedType,
            actual: response.type || "N/A",
          },
          dayConstraints,
          timeConstraints,
          requiredWords,
        },
      };
    } else {
      // VALIDATION DATE POLLS (logique existante)
      // 2. Validation des contraintes de jours (1 point)
      let dayScore = 1;
      let dayConstraints: NonNullable<TestResult["scoreBreakdown"]>["dayConstraints"];
      if (testCase.expectedDayConstraints) {
        dayScore = validateDayConstraints(testCase, response);
        const actualDays =
          response.dates?.map((d: string) => {
            const date = new Date(d);
            const dayNames = [
              "dimanche",
              "lundi",
              "mardi",
              "mercredi",
              "jeudi",
              "vendredi",
              "samedi",
            ];
            return dayNames[date.getDay()];
          }) || [];
        dayConstraints = {
          passed: dayScore >= 0.8,
          score: dayScore,
          expected: testCase.expectedDayConstraints,
          actual: actualDays,
        };
        score += dayScore;
      } else {
        dayConstraints = { passed: true, score: 1 };
        score += 1; // Pas de contrainte = point accordé
      }

      // 3. Validation des contraintes horaires (1 point)
      let timeScore = 1;
      let timeConstraints: NonNullable<TestResult["scoreBreakdown"]>["timeConstraints"];
      if (testCase.expectedTimeConstraints) {
        timeScore = validateTimeConstraints(testCase, response);
        timeConstraints = {
          passed: timeScore >= 0.8,
          score: timeScore,
          expected: testCase.expectedTimeConstraints,
          actual: response.timeSlots,
        };
        score += timeScore;
      } else {
        timeConstraints = { passed: true, score: 1 };
        score += 1; // Pas de contrainte = point accordé
      }

      // 4. Validation du contenu du titre (1 point)
      let contentScore = 1;
      let requiredWords: NonNullable<TestResult["scoreBreakdown"]>["requiredWords"];
      if (testCase.requiredWords) {
        contentScore = validateRequiredWords(testCase, response);
        const title = (response.title || "").toLowerCase();
        const found = testCase.requiredWords.filter((w) => title.includes(w.toLowerCase()));
        const missing = testCase.requiredWords.filter((w) => !title.includes(w.toLowerCase()));
        requiredWords = {
          passed: contentScore >= 0.8,
          score: contentScore,
          expected: testCase.requiredWords,
          found: found,
          missing: missing,
        };
        score += contentScore;
      } else {
        requiredWords = { passed: true, score: 1 };
      }

      return {
        totalScore: Math.min(score, maxScore),
        breakdown: {
          type: {
            passed: typePassed,
            expected: testCase.expectedType,
            actual: response.type || "N/A",
          },
          dayConstraints,
          timeConstraints,
          requiredWords,
        },
      };
    }
  }

  function validateDayConstraints(testCase: TestCase, response: any): number {
    if (!testCase.expectedDayConstraints || !response.dates) return 0;

    const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    let validDays = 0;
    const totalDays = response.dates.length;

    for (const dateStr of response.dates) {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      const dayName = dayNames[dayOfWeek];

      if (
        testCase.expectedDayConstraints.includes(dayName) ||
        (testCase.expectedDayConstraints.includes("semaine") && dayOfWeek >= 1 && dayOfWeek <= 5)
      ) {
        validDays++;
      }
    }

    return totalDays > 0 ? validDays / totalDays : 0;
  }

  function validateTimeConstraints(testCase: TestCase, response: any): number {
    if (!testCase.expectedTimeConstraints || !response.timeSlots) return 1;

    let validSlots = 0;
    const totalSlots = response.timeSlots.length;

    for (const slot of response.timeSlots) {
      const startHour = parseInt(slot.start.split(":")[0]);
      const endHour = parseInt(slot.end.split(":")[0]);

      const expectedStart = testCase.expectedTimeConstraints.start
        ? parseInt(testCase.expectedTimeConstraints.start.split(":")[0])
        : 0;
      const expectedEnd = testCase.expectedTimeConstraints.end
        ? parseInt(testCase.expectedTimeConstraints.end.split(":")[0])
        : 24;

      if (startHour >= expectedStart && endHour <= expectedEnd) {
        validSlots++;
      }
    }

    return totalSlots > 0 ? validSlots / totalSlots : 0;
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

    const passedTests = testResults.filter((r) => r.passed).length;
    const totalTests = testResults.length;

    console.log("\n📊 RAPPORT FINAL DES TESTS AUTOMATISÉS GEMINI");
    console.log("=".repeat(60));
    console.log(`Score final: ${totalScore}/${maxPossibleScore} (${percentage}%)`);
    console.log(`Tests réussis: ${passedTests}/${totalTests}`);
    const minScore = Math.round(maxPossibleScore * 0.7);
    console.log(
      `Objectif minimum: ${minScore}/${maxPossibleScore} (70%) - ${percentage >= 70 ? "✅ ATTEINT" : "❌ NON ATTEINT"}`,
    );

    // Générer le rapport Markdown
    const reportPath = "tests/reports/gemini-test-report.md";
    await generateMarkdownReport(reportPath, testResults, totalScore, maxPossibleScore);
  }

  async function generateMarkdownReport(
    path: string,
    results: TestResult[],
    totalScore: number,
    maxScore: number,
  ): Promise<void> {
    const fs = await import("fs");
    const fsp = fs.promises;

    const percentage = Math.round((totalScore / maxScore) * 100);
    const timestamp = new Date().toISOString();

    let reportContent = `# Rapport Tests Automatisés Gemini\n\n`;
    reportContent += `**Date:** ${timestamp}\n`;
    reportContent += `**Score Final:** ${totalScore}/${maxScore} (${percentage}%)\n`;
    reportContent += `**Tests réussis:** ${results.filter((r) => r.passed).length}/${results.length}\n\n`;

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
      const testCase = testCases.find((t) => t.id === result.testId);
      const status = result.passed ? "✅" : "❌";
      reportContent += `| ${result.testId} | ${testCase?.category || "N/A"} | ${result.score.toFixed(1)}/4 | ${status} | ${result.details.split("\n")[0]} |\n`;
    }

    // Section détaillée pour les tests en échec
    const failedTests = results.filter((r) => !r.passed);
    if (failedTests.length > 0) {
      reportContent += `\n## 🔍 Analyse des Échecs\n\n`;
      for (const result of failedTests) {
        const testCase = testCases.find((t) => t.id === result.testId);
        reportContent += `### Test ${result.testId}: ${testCase?.category} - ${testCase?.input}\n\n`;
        reportContent += `**Score:** ${result.score.toFixed(1)}/4\n\n`;

        if (result.scoreBreakdown) {
          const b = result.scoreBreakdown;
          reportContent += `**Détails des critères:**\n\n`;

          // Type
          reportContent += `- **Type:** ${b.type.passed ? "✅" : "❌"} `;
          reportContent += `Attendu: \`${b.type.expected}\`, Obtenu: \`${b.type.actual}\`\n`;

          // Contraintes de jours
          if (testCase?.expectedDayConstraints) {
            reportContent += `- **Jours:** ${b.dayConstraints.passed ? "✅" : "❌"} `;
            reportContent += `Score: ${b.dayConstraints.score.toFixed(1)}/1\n`;
            reportContent += `  - Attendu: ${b.dayConstraints.expected?.join(", ")}\n`;
            reportContent += `  - Obtenu: ${b.dayConstraints.actual?.join(", ") || "Aucune date"}\n`;
          }

          // Contraintes horaires
          if (testCase?.expectedTimeConstraints) {
            reportContent += `- **Horaires:** ${b.timeConstraints.passed ? "✅" : "❌"} `;
            reportContent += `Score: ${b.timeConstraints.score.toFixed(1)}/1\n`;
          }

          // Form Polls spécifiques
          if (
            testCase?.expectedType === "form" &&
            result.response &&
            result.response.type === "form"
          ) {
            const formData = result.response as { questions?: any[] };
            const questionsCount = formData.questions?.length || 0;
            reportContent += `- **Nombre de questions:** ${questionsCount}`;
            if (testCase.minQuestions || testCase.maxQuestions) {
              reportContent += ` (attendu: ${testCase.minQuestions || "?"}-${testCase.maxQuestions || "?"})`;
            }
            reportContent += `\n`;

            if (testCase.expectedQuestionTypes && testCase.expectedQuestionTypes.length > 0) {
              const actualTypes = formData.questions?.map((q: any) => q.type).filter(Boolean) || [];
              const uniqueActualTypes = [...new Set(actualTypes)];
              const foundTypes = testCase.expectedQuestionTypes.filter((t) =>
                uniqueActualTypes.includes(t),
              );
              const missingTypes = testCase.expectedQuestionTypes.filter(
                (t) => !uniqueActualTypes.includes(t),
              );
              reportContent += `- **Types de questions:** `;
              if (foundTypes.length > 0) {
                reportContent += `✅ Trouvés: ${foundTypes.join(", ")}`;
              }
              if (missingTypes.length > 0) {
                reportContent += ` ❌ Manquants: ${missingTypes.join(", ")}`;
              }
              reportContent += ` (obtenus: ${uniqueActualTypes.join(", ") || "aucun"})\n`;
            }

            if (testCase.expectedValidationTypes && testCase.expectedValidationTypes.length > 0) {
              const questionsWithValidation =
                formData.questions?.filter(
                  (q: any) =>
                    q.validationType &&
                    testCase.expectedValidationTypes?.includes(q.validationType),
                ) || [];
              reportContent += `- **Validations:** ${questionsWithValidation.length > 0 ? "✅" : "❌"} `;
              if (questionsWithValidation.length === 0) {
                reportContent += `Attendues: ${testCase.expectedValidationTypes.join(", ")} mais aucune trouvée\n`;
              } else {
                reportContent += `Trouvées: ${questionsWithValidation.map((q: any) => q.validationType).join(", ")}\n`;
              }
            }
          }

          // Mots-clés
          if (testCase?.requiredWords) {
            reportContent += `- **Mots-clés:** ${b.requiredWords.passed ? "✅" : "❌"} `;
            reportContent += `Score: ${b.requiredWords.score.toFixed(1)}/1\n`;
            if (b.requiredWords.found && b.requiredWords.found.length > 0) {
              reportContent += `  - Trouvés: ${b.requiredWords.found.join(", ")}\n`;
            }
            if (b.requiredWords.missing && b.requiredWords.missing.length > 0) {
              reportContent += `  - ❌ Manquants: ${b.requiredWords.missing.join(", ")}\n`;
            }
          }
        }

        if (result.response) {
          reportContent += `\n**Réponse API:**\n\`\`\`json\n${JSON.stringify(result.response, null, 2)}\n\`\`\`\n\n`;
        }

        reportContent += `---\n\n`;
      }
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
      await fsp.mkdir("tests/reports", { recursive: true });
    } catch (error) {
      // Le dossier existe déjà
    }

    await fsp.writeFile(path, reportContent, "utf8");
    console.log(`📄 Rapport généré: ${path}`);
  }
});
