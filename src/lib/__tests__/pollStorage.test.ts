import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addPoll,
  buildPublicLink,
  copyToClipboard,
  deletePollById,
  duplicatePoll,
  getPollBySlugOrId,
  getPolls,
  getAllPolls,
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
  creator_id: overrides.creator_id ?? "user-1",
  dates: overrides.dates ?? ["2025-08-26"],
  // Ensure minimal valid settings for validation
  settings: overrides.settings ?? {
    selectedDates: ["2025-08-26"],
  },
  updated_at: overrides.updated_at,
});

import { setupMockLocalStorage } from "../../__tests__/helpers/testHelpers";

// In-memory localStorage for this suite - using helper
function installLocalStorage(preset: Record<string, string> = {}) {
  setupMockLocalStorage();
  // Set preset values if any
  Object.entries(preset).forEach(([key, value]) => {
    window.localStorage.setItem(key, value);
  });
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

  it("getAllPolls() should return both date and form polls (unified storage)", () => {
    const datePoll = makePoll({
      id: "d1",
      slug: "date-one",
      type: "date" as any,
    });
    const formPoll = {
      id: "f1",
      title: "Formulaire",
      slug: "form-one",
      created_at: new Date(2024, 0, 1).toISOString(),
      status: "draft",
      updated_at: new Date(2024, 0, 1).toISOString(),
      type: "form",
      creator_id: "user-1",
      dates: [],
      questions: [{ id: "q1", label: "Question?" }],
    } as unknown as Poll;

    // Save via savePolls (bypasses validation to simulate persisted state)
    savePolls([datePoll, formPoll]);

    const onlyDate = getPolls();
    expect(onlyDate.find((p) => p.id === "d1")).toBeTruthy();
    expect(onlyDate.find((p) => p.id === "f1")).toBeFalsy();

    const all = getAllPolls();
    expect(all.find((p) => p.id === "d1")).toBeTruthy();
    expect(
      all.find((p) => p.id === "f1" && (p as any).type === "form"),
    ).toBeTruthy();
  });

  it("migrateFormDraftsIntoUnified should merge doodates_form_polls into doodates_polls on read", () => {
    // Prepare legacy form drafts under doodates_form_polls
    const legacyForms = [
      {
        id: "legacy-1",
        title: "Ancien Form",
        questions: [{ id: "q1", label: "Nom?" }],
        status: "draft",
      },
    ];
    window.localStorage.setItem(
      "doodates_form_polls",
      JSON.stringify(legacyForms),
    );

    // Initially unified is empty
    expect(window.localStorage.getItem("doodates_polls")).toBeNull();

    // Trigger migration by reading
    const all = getAllPolls();

    // Should now contain the migrated form poll with type=form
    const migrated = all.find((p) => p.id === "legacy-1");
    expect(migrated).toBeTruthy();
    expect((migrated as any).type).toBe("form");

    // Old key should be cleaned up
    expect(window.localStorage.getItem("doodates_form_polls")).toBeNull();
  });

  it("addPoll() should validate form polls: title is required", () => {
    // Valid form poll
    const okForm = {
      id: "f-ok",
      title: "Titre",
      slug: "f-ok",
      created_at: new Date().toISOString(),
      status: "draft",
      updated_at: new Date().toISOString(),
      type: "form",
      creator_id: "user-1",
      dates: [],
      questions: [],
    } as unknown as Poll;
    expect(() => addPoll(okForm)).not.toThrow();

    // Invalid form poll (empty title)
    const badForm = {
      id: "f-bad",
      title: " ",
      slug: "f-bad",
      created_at: new Date().toISOString(),
      status: "draft",
      updated_at: new Date().toISOString(),
      type: "form",
      creator_id: "user-1",
      dates: [],
      questions: [],
    } as unknown as Poll;
    expect(() => addPoll(badForm)).toThrow();
  });
});
