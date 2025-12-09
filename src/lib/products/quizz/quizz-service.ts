/* eslint-disable @typescript-eslint/no-explicit-any */
// Quizz Service
// Logique spécifique aux quizz - Stockage séparé des polls

import { ErrorFactory, logError } from "../../error-handling";
import { logger } from "../../logger";

// Types spécifiques aux Quizz
export interface QuizzQuestion {
  id: string;
  question: string;
  type: "single" | "multiple" | "text" | "text-ai" | "true-false";
  options?: string[];
  correctAnswer: string | string[] | boolean;
  points?: number;
  explanation?: string;
}

export interface QuizzResponse {
  id: string;
  pollId: string;
  respondentName?: string;
  respondentEmail?: string;
  deviceId?: string;
  created_at: string;
  answers: Array<{
    questionId: string;
    answer: string | string[] | boolean;
    isCorrect: boolean;
    points: number;
  }>;
  totalPoints: number;
  maxPoints: number;
  percentage: number;
}

export interface QuizzResults {
  pollId: string;
  totalResponses: number;
  averageScore: number;
  averagePercentage: number;
  responses: QuizzResponse[];
  questionStats: Record<
    string,
    {
      correctAnswers: number;
      totalAnswers: number;
      percentage: number;
      mostCommonWrongAnswer?: string;
    }
  >;
}

export interface QuizzSettings {
  allowAnonymousResponses?: boolean;
  showCorrectAnswers?: boolean;
  allowRetakes?: boolean;
  timeLimit?: number; // en minutes
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
}

// Système de badges
export type BadgeType =
  | "first_quiz" // Premier quiz complété
  | "perfect_score" // 100%
  | "streak_3" // 3 quiz d'affilée > 70%
  | "streak_5" // 5 quiz d'affilée > 70%
  | "streak_10" // 10 quiz d'affilée > 70%
  | "speed_demon" // Quiz terminé avec timer
  | "consistent" // 5 quiz avec score > 80%
  | "improver" // Amélioration de 20%+ entre 2 quiz
  | "champion" // 10 quiz avec 100%
  | "explorer"; // 5 quiz différents complétés

export interface Badge {
  type: BadgeType;
  name: string;
  description: string;
  emoji: string;
  earnedAt?: string;
  count?: number; // Pour les badges répétables (ex: perfect_score)
}

export interface ChildHistory {
  childName: string;
  totalQuizzes: number;
  totalPoints: number;
  averageScore: number;
  bestScore: number;
  currentStreak: number; // Quiz consécutifs > 70%
  bestStreak: number;
  badges: Badge[];
  responses: QuizzResponse[];
  lastActivity?: string;
}

// Définition des badges
export const BADGE_DEFINITIONS: Record<BadgeType, Omit<Badge, "type" | "earnedAt" | "count">> = {
  first_quiz: {
    name: "Première étoile",
    description: "Tu as complété ton premier quiz !",
    emoji: "⭐",
  },
  perfect_score: {
    name: "Sans faute",
    description: "100% de bonnes réponses !",
    emoji: "🏆",
  },
  streak_3: {
    name: "En forme",
    description: "3 quiz d'affilée avec plus de 70%",
    emoji: "🔥",
  },
  streak_5: {
    name: "Inarrêtable",
    description: "5 quiz d'affilée avec plus de 70%",
    emoji: "💪",
  },
  streak_10: {
    name: "Légende",
    description: "10 quiz d'affilée avec plus de 70%",
    emoji: "👑",
  },
  speed_demon: {
    name: "Éclair",
    description: "Quiz terminé avec le chrono !",
    emoji: "⚡",
  },
  consistent: {
    name: "Régulier",
    description: "5 quiz avec plus de 80%",
    emoji: "📈",
  },
  improver: {
    name: "En progrès",
    description: "Tu t'améliores ! +20% par rapport au quiz précédent",
    emoji: "🚀",
  },
  champion: {
    name: "Champion",
    description: "10 quiz parfaits à 100%",
    emoji: "🎖️",
  },
  explorer: {
    name: "Explorateur",
    description: "5 quiz différents complétés",
    emoji: "🗺️",
  },
};

