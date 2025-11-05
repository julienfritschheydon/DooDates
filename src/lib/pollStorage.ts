// src/lib/pollStorage.ts
// Utilitaires de stockage/local pour les sondages (mode développement localStorage)
// - Centralise l'accès à localStorage et la logique de duplication/suppression
// - Fournit aussi des helpers d'URL et de copie presse-papier

import {
  readFromStorage,
  writeToStorage,
  addToStorage,
  findById,
  updateInStorage,
  deleteFromStorage,
  readRecordStorage,
  writeRecordStorage,
} from "./storage/storageUtils";
// import { compress, decompress } from "./compression"; // TODO: Implement compression module
import { handleError, ErrorFactory, logError } from "./error-handling";
import { logger } from "./logger";

// Define proper types for time slots
export interface TimeSlot {
  start: string;
  end: string;
  dates?: string[];
}

export interface PollSettings {
  selectedDates?: string[];
  timeSlotsByDate?: Record<
    string,
    Array<{ hour: number; minute: number; enabled: boolean; duration?: number }>
  >;
  timeGranularity?: number; // Granularité des créneaux horaires en minutes (30, 60, etc.)
}

// --- Types FormPoll (réponses & résultats) ---
export type FormQuestionKind =
  | "single"
  | "multiple"
  | "text"
  | "long-text"
  | "matrix"
  | "rating"
  | "nps";

export interface FormQuestionOption {
  id: string;
  label: string;
  isOther?: boolean; // Option "Autre" avec champ texte libre
}

export interface FormQuestionShape {
  id: string;
  kind: FormQuestionKind;
  title: string;
  required?: boolean;
  options?: FormQuestionOption[];
  maxChoices?: number;
  // Legacy compatibility - some old code might use 'type' instead of 'kind'
  type?: FormQuestionKind;
  // Additional properties for text questions
  placeholder?: string;
  maxLength?: number;
  // Matrix-specific fields
  matrixRows?: FormQuestionOption[]; // Lignes (aspects à évaluer)
  matrixColumns?: FormQuestionOption[]; // Colonnes (échelle de réponse)
  matrixType?: "single" | "multiple"; // Une seule réponse par ligne ou plusieurs
  matrixColumnsNumeric?: boolean; // Colonnes numériques (1-5) au lieu de texte
  // Rating-specific fields
  ratingScale?: number; // 5 ou 10 (par défaut 5)
  ratingStyle?: "numbers" | "stars" | "emojis"; // Style d'affichage (par défaut numbers)
  ratingMinLabel?: string; // Label pour la valeur minimale
  ratingMaxLabel?: string; // Label pour la valeur maximale
  // NPS-specific fields (toujours 0-10, pas de configuration)
  // Text validation fields
  validationType?: "email" | "phone" | "url" | "number" | "date"; // Type de validation pour champs text
}

// Import ConditionalRule type
import type { ConditionalRule } from "../types/conditionalRules";

export interface FormResponseItem {
  questionId: string;
  // single => string (optionId), multiple => string[] (optionIds), text => string
  // matrix => Record<rowId, columnId | columnId[]>
  // rating/nps => number
  value: string | string[] | Record<string, string | string[]> | number;
}

export interface FormResponse {
  id: string;
  pollId: string;
  respondentName?: string;
  created_at: string;
  items: FormResponseItem[];
}

export interface FormResults {
  pollId: string;
  countsByQuestion: Record<string, Record<string, number>>; // questionId -> optionId -> count
  textAnswers: Record<string, string[]>; // questionId -> answers
  totalResponses: number;
}

// Define interface for unknown poll data during validation
interface UnknownPollData {
  id?: string;
  slug?: string;
  title?: string;
  type?: string;
  [key: string]: unknown;
}

// Define interface for legacy form poll data during migration
interface LegacyFormPoll {
  id?: string;
  created_at?: string;
  description?: string;
  status?: "draft" | "active" | "closed" | "archived";
  questions?: FormQuestionShape[];
  [key: string]: unknown;
}

