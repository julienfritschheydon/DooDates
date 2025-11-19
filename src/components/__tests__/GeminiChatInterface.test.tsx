/// <reference types="@testing-library/jest-dom" />
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { GeminiChatHandle } from "../GeminiChatInterface";
import GeminiChatInterface from "../GeminiChatInterface";

// Import the hooks that are being mocked
import { useMessageSender } from "../../hooks/useMessageSender";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";
import { useQuota } from "../../hooks/useQuota";
import { useAiMessageQuota } from "../../hooks/useAiMessageQuota";
import { ConversationService } from "../../services/ConversationService";
import { useToast } from "../../hooks/use-toast";
import { usePollManagement } from "../../hooks/usePollManagement";

// Helpers pour wrapper avec Router et React Query
const queryClient = new QueryClient();

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>,
  );
}

// Mocks basiques des hooks utilisés par GeminiChatInterface
// IMPORTANT : on mock complètement useAutoSave pour ne JAMAIS appeler le vrai hook (qui utilise useAuth)
vi.mock("../hooks/useAutoSave", () => ({
  useAutoSave: () => ({
    getRealConversationId: () => "conversation-1",
    conversationId: "conversation-1",
    saveMessage: vi.fn(),
    saveMessages: vi.fn(),
  }),
}));

// Mock minimal de useAuth (au cas où il serait appelé directement ailleurs)
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("../hooks/useConversationResume", () => ({
  useConversationResume: () => ({
    canResume: false,
  }),
}));

vi.mock("../hooks/useGeminiAPI", () => ({
  useGeminiAPI: () => ({
    sendMessage: vi.fn(),
  }),
}));

