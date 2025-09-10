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
  writeRecordStorage
} from './storage/storageUtils';

export interface PollSettings {
  selectedDates?: string[];
  timeSlotsByDate?: Record<string, any[]>;
}

// --- Types FormPoll (réponses & résultats) ---
export type FormQuestionKind = "single" | "multiple" | "text";

export interface FormQuestionOption {
  id: string;
  label: string;
}

export interface FormQuestionShape {
  id: string;
  kind: FormQuestionKind;
  title: string;
  required?: boolean;
  options?: FormQuestionOption[];
  maxChoices?: number;
}

export interface FormResponseItem {
  questionId: string;
  // single => string (optionId), multiple => string[] (optionIds), text => string
  value: string | string[];
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

export interface Poll {
  id: string;
  title: string;
  slug: string;
  created_at: string;
  description?: string;
  status?: "draft" | "active" | "closed" | "archived" | string;
  settings?: PollSettings;
  // Champ facultatif utilisé lors de duplications locales
  updated_at?: string;
  // Unification des types de sondages
  type?: "date" | "form";
  // Champs spécifiques aux formulaires
  questions?: any[];
}

const STORAGE_KEY = "dev-polls";
const FORM_STORAGE_KEY = "dev-form-polls";
const FORM_RESPONSES_KEY = "dev-form-responses";

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
        // eslint-disable-next-line no-console
        console.warn("Poll invalide ignoré (date)", {
          id: (p as any)?.id,
          slug: (p as any)?.slug,
          title: (p as any)?.title,
        });
      }
    }
    return validDatePolls;
  } catch {
    return [];
  }
}

export function savePolls(polls: Poll[]): void {
  writeToStorage(STORAGE_KEY, polls, memoryPollCache);
}

export function getPollBySlugOrId(
  idOrSlug: string | undefined | null,
): Poll | null {
  if (!idOrSlug) return null;
  // Rechercher dans l'ensemble unifié (date + form)
  const polls = getAllPolls();
  return (
    polls.find((p) => p.slug === idOrSlug) ||
    polls.find((p) => p.id === idOrSlug) ||
    null
  );
}

export function addPoll(poll: Poll): void {
  // Validation écriture: empêcher l'enregistrement d'un sondage invalide
  validatePoll(poll);
  // Ajouter dans l'ensemble unifié (ne pas perdre les polls de type "form")
  const polls = getAllPolls();
  polls.push(poll);
  savePolls(polls);
  // Mettre à jour le cache mémoire pour robustesse (tests/concurrence)
  memoryPollCache.set(poll.id, poll);
}

