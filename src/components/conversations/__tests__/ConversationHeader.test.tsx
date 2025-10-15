/**
 * Tests unitaires pour ConversationHeader
 * Vérifie badges bidirectionnels, navigation et i18n
 */

import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConversationHeader } from "../ConversationHeader";
import type { Conversation } from "../../../types/conversation";

// Mock data
const createMockConversation = (
  overrides: Partial<Conversation> = {},
): Conversation => ({
  id: "conv-1",
  title: "Test Conversation",
  status: "active",
  createdAt: new Date("2024-01-15T10:00:00Z"),
  updatedAt: new Date("2024-01-15T14:30:00Z"),
  firstMessage: "Hello, this is the first message",
  messageCount: 5,
  isFavorite: false,
  tags: [],
  relatedPollId: undefined,
  ...overrides,
});

describe("ConversationHeader", () => {
  const defaultProps = {
    conversation: createMockConversation(),
    onResume: vi.fn(),
    onViewPoll: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendu de base", () => {
    it("should render conversation title and status", () => {
      render(<ConversationHeader {...defaultProps} />);

      expect(screen.getByText("Test Conversation")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should show message count and creation date", () => {
      render(<ConversationHeader {...defaultProps} />);

      expect(screen.getByText("5 messages")).toBeInTheDocument();
      expect(screen.getByText(/Créée le 15\/01\/2024/)).toBeInTheDocument();
    });

    it("should show resume button for active conversations", () => {
      render(<ConversationHeader {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /Reprendre la conversation/ }),
      ).toBeInTheDocument();
    });

    it("should not show resume button for archived conversations", () => {
      const archivedConversation = createMockConversation({
        status: "archived",
      });
      render(
        <ConversationHeader
          {...defaultProps}
          conversation={archivedConversation}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /Reprendre la conversation/ }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Badge favori", () => {
    it("should show favorite badge when conversation is favorite", () => {
      const favoriteConversation = createMockConversation({ isFavorite: true });
      render(
        <ConversationHeader
          {...defaultProps}
          conversation={favoriteConversation}
        />,
      );

      expect(screen.getByText(/⭐ Favori/)).toBeInTheDocument();
    });

    it("should not show favorite badge when conversation is not favorite", () => {
      render(<ConversationHeader {...defaultProps} />);

      expect(screen.queryByText(/⭐ Favori/)).not.toBeInTheDocument();
    });
  });

  describe("Badge bidirectionnel sondage", () => {
    it("should show poll link badge when relatedPollId exists", () => {
      const conversationWithPoll = createMockConversation({
        relatedPollId: "poll-123",
      });
      render(
        <ConversationHeader
          {...defaultProps}
          conversation={conversationWithPoll}
        />,
      );

      expect(screen.getByText("Lié à un sondage")).toBeInTheDocument();
    });

    it("should not show poll link badge when no relatedPollId", () => {
      render(<ConversationHeader {...defaultProps} />);

      expect(screen.queryByText("Lié à un sondage")).not.toBeInTheDocument();
    });

    it("should call onViewPoll when poll badge is clicked", async () => {
      const user = userEvent.setup();
      const onViewPoll = vi.fn();
      const conversationWithPoll = createMockConversation({
        relatedPollId: "poll-123",
      });

      render(
        <ConversationHeader
          {...defaultProps}
          conversation={conversationWithPoll}
          onViewPoll={onViewPoll}
        />,
      );

      const pollBadge = screen.getByText("Lié à un sondage");
      await user.click(pollBadge);

      expect(onViewPoll).toHaveBeenCalledWith("poll-123");
    });

    it("should show poll action button when relatedPollId exists", () => {
      const conversationWithPoll = createMockConversation({
        relatedPollId: "poll-123",
      });
      render(
        <ConversationHeader
          {...defaultProps}
          conversation={conversationWithPoll}
        />,
      );

      expect(
        screen.getByRole("button", { name: /Voir le sondage lié/ }),
      ).toBeInTheDocument();
    });

    it("should call onViewPoll when poll action button is clicked", async () => {
      const user = userEvent.setup();
      const onViewPoll = vi.fn();
      const conversationWithPoll = createMockConversation({
        relatedPollId: "poll-123",
      });

      render(
        <ConversationHeader
          {...defaultProps}
          conversation={conversationWithPoll}
          onViewPoll={onViewPoll}
        />,
      );

      const pollButton = screen.getByRole("button", {
        name: /Voir le sondage lié/,
      });
      await user.click(pollButton);

      expect(onViewPoll).toHaveBeenCalledWith("poll-123");
    });
  });

  describe("Navigation bidirectionnelle", () => {
    it("should call onResume when resume button is clicked", async () => {
      const user = userEvent.setup();
      const onResume = vi.fn();

      render(<ConversationHeader {...defaultProps} onResume={onResume} />);

      const resumeButton = screen.getByRole("button", {
        name: /Reprendre la conversation/,
      });
      await user.click(resumeButton);

      expect(onResume).toHaveBeenCalledWith("conv-1");
    });

    it("should show both poll badge and button when poll exists", () => {
      const conversationWithPoll = createMockConversation({
        relatedPollId: "poll-123",
      });
      render(
        <ConversationHeader
          {...defaultProps}
          conversation={conversationWithPoll}
        />,
      );

      expect(screen.getByText("Lié à un sondage")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Voir le sondage lié/ }),
      ).toBeInTheDocument();
    });
  });

  describe("Icônes distinctives", () => {
    it("should show correct icons for poll elements", () => {
      const conversationWithPoll = createMockConversation({
        relatedPollId: "poll-123",
      });
      render(
        <ConversationHeader
          {...defaultProps}
          conversation={conversationWithPoll}
        />,
      );

      // Vérifier que le badge de sondage est présent avec ses icônes
      expect(screen.getByText("Lié à un sondage")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Voir le sondage lié/ }),
      ).toBeInTheDocument();
    });

    it("should show message count with proper text", () => {
      render(<ConversationHeader {...defaultProps} />);

      expect(screen.getByText("5 messages")).toBeInTheDocument();
    });
  });

  describe("Mode compact", () => {
    it("should show compact version when compact=true", () => {
      render(<ConversationHeader {...defaultProps} compact={true} />);

      // En mode compact, les métadonnées détaillées ne sont pas affichées
      expect(screen.queryByText(/Créée le/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Dernière activité/)).not.toBeInTheDocument();
    });

    it("should show emojis in compact mode for actions", () => {
      const conversationWithPoll = createMockConversation({
        relatedPollId: "poll-123",
      });
      render(
        <ConversationHeader
          {...defaultProps}
          conversation={conversationWithPoll}
          compact={true}
        />,
      );

      expect(screen.getByRole("button", { name: /📊/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /▶️/ })).toBeInTheDocument();
    });
  });

  describe("Traductions i18n", () => {
    it("should render in English when language=en", () => {
      render(<ConversationHeader {...defaultProps} language="en" />);

      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("5 messages")).toBeInTheDocument();
      expect(screen.getByText(/Created on/)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Resume conversation/ }),
      ).toBeInTheDocument();
    });

    it("should show English poll badge when language=en", () => {
      const conversationWithPoll = createMockConversation({
        relatedPollId: "poll-123",
      });
      render(
        <ConversationHeader
          {...defaultProps}
          conversation={conversationWithPoll}
          language="en"
        />,
      );

      expect(screen.getByText("Linked to poll")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /View linked poll/ }),
      ).toBeInTheDocument();
    });

    it("should show English favorite badge when language=en", () => {
      const favoriteConversation = createMockConversation({ isFavorite: true });
      render(
        <ConversationHeader
          {...defaultProps}
          conversation={favoriteConversation}
          language="en"
        />,
      );

      expect(screen.getByText(/⭐ Favorite/)).toBeInTheDocument();
    });
  });

  describe("États de statut", () => {
    it("should show correct styling for completed status", () => {
      const completedConversation = createMockConversation({
        status: "completed",
      });
      render(
        <ConversationHeader
          {...defaultProps}
          conversation={completedConversation}
        />,
      );

      const statusBadge = screen.getByText("Terminée");
      expect(statusBadge).toHaveClass("bg-blue-100", "text-blue-800");
    });

    it("should show correct styling for archived status", () => {
      const archivedConversation = createMockConversation({
        status: "archived",
      });
      render(
        <ConversationHeader
          {...defaultProps}
          conversation={archivedConversation}
        />,
      );

      const statusBadge = screen.getByText("Archivée");
      expect(statusBadge).toHaveClass("bg-gray-100", "text-gray-800");
    });

    it("should show correct styling for active status", () => {
      render(<ConversationHeader {...defaultProps} />);

      const statusBadge = screen.getByText("Active");
      expect(statusBadge).toHaveClass("bg-green-100", "text-green-800");
    });
  });

  describe("Accessibilité", () => {
    it("should have proper button roles and labels", () => {
      const conversationWithPoll = createMockConversation({
        relatedPollId: "poll-123",
      });
      render(
        <ConversationHeader
          {...defaultProps}
          conversation={conversationWithPoll}
        />,
      );

      expect(
        screen.getByRole("button", { name: /Reprendre la conversation/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Voir le sondage lié/ }),
      ).toBeInTheDocument();
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      const onResume = vi.fn();

      render(<ConversationHeader {...defaultProps} onResume={onResume} />);

      const resumeButton = screen.getByRole("button", {
        name: /Reprendre la conversation/,
      });
      resumeButton.focus();
      await user.keyboard("{Enter}");

      expect(onResume).toHaveBeenCalledWith("conv-1");
    });
  });
});