// Couper toute dépendance vers React Query / useConversations
vi.mock("../hooks/useConversations", () => ({
  useConversations: () => ({
    conversations: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("../hooks/useFreemiumQuota", () => ({
  useFreemiumQuota: () => ({
    limits: {
      maxConversations: 5,
      maxMessages: 50,
    },
    usage: {
      conversationsCreated: 0,
      aiMessages: 0,
    },
  }),
}));

vi.mock("../hooks/useAiMessageQuota", () => ({
  useAiMessageQuota: () => ({
    aiMessagesUsed: 0,
    aiMessagesLimit: 50,
    aiMessagesRemaining: 50,
    canSendMessage: true,
    pollsInConversation: 0,
    pollsLimit: 5,
    canCreatePoll: true,
    incrementAiMessages: vi.fn(),
    incrementPollCount: vi.fn(),
    resetQuota: vi.fn(),
    isInCooldown: false,
    cooldownRemaining: 0,
    quota: {
      conversationsCreated: 0,
      pollsCreated: 0,
      aiMessages: 45, // Proche de la limite
      analyticsQueries: 0,
      simulations: 0,
      totalCreditsConsumed: 0,
      userId: "guest",
    },
  }),
}));

vi.mock("../hooks/useMessageSender", () => ({
  useMessageSender: vi.fn(),
}));

vi.mock("../hooks/useVoiceRecognition", () => ({
  useVoiceRecognition: () => ({
    isSupported: false,
    isListening: false,
    interimTranscript: "",
    finalTranscript: "",
    startListening: vi.fn(),
    stopListening: vi.fn(),
    resetTranscript: vi.fn(),
  }),
}));

vi.mock("../hooks/useQuota", () => ({
  useQuota: () => ({
    canCreateConversation: true,
    canSendMessage: true,
    showAuthIncentive: vi.fn(),
    conversationsCreated: 0,
    messagesSent: 0,
  }),
}));

vi.mock("../services/ConversationService", () => ({
  ConversationService: {
    resumeFromUrl: vi.fn(),
    convertMessagesToChat: vi.fn(),
    createResumeMessage: vi.fn(),
  },
}));

vi.mock("../hooks/useToast", () => ({
  useToast: vi.fn(),
}));

vi.mock("../hooks/usePollManagement", () => ({
  usePollManagement: () => ({
    showPollCreator: false,
    selectedPollData: null,
    openPollCreator: vi.fn(),
    closePollCreator: vi.fn(),
    getFormDraft: vi.fn(),
  }),
}));

vi.mock("../hooks/useConnectionStatus", () => ({
  useConnectionStatus: () => ({
    status: "online",
    testConnection: vi.fn(),
    cleanup: vi.fn(),
  }),
}));

vi.mock("../hooks/useIntentDetection", () => ({
  useIntentDetection: () => ({
    detectIntent: vi.fn(),
  }),
}));

vi.mock("../lib/e2e-detection", () => ({
  isE2ETestingEnvironment: () => false,
}));

vi.mock("../services/AiQuotaService", () => ({
  checkAiMessageQuota: () => ({ canProceed: true }),
  checkPollCreationQuota: () => ({ canProceed: true }),
  handleQuotaError: vi.fn(),
}));

vi.mock("../services/SurveyRequestAggregator", () => ({
  SurveyRequestAggregator: {
    clearPendingRequest: vi.fn(),
  },
}));

vi.mock("../services/ConversationProtection", () => ({
  conversationProtection: {
    canCreateConversation: () => true,
    notifyCreationAttempt: vi.fn(),
    reset: vi.fn(),
  },
}));

vi.mock("../services/PerformanceMonitor", () => ({
  performanceMonitor: {
    trackOperation: vi.fn(),
  },
}));

vi.mock("../services/InfiniteLoopProtection", () => ({
  useInfiniteLoopProtection: () => ({
    canProceed: () => true,
    notifyOperation: vi.fn(),
  }),
}));

vi.mock("../lib/error-handling", () => ({
  handleError: (error: unknown) => error,
  ErrorFactory: {
    api: vi.fn(),
    storage: vi.fn(),
  },
  logError: vi.fn(),
}));

vi.mock("../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("../lib/ConversationPollLink", () => ({
  linkPollToConversationBidirectional: vi.fn(),
}));

// Providers prototype
vi.mock("../prototype/ConversationStateProvider", () => ({
  useConversationMessages: () => [],
  useConversationActions: () => ({
    setMessages: vi.fn(),
  }),
}));

vi.mock("../prototype/EditorStateProvider", () => ({
  useEditorState: () => ({ currentPoll: null }),
  useEditorActions: () => ({
    dispatchPollAction: vi.fn(),
    openEditor: vi.fn(),
    setCurrentPoll: vi.fn(),
    createPollFromChat: vi.fn(),
    clearCurrentPoll: vi.fn(),
  }),
}));

vi.mock("../prototype/UIStateProvider", () => ({
  useUIState: () => ({
    setModifiedQuestion: vi.fn(),
  }),
}));

vi.mock("../lib/storage/ConversationStorageSimple", () => ({
  getConversation: vi.fn(),
}));

vi.mock("../lib/pollStorage", () => ({
  getPollBySlugOrId: vi.fn(),
}));

vi.mock("../components/OnboardingTour", () => ({
  OnboardingTour: () => null,
}));

// Lazy components
vi.mock("../components/PollCreator", () => ({
  __esModule: true,
  default: () => <div data-testid="poll-creator" />,
}));

vi.mock("../components/polls/FormPollCreator", () => ({
  __esModule: true,
  default: () => <div data-testid="form-poll-creator" />,
}));

// Utilitaire pour créer le composant avec ref
function renderGeminiChat(props: Partial<React.ComponentProps<typeof GeminiChatInterface>> = {}) {
  const ref = React.createRef<GeminiChatHandle>();
  const utils = renderWithRouter(
    <GeminiChatInterface ref={ref} darkTheme={false} resumeLastConversation={false} {...props} />,
  );
  return { ref, ...utils };
}

describe.skip("GeminiChatInterface", () => {
  let mockUseMessageSender: any;
  let mockUseToast: any;
  let mockUseVoiceRecognition: any;
  let mockConversationService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create fresh mocks for each test
    mockUseMessageSender = vi.fn();
    mockUseToast = vi.fn();
    mockUseVoiceRecognition = vi.fn();
    mockConversationService = vi.fn();

    // Apply mocks
    vi.mocked(useMessageSender).mockImplementation(mockUseMessageSender);
    vi.mocked(useToast).mockImplementation(mockUseToast);
    vi.mocked(useVoiceRecognition).mockImplementation(mockUseVoiceRecognition);
    vi.mocked(ConversationService.resumeFromUrl).mockImplementation(mockConversationService);

    // Set default return values
    mockUseMessageSender.mockReturnValue({
      sendMessage: vi.fn().mockResolvedValue(undefined),
    });

    mockUseToast.mockReturnValue({
      toast: vi.fn(),
      dismiss: vi.fn(),
      toasts: [],
    });
  });

  it("affiche l'input de message et le bouton d'envoi", () => {
    renderGeminiChat();

    const input = screen.getByTestId("message-input");
    const sendButton = screen.getByTestId("send-message-button");

    expect(input).toBeInTheDocument();
    expect(sendButton).toBeInTheDocument();
  });

  it("envoie un message quand on clique sur le bouton d'envoi", async () => {
    renderGeminiChat();

    const input = screen.getByTestId("message-input") as HTMLTextAreaElement;
    const sendButton = screen.getByTestId("send-message-button");

    // Simuler saisie texte
    fireEvent.change(input, { target: { value: "Bonjour" } });

    // Le bouton doit être activé
    expect(sendButton).not.toBeDisabled();

    fireEvent.click(sendButton);

    // On vérifie que le composant passe en état "génération en cours" (input + bouton désactivés)
    await waitFor(() => {
      expect(sendButton).toBeDisabled();
      expect(input).toBeDisabled();
    });

    expect(sendButton).toBeInTheDocument();
  });

  it("expose submitMessage via ref", () => {
    const ref = React.createRef<GeminiChatHandle>();

    renderWithRouter(
      <GeminiChatInterface ref={ref} darkTheme={false} resumeLastConversation={false} />,
    );

    expect(ref.current).toBeDefined();
    expect(typeof ref.current!.submitMessage).toBe("function");
  });

  it("gère les erreurs de quota lors de l'envoi de message", async () => {
    // Override the mock for this specific test
    const mockSendMessage = vi.fn().mockRejectedValue(new Error("Credit limit exceeded"));
    mockUseMessageSender.mockReturnValue({
      sendMessage: mockSendMessage,
    });

    renderGeminiChat();

    const input = screen.getByTestId("message-input") as HTMLTextAreaElement;
    const sendButton = screen.getByTestId("send-message-button");

    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith("Test message", true);
    });
  });

  it("désactive l'input et le bouton pendant l'envoi", async () => {
    let resolveSendMessage: ((value: void) => void) | undefined;

    // Create the promise with a resolve function that gets assigned immediately
    const sendMessagePromise = new Promise<void>((resolve) => {
      resolveSendMessage = resolve;
    });

    const mockSendMessage = vi.fn().mockReturnValue(sendMessagePromise);

    mockUseMessageSender.mockReturnValue({
      sendMessage: mockSendMessage,
    });

    renderGeminiChat();

    const input = screen.getByTestId("message-input") as HTMLTextAreaElement;
    const sendButton = screen.getByTestId("send-message-button");

    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.click(sendButton);

    // Vérifier que l'input et le bouton sont désactivés pendant l'envoi
    await waitFor(() => {
      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });

    // Résoudre la promesse pour terminer l'envoi
    if (resolveSendMessage) {
      resolveSendMessage();
    }

    // Vérifier que l'input et le bouton sont réactivés
    await waitFor(() => {
      expect(input).not.toBeDisabled();
      expect(sendButton).not.toBeDisabled();
      expect(input).toHaveValue(""); // Input devrait être vidé
    });
  });

  it("gère la reconnaissance vocale", () => {
    const mockVoiceRecognition = {
      isSupported: true,
      isListening: false,
      interimTranscript: "test interim",
      finalTranscript: "test final",
      error: null,
      startListening: vi.fn(),
      stopListening: vi.fn(),
      resetTranscript: vi.fn(),
    };

    mockUseVoiceRecognition.mockReturnValue(mockVoiceRecognition);

    renderGeminiChat();

    const input = screen.getByTestId("message-input") as HTMLTextAreaElement;

    // Vérifier que la transcription est affichée dans l'input
    expect(input).toHaveValue("test final test interim");
  });

  it("gère les raccourcis clavier (Enter pour envoyer, Shift+Enter pour nouvelle ligne)", () => {
    renderGeminiChat();

    const input = screen.getByTestId("message-input") as HTMLTextAreaElement;
    const sendButton = screen.getByTestId("send-message-button");

    // Simuler saisie avec Enter seul (devrait envoyer)
    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: false });

    // Vérifier que le bouton send a été "cliqué" (via le mock)
    expect(sendButton).toBeInTheDocument();

    // Simuler saisie avec Shift+Enter (devrait permettre la nouvelle ligne)
    fireEvent.change(input, { target: { value: "Test message\n" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

    // L'input devrait contenir la nouvelle ligne
    expect(input.value).toBe("Test message\n");
  });

  it("gère la reprise de conversation depuis l'URL", async () => {
    const mockResumeFromUrl = vi.fn().mockResolvedValue({
      conversation: { id: "test-conv", title: "Test Conversation" },
      messages: [
        {
          id: "1",
          content: "Hello",
          isAI: false,
          timestamp: new Date(),
        },
      ],
    });

    mockConversationService.mockResolvedValue({
      conversation: { id: "test-conv", title: "Test Conversation" },
      messages: [
        {
          id: "1",
          content: "Hello",
          isAI: false,
          timestamp: new Date(),
        },
      ],
    });

    // Simuler une URL avec conversationId
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        search: "?conversationId=test-conv",
        pathname: "/",
      },
      writable: true,
    });

    renderGeminiChat({ resumeLastConversation: true });

    await waitFor(() => {
      expect(mockConversationService).toHaveBeenCalled();
    });

    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it("gère les erreurs réseau", async () => {
    const mockSendMessage = vi.fn().mockRejectedValue(new Error("Network Error"));

    mockUseMessageSender.mockReturnValue({
      sendMessage: mockSendMessage,
    });

    const mockToast = vi.fn();
    mockUseToast.mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    });

    renderGeminiChat();

    const input = screen.getByTestId("message-input") as HTMLTextAreaElement;
    const sendButton = screen.getByTestId("send-message-button");

    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Erreur réseau",
        description: "Vérifiez votre connexion internet",
        variant: "destructive",
      });
    });
  });

  it("affiche les messages d'erreur utilisateur-friendly", async () => {
    const mockSendMessage = vi.fn().mockRejectedValue(new Error("Unknown error"));

    mockUseMessageSender.mockReturnValue({
      sendMessage: mockSendMessage,
    });

    const mockToast = vi.fn();
    mockUseToast.mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    });

    renderGeminiChat();

    const input = screen.getByTestId("message-input") as HTMLTextAreaElement;
    const sendButton = screen.getByTestId("send-message-button");

    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi du message.",
        variant: "destructive",
      });
    });
  });

  it("respecte les limites de quota de messages IA", () => {
    renderGeminiChat();

    // Le composant devrait gérer les quotas via les hooks
    expect(screen.getByTestId("message-input")).toBeInTheDocument();
  });
});