export interface Poll {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  slug: string;
  settings?: PollSettings;
  status: "draft" | "active" | "closed" | "archived";
  expires_at?: string;
  created_at: string;
  updated_at: string;
  creatorEmail?: string; // Email du créateur pour les notifications
  dates: string[]; // Dates sélectionnées pour le sondage
  // Unification des types de sondages
  type?: "date" | "form";
  // Champs spécifiques aux formulaires - properly typed now
  questions?: FormQuestionShape[];
  conditionalRules?: ConditionalRule[]; // Règles pour questions conditionnelles
  themeId?: string; // Thème visuel (Quick Win #3)
  displayMode?: "all-at-once" | "multi-step"; // Mode d'affichage du formulaire
  // Lien avec conversation IA
  relatedConversationId?: string; // ID de la conversation qui a créé ce sondage
  // NOUVEAU : Lien bidirectionnel avec conversation (architecture centrée conversations)
  conversationId?: string; // ID de la conversation parente
}

const STORAGE_KEY = "doodates_polls";
const FORM_STORAGE_KEY = "doodates_form_polls";
const FORM_RESPONSES_KEY = "doodates_form_responses";

// Module-level caches to improve stability in test environments
// - DEVICE_ID_CACHE ensures a stable device id within a single process run even if
//   another concurrent test clears localStorage.
// - memoryPollCache helps immediate lookups after addPoll() even if another test
//   clears localStorage concurrently.
let DEVICE_ID_CACHE: string | null = null;
const memoryPollCache = new Map<string, Poll>();
let memoryResponses: FormResponse[] = [];

// Sûr pour les environnements non-browser (tests)
function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function getPolls(): Poll[] {
  try {
    // 1) Migration éventuelle des brouillons formulaires -> stockage unifié
    migrateFormDraftsIntoUnified();

    // 2) Lecture depuis le stockage unifié
    const parsed = readFromStorage(STORAGE_KEY, memoryPollCache, []);

    // 3) Validation lecture: retourner uniquement les sondages de type "date"
    //    (compatibilité ascendante avec les consommateurs actuels du module)
    const validDatePolls: Poll[] = [];
    for (const p of parsed) {
      try {
        if (isDatePoll(p)) {
          validatePoll(p);
          validDatePolls.push(p);
        }
      } catch (e) {
        // Use proper typing for unknown poll data
        const pollData = p as unknown as UnknownPollData;
        const validationError = handleError(
          e,
          {
            component: "pollStorage",
            operation: "getPolls",
            pollId: pollData?.id,
          },
          "Poll invalide ignoré",
        );

        logError(validationError, {
          component: "pollStorage",
          operation: "validateDatePoll",
          pollData: {
            id: pollData?.id,
            slug: pollData?.slug,
            title: pollData?.title,
          },
        });
      }
    }
    return validDatePolls;
  } catch (error) {
    const storageError = handleError(
      error,
      {
        component: "pollStorage",
        operation: "getAllPolls",
      },
      "Erreur lors de la lecture de tous les sondages",
    );

    logError(storageError, {
      component: "pollStorage",
      operation: "getAllPolls",
    });

    return [];
  }
}

// Dédoublonner les polls par ID (garder le plus récent)
function deduplicatePolls(polls: Poll[]): Poll[] {
  const seen = new Map<string, Poll>();
  for (const poll of polls) {
    const existing = seen.get(poll.id);
    if (!existing) {
      seen.set(poll.id, poll);
    } else {
      // Garder le plus récent (updated_at ou created_at)
      const existingDate = new Date(existing.updated_at || existing.created_at).getTime();
      const currentDate = new Date(poll.updated_at || poll.created_at).getTime();
      if (currentDate > existingDate) {
        logger.warn(`Duplicate poll ID found: ${poll.id}, keeping newer version`, "poll");
        seen.set(poll.id, poll);
      } else {
        logger.warn(`Duplicate poll ID found: ${poll.id}, keeping existing version`, "poll");
      }
    }
  }
  return Array.from(seen.values());
}

export function savePolls(polls: Poll[]): void {
  const deduplicated = deduplicatePolls(polls);
  if (deduplicated.length !== polls.length) {
    logger.info(`Removed ${polls.length - deduplicated.length} duplicate polls`, "poll");
  }
  writeToStorage(STORAGE_KEY, deduplicated, memoryPollCache);
}

