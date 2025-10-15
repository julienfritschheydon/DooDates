/**
 * Tests unitaires pour CascadeDeleteModal
 * Vérifie validation, i18n et interactions utilisateur
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CascadeDeleteModal, CascadeItem } from "../CascadeDeleteModal";

// Mock data
const mockItems: CascadeItem[] = [
  {
    id: "conv-1",
    type: "conversation",
    title: "Réunion équipe du 15/01",
  },
  {
    id: "poll-1",
    type: "poll",
    title: "Disponibilités janvier",
  },
];

describe("CascadeDeleteModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    items: mockItems,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendu et contenu", () => {
    it("should render modal with correct title and items", () => {
      render(<CascadeDeleteModal {...defaultProps} />);

      expect(screen.getByText("Suppression en cascade")).toBeInTheDocument();
      expect(screen.getByText("Réunion équipe du 15/01")).toBeInTheDocument();
      expect(screen.getByText("Disponibilités janvier")).toBeInTheDocument();
      expect(screen.getByText("Conversation")).toBeInTheDocument();
      expect(screen.getByText("Sondage")).toBeInTheDocument();
    });

    it("should show warning message", () => {
      render(<CascadeDeleteModal {...defaultProps} />);

      expect(
        screen.getByText(/Cette action supprimera les DEUX éléments/),
      ).toBeInTheDocument();
    });

    it("should show confirmation instruction", () => {
      render(<CascadeDeleteModal {...defaultProps} />);

      expect(screen.getByText(/Pour confirmer, tapez :/)).toBeInTheDocument();
      expect(screen.getByText("SUPPRIMER")).toBeInTheDocument();
    });
  });

  describe("Validation saisie confirmation", () => {
    it("should disable delete button initially", () => {
      render(<CascadeDeleteModal {...defaultProps} />);

      const deleteButton = screen.getByRole("button", {
        name: /Supprimer définitivement/,
      });
      expect(deleteButton).toBeDisabled();
    });

    it("should keep button disabled with incorrect input", async () => {
      const user = userEvent.setup();
      render(<CascadeDeleteModal {...defaultProps} />);

      const input = screen.getByPlaceholderText(
        "Tapez SUPPRIMER pour confirmer",
      );
      const deleteButton = screen.getByRole("button", {
        name: /Supprimer définitivement/,
      });

      await user.type(input, "supprimer");
      expect(deleteButton).toBeDisabled();

      await user.clear(input);
      await user.type(input, "DELETE");
      expect(deleteButton).toBeDisabled();

      await user.clear(input);
      await user.type(input, "SUPPRIM");
      expect(deleteButton).toBeDisabled();
    });

    it("should enable button with correct input", async () => {
      const user = userEvent.setup();
      render(<CascadeDeleteModal {...defaultProps} />);

      const input = screen.getByPlaceholderText(
        "Tapez SUPPRIMER pour confirmer",
      );
      const deleteButton = screen.getByRole("button", {
        name: /Supprimer définitivement/,
      });

      await user.type(input, "SUPPRIMER");
      expect(deleteButton).toBeEnabled();
    });

    it("should call onConfirm when button clicked with valid input", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      render(<CascadeDeleteModal {...defaultProps} onConfirm={onConfirm} />);

      const input = screen.getByPlaceholderText(
        "Tapez SUPPRIMER pour confirmer",
      );
      const deleteButton = screen.getByRole("button", {
        name: /Supprimer définitivement/,
      });

      await user.type(input, "SUPPRIMER");
      await user.click(deleteButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("should call onConfirm on Enter key with valid input", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      render(<CascadeDeleteModal {...defaultProps} onConfirm={onConfirm} />);

      const input = screen.getByPlaceholderText(
        "Tapez SUPPRIMER pour confirmer",
      );

      await user.type(input, "SUPPRIMER");
      await user.keyboard("{Enter}");

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe("États de chargement", () => {
    it("should show loading state when deleting", () => {
      render(<CascadeDeleteModal {...defaultProps} isDeleting={true} />);

      expect(screen.getByText("Suppression en cours...")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Suppression en cours/ }),
      ).toBeDisabled();
    });

    it("should disable input when deleting", () => {
      render(<CascadeDeleteModal {...defaultProps} isDeleting={true} />);

      const input = screen.getByPlaceholderText(
        "Tapez SUPPRIMER pour confirmer",
      );
      expect(input).toBeDisabled();
    });

    it("should disable cancel button when deleting", () => {
      render(<CascadeDeleteModal {...defaultProps} isDeleting={true} />);

      const cancelButton = screen.getByRole("button", { name: "Annuler" });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe("Fermeture modal", () => {
    it("should call onClose when cancel button clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<CascadeDeleteModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByRole("button", { name: "Annuler" });
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose on Escape key", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<CascadeDeleteModal {...defaultProps} onClose={onClose} />);

      // Clear any previous calls that might have happened during render
      onClose.mockClear();

      await user.keyboard("{Escape}");

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should reset confirmation text when modal reopens", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <CascadeDeleteModal {...defaultProps} isOpen={false} />,
      );

      // Open modal and type confirmation
      rerender(<CascadeDeleteModal {...defaultProps} isOpen={true} />);
      const input = screen.getByPlaceholderText(
        "Tapez SUPPRIMER pour confirmer",
      );
      await user.type(input, "SUPPRIMER");

      // Close and reopen modal
      rerender(<CascadeDeleteModal {...defaultProps} isOpen={false} />);
      rerender(<CascadeDeleteModal {...defaultProps} isOpen={true} />);

      // Input should be reset
      const newInput = screen.getByPlaceholderText(
        "Tapez SUPPRIMER pour confirmer",
      );
      expect(newInput).toHaveValue("");
    });
  });

  describe("Traductions i18n", () => {
    it("should render in English when language is en", () => {
      render(<CascadeDeleteModal {...defaultProps} language="en" />);

      expect(screen.getByText("Cascade deletion")).toBeInTheDocument();
      expect(
        screen.getByText(
          "You are about to permanently delete the following items:",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("To confirm, type:")).toBeInTheDocument();
      expect(screen.getByText("DELETE")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Type DELETE to confirm"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Delete permanently/ }),
      ).toBeInTheDocument();
    });

    it("should use correct confirmation word for English", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      render(
        <CascadeDeleteModal
          {...defaultProps}
          language="en"
          onConfirm={onConfirm}
        />,
      );

      const input = screen.getByPlaceholderText("Type DELETE to confirm");
      const deleteButton = screen.getByRole("button", {
        name: /Delete permanently/,
      });

      // French word should not work
      await user.type(input, "SUPPRIMER");
      expect(deleteButton).toBeDisabled();

      // English word should work
      await user.clear(input);
      await user.type(input, "DELETE");
      expect(deleteButton).toBeEnabled();

      await user.click(deleteButton);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("should show correct item type labels in English", () => {
      render(<CascadeDeleteModal {...defaultProps} language="en" />);

      expect(screen.getByText("Conversation")).toBeInTheDocument();
      expect(screen.getByText("Poll")).toBeInTheDocument();
    });
  });

  describe("Styles visuels", () => {
    it("should apply correct styles to input based on validation", async () => {
      const user = userEvent.setup();
      render(<CascadeDeleteModal {...defaultProps} />);

      const input = screen.getByPlaceholderText(
        "Tapez SUPPRIMER pour confirmer",
      );

      // Invalid input should have red styling
      await user.type(input, "invalid");
      expect(input).toHaveClass("border-red-500", "bg-red-50");

      // Valid input should have green styling
      await user.clear(input);
      await user.type(input, "SUPPRIMER");
      expect(input).toHaveClass("border-green-500", "bg-green-50");
    });

    it("should show items with correct styling", () => {
      render(<CascadeDeleteModal {...defaultProps} />);

      // Find the container divs with the correct styling classes
      const itemContainers = screen
        .getAllByText(/Réunion équipe du 15\/01|Disponibilités janvier/)
        .map((text) => text.closest(".bg-red-50"));

      expect(itemContainers).toHaveLength(2);
      itemContainers.forEach((container) => {
        expect(container).toHaveClass("bg-red-50", "border-red-200");
      });
    });
  });

  describe("Accessibilité", () => {
    it("should focus input when modal opens", () => {
      render(<CascadeDeleteModal {...defaultProps} />);

      const input = screen.getByPlaceholderText(
        "Tapez SUPPRIMER pour confirmer",
      );
      expect(input).toHaveFocus();
    });

    it("should have proper ARIA labels", () => {
      render(<CascadeDeleteModal {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Supprimer définitivement/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Annuler" }),
      ).toBeInTheDocument();
    });
  });
});