export interface Quizz {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  slug: string;
  settings?: QuizzSettings;
  status: "draft" | "active" | "closed" | "archived";
  expires_at?: string;
  created_at: string;
  updated_at: string;
  creatorEmail?: string;
  type: "quizz";
  questions: QuizzQuestion[];
  maxPoints: number;
  themeId?: string;
  relatedConversationId?: string;
  conversationId?: string;
  resultsVisibility?: "creator-only" | "voters" | "public";
}

// Constants - Stockage séparé pour les quizz (indépendant des polls)
const STORAGE_KEY = "doodates_quizz";
const QUIZZ_RESPONSES_KEY = "doodates_quizz_responses";

// Validation spécifique aux Quizz
export function validateQuizz(poll: Quizz): void {
  if (!poll.title || typeof poll.title !== "string" || poll.title.trim() === "") {
    throw ErrorFactory.validation(
      "Invalid quizz: title must be a non-empty string",
      "Invalid quizz: title must be a non-empty string",
      { pollId: poll.id, title: poll.title },
    );
  }

  if (!Array.isArray(poll.questions) || poll.questions.length === 0) {
    throw ErrorFactory.validation(
      "Invalid quizz: questions must be a non-empty array",
      "Invalid quizz: questions must be a non-empty array",
      { pollId: poll.id, questions: poll.questions },
    );
  }

  poll.questions.forEach((question, index) => {
    if (!question.id || !question.question || !question.type) {
      throw ErrorFactory.validation(
        `Invalid quizz question at index ${index}: missing required fields`,
        `Invalid quizz question at index ${index}: missing required fields`,
        { pollId: poll.id, questionIndex: index, question },
      );
    }

    if (question.type === "single" || question.type === "multiple") {
      if (!Array.isArray(question.options) || question.options.length === 0) {
        throw ErrorFactory.validation(
          `Invalid quizz question at index ${index}: options required for ${question.type} type`,
          `Invalid quizz question at index ${index}: options required for ${question.type} type`,
          { pollId: poll.id, questionIndex: index, question },
        );
      }
    }
  });

  logger.info("Quizz validated successfully", "api");
}

// Helper functions
function isQuizz(poll: any): poll is Quizz {
  return poll?.type === "quizz" && Array.isArray(poll?.questions);
}

// CRUD Operations
export function getQuizz(): Quizz[] {
  try {
    if (!hasWindow()) return [];

    // Lire directement depuis localStorage pour les quizz
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw || raw.trim() === "") return [];

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // JSON corrompu - nettoyer et retourner tableau vide
      logger.warn("🧹 localStorage quizz corrompu, nettoyage...", "api");
      window.localStorage.setItem(STORAGE_KEY, "[]");
      return [];
    }

    if (!Array.isArray(parsed)) return [];

    const validQuizz: Quizz[] = [];
    for (const p of parsed) {
      if (isQuizz(p)) {
        try {
          validateQuizz(p);
          validQuizz.push(p);
        } catch {
          // Skip invalid quizz
        }
      }
    }

    return deduplicateQuizz(validQuizz);
  } catch (error) {
    logError(error, { operation: "getQuizz" });
    return [];
  }
}

function deduplicateQuizz(quizz: Quizz[]): Quizz[] {
  const seen = new Set<string>();
  return quizz
    .sort((a, b) => {
      const currentDate = new Date(a.updated_at || a.created_at).getTime();
      const nextDate = new Date(b.updated_at || b.created_at).getTime();
      return nextDate - currentDate;
    })
    .filter((poll) => {
      if (seen.has(poll.id)) {
        logger.warn("Duplicate quizz found and removed", "api");
        return false;
      }
      seen.add(poll.id);
      return true;
    });
}

export function saveQuizz(quizz: Quizz[]): void {
  try {
    if (!hasWindow()) return;

    const deduplicatedQuizz = deduplicateQuizz(quizz);

    // Écriture directe dans localStorage (stockage séparé des polls)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deduplicatedQuizz));
    logger.info("Quizz saved successfully", "api", {
      count: deduplicatedQuizz.length,
    });
  } catch (error) {
    logError(error, { operation: "saveQuizz" });
    throw error;
  }
}