export function getPollBySlugOrId(idOrSlug: string | undefined | null): Poll | null {
  if (!idOrSlug) return null;
  // Rechercher dans l'ensemble unifié (date + form)
  const polls = getAllPolls();
  return polls.find((p) => p.slug === idOrSlug) || polls.find((p) => p.id === idOrSlug) || null;
}

export function addPoll(poll: Poll): void {
  // Validation écriture: empêcher l'enregistrement d'un sondage invalide
  validatePoll(poll);
  // Ajouter ou remplacer dans l'ensemble unifié
  const polls = getAllPolls();
  const existingIndex = polls.findIndex((p) => p.id === poll.id);

  if (existingIndex >= 0) {
    // Remplacer le poll existant
    polls[existingIndex] = poll;
  } else {
    // Ajouter un nouveau poll
    polls.push(poll);
  }

  savePolls(polls);
  // Mettre à jour le cache mémoire pour robustesse (tests/concurrence)
  memoryPollCache.set(poll.id, poll);
}

export function deletePollById(id: string): void {
  logger.debug(`Deleting poll with id: ${id}`, "poll");
  // Supprimer dans l'ensemble unifié
  const polls = getAllPolls();
  logger.debug(`Found ${polls.length} polls before deletion`, "poll");
  const next = polls.filter((p) => p.id !== id);
  logger.debug(`${next.length} polls remaining after filter`, "poll");
  savePolls(next);
  // Synchroniser le cache mémoire
  memoryPollCache.delete(id);
  logger.info(`Poll ${id} deleted successfully`, "poll");

  // Notifier les composants du changement
  logger.info(`🔔 Dispatching pollsChanged event for poll ${id}`, "poll");
  const event = new CustomEvent("pollsChanged", { detail: { action: "delete", pollId: id } });
  window.dispatchEvent(event);
  logger.info(`✅ pollsChanged event dispatched`, "poll");
}

export function duplicatePoll(poll: Poll): Poll {
  const now = new Date().toISOString();
  const ts = Date.now();
  const duplicated: Poll = {
    ...poll,
    id: `local-${ts}`,
    title: `${poll.title} (Copie)`,
    slug: `${poll.slug}-copy-${ts}`,
    created_at: now,
    updated_at: now,
  };
  addPoll(duplicated);
  return duplicated;
}

export function buildPublicLink(slug: string): string {
  const origin =
    hasWindow() && window.location?.origin ? window.location.origin : "http://localhost";
  return `${origin}/poll/${slug}`;
}

export async function copyToClipboard(text: string): Promise<void> {
  // API moderne
  if (hasWindow() && navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback DOM
  if (hasWindow()) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return;
  }
  // Environnement non-browser: on ne peut pas copier, on échoue proprement
  const clipboardError = ErrorFactory.critical(
    "Clipboard non disponible dans cet environnement",
    "Impossible de copier dans le presse-papier",
  );

  logError(clipboardError, {
    component: "pollStorage",
    operation: "copyToClipboard",
  });

  throw clipboardError;
}

// --- Validation helpers ---
function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((v) => typeof v === "string" && v.trim().length > 0)
  );
}

function validatePoll(poll: Poll): void {
  // Pour les sondages de type "date" (ou legacy sans type mais avec des dates), exiger selectedDates non vide
  if (isDatePoll(poll)) {
    const dates = poll?.settings?.selectedDates;
    if (!isNonEmptyStringArray(dates)) {
      const validationError = ErrorFactory.validation(
        "Invalid date poll: settings.selectedDates must be a non-empty array of strings",
        "Le sondage doit contenir au moins une date valide",
      );

      logError(validationError, {
        component: "pollStorage",
        operation: "validateDatePoll",
      });

      throw validationError;
    }
    return;
  }
  // Pour les sondages de type "form", valider minimalement le titre
  if (poll.type === "form") {
    if (!poll?.title || typeof poll.title !== "string" || !poll.title.trim()) {
      const validationError = ErrorFactory.validation(
        "Invalid form poll: title must be a non-empty string",
        "Le titre du formulaire est obligatoire",
      );

      logError(validationError, {
        component: "pollStorage",
        operation: "validateFormPoll",
      });

      throw validationError;
    }
    return;
  }
}

