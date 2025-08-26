// src/lib/pollStorage.ts
// Utilitaires de stockage/local pour les sondages (mode développement localStorage)
// - Centralise l'accès à localStorage et la logique de duplication/suppression
// - Fournit aussi des helpers d'URL et de copie presse-papier

export interface PollSettings {
  selectedDates?: string[];
  timeSlotsByDate?: Record<string, any[]>;
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
}

const STORAGE_KEY = "dev-polls";

// Sûr pour les environnements non-browser (tests)
function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function getPolls(): Poll[] {
  try {
    const raw = hasWindow() ? window.localStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? (JSON.parse(raw) as unknown as Poll[]) : [];
    // Validation lecture: ne retourner que des sondages avec des dates valides
    const valid: Poll[] = [];
    for (const p of parsed) {
      try {
        validatePoll(p);
        valid.push(p);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Poll invalide ignoré (selectedDates manquant ou vide)", {
          id: (p as any)?.id,
          slug: (p as any)?.slug,
          title: (p as any)?.title,
        });
      }
    }
    return valid;
  } catch {
    return [];
  }
}

export function savePolls(polls: Poll[]): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
}

export function getPollBySlugOrId(
  idOrSlug: string | undefined | null,
): Poll | null {
  if (!idOrSlug) return null;
  const polls = getPolls();
  return (
    polls.find((p) => p.slug === idOrSlug) ||
    polls.find((p) => p.id === idOrSlug) ||
    null
  );
}

export function addPoll(poll: Poll): void {
  // Validation écriture: empêcher l'enregistrement d'un sondage invalide
  validatePoll(poll);
  const polls = getPolls();
  polls.push(poll);
  savePolls(polls);
}

export function deletePollById(id: string): void {
  const polls = getPolls();
  const next = polls.filter((p) => p.id !== id);
  savePolls(next);
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
  const dates = poll?.settings?.selectedDates;
  if (!isNonEmptyStringArray(dates)) {
    throw new Error(
      "Invalid poll: settings.selectedDates must be a non-empty array of strings",
    );
  }
}
