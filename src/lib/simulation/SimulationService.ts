/**
 * SimulationService - Génération de réponses simulées
 *
 * Service principal pour simuler des réponses à un questionnaire
 * en utilisant des personas et optionnellement Gemini pour les questions texte.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../logger";
import type {
  SimulationConfig,
  SimulationResult,
  SimulatedRespondent,
  SimulatedResponse,
  Persona,
  DetailLevel,
} from "../../types/simulation";
import { selectPersonas } from "./PersonaGenerator";
import { v4 as uuidv4 } from "uuid";

// ============================================================================
// CONFIGURATION
// ============================================================================

const GEMINI_MODEL = "gemini-2.0-flash-exp";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ============================================================================
// TYPES INTERNES
// ============================================================================

interface Question {
  id: string;
  title: string;
  type: "single" | "multiple" | "text" | "long-text" | "matrix";
  required?: boolean;
  options?: Array<{ id: string; label: string }>;
  matrixRows?: Array<{ id: string; label: string }>;
  matrixColumns?: Array<{ id: string; label: string }>;
  matrixType?: "single" | "multiple";
}

// ============================================================================
// GÉNÉRATION RÉPONSES À CHOIX (PERSONAS)
// ============================================================================

/**
 * Génère une réponse pour une question à choix unique
 */
function generateSingleChoiceResponse(question: Question, persona: Persona): string {
  if (!question.options || question.options.length === 0) {
    return "";
  }

  // Pondération selon biais persona
  const weights = question.options.map((_, index) => {
    // Favoriser première option si biais positif
    if (index === 0 && persona.traits.biasTowardPositive > 0) {
      return 1 + persona.traits.biasTowardPositive;
    }
    // Favoriser dernière option si biais négatif
    if (index === question.options!.length - 1 && persona.traits.biasTowardPositive < 0) {
      return 1 + Math.abs(persona.traits.biasTowardPositive);
    }
    return 1;
  });

  // Sélection pondérée
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < question.options.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return question.options[i].id;
    }
  }

  return question.options[0].id;
}

/**
 * Génère une réponse pour une question à choix multiples
 */
function generateMultipleChoiceResponse(question: Question, persona: Persona): string[] {
  if (!question.options || question.options.length === 0) {
    return [];
  }

  // Nombre de sélections selon detailLevel
  const maxSelections = {
    low: 1,
    medium: 2,
    high: 3,
  }[persona.traits.detailLevel];

  const count = Math.min(Math.floor(Math.random() * maxSelections) + 1, question.options.length);

  // Sélection aléatoire sans répétition
  const selected: string[] = [];
  const availableOptions = [...question.options];

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * availableOptions.length);
    selected.push(availableOptions[randomIndex].id);
    availableOptions.splice(randomIndex, 1);
  }

  return selected;
}

/**
 * Génère une réponse pour une question matrice
 */
function generateMatrixResponse(
  question: Question,
  persona: Persona,
): Record<string, string | string[]> {
  if (!question.matrixRows || !question.matrixColumns) {
    return {};
  }

  const response: Record<string, string | string[]> = {};

  for (const row of question.matrixRows) {
    if (question.matrixType === "multiple") {
      // Choix multiples par ligne
      const count = Math.floor(Math.random() * 2) + 1;
      const selected: string[] = [];

      for (let i = 0; i < Math.min(count, question.matrixColumns.length); i++) {
        const randomCol =
          question.matrixColumns[Math.floor(Math.random() * question.matrixColumns.length)];
        if (!selected.includes(randomCol.id)) {
          selected.push(randomCol.id);
        }
      }

      response[row.id] = selected;
    } else {
      // Choix unique par ligne
      const randomCol =
        question.matrixColumns[Math.floor(Math.random() * question.matrixColumns.length)];
      response[row.id] = randomCol.id;
    }
  }

  return response;
}

// ============================================================================
// GÉNÉRATION RÉPONSES TEXTE (GEMINI)
// ============================================================================

/**
 * Génère une réponse texte avec Gemini
 */