// Déterminer si un poll est un sondage "date"
function isDatePoll(p: Poll): boolean {
  if (p?.type === "date") return true;
  // Legacy: pas de type mais présence de selectedDates
  const dates = p?.settings?.selectedDates;
  return p?.type === undefined && Array.isArray(dates) && dates.length > 0;
}

// Retourne tous les sondages (date + form) après migration éventuelle
export function getAllPolls(): Poll[] {
  try {
    migrateFormDraftsIntoUnified();
    // Utiliser readFromStorage pour maintenir la cohérence du cache mémoire
    const polls = readFromStorage(STORAGE_KEY, memoryPollCache, []);

    // Dédoublonner par ID (garder le plus récent)
    const seen = new Map<string, Poll>();
    for (const p of polls) {
      const existing = seen.get(p.id);
      if (!existing) {
        seen.set(p.id, p);
      } else {
        const existingDate = new Date(existing.updated_at || existing.created_at).getTime();
        const currentDate = new Date(p.updated_at || p.created_at).getTime();
        if (currentDate > existingDate) {
          logger.warn(`Duplicate poll ID ${p.id} found, keeping newer version`, "poll");
          seen.set(p.id, p);
        }
      }
    }
    const deduplicated = Array.from(seen.values());

    if (deduplicated.length !== polls.length) {
      logger.warn(
        `Removed ${polls.length - deduplicated.length} duplicate polls, saving cleaned version...`,
        "poll",
      );
      writeToStorage(STORAGE_KEY, deduplicated, memoryPollCache);
    }

    // Valider individuellement selon leur type, ignorer les entrées manifestement invalides
    const valid: Poll[] = [];
    for (const p of deduplicated) {
      try {
        validatePoll(p);
        valid.push(p);
      } catch (e) {
        // Use proper typing for unknown poll data
        const pollData = p as unknown as UnknownPollData;
        const validationError = handleError(
          e,
          {
            component: "pollStorage",
            operation: "getAllPolls",
            pollId: pollData?.id,
          },
          "Poll invalide ignoré",
        );

        logError(validationError, {
          component: "pollStorage",
          operation: "validateUnifiedPoll",
          pollData: {
            id: pollData?.id,
            slug: pollData?.slug,
            title: pollData?.title,
            type: pollData?.type,
          },
        });
      }
    }

    // Synchroniser le cache mémoire avec les données valides
    memoryPollCache.clear();
    valid.forEach((poll) => {
      memoryPollCache.set(poll.id, poll);
    });

    return valid;
  } catch (error) {
    const storageError = handleError(
      error,
      {
        component: "pollStorage",
        operation: "getAllPolls",
      },
      "Erreur lors de la lecture de tous les sondages",
    );

    logError(storageError, {
      component: "pollStorage",
      operation: "getAllPolls",
    });

    return [];
  }
}

// Migration: fusionner les brouillons formulaires stockés dans FORM_STORAGE_KEY vers STORAGE_KEY
function migrateFormDraftsIntoUnified(): void {
  if (!hasWindow()) return;
  try {
    const rawUnified = window.localStorage.getItem(STORAGE_KEY);
    const unified = rawUnified ? (JSON.parse(rawUnified) as Poll[]) : [];

    const rawForms = window.localStorage.getItem(FORM_STORAGE_KEY);
    const forms = rawForms ? (JSON.parse(rawForms) as LegacyFormPoll[]) : [];

    if (!Array.isArray(forms) || forms.length === 0) return;

    // Ne pas dupliquer: indexer par id existant dans le unifié
    const existingIds = new Set(unified.map((p) => p.id));
    let migrated = 0;
    for (const f of forms) {
      const id = (f && typeof f === "object" ? (f as LegacyFormPoll).id : undefined) as
        | string
        | undefined;
      if (id && existingIds.has(id)) continue;
      const formPoll: Poll = {
        id: id || `form-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        creator_id: "anonymous",
        title: (f?.title as string) || "Sans titre",
        slug: (f?.slug as string) || `form-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        created_at: (f?.created_at as string) || new Date().toISOString(),
        description: (f?.description as string) || undefined,
        status: (f?.status as any) || "draft",
        updated_at: new Date().toISOString(),
        dates: [], // Form polls don't have dates
        type: "form",
        questions: Array.isArray((f as LegacyFormPoll).questions)
          ? (f as LegacyFormPoll).questions
          : [],
      };
      unified.push(formPoll);
      existingIds.add(formPoll.id);
      migrated++;
    }

    if (migrated > 0) {
      writeToStorage(STORAGE_KEY, unified, memoryPollCache);
      // Nettoyage: on peut vider l'ancien stockage spécifique
      window.localStorage.removeItem(FORM_STORAGE_KEY);
    }
  } catch (e) {
    const migrationError = handleError(
      e,
      {
        component: "pollStorage",
        operation: "migrateFormDrafts",
      },
      "Migration des brouillons formulaires échouée",
    );

    logError(migrationError, {
      component: "pollStorage",
      operation: "migrateFormDrafts",
    });
  }
}