export function getQuizzBySlugOrId(idOrSlug: string | undefined | null): Quizz | null {
  if (!idOrSlug) return null;

  const quizz = getQuizz();
  return quizz.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
}

export async function addQuizz(poll: Quizz): Promise<void> {
  try {
    validateQuizz(poll);

    const quizz = getQuizz();
    const existingIndex = quizz.findIndex((p) => p.id === poll.id);

    if (existingIndex >= 0) {
      quizz[existingIndex] = poll;
      logger.info("Quizz updated", "api");
    } else {
      quizz.push(poll);
      logger.info("Quizz created", "api");
    }

    saveQuizz(quizz);
  } catch (error) {
    logError(error, { operation: "addQuizz", pollId: poll.id });
    throw error;
  }
}

export function deleteQuizzById(id: string): void {
  try {
    const quizz = getQuizz();
    const next = quizz.filter((p) => p.id !== id);
    saveQuizz(next);
    logger.info("Quizz deleted", "api");
  } catch (error) {
    logError(error, { operation: "deleteQuizzById", pollId: id });
    throw error;
  }
}

export function duplicateQuizz(poll: Quizz): Quizz {
  const newQuizz: Quizz = {
    ...poll,
    id: `quizz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    slug: `${poll.slug}-${Date.now()}`,
    title: `${poll.title} (copie)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  logger.info("Quizz duplicated", "api");

  return newQuizz;
}

// Quizz Responses Management
function readAllQuizzResponses(): QuizzResponse[] {
  try {
    if (!hasWindow()) return [];

    const raw = window.localStorage.getItem(QUIZZ_RESPONSES_KEY);
    if (!raw) return [];

    try {
      return JSON.parse(raw);
    } catch {
      // JSON corrompu - réinitialiser
      window.localStorage.setItem(QUIZZ_RESPONSES_KEY, "[]");
      return [];
    }
  } catch (error) {
    logError(error, { operation: "readAllQuizzResponses" });
    return [];
  }
}

function writeAllQuizzResponses(responses: QuizzResponse[]): void {
  try {
    if (!hasWindow()) return;
    window.localStorage.setItem(QUIZZ_RESPONSES_KEY, JSON.stringify(responses));
  } catch (error) {
    logError(error, { operation: "writeAllQuizzResponses" });
    throw error;
  }
}

// --- Fonctions RGPD : reset / anonymisation des réponses de quizz ---

/**
 * Supprime toutes les réponses associées à un quizz donné (reset complet des scores).
 */
export function deleteQuizzResponsesByPollId(pollId: string): { removedCount: number } {
  if (!pollId) {
    throw ErrorFactory.validation(
      "pollId is required",
      "ID du quizz requis pour supprimer les réponses",
      { pollId },
    );
  }

  try {
    const all = readAllQuizzResponses();
    const remaining = all.filter((r) => r.pollId !== pollId);

    if (remaining.length !== all.length) {
      writeAllQuizzResponses(remaining);
      const removedCount = all.length - remaining.length;
      logger.info("Quizz responses deleted for poll", "api", { pollId, removedCount });
      return { removedCount };
    }

    logger.info("No quizz responses to delete for poll", "api", { pollId });
    return { removedCount: 0 };
  } catch (error) {
    logError(error, { operation: "deleteQuizzResponsesByPollId", pollId });
    throw error;
  }
}

/**
 * Supprime les réponses d'un enfant donné, éventuellement limitées à un quizz.
 * Utile pour le reset des scores par participant.
 */
export function deleteQuizzResponsesForChild(
  childName: string,
  pollId?: string,
): { removedCount: number } {
  const normalizedName = childName?.trim().toLowerCase();
  if (!normalizedName) {
    throw ErrorFactory.validation(
      "childName is required",
      "Nom de l'enfant requis pour supprimer les réponses",
      { childName },
    );
  }

  try {
    const all = readAllQuizzResponses();
    const remaining = all.filter((r) => {
      const sameChild = r.respondentName?.trim().toLowerCase() === normalizedName;
      const samePoll = pollId ? r.pollId === pollId : true;
      return !(sameChild && samePoll);
    });

    if (remaining.length !== all.length) {
      writeAllQuizzResponses(remaining);
      const removedCount = all.length - remaining.length;
      logger.info("Quizz responses deleted for child", "api", {
        childName: normalizedName,
        pollId,
        removedCount,
      });
      return { removedCount };
    }

    logger.info("No quizz responses to delete for child", "api", {
      childName: normalizedName,
      pollId,
    });
    return { removedCount: 0 };
  } catch (error) {
    logError(error, {
      operation: "deleteQuizzResponsesForChild",
      metadata: { childName: normalizedName, pollId },
    });
    throw error;
  }
}

export function getQuizzById(pollId: string): Quizz | null {
  const poll = getQuizz().find((p) => p.id === pollId) || null;
  if (!poll) {
    logger.warn("Quizz not found", "api");
  }
  return poll;
}

export function addQuizzResponse(params: {
  pollId: string;
  answers: Array<{
    questionId: string;
    answer: string | string[] | boolean;
  }>;
  respondentName?: string;
  respondentEmail?: string;
}): QuizzResponse {
  const { pollId, answers, respondentName, respondentEmail } = params;

  try {
    const quizz = getQuizzById(pollId);
    if (!quizz) {
      throw ErrorFactory.validation("Quizz not found", "Quizz not found", { pollId });
    }

    const deviceId = getDeviceId();
    const processedAnswers = answers.map((answer) => {
      const question = quizz.questions.find((q) => q.id === answer.questionId);
      if (!question) {
        throw ErrorFactory.validation(
          `Question not found: ${answer.questionId}`,
          `Question not found: ${answer.questionId}`,
          { pollId, questionId: answer.questionId },
        );
      }

      const isCorrect = checkAnswer(question, answer.answer);
      const points = isCorrect ? question.points || 1 : 0;

      return {
        ...answer,
        isCorrect,
        points,
      };
    });

    const totalPoints = processedAnswers.reduce((sum, a) => sum + a.points, 0);
    const maxPoints =
      quizz.maxPoints || quizz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

    const response: QuizzResponse = {
      id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pollId,
      respondentName,
      respondentEmail,
      deviceId,
      created_at: new Date().toISOString(),
      answers: processedAnswers,
      totalPoints,
      maxPoints,
      percentage,
    };

    const all = readAllQuizzResponses();
    all.push(response);
    writeAllQuizzResponses(all);

    logger.info("Quizz response added", "api");

    return response;
  } catch (error) {
    logError(error, { operation: "addQuizzResponse", pollId });
    throw error;
  }
}

/**
 * Normalise une réponse pour comparaison souple
 * (insensible à la casse, accents, espaces multiples, ponctuation)
 */
function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^\w\s]/g, "") // Supprime la ponctuation
    .replace(/\s+/g, " "); // Normalise les espaces
}

