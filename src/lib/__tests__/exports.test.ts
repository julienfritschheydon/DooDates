import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  exportFormPollToCSV,
  exportFormPollToJSON,
  exportFormPollToMarkdown,
  exportFormPollToPDF,
  hasExportableData,
  canExport,
} from "../exports";
import type { Poll, FormResponse } from "../pollStorage";

// Mock pollStorage functions
vi.mock("../pollStorage", async () => {
  const actual = await vi.importActual("../pollStorage");
  return {
    ...actual,
    getFormResponses: vi.fn(),
  };
});

import { getFormResponses } from "../pollStorage";

describe("Export Module", () => {
  let mockPoll: Poll;
  let mockResponses: FormResponse[];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock poll data
    mockPoll = {
      id: "test-poll-123",
      slug: "test-questionnaire",
      title: "Questionnaire de Test",
      type: "form",
      status: "active",
      created_at: "2025-01-15T10:00:00.000Z",
      questions: [
        {
          id: "q1",
          kind: "single",
          title: "Quelle est votre couleur préférée ?",
          type: "single",
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
          type: "text",
          required: false,
        },
        {
          id: "q3",
          kind: "multiple",
          title: "Quels sports pratiquez-vous ?",
          type: "multiple",
          required: false,
          options: [
            { id: "sport1", label: "Football" },
            { id: "sport2", label: "Tennis" },
            { id: "sport3", label: "Natation" },
          ],
        },
      ],
    } as Poll;

    mockResponses = [
      {
        id: "resp1",
        pollId: "test-poll-123",
        respondentName: "Alice Dupont",
        created_at: "2025-01-15T11:00:00.000Z",
        items: [
          { questionId: "q1", value: "Bleu" },
          { questionId: "q2", value: "Très bon questionnaire !" },
          { questionId: "q3", value: ["Football", "Tennis"] },
        ],
      },
      {
        id: "resp2",
        pollId: "test-poll-123",
        respondentName: "Bob Martin",
        created_at: "2025-01-15T12:00:00.000Z",
        items: [
          { questionId: "q1", value: "Rouge" },
          { questionId: "q2", value: "RAS" },
          { questionId: "q3", value: ["Natation"] },
        ],
      },
    ];

    vi.mocked(getFormResponses).mockReturnValue(mockResponses);
  });

  describe("hasExportableData", () => {
    it("retourne true si le poll a des réponses", () => {
      const result = hasExportableData(mockPoll);
      expect(result).toBe(true);
    });

    it("retourne false si le poll n'a pas de réponses", () => {
      vi.mocked(getFormResponses).mockReturnValue([]);
      const result = hasExportableData(mockPoll);
      expect(result).toBe(false);
    });

    it("retourne false si le poll n'est pas de type form", () => {
      const datePoll = { ...mockPoll, type: "date" as const };
      const result = hasExportableData(datePoll);
      expect(result).toBe(false);
    });
  });

  describe("canExport", () => {
    it("permet l'export si le poll a des données", () => {
      const result = canExport(mockPoll);
      expect(result).toBe(true);
    });

    it("refuse l'export si pas de données", () => {
      vi.mocked(getFormResponses).mockReturnValue([]);
      const result = canExport(mockPoll);
      expect(result).toBe(false);
    });
  });

  describe("CSV Export", () => {
    it("génère un CSV valide avec BOM UTF-8", () => {
      // Mock DOM APIs
      const mockBlob = vi.fn();
      const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
      const mockRevokeObjectURL = vi.fn();
      const mockClick = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();

      global.Blob = mockBlob as any;
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      const mockLink = {
        href: "",
        download: "",
        style: { display: "" },
        click: mockClick,
      };

      vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
      vi.spyOn(document.body, "appendChild").mockImplementation(mockAppendChild);
      vi.spyOn(document.body, "removeChild").mockImplementation(mockRemoveChild);

      exportFormPollToCSV(mockPoll);

      // Vérifier que Blob a été créé avec le bon type
      expect(mockBlob).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ type: "text/csv;charset=utf-8;" }),
      );

      // Vérifier que le lien a été créé et cliqué
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it("échappe correctement les virgules et guillemets", () => {
      const responseWithSpecialChars: FormResponse[] = [
        {
          id: "resp-special",
          pollId: "test-poll-123",
          respondentName: 'Nom, avec "guillemets"',
          created_at: "2025-01-15T11:00:00.000Z",
          items: [
            {
              questionId: "q2",
              value: 'Commentaire avec, virgule et "guillemets"',
            },
          ],
        },
      ];

      vi.mocked(getFormResponses).mockReturnValue(responseWithSpecialChars);

      // Mock Blob to capture content
      let csvContent = "";
      global.Blob = vi.fn((content) => {
        csvContent = content[0];
        return {} as Blob;
      }) as any;

      global.URL.createObjectURL = vi.fn(() => "blob:mock");
      global.URL.revokeObjectURL = vi.fn();

      const mockLink = {
        href: "",
        download: "",
        style: { display: "" },
        click: vi.fn(),
      };
      vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
      vi.spyOn(document.body, "appendChild").mockImplementation(vi.fn());
      vi.spyOn(document.body, "removeChild").mockImplementation(vi.fn());

      exportFormPollToCSV(mockPoll);

      // Vérifier que les valeurs avec virgules/guillemets sont échappées
      expect(csvContent).toContain('"Nom, avec ""guillemets"""');
      expect(csvContent).toContain('"Commentaire avec, virgule et ""guillemets"""');
    });

    it("génère un nom de fichier correct", () => {
      const mockLink = {
        href: "",
        download: "",
        style: { display: "" },
        click: vi.fn(),
      };

      vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
      vi.spyOn(document.body, "appendChild").mockImplementation(vi.fn());
      vi.spyOn(document.body, "removeChild").mockImplementation(vi.fn());

      global.Blob = vi.fn(() => ({}) as Blob);
      global.URL.createObjectURL = vi.fn(() => "blob:mock");
      global.URL.revokeObjectURL = vi.fn();

      exportFormPollToCSV(mockPoll);

      expect(mockLink.download).toMatch(/^doodates_form_test-questionnaire_\d{8}-\d{6}\.csv$/);
    });
  });

  describe("JSON Export", () => {
    it("génère un JSON valide avec toutes les données", () => {
      let jsonContent = "";

      global.Blob = vi.fn((content) => {
        jsonContent = content[0];
        return {} as Blob;
      }) as any;

      global.URL.createObjectURL = vi.fn(() => "blob:mock");
      global.URL.revokeObjectURL = vi.fn();

      const mockLink = {
        href: "",
        download: "",
        style: { display: "" },
        click: vi.fn(),
      };
      vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
      vi.spyOn(document.body, "appendChild").mockImplementation(vi.fn());
      vi.spyOn(document.body, "removeChild").mockImplementation(vi.fn());

      exportFormPollToJSON(mockPoll);

      const parsed = JSON.parse(jsonContent);

      expect(parsed).toHaveProperty("meta");
      expect(parsed.meta.poll_id).toBe("test-poll-123");
      expect(parsed.meta.poll_title).toBe("Questionnaire de Test");
      expect(parsed.meta.total_responses).toBe(2);
      expect(parsed).toHaveProperty("questions");
      expect(parsed).toHaveProperty("responses");
      expect(parsed.responses).toHaveLength(2);
    });

    it("inclut les règles conditionnelles si présentes", () => {
      const pollWithRules = {
        ...mockPoll,
        conditionalRules: [
          {
            questionId: "q2",
            dependsOn: "q1",
            showIf: { operator: "equals" as const, value: "Rouge" },
          },
        ],
      };

      let jsonContent = "";
      global.Blob = vi.fn((content) => {
        jsonContent = content[0];
        return {} as Blob;
      }) as any;

      global.URL.createObjectURL = vi.fn(() => "blob:mock");
      global.URL.revokeObjectURL = vi.fn();

      const mockLink = {
        href: "",
        download: "",
        style: { display: "" },
        click: vi.fn(),
      };
      vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
      vi.spyOn(document.body, "appendChild").mockImplementation(vi.fn());
      vi.spyOn(document.body, "removeChild").mockImplementation(vi.fn());

      exportFormPollToJSON(pollWithRules);

      const parsed = JSON.parse(jsonContent);
      expect(parsed.conditionalRules).toHaveLength(1);
      expect(parsed.conditionalRules[0].questionId).toBe("q2");
    });
  });

  describe("Markdown Export", () => {
    it("génère un markdown valide", () => {
      let markdownContent = "";

      global.Blob = vi.fn((content) => {
        markdownContent = content[0];
        return {} as Blob;
      }) as any;

      global.URL.createObjectURL = vi.fn(() => "blob:mock");
      global.URL.revokeObjectURL = vi.fn();

      const mockLink = {
        href: "",
        download: "",
        style: { display: "" },
        click: vi.fn(),
      };
      vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
      vi.spyOn(document.body, "appendChild").mockImplementation(vi.fn());
      vi.spyOn(document.body, "removeChild").mockImplementation(vi.fn());

      exportFormPollToMarkdown(mockPoll);

      expect(markdownContent).toContain("# Questionnaire de Test");
      expect(markdownContent).toContain("## Question 1:");
      expect(markdownContent).toContain("| Option | Réponses | Pourcentage |");
      expect(markdownContent).toContain("Généré par DooDates");
    });

    it("affiche correctement les réponses texte", () => {
      let markdownContent = "";

      global.Blob = vi.fn((content) => {
        markdownContent = content[0];
        return {} as Blob;
      }) as any;

      global.URL.createObjectURL = vi.fn(() => "blob:mock");
      global.URL.revokeObjectURL = vi.fn();

      const mockLink = {
        href: "",
        download: "",
        style: { display: "" },
        click: vi.fn(),
      };
      vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
      vi.spyOn(document.body, "appendChild").mockImplementation(vi.fn());
      vi.spyOn(document.body, "removeChild").mockImplementation(vi.fn());

      exportFormPollToMarkdown(mockPoll);

      expect(markdownContent).toContain("1. Très bon questionnaire !");
      expect(markdownContent).toContain("2. RAS");
    });
  });

  describe("PDF Export", () => {
    it("ouvre une fenêtre avec le HTML généré", () => {
      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
      };

      vi.spyOn(window, "open").mockReturnValue(mockPrintWindow as any);

      exportFormPollToPDF(mockPoll);

      expect(window.open).toHaveBeenCalledWith("", "_blank");
      expect(mockPrintWindow.document.write).toHaveBeenCalled();
      expect(mockPrintWindow.document.close).toHaveBeenCalled();

      const htmlContent = mockPrintWindow.document.write.mock.calls[0][0];
      expect(htmlContent).toContain("<!DOCTYPE html>");
      expect(htmlContent).toContain('<html lang="fr">');
      expect(htmlContent).toContain("window.print()");
      expect(htmlContent).toContain("@page");
      expect(htmlContent).toContain("results-table");
    });

    it("lance une erreur si la popup est bloquée", () => {
      vi.spyOn(window, "open").mockReturnValue(null);

      expect(() => exportFormPollToPDF(mockPoll)).toThrow(
        "Popup blocked. Please allow popups for this site.",
      );
    });
  });

  describe("Error Handling", () => {
    it("lance une erreur si le poll n'est pas de type form", () => {
      const datePoll = { ...mockPoll, type: "date" as const };

      expect(() => exportFormPollToCSV(datePoll)).toThrow("This function only supports FormPoll");
      expect(() => exportFormPollToJSON(datePoll)).toThrow("This function only supports FormPoll");
      expect(() => exportFormPollToMarkdown(datePoll)).toThrow(
        "This function only supports FormPoll",
      );
      expect(() => exportFormPollToPDF(datePoll)).toThrow("This function only supports FormPoll");
    });
  });
});