// --- Réponses FormPoll: stockage local et agrégations ---

const memoryResponsesCache = new Map<string, FormResponse>();

function readAllResponses(): FormResponse[] {
  try {
    const fromStorage = readFromStorage(FORM_RESPONSES_KEY, memoryResponsesCache, []);
    // Merge with in-memory cache (avoid duplicates by id)
    const byId = new Map<string, FormResponse>();
    for (const r of memoryResponses) byId.set(r.id, r);
    for (const r of fromStorage) byId.set(r.id, r);
    const merged = Array.from(byId.values());
    // Keep memory cache in sync
    memoryResponses = merged;
    return merged;
  } catch (error) {
    const readError = handleError(
      error,
      {
        component: "pollStorage",
        operation: "readAllResponses",
      },
      "Erreur lors de la lecture des réponses",
    );

    logError(readError, {
      component: "pollStorage",
      operation: "readAllResponses",
    });

    // Fallback to memory cache if JSON parse fails or other issue
    return memoryResponses.slice();
  }
}

function writeAllResponses(resps: FormResponse[]): void {
  // Update memory cache first (write-through)
  memoryResponses = resps.slice();
  writeToStorage(FORM_RESPONSES_KEY, resps, memoryResponsesCache);
}

function getFormPollById(pollId: string): Poll | null {
  // 1) Essayer d'abord le cache mémoire (utile si localStorage a été vidé par un autre test)
  const cached = memoryPollCache.get(pollId) || null;
  if (cached && cached.type === "form") return cached;
  // 2) Sinon, lire depuis le stockage unifié
  const poll = getAllPolls().find((p) => p.id === pollId) || null;
  if (!poll || poll.type !== "form") return null;
  return poll;
}

function assertValidFormAnswer(poll: Poll, items: FormResponseItem[]): void {
  const qIndex = new Map<string, FormQuestionShape>();
  for (const q of (poll.questions || []) as FormQuestionShape[]) {
    qIndex.set(q.id, q);
  }
  for (const q of qIndex.values()) {
    const it = items.find((i) => i.questionId === q.id);
    // Required
    if (q.required) {
      if (!it) {
        const validationError = ErrorFactory.validation(
          "Missing required answer",
          "Réponse obligatoire manquante",
        );

        logError(validationError, {
          component: "pollStorage",
          operation: "assertValidFormAnswer",
          questionId: q.id,
        });

        throw validationError;
      }
      if (q.kind === "text" && (typeof it.value !== "string" || !it.value.trim())) {
        const validationError = ErrorFactory.validation(
          "Text answer required",
          "Réponse textuelle obligatoire",
        );

        logError(validationError, {
          component: "pollStorage",
          operation: "assertValidFormAnswer",
          questionId: q.id,
        });

        throw validationError;
      }
      if (q.kind === "single" && (typeof it.value !== "string" || !it.value)) {
        const validationError = ErrorFactory.validation(
          "Single choice required",
          "Choix unique obligatoire",
        );

        logError(validationError, {
          component: "pollStorage",
          operation: "assertValidFormAnswer",
          questionId: q.id,
        });

        throw validationError;
      }
      if (q.kind === "multiple") {
        if (!Array.isArray(it.value) || it.value.length === 0) {
          const validationError = ErrorFactory.validation(
            "At least one choice required",
            "Au moins un choix obligatoire",
          );

          logError(validationError, {
            component: "pollStorage",
            operation: "assertValidFormAnswer",
            questionId: q.id,
          });

          throw validationError;
        }
      }
    }
    // Max choices
    if (q.kind === "multiple" && q.maxChoices && q.maxChoices > 0) {
      const v = it?.value;
      if (Array.isArray(v) && v.length > q.maxChoices) {
        const validationError = ErrorFactory.validation(
          "Too many choices",
          "Trop de choix sélectionnés",
        );

        logError(validationError, {
          component: "pollStorage",
          operation: "assertValidFormAnswer",
          questionId: q.id,
          maxChoices: q.maxChoices,
        });

        throw validationError;
      }
    }
  }
}