async function generateTextResponseWithGemini(
  question: Question,
  persona: Persona,
): Promise<string> {
  if (!API_KEY) {
    // Fallback sur template simple si pas de clé API
    return generateTextResponseFallback(question, persona);
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const detailInstructions = {
      low: "Réponds en 1 phrase courte (5-10 mots), de manière naturelle et spontanée.",
      medium: "Réponds en 2-3 phrases (15-30 mots), de manière claire et constructive.",
      high: "Réponds en 3-5 phrases (30-60 mots), de manière détaillée et réfléchie.",
    };

    const contextDescription = {
      event: "un événement (soirée, mariage, anniversaire)",
      feedback: "un retour d'expérience ou une satisfaction",
      leisure: "une activité de loisirs entre amis ou en famille",
      association: "une activité associative ou de groupe",
      research: "une étude ou une recherche",
    };

    const prompt = `Tu es un participant à un questionnaire sur ${contextDescription[persona.context]}.

Question : ${question.title}

${detailInstructions[persona.traits.detailLevel]}

Réponds de manière naturelle, comme une vraie personne. Ne mentionne pas que tu es une IA.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    logger.error("Erreur Gemini lors de la génération de réponse", "api", {
      error,
      question: question.title,
    });
    return generateTextResponseFallback(question, persona);
  }
}

/**
 * Génère une réponse texte simple (fallback)
 */
function generateTextResponseFallback(question: Question, persona: Persona): string {
  const templates = {
    low: ["Bien", "Correct", "OK", "Satisfaisant", "Pas mal"],
    medium: [
      "C'est plutôt bien dans l'ensemble",
      "Globalement satisfaisant",
      "Quelques points à améliorer",
      "Répond à mes attentes",
      "Bonne expérience",
    ],
    high: [
      "Mon avis est globalement positif avec quelques suggestions d'amélioration",
      "Très satisfait de l'expérience, notamment sur plusieurs aspects importants",
      "Quelques points forts à souligner et des axes d'amélioration à considérer",
      "Expérience enrichissante avec des éléments particulièrement appréciés",
      "Bilan positif avec des recommandations pour optimiser davantage",
    ],
  };

  const templateList = templates[persona.traits.detailLevel];
  return templateList[Math.floor(Math.random() * templateList.length)];
}

// ============================================================================
// GÉNÉRATION RÉPONSE COMPLÈTE
// ============================================================================

/**
 * Génère une réponse pour une question
 */
async function generateResponse(
  question: Question,
  persona: Persona,
  questionIndex: number,
  useGemini: boolean,
): Promise<SimulatedResponse> {
  // Vérifier si le persona abandonne (fatigue)
  if (questionIndex >= persona.traits.attentionSpan) {
    const abandonProbability = (questionIndex - persona.traits.attentionSpan) * 0.1;
    if (Math.random() < abandonProbability) {
      return {
        questionId: question.id,
        value: null,
        timeSpent: 0,
        personaId: persona.id,
      };
    }
  }

  // Vérifier si le persona saute la question
  if (Math.random() > persona.traits.responseRate) {
    return {
      questionId: question.id,
      value: null,
      timeSpent: Math.random() * 5,
      personaId: persona.id,
    };
  }

  // Générer la réponse selon le type
  let value: string | string[] | Record<string, string | string[]> | null;
  let baseTime: number;

  switch (question.type) {
    case "text":
      if (useGemini) {
        value = await generateTextResponseWithGemini(question, persona);
      } else {
        value = generateTextResponseFallback(question, persona);
      }
      baseTime =
        persona.traits.detailLevel === "high"
          ? 30
          : persona.traits.detailLevel === "medium"
            ? 15
            : 8;
      break;

    case "multiple":
      value = generateMultipleChoiceResponse(question, persona);
      baseTime = 10;
      break;

    case "single":
      value = generateSingleChoiceResponse(question, persona);
      baseTime = 5;
      break;

    case "matrix":
      value = generateMatrixResponse(question, persona);
      baseTime = 15;
      break;

    default:
      value = null;
      baseTime = 0;
  }

  // Ajouter variance au temps (±30%)
  const timeSpent = baseTime * (0.7 + Math.random() * 0.6);

  return {
    questionId: question.id,
    value,
    timeSpent: Math.round(timeSpent),
    personaId: persona.id,
  };
}

// ============================================================================
// SIMULATION COMPLÈTE
// ============================================================================

/**
 * Simule les réponses pour un questionnaire
 */
export async function simulate(
  config: SimulationConfig,
  questions: Question[],
): Promise<SimulationResult> {
  const startTime = Date.now();

  // Sélectionner les personas
  const personas =
    config.personaIds && config.personaIds.length > 0
      ? config.personaIds.map((id) => ({ id }) as Persona) // TODO: récupérer vrais personas
      : selectPersonas(config.context, config.volume);

  const respondents: SimulatedRespondent[] = [];

  // Générer les réponses pour chaque persona
  for (let i = 0; i < config.volume; i++) {
    const persona = personas[i % personas.length];
    const responses: SimulatedResponse[] = [];
    let totalTime = 0;

    for (let j = 0; j < questions.length; j++) {
      const response = await generateResponse(questions[j], persona, j, config.useGemini || false);

      responses.push(response);
      totalTime += response.timeSpent;

      // Si abandon, arrêter
      if (response.value === null && response.timeSpent === 0) {
        break;
      }
    }

    const completionRate = responses.filter((r) => r.value !== null).length / questions.length;

    respondents.push({
      id: uuidv4(),
      personaId: persona.id,
      responses,
      totalTime,
      completionRate,
    });
  }

  const generationTime = Date.now() - startTime;

  // Calculer le coût estimé (si Gemini utilisé)
  let estimatedCost;
  if (config.useGemini) {
    const textQuestions = questions.filter((q) => q.type === "text" || q.type === "long-text");
    const geminiCalls = respondents.length * textQuestions.length;

    // Coût Gemini 2.0 Flash : $0.000019 par réponse (input + output)
    const COST_PER_CALL = 0.000019;
    const totalCost = geminiCalls * COST_PER_CALL;

    estimatedCost = {
      total: totalCost,
      geminiCalls,
      costPerResponse: totalCost / respondents.length,
    };
  }

  // Créer résultat initial
  const initialResult: SimulationResult = {
    id: uuidv4(),
    config,
    createdAt: new Date(),
    respondents,
    metrics: {
      totalResponses: respondents.length,
      avgCompletionRate:
        respondents.reduce((sum, r) => sum + r.completionRate, 0) / respondents.length,
      avgTotalTime: respondents.reduce((sum, r) => sum + r.totalTime, 0) / respondents.length,
      dropoffRate:
        1 - respondents.reduce((sum, r) => sum + r.completionRate, 0) / respondents.length,
      questionMetrics: [],
    },
    issues: [],
    generationTime,
    estimatedCost,
  };

  // Analyser et détecter problèmes
  const { analyzeSimulation } = await import("./SimulationAnalyzer");
  return await analyzeSimulation(initialResult, questions);
}
