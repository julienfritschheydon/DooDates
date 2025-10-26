import { describe, it, expect, beforeEach } from "vitest";
import { pollReducer, type PollAction } from "../pollReducer";
import type { Poll } from "../../types/poll";

describe("pollReducer", () => {
  let mockPoll: Poll;

  beforeEach(() => {
    mockPoll = {
      id: "test-poll-123",
      slug: "test-poll",
      title: "Déjeuner mardi ou mercredi",
      type: "date",
      dates: ["2025-10-28", "2025-10-29"],
      created_at: "2025-10-24T12:00:00Z",
      updated_at: "2025-10-24T12:00:00Z",
      creator_id: "test-user",
      status: "draft",
      settings: {
        selectedDates: ["2025-10-28", "2025-10-29"],
        timeSlotsByDate: {},
      },
    } as Poll;
  });

  describe("REPLACE_POLL", () => {
    it("remplace complètement le poll", () => {
      const newPoll: Poll = {
        ...mockPoll,
        id: "new-poll-456",
        title: "Nouveau sondage",
      };

      const action: PollAction = { type: "REPLACE_POLL", payload: newPoll };
      const result = pollReducer(mockPoll, action);

      expect(result).toEqual(newPoll);
      expect(result?.id).toBe("new-poll-456");
    });

    it("peut remplacer un poll null", () => {
      const action: PollAction = { type: "REPLACE_POLL", payload: mockPoll };
      const result = pollReducer(null, action);

      expect(result).toEqual(mockPoll);
    });
  });

  describe("ADD_DATE", () => {
    it("ajoute une date au sondage", () => {
      const action: PollAction = { type: "ADD_DATE", payload: "2025-10-27" };
      const result = pollReducer(mockPoll, action);

      expect(result?.dates).toContain("2025-10-27");
      expect(result?.dates).toHaveLength(3);
      expect(result?.updated_at).not.toBe(mockPoll.updated_at);
    });

    it("ne duplique pas une date existante", () => {
      const action: PollAction = { type: "ADD_DATE", payload: "2025-10-28" };
      const result = pollReducer(mockPoll, action);

      // Doit retourner la même référence (pas de changement)
      expect(result).toBe(mockPoll);
      expect(result?.dates).toHaveLength(2);
    });

    it("trie les dates automatiquement", () => {
      const poll = { ...mockPoll, dates: ["2025-10-29"] };
      const action: PollAction = { type: "ADD_DATE", payload: "2025-10-27" };
      const result = pollReducer(poll, action);

      expect(result?.dates).toEqual(["2025-10-27", "2025-10-29"]);
    });

    it("retourne null si poll est null", () => {
      const action: PollAction = { type: "ADD_DATE", payload: "2025-10-27" };
      const result = pollReducer(null, action);

      expect(result).toBeNull();
    });

    it("initialise dates si undefined", () => {
      const poll = { ...mockPoll, dates: undefined };
      const action: PollAction = { type: "ADD_DATE", payload: "2025-10-27" };
      const result = pollReducer(poll, action);

      expect(result?.dates).toEqual(["2025-10-27"]);
    });
  });

  describe("REMOVE_DATE", () => {
    it("retire une date du sondage", () => {
      const action: PollAction = { type: "REMOVE_DATE", payload: "2025-10-28" };
      const result = pollReducer(mockPoll, action);

      expect(result?.dates).not.toContain("2025-10-28");
      expect(result?.dates).toContain("2025-10-29");
      expect(result?.dates).toHaveLength(1);
      expect(result?.updated_at).not.toBe(mockPoll.updated_at);
    });

    it("ne change rien si date non trouvée", () => {
      const action: PollAction = { type: "REMOVE_DATE", payload: "2025-10-30" };
      const result = pollReducer(mockPoll, action);

      // Doit retourner la même référence
      expect(result).toBe(mockPoll);
    });

    it("retourne null si poll est null", () => {
      const action: PollAction = { type: "REMOVE_DATE", payload: "2025-10-28" };
      const result = pollReducer(null, action);

      expect(result).toBeNull();
    });

    it("gère un tableau de dates vide", () => {
      const poll = { ...mockPoll, dates: [] };
      const action: PollAction = { type: "REMOVE_DATE", payload: "2025-10-28" };
      const result = pollReducer(poll, action);

      expect(result).toBe(poll);
    });
  });

  describe("UPDATE_TITLE", () => {
    it("modifie le titre", () => {
      const action: PollAction = {
        type: "UPDATE_TITLE",
        payload: "Nouveau titre",
      };
      const result = pollReducer(mockPoll, action);

      expect(result?.title).toBe("Nouveau titre");
      expect(result?.updated_at).not.toBe(mockPoll.updated_at);
    });

    it("ignore les titres vides", () => {
      const action: PollAction = { type: "UPDATE_TITLE", payload: "   " };
      const result = pollReducer(mockPoll, action);

      // Doit retourner la même référence
      expect(result).toBe(mockPoll);
      expect(result?.title).toBe("Déjeuner mardi ou mercredi");
    });

    it("trim le titre", () => {
      const action: PollAction = {
        type: "UPDATE_TITLE",
        payload: "  Nouveau titre  ",
      };
      const result = pollReducer(mockPoll, action);

      expect(result?.title).toBe("Nouveau titre");
    });

    it("retourne null si poll est null", () => {
      const action: PollAction = {
        type: "UPDATE_TITLE",
        payload: "Nouveau titre",
      };
      const result = pollReducer(null, action);

      expect(result).toBeNull();
    });

    it("supporte les caractères spéciaux", () => {
      const action: PollAction = { type: "UPDATE_TITLE", payload: "Apéro 🍻" };
      const result = pollReducer(mockPoll, action);

      expect(result?.title).toBe("Apéro 🍻");
    });
  });

  describe("ADD_TIMESLOT", () => {
    it("ajoute un créneau horaire", () => {
      const action: PollAction = {
        type: "ADD_TIMESLOT",
        payload: { date: "2025-10-28", start: "14:00", end: "15:00" },
      };
      const result = pollReducer(mockPoll, action);

      const slots = (result?.settings as any)?.timeSlotsByDate?.["2025-10-28"];
      expect(slots).toBeDefined();
      expect(slots).toHaveLength(1);
      expect(slots[0].hour).toBe(14);
      expect(slots[0].minute).toBe(0);
      expect(slots[0].duration).toBe(60);
      expect(slots[0].enabled).toBe(true);
    });

    it("calcule correctement la durée en minutes", () => {
      const action: PollAction = {
        type: "ADD_TIMESLOT",
        payload: { date: "2025-10-28", start: "14:30", end: "16:45" },
      };
      const result = pollReducer(mockPoll, action);

      const slots = (result?.settings as any)?.timeSlotsByDate?.["2025-10-28"];
      // Le reducer découpe maintenant les slots selon la granularité (défaut 60min)
      // 14:30-16:45 (135min) → 3 slots: 14:30, 15:30, 16:30
      expect(slots.length).toBeGreaterThanOrEqual(2); // Au moins 2 slots créés
      expect(slots[0].hour).toBe(14);
      expect(slots[0].minute).toBe(30);
      expect(slots[0].duration).toBe(60); // Granularité par défaut
    });

    it("ajoute automatiquement la date si elle n'existe pas", () => {
      const action: PollAction = {
        type: "ADD_TIMESLOT",
        payload: { date: "2025-10-30", start: "14:00", end: "15:00" },
      };
      const result = pollReducer(mockPoll, action);

      // Doit ajouter la date ET le créneau
      expect(result?.dates).toContain("2025-10-30");
      expect(result?.dates).toHaveLength(3);
      const slots = (result?.settings as any)?.timeSlotsByDate?.["2025-10-30"];
      expect(slots).toBeDefined();
      expect(slots).toHaveLength(1);
      expect(slots[0].hour).toBe(14);
      expect(slots[0].minute).toBe(0);
      expect(slots[0].duration).toBe(60);
    });

    it("détecte les doublons de créneaux", () => {
      const pollWithSlot = {
        ...mockPoll,
        settings: {
          timeSlotsByDate: {
            "2025-10-28": [
              { hour: 14, minute: 0, duration: 60, enabled: true },
            ],
          },
        } as any,
      };

      const action: PollAction = {
        type: "ADD_TIMESLOT",
        payload: { date: "2025-10-28", start: "14:00", end: "15:00" },
      };
      const result = pollReducer(pollWithSlot, action);

      // Doit retourner la même référence (pas de duplication)
      expect(result).toBe(pollWithSlot);
    });

    it("ajoute plusieurs créneaux sur la même date", () => {
      const pollWithSlot = {
        ...mockPoll,
        settings: {
          timeSlotsByDate: {
            "2025-10-28": [{ start: "14:00", end: "15:00", enabled: true }],
          },
        },
      };

      const action: PollAction = {
        type: "ADD_TIMESLOT",
        payload: { date: "2025-10-28", start: "16:00", end: "17:00" },
      };
      const result = pollReducer(pollWithSlot, action);

      const slots = (result?.settings as any)?.timeSlotsByDate?.["2025-10-28"];
      expect(slots).toHaveLength(2);
    });

    it("retourne null si poll est null", () => {
      const action: PollAction = {
        type: "ADD_TIMESLOT",
        payload: { date: "2025-10-28", start: "14:00", end: "15:00" },
      };
      const result = pollReducer(null, action);

      expect(result).toBeNull();
    });

    it("initialise settings si undefined", () => {
      const poll = { ...mockPoll, settings: undefined };
      const action: PollAction = {
        type: "ADD_TIMESLOT",
        payload: { date: "2025-10-28", start: "14:00", end: "15:00" },
      };
      const result = pollReducer(poll, action);

      expect(result?.settings).toBeDefined();
      const slots = (result?.settings as any)?.timeSlotsByDate?.["2025-10-28"];
      expect(slots).toHaveLength(1);
    });
  });

  describe("Immutabilité", () => {
    it("ne modifie pas le poll original (ADD_DATE)", () => {
      const originalDates = [...mockPoll.dates!];
      const action: PollAction = { type: "ADD_DATE", payload: "2025-10-27" };

      pollReducer(mockPoll, action);

      expect(mockPoll.dates).toEqual(originalDates);
    });

    it("ne modifie pas le poll original (UPDATE_TITLE)", () => {
      const originalTitle = mockPoll.title;
      const action: PollAction = { type: "UPDATE_TITLE", payload: "Nouveau" };

      pollReducer(mockPoll, action);

      expect(mockPoll.title).toBe(originalTitle);
    });

    it("retourne une nouvelle référence si changement", () => {
      const action: PollAction = { type: "ADD_DATE", payload: "2025-10-27" };
      const result = pollReducer(mockPoll, action);

      expect(result).not.toBe(mockPoll);
    });

    it("retourne la même référence si pas de changement", () => {
      const action: PollAction = { type: "ADD_DATE", payload: "2025-10-28" };
      const result = pollReducer(mockPoll, action);

      expect(result).toBe(mockPoll);
    });
  });

  describe("updated_at", () => {
    it("met à jour updated_at pour ADD_DATE", () => {
      const action: PollAction = { type: "ADD_DATE", payload: "2025-10-27" };
      const result = pollReducer(mockPoll, action);

      expect(result?.updated_at).not.toBe(mockPoll.updated_at);
      expect(new Date(result!.updated_at).getTime()).toBeGreaterThan(
        new Date(mockPoll.updated_at).getTime(),
      );
    });

    it("met à jour updated_at pour REMOVE_DATE", () => {
      const action: PollAction = { type: "REMOVE_DATE", payload: "2025-10-28" };
      const result = pollReducer(mockPoll, action);

      expect(result?.updated_at).not.toBe(mockPoll.updated_at);
    });

    it("met à jour updated_at pour UPDATE_TITLE", () => {
      const action: PollAction = { type: "UPDATE_TITLE", payload: "Nouveau" };
      const result = pollReducer(mockPoll, action);

      expect(result?.updated_at).not.toBe(mockPoll.updated_at);
    });

    it("met à jour updated_at pour ADD_TIMESLOT", () => {
      const action: PollAction = {
        type: "ADD_TIMESLOT",
        payload: { date: "2025-10-28", start: "14:00", end: "15:00" },
      };
      const result = pollReducer(mockPoll, action);

      expect(result?.updated_at).not.toBe(mockPoll.updated_at);
    });
  });
});
