/// <reference types="@testing-library/jest-dom" />
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { GeminiChatHandle } from "../GeminiChatInterface";
import GeminiChatInterface from "../GeminiChatInterface";

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
    incrementMessageCount: vi.fn(),
    incrementPollCount: vi.fn(),
    quota: {
      conversationsCreated: 0,
      pollsCreated: 0,
      aiMessages: 0,
      analyticsQueries: 0,
      simulations: 0,
      totalCreditsConsumed: 0,
      userId: "guest",
    },
  }),
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

vi.mock("../hooks/usePollManagement", () => ({
  usePollManagement: () => ({
    showPollCreator: false,
    selectedPollData: null,
    openPollCreator: vi.fn(),
    closePollCreator: vi.fn(),
    getFormDraft: vi.fn(),
  }),
}));

vi.mock("../hooks/useMessageSender", () => ({
  useMessageSender: () => ({
    sendMessage: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
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

describe("GeminiChatInterface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
