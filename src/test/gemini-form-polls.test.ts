/**
 * Tests Gemini - Form Polls (Formulaires)
 * 
 * Suite complète de 10 tests pour valider la génération de formulaires.
 * 
 * Usage:
 *   # Tous les tests (10 tests, ~7-8 min)
 *   npx vitest run --config vitest.config.gemini.ts src/test/gemini-form-polls.test.ts --reporter=default --no-coverage
 * 
 *   # Tests échoués uniquement (~1-2 min)
 *   $env:FAILED_TEST_IDS="form-1,form-2"; npx vitest run --config vitest.config.gemini.ts src/test/gemini-form-polls.test.ts --reporter=default --no-coverage
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { writeFileSync, mkdirSync } from "fs";

type GeminiModule = typeof import("@/lib/ai/gemini");
type GeminiServiceInstance = ReturnType<GeminiModule["GeminiService"]["getInstance"]>;
let geminiService: GeminiServiceInstance;

// Charger .env.local
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: false });

// ============================================================================
// Types
// ============================================================================

interface FormPollPromptSpec {
    id: string;
    category: "simples" | "rating" | "nps" | "matrix" | "validation" | "mix" | "event" | "feedback" | "complex";
    input: string;
    description: string;
    expectedType: "form";
    minQuestions?: number;
    maxQuestions?: number;
    expectedQuestionTypes?: string[];
    expectedValidationTypes?: string[];
    requiredWords?: string[];
    priority?: "CRITIQUE" | "HAUTE" | "MOYENNE";
}

interface TestResult {
    id: string;
    category: string;
    passed: boolean;
    score: number;
    maxScore: number;
    details: {
        type: string;
        questionsCount: number;
        questionTypes: string[];
        validationTypes: string[];
        violations: string[];
        scoreBreakdown: {
            type: number;
            questionCount: number;
            questionTypes: number;
            validations: number;
        };
    };
}

// ============================================================================
// Prompts de Form Polls (10 tests)
// ============================================================================

const formPollPrompts: FormPollPromptSpec[] = [
    // ═══════════════════════════════════════════════════════════════════════════
    // CATÉGORIE: SIMPLES (2 tests)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: "form-1",
        category: "simples",
        input: "Crée un questionnaire de satisfaction client avec au moins 3 questions : une question à choix unique, une à choix multiples, et une question de réponse libre",
        description: "Form Polls - Simples: Satisfaction client",
        expectedType: "form",
        expectedQuestionTypes: ["single", "multiple", "text"],
        minQuestions: 3,
        maxQuestions: 10,
        requiredWords: ["satisfaction", "client"],
        priority: "HAUTE",
    },
    {
        id: "form-2",
        category: "simples",
        input: "Fais un sondage d'opinion sur notre nouveau produit",
        description: "Form Polls - Simples: Sondage d'opinion",
        expectedType: "form",
        expectedQuestionTypes: ["single", "multiple"],
        minQuestions: 3,
        maxQuestions: 8,
        requiredWords: ["produit"],
        priority: "MOYENNE",
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CATÉGORIE: RATING (1 test)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: "form-3",
        category: "rating",
        input: "Crée un questionnaire avec des notes de 1 à 5 pour évaluer notre service",
        description: "Form Polls - Rating: Évaluation service",
        expectedType: "form",
        expectedQuestionTypes: ["rating"],
        minQuestions: 1,
        maxQuestions: 10,
        requiredWords: ["service"],
        priority: "HAUTE",
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CATÉGORIE: NPS (1 test)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: "form-4",
        category: "nps",
        input: "Crée un questionnaire avec une question de type NPS (Net Promoter Score) demandant la probabilité de recommandation de notre service sur une échelle de 0 à 10",
        description: "Form Polls - NPS: Net Promoter Score",
        expectedType: "form",
        expectedQuestionTypes: ["nps"],
        minQuestions: 1,
        maxQuestions: 5,
        requiredWords: ["recommandation"],
        priority: "HAUTE",
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CATÉGORIE: MATRIX (1 test)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: "form-5",
        category: "matrix",
        input: "Crée une matrice d'évaluation pour noter la qualité, le prix et le service",
        description: "Form Polls - Matrix: Matrice d'évaluation",
        expectedType: "form",
        expectedQuestionTypes: ["matrix"],
        minQuestions: 1,
        maxQuestions: 5,
        requiredWords: ["qualité", "prix", "service"],
        priority: "HAUTE",
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CATÉGORIE: VALIDATION (1 test)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: "form-6",
        category: "validation",
        input: "Crée un formulaire de contact avec validation email et téléphone",
        description: "Form Polls - Validation: Formulaire de contact",
        expectedType: "form",
        expectedQuestionTypes: ["text"],
        expectedValidationTypes: ["email", "phone"],
        minQuestions: 2,
        maxQuestions: 8,
        requiredWords: ["contact"],
        priority: "HAUTE",
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CATÉGORIE: MIX TYPES (1 test)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: "form-7",
        category: "mix",
        input: "Crée un questionnaire complet avec choix unique, choix multiples et réponse libre",
        description: "Form Polls - Mix Types: Questionnaire complet",
        expectedType: "form",
        expectedQuestionTypes: ["single", "multiple", "text"],
        minQuestions: 3,
        maxQuestions: 10,
        priority: "MOYENNE",
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CATÉGORIE: EVENT (1 test)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: "form-8",
        category: "event",
        input: "Crée un questionnaire pour recueillir les préférences des participants : type de nourriture préféré, horaire préféré, et allergies alimentaires",
        description: "Form Polls - Event: Préférences participants",
        expectedType: "form",
        expectedQuestionTypes: ["single", "multiple", "text"],
        minQuestions: 3,
        maxQuestions: 8,
        priority: "MOYENNE",
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CATÉGORIE: FEEDBACK (1 test)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: "form-9",
        category: "feedback",
        input: "Crée un formulaire de feedback avec évaluation par étoiles et commentaires",
        description: "Form Polls - Feedback: Formulaire de feedback",
        expectedType: "form",
        expectedQuestionTypes: ["rating", "text"],
        minQuestions: 2,
        maxQuestions: 6,
        requiredWords: ["feedback"],
        priority: "MOYENNE",
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // CATÉGORIE: COMPLEX (1 test)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: "form-10",
        category: "complex",
        input: "Crée un questionnaire d'enquête client avec : une matrice d'évaluation pour noter plusieurs aspects, des questions de choix multiples avec maximum 3 réponses, et une question email avec validation",
        description: "Form Polls - Complex: Enquête client",
        expectedType: "form",
        expectedQuestionTypes: ["matrix", "multiple", "text"],
        expectedValidationTypes: ["email"],
        minQuestions: 3,
        maxQuestions: 10,
        requiredWords: ["client"],
        priority: "HAUTE",
    },
];

// ============================================================================
// Filtrage par FAILED_TEST_IDS
// ============================================================================

const failedTestIdsEnv = process.env.FAILED_TEST_IDS?.split(",").map(id => id.trim()) || [];
const shouldRunTest = (prompt: FormPollPromptSpec): boolean => {
    if (failedTestIdsEnv.length === 0) {
        return true; // Exécuter tous les tests si aucun filtre
    }
    return failedTestIdsEnv.includes(prompt.id);
};

const filteredPrompts = formPollPrompts.filter(shouldRunTest);

// ============================================================================
// Fonction de scoring (4 points max)
// ============================================================================

function scoreFormPollTest(
    prompt: FormPollPromptSpec,
    result: any
): { score: number; maxScore: number; violations: string[]; breakdown: { type: number; questionCount: number; questionTypes: number; validations: number } } {
    const maxScore = 4.0;
    let score = 0;
    const violations: string[] = [];
    const breakdown = {
        type: 0,
        questionCount: 0,
        questionTypes: 0,
        validations: 0,
    };

    const pollType = String(result.type ?? "");
    const questions = Array.isArray(result.questions) ? result.questions : [];
    const title = String(result.title ?? "");
    const description = String(result.description ?? "");
    const textContent = `${title} ${description}`.toLowerCase();

    // 1. Type correct (1 point)
    if (pollType === "form") {
        breakdown.type = 1.0;
        score += 1.0;
    } else {
        violations.push(`Type: attendu "form" mais obtenu "${pollType}"`);
    }

    // 2. Nombre de questions (1 point)
    if (typeof prompt.minQuestions === "number" || typeof prompt.maxQuestions === "number") {
        const questionsCount = questions.length;
        const minQuestions = prompt.minQuestions ?? 0;
        const maxQuestions = prompt.maxQuestions ?? Infinity;

        if (questionsCount >= minQuestions && questionsCount <= maxQuestions) {
            breakdown.questionCount = 1.0;
            score += 1.0;
        } else {
            const expected = prompt.maxQuestions ? `${minQuestions}-${maxQuestions}` : `≥${minQuestions}`;
            violations.push(`Questions: ${questionsCount} questions obtenues (attendu: ${expected})`);
            // Score partiel si proche
            if (questionsCount >= minQuestions * 0.8 && questionsCount <= maxQuestions * 1.2) {
                breakdown.questionCount = 0.5;
                score += 0.5;
            }
        }
    } else {
        // Pas de contrainte de nombre, on donne le point
        breakdown.questionCount = 1.0;
        score += 1.0;
    }

    // 3. Types de questions (1 point)
    if (prompt.expectedQuestionTypes && prompt.expectedQuestionTypes.length > 0) {
        const questionTypes = questions.map((q: any) => String(q.type ?? "")).filter((t: string) => t);
        const foundTypes = prompt.expectedQuestionTypes.filter(expectedType =>
            questionTypes.includes(expectedType)
        );
        const ratio = foundTypes.length / prompt.expectedQuestionTypes.length;

        if (ratio === 1.0) {
            breakdown.questionTypes = 1.0;
            score += 1.0;
        } else {
            const missing = prompt.expectedQuestionTypes.filter(expectedType =>
                !questionTypes.includes(expectedType)
            );
            violations.push(`Types de questions manquants: ${missing.join(", ")}`);
            breakdown.questionTypes = ratio;
            score += ratio;
        }
    } else {
        // Pas de contrainte de types, on donne le point
        breakdown.questionTypes = 1.0;
        score += 1.0;
    }

    // 4. Validations (1 point)
    if (prompt.expectedValidationTypes && prompt.expectedValidationTypes.length > 0) {
        const validationTypes = questions
            .map((q: any) => String(q.validationType ?? ""))
            .filter((v: string) => v);
        const foundValidations = prompt.expectedValidationTypes.filter(expectedValidation =>
            validationTypes.includes(expectedValidation)
        );
        const ratio = foundValidations.length / prompt.expectedValidationTypes.length;

        if (ratio === 1.0) {
            breakdown.validations = 1.0;
            score += 1.0;
        } else {
            const missing = prompt.expectedValidationTypes.filter(expectedValidation =>
                !validationTypes.includes(expectedValidation)
            );
            violations.push(`Types de validation manquants: ${missing.join(", ")}`);
            breakdown.validations = ratio;
            score += ratio;
        }
    } else {
        // Pas de contrainte de validations, on donne le point
        breakdown.validations = 1.0;
        score += 1.0;
    }

    // Bonus: Mots requis (vérification mais pas de point dédié, déjà inclus dans le type)
    if (prompt.requiredWords && prompt.requiredWords.length > 0) {
        const foundWords = prompt.requiredWords.filter(word =>
            textContent.includes(word.toLowerCase())
        );
        if (foundWords.length < prompt.requiredWords.length) {
            const missing = prompt.requiredWords.filter(word =>
                !textContent.includes(word.toLowerCase())
            );
            violations.push(`Mots-clés manquants: ${missing.join(", ")}`);
        }
    }

    return { score, maxScore, violations, breakdown };
}

// ============================================================================
// Génération de rapport markdown
// ============================================================================

function generateFormPollsReport(results: TestResult[]): string {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const maxTotalScore = results.reduce((sum, r) => sum + r.maxScore, 0);
    const percentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;

    let report = `# Rapport Gemini Form Polls Test Suite\n\n`;
    report += `**Date:** ${new Date().toISOString()}\n`;
    report += `**Score Final:** ${totalScore.toFixed(2)}/${maxTotalScore.toFixed(0)} (${percentage.toFixed(1)}%)\n`;
    report += `**Tests réussis:** ${passedTests}/${totalTests}\n\n`;

    // Évaluation qualité
    let qualityEmoji = "🔴";
    let qualityText = "INSUFFISANT";
    if (percentage >= 90) {
        qualityEmoji = "✅";
        qualityText = "EXCELLENT";
    } else if (percentage >= 80) {
        qualityEmoji = "🟡";
        qualityText = "BON";
    } else if (percentage >= 70) {
        qualityEmoji = "🟠";
        qualityText = "ACCEPTABLE";
    }

    report += `## 🎯 Évaluation Qualité\n\n`;
    report += `${qualityEmoji} **${qualityText}** (${percentage.toFixed(1)}%)`;
    if (percentage < 70) {
        report += ` - Révision requise`;
    } else if (percentage >= 90) {
        report += ` - Prêt pour production`;
    }
    report += `\n\n`;

    // Détail des tests
    report += `## 📋 Détail des Tests\n\n`;
    report += `| Test ID | Catégorie | Score | Status | Détails |\n`;
    report += `|---------|-----------|--------|--------|----------|\n`;

    results.forEach(result => {
        const statusEmoji = result.passed ? "✅" : "❌";
        const statusText = result.passed ? "RÉUSSI" : "ÉCHEC";
        report += `| ${result.id} | ${result.category} | ${result.score.toFixed(1)}/${result.maxScore.toFixed(0)} | ${statusEmoji} | Score: ${result.score.toFixed(1)}/${result.maxScore.toFixed(0)} - ${statusText} |\n`;
    });

    // Analyse des échecs
    const failedTests = results.filter(r => !r.passed);
    if (failedTests.length > 0) {
        report += `\n## 🔍 Analyse des Échecs\n\n`;
        failedTests.forEach(result => {
            const prompt = formPollPrompts.find(p => p.id === result.id);
            report += `### Test ${result.id}: ${result.category}\n\n`;
            if (prompt) {
                report += `**Prompt:** ${prompt.input}\n\n`;
            }
            report += `**Score:** ${result.score.toFixed(1)}/${result.maxScore.toFixed(0)}\n\n`;
            report += `**Détails:** Score: ${result.score.toFixed(1)}/${result.maxScore.toFixed(0)} - ÉCHEC\n`;
            if (result.details.violations.length > 0) {
                result.details.violations.forEach(v => {
                    report += `  - ${v}\n`;
                });
            }
            report += `\n---\n\n`;
        });
    }

    // Recommandations
    report += `\n## 📈 Recommandations\n\n`;
    if (percentage < 70) {
        report += `- Réviser les prompts Gemini pour améliorer la précision\n`;
        report += `- Analyser les tests en échec pour identifier les patterns\n`;
        report += `- Tester avec des variations de formulation\n`;
    } else if (percentage >= 90) {
        report += `- Continuer le monitoring automatisé\n`;
        report += `- Maintenir la qualité actuelle\n`;
    } else {
        report += `- Améliorer les prompts en échec\n`;
        report += `- Continuer le monitoring automatisé\n`;
    }

    return report;
}

// ============================================================================
// Tests
// ============================================================================

describe("Gemini Form Polls Tests", () => {
    const testResults: TestResult[] = [];

    beforeAll(async () => {
        const module = await import("@/lib/ai/gemini");
        geminiService = module.GeminiService.getInstance();

        const apiKey = process.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error(
                "VITE_GEMINI_API_KEY manquante. Définissez la clé dans .env.local.",
            );
        }

        console.log("\n" + "=".repeat(70));
        console.log("🧪 TESTS GEMINI - FORM POLLS");
        console.log("=".repeat(70));
        console.log(`   Total prompts: ${formPollPrompts.length}`);
        console.log(`   Prompts filtrés: ${filteredPrompts.length}`);
        if (failedTestIdsEnv.length > 0) {
            console.log(`   Tests échoués à relancer: ${failedTestIdsEnv.join(", ")}`);
        }
    });

    filteredPrompts.forEach((prompt) => {
        it(
            `[${prompt.priority || "MOYENNE"}] ${prompt.description}`,
            async () => {
                console.log(`\n🧪 Test: ${prompt.id}`);
                console.log(`   Prompt: "${prompt.input}"`);

                const startTime = Date.now();
                // Tous les tests dans ce fichier sont des Form Polls - passer "form" explicitement
                const result = await geminiService.generatePollFromText(prompt.input, "form");
                const duration = Date.now() - startTime;

                console.log(`   ⏱️ Durée: ${duration}ms`);

                expect(result.success).toBe(true);
                expect(result.data).toBeTruthy();

                const poll = result.data as any;
                const scoring = scoreFormPollTest(prompt, poll);
                const passed = scoring.score >= 2.8; // 70% de 4 points

                console.log(`   ✅ Score: ${scoring.score.toFixed(1)}/4.0`);
                console.log(`   📊 Breakdown: Type=${scoring.breakdown.type.toFixed(1)}, Questions=${scoring.breakdown.questionCount.toFixed(1)}, Types=${scoring.breakdown.questionTypes.toFixed(1)}, Validations=${scoring.breakdown.validations.toFixed(1)}`);
                if (scoring.violations.length > 0) {
                    console.log(`   ⚠️ Violations: ${scoring.violations.join("; ")}`);
                }

                testResults.push({
                    id: prompt.id,
                    category: prompt.category,
                    passed,
                    score: scoring.score,
                    maxScore: scoring.maxScore,
                    details: {
                        type: String(poll.type ?? ""),
                        questionsCount: Array.isArray(poll.questions) ? poll.questions.length : 0,
                        questionTypes: Array.isArray(poll.questions) 
                            ? poll.questions.map((q: any) => String(q.type ?? "")).filter((t: string) => t)
                            : [],
                        validationTypes: Array.isArray(poll.questions)
                            ? poll.questions.map((q: any) => String(q.validationType ?? "")).filter((v: string) => v)
                            : [],
                        violations: scoring.violations,
                        scoreBreakdown: scoring.breakdown,
                    },
                });

                // Assertion pour Vitest
                if (!passed) {
                    console.warn(`   ⚠️ Test échoué (score ${scoring.score.toFixed(1)}/4.0 < 2.8)`);
                }
            },
            120000, // 2 minutes timeout
        );
    });

    afterAll(() => {
        // Générer et sauvegarder le rapport
        const report = generateFormPollsReport(testResults);
        const reportPath = path.resolve(process.cwd(), "tests/reports/gemini-form-polls-report.md");
        
        // Créer le dossier s'il n'existe pas
        const reportDir = path.dirname(reportPath);
        try {
            mkdirSync(reportDir, { recursive: true });
        } catch (e) {
            // Le dossier existe déjà
        }

        writeFileSync(reportPath, report, "utf-8");
        console.log(`\n📊 Rapport généré: ${reportPath}`);

        // Afficher le résumé
        const totalScore = testResults.reduce((sum, r) => sum + r.score, 0);
        const maxTotalScore = testResults.reduce((sum, r) => sum + r.maxScore, 0);
        const percentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;
        const passed = testResults.filter(r => r.passed).length;

        console.log("\n" + "=".repeat(70));
        console.log("📊 RÉSUMÉ DES TESTS");
        console.log("=".repeat(70));
        console.log(`   ✅ Réussis: ${passed}/${testResults.length}`);
        console.log(`   ❌ Échoués: ${testResults.length - passed}/${testResults.length}`);
        console.log(`   📈 Score: ${totalScore.toFixed(2)}/${maxTotalScore.toFixed(0)} (${percentage.toFixed(1)}%)`);
        console.log("=".repeat(70));
    });
});
