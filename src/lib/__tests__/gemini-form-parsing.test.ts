import { describe, it, expect, beforeEach } from "vitest";
import { GeminiService } from "../gemini";

describe("GeminiService - Form Poll Parsing", () => {
  let service: GeminiService;

  beforeEach(() => {
    service = GeminiService.getInstance();
  });

  describe("parseFormPollResponse - Valid responses", () => {
    it("parse un questionnaire de satisfaction simple", () => {
      const mockResponse = JSON.stringify({
        title: "Questionnaire de satisfaction client",
        description: "Évaluez notre service",
        questions: [
          {
            title: "Quel est votre niveau de satisfaction ?",
            type: "single",
            required: true,
            options: ["Très satisfait", "Satisfait", "Neutre", "Insatisfait"],
          },
          {
            title: "Commentaires additionnels",
            type: "text",
            required: false,
            placeholder: "Vos suggestions...",
            maxLength: 500,
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).not.toBeNull();
      expect(result?.type).toBe("form");
      expect(result?.title).toBe("Questionnaire de satisfaction client");
      expect(result?.questions).toHaveLength(2);
      expect(result?.questions[0].type).toBe("single");
      expect(result?.questions[0].options).toHaveLength(4);
      expect(result?.questions[1].type).toBe("text");
    });

    it("parse un questionnaire avec choix multiples", () => {
      const mockResponse = JSON.stringify({
        title: "Sondage préférences produit",
        questions: [
          {
            title: "Quelles fonctionnalités vous intéressent ? (3 max)",
            type: "multiple",
            required: true,
            options: ["Dashboard", "Notifications", "Export PDF", "Analytics", "API"],
            maxChoices: 3,
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).not.toBeNull();
      expect(result?.questions[0].type).toBe("multiple");
      expect(result?.questions[0].maxChoices).toBe(3);
      expect(result?.questions[0].options).toHaveLength(5);
    });

    it("parse un questionnaire avec mix de types", () => {
      const mockResponse = JSON.stringify({
        title: "Formulaire d'inscription événement",
        description: "Inscrivez-vous à notre événement",
        questions: [
          {
            title: "Votre niveau d'expérience",
            type: "single",
            required: true,
            options: ["Débutant", "Intermédiaire", "Avancé"],
          },
          {
            title: "Centres d'intérêt (2 max)",
            type: "multiple",
            required: false,
            options: ["Tech", "Design", "Marketing", "Business"],
            maxChoices: 2,
          },
          {
            title: "Motivations pour participer",
            type: "text",
            required: false,
            placeholder: "Dites-nous pourquoi...",
            maxLength: 300,
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).not.toBeNull();
      expect(result?.questions).toHaveLength(3);
      expect(result?.questions[0].type).toBe("single");
      expect(result?.questions[1].type).toBe("multiple");
      expect(result?.questions[2].type).toBe("text");
    });

    it("applique required=true par défaut si non spécifié", () => {
      const mockResponse = JSON.stringify({
        title: "Test questionnaire",
        questions: [
          {
            title: "Question sans required",
            type: "single",
            options: ["Option 1", "Option 2"],
            // Pas de champ 'required'
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).not.toBeNull();
      expect(result?.questions[0].required).toBe(true);
    });

    it("accepte required=false explicite", () => {
      const mockResponse = JSON.stringify({
        title: "Test questionnaire",
        questions: [
          {
            title: "Question optionnelle",
            type: "single",
            required: false,
            options: ["Option 1", "Option 2"],
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).not.toBeNull();
      expect(result?.questions[0].required).toBe(false);
    });
  });

  describe("parseFormPollResponse - Invalid responses", () => {
    it("rejette une réponse sans titre", () => {
      const mockResponse = JSON.stringify({
        // Pas de title
        questions: [
          {
            title: "Question test",
            type: "single",
            options: ["A", "B"],
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).toBeNull();
    });

    it("rejette une réponse sans questions", () => {
      const mockResponse = JSON.stringify({
        title: "Test",
        questions: [],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).toBeNull();
    });

    it("rejette une réponse avec type !== 'form'", () => {
      const mockResponse = JSON.stringify({
        title: "Test",
        questions: [
          {
            title: "Question",
            type: "single",
            options: ["A", "B"],
          },
        ],
        type: "date", // Mauvais type
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).toBeNull();
    });

    it("filtre les questions single sans options", () => {
      const mockResponse = JSON.stringify({
        title: "Test",
        questions: [
          {
            title: "Question valide",
            type: "single",
            options: ["A", "B"],
          },
          {
            title: "Question invalide",
            type: "single",
            // Pas d'options
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).not.toBeNull();
      expect(result?.questions).toHaveLength(1);
      expect(result?.questions[0].title).toBe("Question valide");
    });

    it("filtre les questions single avec moins de 2 options", () => {
      const mockResponse = JSON.stringify({
        title: "Test",
        questions: [
          {
            title: "Question valide",
            type: "single",
            options: ["A", "B"],
          },
          {
            title: "Question avec 1 option",
            type: "single",
            options: ["A"], // Une seule option
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).not.toBeNull();
      expect(result?.questions).toHaveLength(1);
      expect(result?.questions[0].title).toBe("Question valide");
    });

    it("filtre les questions avec type invalide", () => {
      const mockResponse = JSON.stringify({
        title: "Test",
        questions: [
          {
            title: "Question valide",
            type: "single",
            options: ["A", "B"],
          },
          {
            title: "Question type invalide",
            type: "invalid_type",
            options: ["A", "B"],
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).not.toBeNull();
      expect(result?.questions).toHaveLength(1);
      expect(result?.questions[0].title).toBe("Question valide");
    });

    it("accepte les questions text sans options", () => {
      const mockResponse = JSON.stringify({
        title: "Test",
        questions: [
          {
            title: "Question texte",
            type: "text",
            // Pas d'options pour text - c'est normal
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).not.toBeNull();
      expect(result?.questions).toHaveLength(1);
      expect(result?.questions[0].type).toBe("text");
    });

    it("rejette tout si aucune question valide", () => {
      const mockResponse = JSON.stringify({
        title: "Test",
        questions: [
          {
            title: "Question invalide 1",
            type: "single",
            // Pas d'options
          },
          {
            title: "Question invalide 2",
            type: "multiple",
            options: ["A"], // Une seule option
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).toBeNull();
    });

    it("gère les erreurs JSON malformé", () => {
      const mockResponse = "{invalid json";

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).toBeNull();
    });
  });

  describe("parseFormPollResponse - Edge cases", () => {
    it("gère un questionnaire avec 10 questions (maximum)", () => {
      const questions = Array.from({ length: 10 }, (_, i) => ({
        title: `Question ${i + 1}`,
        type: "single",
        required: true,
        options: ["Option A", "Option B"],
      }));

      const mockResponse = JSON.stringify({
        title: "Questionnaire complet",
        questions,
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).not.toBeNull();
      expect(result?.questions).toHaveLength(10);
    });

    it("gère des options avec caractères spéciaux", () => {
      const mockResponse = JSON.stringify({
        title: "Test caractères spéciaux",
        questions: [
          {
            title: "Choisissez votre préférence",
            type: "single",
            options: [
              "Option avec émojis 🎉",
              "Option avec accents éàù",
              'Option avec guillemets "test"',
            ],
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).not.toBeNull();
      expect(result?.questions[0].options).toHaveLength(3);
      expect(result?.questions[0].options?.[0]).toContain("🎉");
    });

    it("préserve la description si présente", () => {
      const mockResponse = JSON.stringify({
        title: "Test",
        description: "Description détaillée du questionnaire",
        questions: [
          {
            title: "Question",
            type: "single",
            options: ["A", "B"],
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).not.toBeNull();
      expect(result?.description).toBe("Description détaillée du questionnaire");
    });

    it("gère l'absence de description", () => {
      const mockResponse = JSON.stringify({
        title: "Test",
        // Pas de description
        questions: [
          {
            title: "Question",
            type: "single",
            options: ["A", "B"],
          },
        ],
        type: "form",
      });

      // @ts-expect-error - Testing private method
      const result = service.parseFormPollResponse(mockResponse);

      expect(result).not.toBeNull();
      expect(result?.description).toBeUndefined();
    });
  });
});
