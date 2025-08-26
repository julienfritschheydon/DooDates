import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addPoll,
  buildPublicLink,
  copyToClipboard,
  deletePollById,
  duplicatePoll,
  getPollBySlugOrId,
  getPolls,
  savePolls,
  type Poll,
} from "@/lib/pollStorage";

const makePoll = (overrides: Partial<Poll> = {}): Poll => ({
  id: overrides.id ?? "local-1",
  title: overrides.title ?? "Réunion",
  slug: overrides.slug ?? "reunion",
  created_at: overrides.created_at ?? new Date(2020, 0, 1).toISOString(),
  description: overrides.description,
  status: overrides.status ?? "active",
  // Ensure minimal valid settings for validation
  settings: overrides.settings ?? {
    selectedDates: ["2025-08-26"],
  },
  updated_at: overrides.updated_at,
});

// In-memory localStorage for this suite
function installLocalStorage(preset: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(preset));
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      setItem: (key: string, value: string) =>
        void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => void store.clear(),
    },
    configurable: true,
  });
  return store;
}

describe("pollStorage", () => {
  beforeEach(() => {
    // Fresh functional localStorage and mocks
    installLocalStorage();
    vi.restoreAllMocks();
  });

  it("getPollBySlugOrId() should retrieve by slug or id", () => {
    const p1 = makePoll({ id: "a", slug: "alpha" });
    const p2 = makePoll({ id: "b", slug: "bravo" });
    savePolls([p1, p2]);

    expect(getPollBySlugOrId("alpha")?.id).toBe("a");
    expect(getPollBySlugOrId("b")?.slug).toBe("bravo");
    expect(getPollBySlugOrId(null)).toBeNull();
  });

  it("duplicatePoll() should create a new poll with updated id/slug/title and persist it", () => {
    const p = makePoll({ id: "x", slug: "event" });
    savePolls([p]);

    const dup = duplicatePoll(p);

    const all = getPolls();
    expect(all.length).toBe(2);
    expect(dup.id).not.toBe(p.id);
    expect(dup.slug).toMatch(/^event-copy-/);
    expect(dup.title).toBe(`${p.title} (Copie)`);
    // persisted
    expect(all.find((pp) => pp.id === dup.id)).toBeTruthy();
  });

  it("deletePollById() should remove the poll and persist", () => {
    const p1 = makePoll({ id: "1", slug: "s1" });
    const p2 = makePoll({ id: "2", slug: "s2" });
    savePolls([p1, p2]);

    deletePollById("1");
    const all = getPolls();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe("2");
  });

  it("buildPublicLink() should build an absolute link", () => {
    // jsdom provides window.location.origin
    const link = buildPublicLink("sluggy");
    expect(link).toContain("/poll/sluggy");
  });

  it("copyToClipboard() should use navigator.clipboard when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } as any });

    await expect(copyToClipboard("hello")).resolves.toBeUndefined();

    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("copyToClipboard() should fallback to execCommand when clipboard API is unavailable", async () => {
    // Remove clipboard API
    Object.assign(navigator, { clipboard: undefined as any });

    const exec = vi.fn();
    Object.defineProperty(document, "execCommand", {
      value: exec,
      configurable: true,
    });

    await expect(copyToClipboard("world")).resolves.toBeUndefined();

    expect(exec).toHaveBeenCalledWith("copy");
  });
});
