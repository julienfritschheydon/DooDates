// Quizz Service
// Logique spécifique aux quizz

import {
  readFromStorage,
  writeToStorage,
  addToStorage,
  findById,
  updateInStorage,
  deleteFromStorage,
  readRecordStorage,
  writeRecordStorage,
} from "../../storage/storageUtils";
import { handleError, ErrorFactory, logError } from "../../error-handling";
import { logger } from "../../logger";

// Types spécifiques aux Quizz
export interface QuizzQuestion {
  id: string;
  question: string;
  type: "single" | "multiple" | "text" | "true-false";
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

// Constants
const STORAGE_KEY = "doodates_polls";
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

  logger.info("Quizz validated successfully", {
    pollId: poll.id,
    title: poll.title,
    questionsCount: poll.questions.length,
    maxPoints: poll.maxPoints,
  });
}

// Helper functions
function isQuizz(poll: any): poll is Quizz {
  return poll?.type === "quizz" && Array.isArray(poll?.questions);
}

// CRUD Operations
export function getQuizz(): Quizz[] {
  try {
    if (!hasWindow()) return [];

    const raw = readFromStorage(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const validQuizz: Quizz[] = [];
    for (const p of parsed) {
      if (isQuizz(p)) {
        validateQuizz(p);
        validQuizz.push(p);
      }
    }

    return deduplicateQuizz(validQuizz);
  } catch (error) {
    logError(error, "getQuizz", {
      operation: "getQuizz",
      storageKey: STORAGE_KEY,
    });
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
        logger.warn("Duplicate quizz found and removed", { pollId: poll.id });
        return false;
      }
      seen.add(poll.id);
      return true;
    });
}

export function saveQuizz(quizz: Quizz[]): void {
  try {
    if (!hasWindow()) return;

    const existingQuizz = getQuizz();
    const mergedQuizz = [...existingQuizz, ...quizz];
    const deduplicatedQuizz = deduplicateQuizz(mergedQuizz);

    writeToStorage(STORAGE_KEY, JSON.stringify(deduplicatedQuizz));
    logger.info("Quizz saved successfully", {
      count: deduplicatedQuizz.length,
    });
  } catch (error) {
    logError(error, "saveQuizz", {
      operation: "saveQuizz",
      quizzCount: quizz.length,
    });
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
      logger.info("Quizz updated", { pollId: poll.id });
    } else {
      quizz.push(poll);
      logger.info("Quizz created", { pollId: poll.id });
    }

    saveQuizz(quizz);
  } catch (error) {
    logError(error, "addQuizz", {
      operation: "addQuizz",
      pollId: poll.id,
    });
    throw error;
  }
}

export function deleteQuizzById(id: string): void {
  try {
    const quizz = getQuizz();
    const next = quizz.filter((p) => p.id !== id);
    saveQuizz(next);
    logger.info("Quizz deleted", { pollId: id });
  } catch (error) {
    logError(error, "deleteQuizzById", {
      operation: "deleteQuizzById",
      pollId: id,
    });
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

  logger.info("Quizz duplicated", {
    originalId: poll.id,
    newId: newQuizz.id,
  });

  return newQuizz;
}

// Quizz Responses Management
function readAllQuizzResponses(): QuizzResponse[] {
  try {
    if (!hasWindow()) return [];

    const raw = readFromStorage(QUIZZ_RESPONSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    logError(error, "readAllQuizzResponses", {
      operation: "readAllQuizzResponses",
      storageKey: QUIZZ_RESPONSES_KEY,
    });
    return [];
  }
}

function writeAllQuizzResponses(responses: QuizzResponse[]): void {
  try {
    if (!hasWindow()) return;
    writeToStorage(QUIZZ_RESPONSES_KEY, JSON.stringify(responses));
  } catch (error) {
    logError(error, "writeAllQuizzResponses", {
      operation: "writeAllQuizzResponses",
      responseCount: responses.length,
    });
    throw error;
  }
}

export function getQuizzById(pollId: string): Quizz | null {
  const poll = getQuizz().find((p) => p.id === pollId) || null;
  if (!poll) {
    logger.warn("Quizz not found", { pollId });
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

    logger.info("Quizz response added", {
      responseId: response.id,
      pollId,
      totalPoints,
      percentage,
    });

    return response;
  } catch (error) {
    logError(error, "addQuizzResponse", {
      operation: "addQuizzResponse",
      pollId,
      answersCount: answers.length,
    });
    throw error;
  }
}

function checkAnswer(question: QuizzQuestion, userAnswer: string | string[] | boolean): boolean {
  switch (question.type) {
    case "single":
    case "text":
      return userAnswer === question.correctAnswer;
    case "multiple":
      if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
        return false;
      }
      const userSet = new Set(userAnswer);
      const correctSet = new Set(question.correctAnswer as string[]);
      return userSet.size === correctSet.size && [...userSet].every((x) => correctSet.has(x));
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

export function getQuizzResponses(pollId: string): QuizzResponse[] {
  const all = readAllQuizzResponses();
  return all.filter((r) => r.pollId === pollId);
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
