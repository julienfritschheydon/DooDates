/**
 * Tests pour FormPollIntentService
 */

import { describe, it, expect } from "vitest";
import { FormPollIntentService } from "../FormPollIntentService";
import type { Poll } from "../../lib/pollStorage";

// Mock Form Poll
const mockFormPoll: Poll = {
  id: "test-form",
  slug: "test-form",
  title: "Questionnaire test",
  type: "form",
  creator_id: "test",
  status: "draft",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  dates: [],
  questions: [
    {
      id: "q1",
      kind: "single",
      title: "Quelle est votre couleur préférée ?",
      required: true,
      options: [
        { id: "opt1", label: "Rouge" },
        { id: "opt2", label: "Bleu" },
        { id: "opt3", label: "Vert" },
      ],
    },
    {
      id: "q2",
      kind: "text",
      title: "Commentaires",
      required: false,
    },
  ],
};

describe("FormPollIntentService", () => {
  describe("ADD_QUESTION", () => {
    it('détecte "ajoute une question sur l\'âge"', () => {
      const intent = FormPollIntentService.detectIntent(
        "ajoute une question sur l'âge",
        mockFormPoll,
      );

      expect(intent).not.toBeNull();
      expect(intent?.action).toBe("ADD_QUESTION");
      expect(intent?.payload.subject).toBe("l'âge");
      expect(intent?.confidence).toBeGreaterThan(0.8);
    });

    it('détecte "ajouter question concernant le budget"', () => {
      const intent = FormPollIntentService.detectIntent(
        "ajouter question concernant le budget",
        mockFormPoll,
      );

      expect(intent).not.toBeNull();
      expect(intent?.action).toBe("ADD_QUESTION");
      expect(intent?.payload.subject).toBe("le budget");
    });
  });

  describe("REMOVE_QUESTION", () => {
    it('détecte "supprime la question 1"', () => {
      const intent = FormPollIntentService.detectIntent(
        "supprime la question 1",
        mockFormPoll,
      );

      expect(intent).not.toBeNull();
      expect(intent?.action).toBe("REMOVE_QUESTION");
      expect(intent?.payload.questionIndex).toBe(0); // 0-based
    });

    it('détecte "retire Q2"', () => {
      const intent = FormPollIntentService.detectIntent(
        "retire Q2",
        mockFormPoll,
      );

      expect(intent).not.toBeNull();
      expect(intent?.action).toBe("REMOVE_QUESTION");
      expect(intent?.payload.questionIndex).toBe(1);
    });

    it("retourne null si question n'existe pas", () => {
      const intent = FormPollIntentService.detectIntent(
        "supprime la question 10",
        mockFormPoll,
      );

      expect(intent).toBeNull();
    });
  });

  describe("CHANGE_QUESTION_TYPE", () => {
    it('détecte "change la question 1 en choix multiple"', () => {
      const intent = FormPollIntentService.detectIntent(
        "change la question 1 en choix multiple",
        mockFormPoll,
      );

      expect(intent).not.toBeNull();
      expect(intent?.action).toBe("CHANGE_QUESTION_TYPE");
      expect(intent?.payload.questionIndex).toBe(0);
      expect(intent?.payload.newType).toBe("multiple");
    });

    it('détecte "change la question 2 en texte"', () => {
      const intent = FormPollIntentService.detectIntent(
        "change la question 2 en texte",
        mockFormPoll,
      );

      expect(intent).not.toBeNull();
      expect(intent?.payload.newType).toBe("text");
    });
  });

  describe("ADD_OPTION", () => {
    it('détecte "ajoute l\'option "Jaune" à la question 1"', () => {
      const intent = FormPollIntentService.detectIntent(
        'ajoute l\'option "Jaune" à la question 1',
        mockFormPoll,
      );

      expect(intent).not.toBeNull();
      expect(intent?.action).toBe("ADD_OPTION");
      expect(intent?.payload.questionIndex).toBe(0);
      expect(intent?.payload.optionText).toBe("Jaune");
    });

    it("retourne null pour question texte (pas d'options)", () => {
      const intent = FormPollIntentService.detectIntent(
        'ajoute l\'option "Test" à la question 2',
        mockFormPoll,
      );

      expect(intent).toBeNull(); // Q2 est de type text
    });
  });

  describe("REMOVE_OPTION", () => {
    it('détecte "supprime l\'option "Rouge" de la question 1"', () => {
      const intent = FormPollIntentService.detectIntent(
        'supprime l\'option "Rouge" de la question 1',
        mockFormPoll,
      );

      expect(intent).not.toBeNull();
      expect(intent?.action).toBe("REMOVE_OPTION");
      expect(intent?.payload.questionIndex).toBe(0);
      expect(intent?.payload.optionText).toBe("Rouge");
    });
  });

  describe("SET_REQUIRED", () => {
    it('détecte "rends la question 2 obligatoire"', () => {
      const intent = FormPollIntentService.detectIntent(
        "rends la question 2 obligatoire",
        mockFormPoll,
      );

      expect(intent).not.toBeNull();
      expect(intent?.action).toBe("SET_REQUIRED");
      expect(intent?.payload.questionIndex).toBe(1);
      expect(intent?.payload.required).toBe(true);
    });

    it('détecte "rends la question 1 optionnelle"', () => {
      const intent = FormPollIntentService.detectIntent(
        "rends la question 1 optionnelle",
        mockFormPoll,
      );

      expect(intent).not.toBeNull();
      expect(intent?.payload.required).toBe(false);
    });
  });

  describe("RENAME_QUESTION", () => {
    it('détecte "renomme la question 1 en Couleur favorite"', () => {
      const intent = FormPollIntentService.detectIntent(
        "renomme la question 1 en Couleur favorite",
        mockFormPoll,
      );

      expect(intent).not.toBeNull();
      expect(intent?.action).toBe("RENAME_QUESTION");
      expect(intent?.payload.questionIndex).toBe(0);
      expect(intent?.payload.newTitle).toBe("Couleur favorite");
    });
  });

  describe("Edge cases", () => {
    it("retourne null si pas de Form Poll", () => {
      const datePoll = { ...mockFormPoll, type: "date" as const };
      const intent = FormPollIntentService.detectIntent(
        "ajoute une question sur l'âge",
        datePoll,
      );

      expect(intent).toBeNull();
    });

    it("retourne null si message non reconnu", () => {
      const intent = FormPollIntentService.detectIntent(
        "blabla random",
        mockFormPoll,
      );

      expect(intent).toBeNull();
    });

    it("retourne null si poll null", () => {
      const intent = FormPollIntentService.detectIntent(
        "ajoute une question",
        null,
      );

      expect(intent).toBeNull();
    });
  });
});
