import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import MultiStepFormVote from "../MultiStepFormVote";
import type { Poll } from "../../../lib/pollStorage";

// Mock des dépendances
vi.mock("../../../lib/pollStorage", () => ({
  addFormResponse: vi.fn(),
}));

vi.mock("../../../hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("MultiStepFormVote", () => {
  const mockPoll: Poll = {
    id: "test-poll",
    creator_id: "user1",
    title: "Test Poll",
    slug: "test-poll",
    status: "active",
    created_at: "2025-01-01",
    updated_at: "2025-01-01",
    dates: [],
    type: "form",
    displayMode: "multi-step",
    questions: [
      {
        id: "q1",
        kind: "single",
        title: "Question 1",
        required: true,
        options: [
          { id: "opt1", label: "Option 1" },
          { id: "opt2", label: "Option 2" },
        ],
      },
      {
        id: "q2",
        kind: "text",
        title: "Question 2",
        required: false,
      },
      {
        id: "q3",
        kind: "rating",
        title: "Question 3",
        required: true,
        ratingScale: 5,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche la première question au chargement", () => {
    render(
      <BrowserRouter>
        <MultiStepFormVote poll={mockPoll} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Question 1")).toBeInTheDocument();
    expect(screen.getByText("Question 1 sur 3")).toBeInTheDocument();
  });

  // FIXME: Précision flottante JavaScript (33.333333333333336% vs 33.33333333333333%)
  it.skip("affiche la barre de progression correcte", () => {
    render(
      <BrowserRouter>
        <MultiStepFormVote poll={mockPoll} />
      </BrowserRouter>,
    );

    const progressBar = document.querySelector(".bg-gradient-to-r");
    expect(progressBar).toHaveStyle({ width: "33.333333333333336%" }); // 1/3
  });

  it("désactive le bouton Continuer si question requise non répondue", () => {
    render(
      <BrowserRouter>
        <MultiStepFormVote poll={mockPoll} />
      </BrowserRouter>,
    );

    const continueButton = screen.getByText("Continuer");
    expect(continueButton).toBeDisabled();
  });

  it("active le bouton Continuer après avoir répondu à une question requise", () => {
    render(
      <BrowserRouter>
        <MultiStepFormVote poll={mockPoll} />
      </BrowserRouter>,
    );

    const option1 = screen.getByText("Option 1");
    fireEvent.click(option1);

    const continueButton = screen.getByText("Continuer");
    expect(continueButton).not.toBeDisabled();
  });

  it("passe à la question suivante en cliquant sur Continuer", () => {
    render(
      <BrowserRouter>
        <MultiStepFormVote poll={mockPoll} />
      </BrowserRouter>,
    );

    // Répondre à Q1
    const option1 = screen.getByText("Option 1");
    fireEvent.click(option1);

    // Cliquer sur Continuer
    const continueButton = screen.getByText("Continuer");
    fireEvent.click(continueButton);

    // Vérifier qu'on est sur Q2
    expect(screen.getByText("Question 2")).toBeInTheDocument();
    expect(screen.getByText("Question 2 sur 3")).toBeInTheDocument();
  });

  it("permet de revenir en arrière avec le bouton Retour", () => {
    render(
      <BrowserRouter>
        <MultiStepFormVote poll={mockPoll} />
      </BrowserRouter>,
    );

    // Aller à Q2
    fireEvent.click(screen.getByText("Option 1"));
    fireEvent.click(screen.getByText("Continuer"));

    // Revenir à Q1
    const backButton = screen.getByText("Retour");
    fireEvent.click(backButton);

    expect(screen.getByText("Question 1")).toBeInTheDocument();
  });

  it("désactive le bouton Retour sur la première question", () => {
    render(
      <BrowserRouter>
        <MultiStepFormVote poll={mockPoll} />
      </BrowserRouter>,
    );

    const backButton = screen.getByText("Retour");
    expect(backButton).toBeDisabled();
  });

  it("affiche 'Dernière question !' sur la dernière question", () => {
    render(
      <BrowserRouter>
        <MultiStepFormVote poll={mockPoll} />
      </BrowserRouter>,
    );

    // Aller à Q2
    fireEvent.click(screen.getByText("Option 1"));
    fireEvent.click(screen.getByText("Continuer"));

    // Aller à Q3 (dernière)
    fireEvent.click(screen.getByText("Continuer")); // Q2 non requise

    expect(screen.getByText("Dernière question ! 🎉")).toBeInTheDocument();
  });

  it.skip("affiche le bouton Soumettre sur l'étape coordonnées", async () => {
    render(
      <BrowserRouter>
        <MultiStepFormVote poll={mockPoll} />
      </BrowserRouter>,
    );

    // Aller à la dernière question
    fireEvent.click(screen.getByText("Option 1"));
    fireEvent.click(screen.getByText("Continuer"));
    fireEvent.click(screen.getByText("Continuer"));

    // Cliquer sur le rating pour passer à l'étape coordonnées
    fireEvent.click(screen.getByText("5"));

    // Attendre et cliquer sur le bouton pour aller aux coordonnées
    await waitFor(() => {
      const nextButton = screen.getByText(/Vos coordonnées/i);
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Soumettre")).toBeInTheDocument();
    });
  });

  it.skip("soumet le formulaire avec toutes les réponses", async () => {
    const { addFormResponse } = await import("../../../lib/pollStorage");

    render(
      <BrowserRouter>
        <MultiStepFormVote poll={mockPoll} />
      </BrowserRouter>,
    );

    // Répondre Q1
    fireEvent.click(screen.getByText("Option 1"));
    fireEvent.click(screen.getByText("Continuer"));

    // Répondre Q2 (optionnelle)
    const textarea = screen.getByPlaceholderText("Votre réponse...");
    fireEvent.change(textarea, { target: { value: "Ma réponse" } });
    fireEvent.click(screen.getByText("Continuer"));

    // Répondre Q3
    const rating5 = screen.getByText("5");
    fireEvent.click(rating5);

    // Aller à l'étape coordonnées
    await waitFor(() => {
      const nextButton = screen.getByText(/Vos coordonnées/i);
      fireEvent.click(nextButton);
    });

    // Soumettre
    await waitFor(() => {
      const submitButton = screen.getByText("Soumettre");
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(addFormResponse).toHaveBeenCalledWith({
        pollId: "test-poll",
        respondentName: undefined,
        items: [
          { questionId: "q1", value: "opt1" },
          { questionId: "q2", value: "Ma réponse" },
          { questionId: "q3", value: 5 },
        ],
      });
    });
  });

  it("gère les questions conditionnelles", async () => {
    const pollWithConditional: Poll = {
      ...mockPoll,
      questions: [
        {
          id: "q1",
          kind: "single",
          title: "Êtes-vous satisfait ?",
          required: true,
          options: [
            { id: "yes", label: "Oui" },
            { id: "no", label: "Non" },
          ],
        },
        {
          id: "q2",
          kind: "text",
          title: "Pourquoi pas ?",
          required: false,
        },
      ],
      conditionalRules: [
        {
          questionId: "q2",
          dependsOn: "q1",
          showIf: {
            operator: "equals",
            value: "no",
          },
        },
      ],
    };

    render(
      <BrowserRouter>
        <MultiStepFormVote poll={pollWithConditional} />
      </BrowserRouter>,
    );

    // Répondre "Oui" → Q2 ne devrait pas apparaître, passer à l'étape coordonnées
    fireEvent.click(screen.getByText("Oui"));

    await waitFor(() => {
      const nextButton = screen.getByText(/Vos coordonnées/i);
      fireEvent.click(nextButton);
    });

    expect(screen.queryByText("Pourquoi pas ?")).not.toBeInTheDocument();
  });

  it("supporte la navigation clavier (Entrée)", () => {
    render(
      <BrowserRouter>
        <MultiStepFormVote poll={mockPoll} />
      </BrowserRouter>,
    );

    // Répondre Q1
    fireEvent.click(screen.getByText("Option 1"));

    // Appuyer sur Entrée
    fireEvent.keyDown(window, { key: "Enter" });

    // Devrait passer à Q2
    expect(screen.getByText("Question 2")).toBeInTheDocument();
  });

  it("supporte la navigation clavier (Flèches)", () => {
    render(
      <BrowserRouter>
        <MultiStepFormVote poll={mockPoll} />
      </BrowserRouter>,
    );

    // Répondre Q1
    fireEvent.click(screen.getByText("Option 1"));
    fireEvent.click(screen.getByText("Continuer"));

    // Appuyer sur Flèche gauche
    fireEvent.keyDown(window, { key: "ArrowLeft" });

    // Devrait revenir à Q1
    expect(screen.getByText("Question 1")).toBeInTheDocument();
  });

  it("affiche un message si aucune question disponible", () => {
    const emptyPoll: Poll = {
      ...mockPoll,
      questions: [],
    };

    render(
      <BrowserRouter>
        <MultiStepFormVote poll={emptyPoll} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Aucune question disponible")).toBeInTheDocument();
  });

  it.skip("permet de saisir le nom du répondant sur l'étape coordonnées", async () => {
    render(
      <BrowserRouter>
        <MultiStepFormVote poll={mockPoll} />
      </BrowserRouter>,
    );

    // Aller jusqu'à l'étape coordonnées
    fireEvent.click(screen.getByText("Option 1"));
    fireEvent.click(screen.getByText("Continuer"));
    fireEvent.click(screen.getByText("Continuer"));
    fireEvent.click(screen.getByText("5"));

    await waitFor(() => {
      const nextButton = screen.getByText(/Vos coordonnées/i);
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText("Anonyme");
      fireEvent.change(nameInput, { target: { value: "John Doe" } });
      expect(nameInput).toHaveValue("John Doe");
    });
  });

  it.skip("gère les questions de type multiple choice", async () => {
    const pollWithMultiple: Poll = {
      ...mockPoll,
      questions: [
        {
          id: "q1",
          kind: "multiple",
          title: "Sélectionnez vos préférences",
          required: true,
          options: [
            { id: "opt1", label: "Option 1" },
            { id: "opt2", label: "Option 2" },
            { id: "opt3", label: "Option 3" },
          ],
        },
      ],
    };

    render(
      <BrowserRouter>
        <MultiStepFormVote poll={pollWithMultiple} />
      </BrowserRouter>,
    );

    // Sélectionner plusieurs options
    fireEvent.click(screen.getByText("Option 1"));
    fireEvent.click(screen.getByText("Option 3"));

    // Aller à l'étape coordonnées
    await waitFor(() => {
      const nextButton = screen.getByText(/Vos coordonnées/i);
      fireEvent.click(nextButton);
    });

    // Le bouton Soumettre devrait être actif
    await waitFor(() => {
      const submitButton = screen.getByText("Soumettre");
      expect(submitButton).not.toBeDisabled();
    });
  });

  it.skip("gère les questions de type NPS", async () => {
    const pollWithNPS: Poll = {
      ...mockPoll,
      questions: [
        {
          id: "q1",
          kind: "nps",
          title: "Recommanderiez-vous notre produit ?",
          required: true,
        },
      ],
    };

    render(
      <BrowserRouter>
        <MultiStepFormVote poll={pollWithNPS} />
      </BrowserRouter>,
    );

    // Vérifier que les 11 boutons (0-10) sont affichés
    for (let i = 0; i <= 10; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }

    // Cliquer sur 9
    fireEvent.click(screen.getByText("9"));

    // Aller à l'étape coordonnées
    await waitFor(() => {
      const nextButton = screen.getByText(/Vos coordonnées/i);
      fireEvent.click(nextButton);
    });

    // Le bouton Soumettre devrait être actif
    await waitFor(() => {
      const submitButton = screen.getByText("Soumettre");
      expect(submitButton).not.toBeDisabled();
    });
  });
});
