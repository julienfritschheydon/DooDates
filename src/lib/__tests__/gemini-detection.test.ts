import { describe, it, expect, beforeEach } from "vitest";
import { GeminiService } from "../gemini";

describe("GeminiService - Poll Type Detection", () => {
  let service: GeminiService;

  beforeEach(() => {
    service = GeminiService.getInstance();
  });

  describe("detectPollType - Form Polls", () => {
    it("détecte 'questionnaire' comme Form Poll", () => {
      const input = "Crée un questionnaire de satisfaction client";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("form");
    });

    it("détecte 'sondage d'opinion' comme Form Poll", () => {
      const input = "Je veux faire un sondage d'opinion sur notre produit";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("form");
    });

    it("détecte 'enquête' comme Form Poll", () => {
      const input = "Enquête de satisfaction employés";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("form");
    });

    it("détecte 'formulaire' comme Form Poll", () => {
      const input = "Formulaire d'inscription événement";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("form");
    });

    it("détecte 'feedback' comme Form Poll", () => {
      const input = "Recueillir le feedback des utilisateurs";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("form");
    });

    it("détecte multiple mots-clés Form", () => {
      const input =
        "Questionnaire avec choix multiple pour évaluer la satisfaction";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("form");
    });
  });

  describe("detectPollType - Date Polls", () => {
    it("détecte 'rendez-vous' comme Date Poll", () => {
      const input = "Trouver une date pour un rendez-vous";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("date");
    });

    it("détecte 'réunion' comme Date Poll", () => {
      const input = "Organiser une réunion la semaine prochaine";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("date");
    });

    it("détecte 'disponibilité' comme Date Poll", () => {
      const input = "Vérifier les disponibilités pour un meeting";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("date");
    });

    it("détecte 'planning' comme Date Poll", () => {
      const input = "Créer un planning pour les entretiens";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("date");
    });

    it("détecte 'créneau' comme Date Poll", () => {
      const input = "Proposer des créneaux horaires";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("date");
    });

    it("détecte multiple mots-clés Date", () => {
      const input =
        "Organiser une réunion avec disponibilités et créneaux horaires";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("date");
    });
  });

  describe("detectPollType - Cas Ambigus", () => {
    it("détecte 'date' par défaut si égalité", () => {
      const input = "Créer un sondage";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("date");
    });

    it("prioritise Form si plus de mots-clés Form", () => {
      const input = "Questionnaire de satisfaction pour une réunion";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("form");
    });

    it("prioritise Date si plus de mots-clés Date", () => {
      const input = "Organiser une réunion pour discuter du questionnaire";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("date");
    });

    it("gère les textes sans mots-clés (défaut Date)", () => {
      const input = "Je veux créer quelque chose";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("date");
    });
  });

  describe("detectPollType - Cas Réels", () => {
    it("détecte correctement un cas Form réaliste", () => {
      const input =
        "Je veux créer un questionnaire de satisfaction avec des questions sur le service client et les préférences des utilisateurs";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("form");
    });

    it("détecte correctement un cas Date réaliste", () => {
      const input =
        "Trouver une date pour notre réunion d'équipe la semaine prochaine, avec plusieurs créneaux horaires possibles";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("date");
    });

    it("détecte Form pour inscription événement", () => {
      const input =
        "Formulaire d'inscription avec nom, email et choix de l'atelier";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("form");
    });

    it("détecte Date pour planning équipe", () => {
      const input =
        "Planning de disponibilité pour les entretiens du mois prochain";
      // @ts-expect-error - Testing private method
      const result = service.detectPollType(input);
      expect(result).toBe("date");
    });
  });
});
