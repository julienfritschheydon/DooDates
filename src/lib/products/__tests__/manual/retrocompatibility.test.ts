import { describe, it, expect } from "@jest/globals";

// Test simple des exports sans dépendances externes
describe("Rétrocompatibilité des Wrappers", () => {
  it("devrait exporter les fonctions de base pour form-polls", async () => {
    const formPollsModule = await import("../form-polls");

    expect(typeof formPollsModule.getPolls).toBe("function");
    expect(typeof formPollsModule.addPoll).toBe("function");
    expect(typeof formPollsModule.deletePollById).toBe("function");
    expect(typeof formPollsModule.isFormPoll).toBe("function");
  });

  it("devrait utiliser l interface unifiée", async () => {
    const { getPollType } = await import("..");

    expect(typeof getPollType).toBe("function");

    const datePoll = { type: "date" };
    const formPoll = { type: "form" };

    expect(getPollType(datePoll)).toBe("date");
    expect(getPollType(formPoll)).toBe("form");
    expect(getPollType({ type: "unknown" })).toBe(null);
  });

  it("devrait détecter correctement les types de polls", async () => {
    const { isFormPoll } = await import("../form-polls");

    const datePoll = { type: "date", settings: { selectedDates: [] } };
    const formPoll = { type: "form", questions: [] };

    expect(isFormPoll(datePoll)).toBe(false);
    expect(isFormPoll(formPoll)).toBe(true);
  });
});