function checkAnswer(question: QuizzQuestion, userAnswer: string | string[] | boolean): boolean {
  switch (question.type) {
    case "single":
      return userAnswer === question.correctAnswer;
    case "text":
    case "text-ai":
      // Comparaison souple pour les réponses textuelles
      // (insensible à la casse, accents, espaces)
      if (typeof userAnswer !== "string" || typeof question.correctAnswer !== "string") {
        return userAnswer === question.correctAnswer;
      }
      return normalizeAnswer(userAnswer) === normalizeAnswer(question.correctAnswer);
    case "multiple": {
      if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
        return false;
      }
      const userSet = new Set(userAnswer);
      const correctSet = new Set(question.correctAnswer as string[]);
      return userSet.size === correctSet.size && [...userSet].every((x) => correctSet.has(x));
    }
    case "true-false":
      return userAnswer === question.correctAnswer;
    default:
      return false;
  }
}

export function getQuizzResults(pollId: string): QuizzResults {
  const quizz = getQuizzById(pollId);
  if (!quizz) {
    throw ErrorFactory.validation("Quizz not found", "Quizz not found", { pollId });
  }

  const responses = readAllQuizzResponses().filter((r) => r.pollId === pollId);
  const totalResponses = responses.length;

  if (totalResponses === 0) {
    return {
      pollId,
      totalResponses: 0,
      averageScore: 0,
      averagePercentage: 0,
      responses: [],
      questionStats: {},
    };
  }

  const totalPoints = responses.reduce((sum, r) => sum + r.totalPoints, 0);
  const averageScore = totalPoints / totalResponses;
  const averagePercentage = responses.reduce((sum, r) => sum + r.percentage, 0) / totalResponses;

  const questionStats: Record<string, any> = {};
  quizz.questions.forEach((question) => {
    const questionResponses = responses
      .map((r) => r.answers.find((a) => a.questionId === question.id))
      .filter(Boolean);

    const correctAnswers = questionResponses.filter((a) => a!.isCorrect).length;
    const totalAnswers = questionResponses.length;
    const percentage = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

    const wrongAnswers = questionResponses
      .filter((a) => !a!.isCorrect)
      .map((a) => a!.answer.toString());

    const mostCommonWrongAnswer =
      wrongAnswers.length > 0
        ? wrongAnswers.sort(
            (a, b) =>
              wrongAnswers.filter((x) => x === b).length -
              wrongAnswers.filter((x) => x === a).length,
          )[0]
        : undefined;

    questionStats[question.id] = {
      correctAnswers,
      totalAnswers,
      percentage,
      mostCommonWrongAnswer,
    };
  });

  return {
    pollId,
    totalResponses,
    averageScore,
    averagePercentage,
    responses,
    questionStats,
  };
}