export function deletePollById(id: string): void {
  // Supprimer dans l'ensemble unifié
  const polls = getAllPolls();
  const next = polls.filter((p) => p.id !== id);
  savePolls(next);
  // Synchroniser le cache mémoire
  memoryPollCache.delete(id);
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
    hasWindow() && window.location?.origin
      ? window.location.origin
      : "http://localhost";
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
  throw new Error("Clipboard non disponible dans cet environnement");
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
      throw new Error(
        "Invalid date poll: settings.selectedDates must be a non-empty array of strings",
      );
    }
    return;
  }
  // Pour les sondages de type "form", valider minimalement le titre
  if (poll.type === "form") {
    if (!poll?.title || typeof poll.title !== "string" || !poll.title.trim()) {
      throw new Error("Invalid form poll: title must be a non-empty string");
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
    const raw = hasWindow() ? window.localStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? (JSON.parse(raw) as unknown as Poll[]) : [];
    // Valider individuellement selon leur type, ignorer les entrées manifestement invalides
    const valid: Poll[] = [];
    for (const p of parsed) {
      try {
        validatePoll(p);
        valid.push(p);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Poll invalide ignoré (unifié)", {
          id: (p as any)?.id,
          slug: (p as any)?.slug,
          title: (p as any)?.title,
          type: (p as any)?.type,
        });
      }
    }
    return valid;
  } catch {
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
    const forms = rawForms ? (JSON.parse(rawForms) as any[]) : [];

    if (!Array.isArray(forms) || forms.length === 0) return;

    // Ne pas dupliquer: indexer par id existant dans le unifié
    const existingIds = new Set(unified.map((p) => p.id));
    let migrated = 0;
    for (const f of forms) {
      const id = (f && typeof f === "object" ? (f as any).id : undefined) as
        | string
        | undefined;
      if (id && existingIds.has(id)) continue;
      const formPoll: Poll = {
        id: id || `form-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: (f?.title as string) || "Sans titre",
        slug:
          (f?.slug as string) ||
          `form-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        created_at: (f?.created_at as string) || new Date().toISOString(),
        description: (f?.description as string) || undefined,
        status: (f?.status as any) || "draft",
        updated_at: new Date().toISOString(),
        type: "form",
        questions: Array.isArray((f as any)?.questions)
          ? (f as any).questions
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
    // eslint-disable-next-line no-console
    console.warn("Migration des brouillons formulaires échouée", e);
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
  } catch {
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
      if (!it) throw new Error("Missing required answer");
      if (
        q.kind === "text" &&
        (typeof it.value !== "string" || !it.value.trim())
      ) {
        throw new Error("Text answer required");
      }
      if (q.kind === "single" && (typeof it.value !== "string" || !it.value)) {
        throw new Error("Single choice required");
      }
      if (q.kind === "multiple") {
        if (!Array.isArray(it.value) || it.value.length === 0) {
          throw new Error("At least one choice required");
        }
      }
    }
    // Max choices
    if (q.kind === "multiple" && q.maxChoices && q.maxChoices > 0) {
      const v = it?.value;
      if (Array.isArray(v) && v.length > q.maxChoices) {
        throw new Error("Too many choices");
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
  if (!poll) throw new Error("Form poll not found");
  // Validation (required + maxChoices)
  assertValidFormAnswer(poll, params.items);

  const all = readAllResponses();
  // déduplication légère: même navigateur + même nom => remplace
  const normalizedName = (params.respondentName || "").trim();
  const targetKey = (normalizedName || "").toLowerCase();
  const existingIdx = all.findIndex(
    (r) =>
      r.pollId === params.pollId &&
      (r.respondentName || "").trim().toLowerCase() === targetKey,
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
  if (!poll) throw new Error("Form poll not found");
  const all = readAllResponses().filter((r) => r.pollId === pollId);

  const countsByQuestion: Record<string, Record<string, number>> = {};
  const textAnswers: Record<string, string[]> = {};

  const qIndex = new Map<string, FormQuestionShape>();
  for (const q of (poll.questions || []) as FormQuestionShape[]) {
    qIndex.set(q.id, q);
    const kind = (q as any)?.kind || (q as any)?.type || "single";
    if (kind !== "text") countsByQuestion[q.id] = {};
    else textAnswers[q.id] = [];
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
        countsByQuestion[q.id][optId] =
          (countsByQuestion[q.id][optId] || 0) + 1;
        continue;
      }
      if (kind === "multiple") {
        const arr = Array.isArray(it.value) ? it.value : [];
        for (const optId of arr) {
          countsByQuestion[q.id][optId] =
            (countsByQuestion[q.id][optId] || 0) + 1;
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
  const generated = `dev-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  if (hasWindow()) {
    window.localStorage.setItem(key, generated);
  }
  DEVICE_ID_CACHE = generated;
  return generated;
}

// For date-poll votes stored in dev-votes
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

// For form-poll responses stored via addFormResponse
export function getRespondentId(resp: FormResponse): string {
  const name = (resp?.respondentName || "").trim().toLowerCase();
  if (name) return `name:${name}`;
  // Stable fallback combines deviceId and response id
  return `anon:${getDeviceId()}:${resp.id}`;
}
