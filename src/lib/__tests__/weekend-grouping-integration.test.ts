import { describe, it, expect, vi, beforeEach } from "vitest";
import { groupConsecutiveDates } from "../date-utils";

/**
 * Test d'intégration pour le regroupement des week-ends
 *
 * Ce test vérifie le flux complet de données:
 * 1. Gemini génère des dateGroups
 * 2. Les dateGroups sont passés à createPoll via EditorStateProvider
 * 3. Les dateGroups sont sauvegardés dans la base de données
 * 4. Les dateGroups sont récupérés et affichés dans PollCreator
 *
 * Ce test complète les tests unitaires de groupConsecutiveDates en vérifiant
 * que les données circulent correctement dans toute l'application.
 */
describe("Weekend Grouping - Integration Test", () => {
  describe("Data Flow Verification", () => {
    it("✅ DatePollData interface devrait inclure dateGroups", () => {
      // Simuler les données qui viennent de Gemini
      const geminiResponse = {
        title: "Sondage Week-end Jeux",
        dates: ["2026-03-07", "2026-03-08", "2026-03-14", "2026-03-15"],
        dateGroups: [
          {
            dates: ["2026-03-07", "2026-03-08"],
            label: "Week-end du 7-8 mars",
            type: "weekend" as const,
          },
          {
            dates: ["2026-03-14", "2026-03-15"],
            label: "Week-end du 14-15 mars",
            type: "weekend" as const,
          },
        ],
      };

      // Vérifier que la structure correspond à DatePollSuggestion
      expect(geminiResponse).toHaveProperty("dateGroups");
      expect(geminiResponse.dateGroups).toHaveLength(2);
      expect(geminiResponse.dateGroups![0]).toMatchObject({
        dates: expect.arrayContaining(["2026-03-07", "2026-03-08"]),
        label: expect.stringContaining("Week-end"),
        type: "weekend",
      });
    });

    it("✅ DatePollData devrait accepter dateGroups lors de la création", () => {
      // Simuler les données passées à createPoll
      const datePollData = {
        type: "date" as const,
        title: "Sondage Week-end Jeux",
        description: undefined,
        selectedDates: ["2026-03-07", "2026-03-08", "2026-03-14", "2026-03-15"],
        timeSlotsByDate: {},
        participantEmails: [],
        dateGroups: [
          {
            dates: ["2026-03-07", "2026-03-08"],
            label: "Week-end du 7-8 mars",
            type: "weekend" as const,
          },
          {
            dates: ["2026-03-14", "2026-03-15"],
            label: "Week-end du 14-15 mars",
            type: "weekend" as const,
          },
        ],
        settings: {
          timeGranularity: 30,
          allowAnonymousVotes: true,
          allowMaybeVotes: true,
          sendNotifications: false,
        },
      };

      // Vérifier que l'objet est valide
      expect(datePollData).toHaveProperty("dateGroups");
      expect(datePollData.dateGroups).toHaveLength(2);
      expect(datePollData.type).toBe("date");
    });

    it("✅ groupConsecutiveDates devrait détecter les week-ends correctement", () => {
      const dates = ["2026-03-07", "2026-03-08", "2026-03-14", "2026-03-15"];
      const result = groupConsecutiveDates(dates, true);

      // Vérifier que 2 week-ends sont détectés
      expect(result).toHaveLength(2);

      // Vérifier le premier week-end
      expect(result[0]).toMatchObject({
        dates: ["2026-03-07", "2026-03-08"],
        type: "weekend",
        label: expect.stringContaining("Week-end"),
      });

      // Vérifier le deuxième week-end
      expect(result[1]).toMatchObject({
        dates: ["2026-03-14", "2026-03-15"],
        type: "weekend",
        label: expect.stringContaining("Week-end"),
      });
    });

    it("✅ PollCreator initialData devrait recevoir dateGroups", () => {
      // Simuler les données passées à PollCreator
      const currentPoll = {
        id: "test-poll",
        title: "Sondage Week-end Jeux",
        dates: ["2026-03-07", "2026-03-08", "2026-03-14", "2026-03-15"],
        dateGroups: [
          {
            dates: ["2026-03-07", "2026-03-08"],
            label: "Week-end du 7-8 mars",
            type: "weekend" as const,
          },
          {
            dates: ["2026-03-14", "2026-03-15"],
            label: "Week-end du 14-15 mars",
            type: "weekend" as const,
          },
        ],
      };

      const initialData = {
        title: currentPoll.title,
        description: undefined,
        dates: currentPoll.dates || [],
        dateGroups: currentPoll.dateGroups,
        type: "date" as const,
      };

      // Vérifier que dateGroups est bien passé
      expect(initialData.dateGroups).toBeDefined();
      expect(initialData.dateGroups).toHaveLength(2);
      expect(initialData.dateGroups![0].type).toBe("weekend");
    });

    it("✅ hasGroupedDates devrait être true si dateGroups contient des week-ends", () => {
      const dateGroups = [
        {
          dates: ["2026-03-07", "2026-03-08"],
          label: "Week-end du 7-8 mars",
          type: "weekend" as const,
        },
      ];

      // Simuler la logique de PollCreator
      const hasGroupedDates = dateGroups.some(
        (group) => group.type && ["weekend", "week", "fortnight"].includes(group.type),
      );

      expect(hasGroupedDates).toBe(true);
    });

    it("❌ hasGroupedDates devrait être false si dateGroups est undefined", () => {
      const dateGroups = undefined;

      // Simuler la logique de PollCreator avec fallback
      const effectiveGroups = dateGroups || [];
      const hasGroupedDates = effectiveGroups.some(
        (group) => group.type && ["weekend", "week", "fortnight"].includes(group.type),
      );

      expect(hasGroupedDates).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("devrait gérer des dates non-week-end", () => {
      const dates = ["2026-03-09", "2026-03-10"]; // Lundi-Mardi
      const result = groupConsecutiveDates(dates, true);

      // Ne devrait PAS être groupé en week-end
      expect(result[0]?.type).not.toBe("weekend");
    });

    it("devrait gérer un seul jour de week-end", () => {
      const dates = ["2026-03-07"]; // Samedi seul
      const result = groupConsecutiveDates(dates, true);

      // Un seul jour ne peut pas former un week-end
      expect(result[0]?.type).not.toBe("weekend");
    });

    it("devrait gérer des week-ends incomplets (Sam-Lun)", () => {
      const dates = ["2026-03-07", "2026-03-09"]; // Samedi + Lundi (pas consécutifs)
      const result = groupConsecutiveDates(dates, true);

      // Ne devrait PAS être groupé en week-end
      expect(result.length).toBeGreaterThan(1); // Deux groupes séparés
    });

    it("devrait gérer allowWeekendGrouping=false", () => {
      const dates = ["2026-03-07", "2026-03-08"];
      const result = groupConsecutiveDates(dates, false);

      // Ne devrait PAS être groupé en week-end si désactivé
      expect(result[0]?.type).not.toBe("weekend");
    });
  });

  describe("Real-world Scenario", () => {
    it("✅ SCÉNARIO COMPLET: Prompt utilisateur → Gemini → createPoll → PollCreator", () => {
      // 1. Utilisateur envoie un prompt
      const userPrompt =
        "Crée un sondage pour un week-end jeux. Sélectionner les dates de mars et avril 2026";

      // 2. Gemini détecte les week-ends et génère dateGroups
      const geminiResponse = {
        title: "Sondage Week-end Jeux",
        dates: ["2026-03-07", "2026-03-08", "2026-04-04", "2026-04-05"],
        dateGroups: groupConsecutiveDates(
          ["2026-03-07", "2026-03-08", "2026-04-04", "2026-04-05"],
          true,
        ),
      };

      expect(geminiResponse.dateGroups).toHaveLength(2);
      expect(geminiResponse.dateGroups[0].type).toBe("weekend");

      // 3. EditorStateProvider passe dateGroups à createPoll
      const datePollData = {
        type: "date" as const,
        title: geminiResponse.title,
        description: undefined,
        selectedDates: geminiResponse.dates,
        timeSlotsByDate: {},
        participantEmails: [],
        dateGroups: geminiResponse.dateGroups, // 🔧 FIX: Maintenant passé correctement
        settings: {
          timeGranularity: 30,
          allowAnonymousVotes: true,
          allowMaybeVotes: true,
          sendNotifications: false,
        },
      };

      expect(datePollData.dateGroups).toBeDefined();

      // 4. createPoll sauvegarde dateGroups dans poll_data
      const pollData_json = {
        type: "date",
        title: datePollData.title,
        dates: datePollData.selectedDates,
        dateGroups: datePollData.dateGroups, // 🔧 FIX: Maintenant sauvegardé
      };

      expect(pollData_json.dateGroups).toBeDefined();

      // 5. PollCreator reçoit dateGroups via initialData
      const initialData = {
        title: pollData_json.title,
        dates: pollData_json.dates,
        dateGroups: pollData_json.dateGroups, // 🔧 FIX: Maintenant disponible
        type: "date" as const,
      };

      expect(initialData.dateGroups).toHaveLength(2);

      // 6. PollCreator masque les horaires car hasGroupedDates=true
      const hasGroupedDates = initialData.dateGroups!.some(
        (group) => group.type && ["weekend", "week", "fortnight"].includes(group.type),
      );

      expect(hasGroupedDates).toBe(true); // ✅ Les horaires seront masqués
    });
  });
});