export function addFormResponse(params: {
  pollId: string;
  respondentName?: string;
  items: FormResponseItem[];
}): FormResponse {
  const poll = getFormPollById(params.pollId);
  if (!poll) {
    const notFoundError = ErrorFactory.validation(
      "Form poll not found",
      "Sondage de formulaire introuvable",
    );

    logError(notFoundError, {
      component: "pollStorage",
      operation: "addFormResponse",
      pollId: params.pollId,
    });

    throw notFoundError;
  }
  // Validation (required + maxChoices)
  assertValidFormAnswer(poll, params.items);

  const all = readAllResponses();
  // déduplication légère: même navigateur + même nom => remplace
  const normalizedName = (params.respondentName || "").trim();
  const targetKey = (normalizedName || "").toLowerCase();
  const existingIdx = all.findIndex(
    (r) =>
      r.pollId === params.pollId && (r.respondentName || "").trim().toLowerCase() === targetKey,
  );
  const now = new Date().toISOString();
  const resp: FormResponse = {
    id:
      existingIdx >= 0
        ? all[existingIdx].id
        : `resp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    pollId: params.pollId,
    respondentName: normalizedName ? normalizedName : undefined,
    created_at: now,
    items: params.items,
  };
  if (existingIdx >= 0) {
    all[existingIdx] = resp;
  } else {
    all.push(resp);
  }
  writeAllResponses(all);

  return resp;
}

export function getFormResults(pollId: string): FormResults {
  const poll = getFormPollById(pollId);
  if (!poll) {
    const notFoundError = ErrorFactory.validation(
      "Form poll not found",
      "Sondage de formulaire introuvable",
    );

    logError(notFoundError, {
      component: "pollStorage",
      operation: "getFormResults",
      pollId,
    });

    throw notFoundError;
  }
  const all = readAllResponses().filter((r) => r.pollId === pollId);

  const countsByQuestion: Record<string, Record<string, number>> = {};
  const textAnswers: Record<string, string[]> = {};

  const qIndex = new Map<string, FormQuestionShape>();
  for (const q of (poll.questions || []) as FormQuestionShape[]) {
    qIndex.set(q.id, q);
    const kind = (q as any)?.kind || (q as any)?.type || "single";
    if (kind !== "text") countsByQuestion[q.id] = {};
    if (kind === "text") textAnswers[q.id] = [];
  }

  for (const r of all) {
    for (const it of r.items) {
      const q = qIndex.get(it.questionId);
      if (!q) continue;
      const kind = (q as any)?.kind || (q as any)?.type || "single";
      if (kind === "text") {
        if (typeof it.value === "string" && it.value.trim()) {
          textAnswers[q.id].push(it.value);
        }
        continue;
      }
      if (kind === "single") {
        const optId = typeof it.value === "string" ? it.value : undefined;
        if (!optId) continue;
        countsByQuestion[q.id][optId] = (countsByQuestion[q.id][optId] || 0) + 1;
        continue;
      }
      if (kind === "multiple") {
        const arr = Array.isArray(it.value) ? it.value : [];
        for (const optId of arr) {
          countsByQuestion[q.id][optId] = (countsByQuestion[q.id][optId] || 0) + 1;
        }
        continue;
      }
      if (kind === "matrix") {
        // Pour matrices, compter chaque cellule (rowId_colId)
        const matrixVal = it.value as Record<string, string | string[]>;
        if (matrixVal && typeof matrixVal === "object" && !Array.isArray(matrixVal)) {
          for (const [rowId, colValue] of Object.entries(matrixVal)) {
            const colIds = Array.isArray(colValue) ? colValue : [colValue];
            for (const colId of colIds) {
              if (colId) {
                const key = `${rowId}_${colId}`;
                countsByQuestion[q.id][key] = (countsByQuestion[q.id][key] || 0) + 1;
              }
            }
          }
        }
      }
    }
  }

  return {
    pollId,
    countsByQuestion,
    textAnswers,
    totalResponses: all.length,
  };
}

// Expose raw form responses for a poll (used for dashboard stats and per-respondent views)
export function getFormResponses(pollId: string): FormResponse[] {
  return readAllResponses().filter((r) => r.pollId === pollId);
}

// --- Unicity helpers (simple, centralized) ---
export function getDeviceId(): string {
  if (DEVICE_ID_CACHE) return DEVICE_ID_CACHE;
  if (!hasWindow()) return (DEVICE_ID_CACHE = "server");
  const key = "dd-device-id";
  const existing = hasWindow() ? window.localStorage.getItem(key) : null;
  if (existing && existing.trim()) {
    DEVICE_ID_CACHE = existing;
    return existing;
  }
  const generated = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  if (hasWindow()) {
    window.localStorage.setItem(key, generated);
  }
  DEVICE_ID_CACHE = generated;
  return generated;
}

// Vote storage constants and functions
const VOTES_STORAGE_KEY = "doodates_votes";

export interface Vote {
  id?: string;
  poll_id: string;
  voter_email?: string;
  voter_name?: string;
  created_at?: string;
  [key: string]: any;
}

// For date-poll votes stored in doodates_votes
export function getVoterId(vote: {
  voter_email?: string;
  voter_name?: string;
  id?: string;
  created_at?: string;
}): string {
  const email = (vote?.voter_email || "").trim().toLowerCase();
  if (email) return email;
  const name = (vote?.voter_name || "").trim().toLowerCase();
  if (name) return `name:${name}`;
  const t = (vote?.created_at || "").trim();
  if (t) return `anon:${t}`;
  return `anon:${vote?.id || Math.random().toString(36).slice(2, 8)}`;
}

export function getAllVotes(): Vote[] {
  try {
    const stored = localStorage.getItem(VOTES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    const storageError = handleError(
      error,
      {
        component: "pollStorage",
        operation: "getAllPolls",
      },
      "Erreur lors de la lecture de tous les sondages",
    );

    logError(storageError, {
      component: "pollStorage",
      operation: "getAllPolls",
    });

    return [];
  }
}

export function saveVotes(votes: Vote[]): void {
  try {
    localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votes));
  } catch (error) {
    const handledError = handleError(
      error,
      {
        component: "pollStorage",
        operation: "saveVotes",
      },
      "Erreur lors de la sauvegarde des votes",
    );
    throw handledError;
  }
}

export function getVotesByPollId(pollId: string): Vote[] {
  return getAllVotes().filter((vote) => vote.poll_id === pollId);
}

export function deleteVotesByPollId(pollId: string): void {
  const allVotes = getAllVotes();
  const filteredVotes = allVotes.filter((vote) => vote.poll_id !== pollId);
  saveVotes(filteredVotes);
}

// For form-poll responses stored via addFormResponse
export function getRespondentId(resp: FormResponse): string {
  const name = (resp?.respondentName || "").trim().toLowerCase();
  if (name) return `name:${name}`;
  // Stable fallback combines deviceId and response id
  return `anon:${getDeviceId()}:${resp.id}`;
}

// ============================================================================
// CONVERSATION ↔ POLL LINK FUNCTIONS (Session 1 - Architecture centrée conversations)
// ============================================================================

/**
 * Récupère un poll par son conversationId
 */
export function getPollByConversationId(conversationId: string): Poll | null {
  const allPolls = getAllPolls();
  return allPolls.find((poll) => poll.conversationId === conversationId) || null;
}

/**
 * Met à jour le lien entre un poll et une conversation
 */
export function updatePollConversationLink(pollId: string, conversationId: string): void {
  const poll = getPollBySlugOrId(pollId);
  if (!poll) {
    throw ErrorFactory.storage(`Poll not found: ${pollId}`, `Sondage non trouvé: ${pollId}`);
  }

  const updatedPoll = {
    ...poll,
    conversationId,
    updated_at: new Date().toISOString(),
  };

  addPoll(updatedPoll); // addPoll fait aussi la mise à jour si le poll existe déjà
}