/**
 * Version anonymisée des résultats d'un quizz :
 * - mêmes statistiques agrégées que getQuizzResults
 * - mais noms/emails supprimés dans le tableau responses.
 * À utiliser pour exports/statistiques partagés en dehors du foyer.
 */
export function getQuizzResultsAnonymized(pollId: string): QuizzResults {
  const base = getQuizzResults(pollId);
  const anonymizedResponses = base.responses.map((r) => ({
    ...r,
    respondentName: undefined,
    respondentEmail: undefined,
  }));

  return {
    ...base,
    responses: anonymizedResponses,
  };
}

export function getQuizzResponses(pollId: string): QuizzResponse[] {
  const all = readAllQuizzResponses();
  return all.filter((r) => r.pollId === pollId);
}

// ============ HISTORIQUE ENFANT & BADGES ============

/**
 * Récupère tous les enfants qui ont participé à des quiz
 */
export function getAllChildren(): string[] {
  const responses = readAllQuizzResponses();
  const names = new Set<string>();
  responses.forEach((r) => {
    if (r.respondentName && r.respondentName.trim()) {
      names.add(r.respondentName.trim().toLowerCase());
    }
  });
  return Array.from(names).sort();
}

/**
 * Récupère l'historique complet d'un enfant
 */
export function getChildHistory(childName: string): ChildHistory | null {
  if (!childName || !childName.trim()) return null;

  const normalizedName = childName.trim().toLowerCase();
  const allResponses = readAllQuizzResponses();

  // Filtrer les réponses de cet enfant
  const childResponses = allResponses
    .filter((r) => r.respondentName?.trim().toLowerCase() === normalizedName)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (childResponses.length === 0) return null;

  // Calculer les stats
  const totalQuizzes = childResponses.length;
  const totalPoints = childResponses.reduce((sum, r) => sum + r.totalPoints, 0);
  const averageScore = childResponses.reduce((sum, r) => sum + r.percentage, 0) / totalQuizzes;
  const bestScore = Math.max(...childResponses.map((r) => r.percentage));

  // Calculer les streaks
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  childResponses.forEach((r) => {
    if (r.percentage >= 70) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  });

  // Streak actuel (depuis le dernier quiz)
  for (let i = childResponses.length - 1; i >= 0; i--) {
    if (childResponses[i].percentage >= 70) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculer les badges
  const badges = calculateBadges(childResponses);

  return {
    childName: childResponses[0].respondentName || childName,
    totalQuizzes,
    totalPoints,
    averageScore: Math.round(averageScore * 10) / 10,
    bestScore: Math.round(bestScore * 10) / 10,
    currentStreak,
    bestStreak,
    badges,
    responses: childResponses,
    lastActivity: childResponses[childResponses.length - 1]?.created_at,
  };
}

/**
 * Calcule les badges gagnés basés sur l'historique
 */
function calculateBadges(responses: QuizzResponse[]): Badge[] {
  const badges: Badge[] = [];

  if (responses.length === 0) return badges;

  // Premier quiz
  badges.push({
    type: "first_quiz",
    ...BADGE_DEFINITIONS.first_quiz,
    earnedAt: responses[0].created_at,
  });

  // Compteurs
  let perfectScoreCount = 0;
  let highScoreCount = 0; // > 80%
  let currentStreak = 0;
  let bestStreak = 0;
  const uniqueQuizzes = new Set<string>();

  responses.forEach((r, index) => {
    uniqueQuizzes.add(r.pollId);

    // Perfect score
    if (r.percentage === 100) {
      perfectScoreCount++;
      if (perfectScoreCount === 1) {
        badges.push({
          type: "perfect_score",
          ...BADGE_DEFINITIONS.perfect_score,
          earnedAt: r.created_at,
          count: 1,
        });
      }
    }

    // High score count
    if (r.percentage >= 80) {
      highScoreCount++;
    }

    // Streak calculation
    if (r.percentage >= 70) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }

    // Amélioration (comparaison avec le quiz précédent)
    if (index > 0) {
      const improvement = r.percentage - responses[index - 1].percentage;
      if (improvement >= 20 && !badges.find((b) => b.type === "improver")) {
        badges.push({
          type: "improver",
          ...BADGE_DEFINITIONS.improver,
          earnedAt: r.created_at,
        });
      }
    }
  });

  // Badges de streak
  if (bestStreak >= 3 && !badges.find((b) => b.type === "streak_3")) {
    badges.push({
      type: "streak_3",
      ...BADGE_DEFINITIONS.streak_3,
    });
  }
  if (bestStreak >= 5 && !badges.find((b) => b.type === "streak_5")) {
    badges.push({
      type: "streak_5",
      ...BADGE_DEFINITIONS.streak_5,
    });
  }
  if (bestStreak >= 10 && !badges.find((b) => b.type === "streak_10")) {
    badges.push({
      type: "streak_10",
      ...BADGE_DEFINITIONS.streak_10,
    });
  }

  // Badge régulier (5 quiz > 80%)
  if (highScoreCount >= 5 && !badges.find((b) => b.type === "consistent")) {
    badges.push({
      type: "consistent",
      ...BADGE_DEFINITIONS.consistent,
    });
  }

  // Badge champion (10 quiz parfaits)
  if (perfectScoreCount >= 10 && !badges.find((b) => b.type === "champion")) {
    badges.push({
      type: "champion",
      ...BADGE_DEFINITIONS.champion,
    });
  }

  // Badge explorateur (5 quiz différents)
  if (uniqueQuizzes.size >= 5 && !badges.find((b) => b.type === "explorer")) {
    badges.push({
      type: "explorer",
      ...BADGE_DEFINITIONS.explorer,
    });
  }

  // Mettre à jour le count pour perfect_score
  const perfectBadge = badges.find((b) => b.type === "perfect_score");
  if (perfectBadge) {
    perfectBadge.count = perfectScoreCount;
  }

  return badges;
}

/**
 * Récupère les badges nouvellement gagnés après un quiz
 * (compare avant/après pour afficher les nouveaux)
 */
export function getNewBadges(childName: string, previousBadgeCount: number): Badge[] {
  const history = getChildHistory(childName);
  if (!history) return [];

  // Retourner les badges au-delà de previousBadgeCount
  return history.badges.slice(previousBadgeCount);
}

// Utility functions
function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function getDeviceId(): string {
  if (!hasWindow()) return `server_${Date.now()}`;

  let deviceId = localStorage.getItem("doodates_device_id");
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("doodates_device_id", deviceId);
  }
  return deviceId;
}
