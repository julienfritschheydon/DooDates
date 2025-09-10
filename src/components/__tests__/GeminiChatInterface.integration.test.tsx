/**
 * Integration tests for GeminiChatInterface with freemium workflow
 * DooDates - Freemium Workflow Integration Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GeminiChatInterface from '../GeminiChatInterface';

// Mock all dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useConversations');
jest.mock('../../hooks/useAutoSave');
jest.mock('../../hooks/useConversationResume');
jest.mock('../../hooks/useFreemiumQuota');
jest.mock('../../hooks/usePollConversationLink');

// Mock components
jest.mock('../../components/modals/AuthIncentiveModal', () => ({
  AuthIncentiveModal: ({ isOpen, onClose, trigger }: any) => 
    isOpen ? (
      <div data-testid="auth-incentive-modal">
        <div>Modal: {trigger}</div>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
}));

jest.mock('../../components/ui/QuotaIndicator', () => ({
  QuotaIndicator: ({ usage, limits }: any) => (
    <div data-testid="quota-indicator">
      {usage.conversations}/{limits.conversations} conversations
    </div>
  )
}));

jest.mock('../../components/PollCreator', () => ({
  PollCreator: ({ onClose }: any) => (
    <div data-testid="poll-creator">
      <button onClick={onClose}>Close Poll Creator</button>
    </div>
  )
}));

// Import mocked hooks
import { useAuth } from '../../contexts/AuthContext';
import { useConversations } from '../../hooks/useConversations';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useConversationResume } from '../../hooks/useConversationResume';
import { useFreemiumQuota } from '../../hooks/useFreemiumQuota';
import { usePollConversationLink } from '../../hooks/usePollConversationLink';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseConversations = useConversations as jest.MockedFunction<typeof useConversations>;
const mockUseAutoSave = useAutoSave as jest.MockedFunction<typeof useAutoSave>;
const mockUseConversationResume = useConversationResume as jest.MockedFunction<typeof useConversationResume>;
const mockUseFreemiumQuota = useFreemiumQuota as jest.MockedFunction<typeof useFreemiumQuota>;
const mockUsePollConversationLink = usePollConversationLink as jest.MockedFunction<typeof usePollConversationLink>;

describe('GeminiChatInterface - Freemium Workflow Integration', () => {
  let queryClient: QueryClient;

  const defaultMocks = {
    useAuth: {
      user: null,
      isAuthenticated: false,
    },
    useConversations: {
      conversations: { conversations: [] },
      createConversation: { mutateAsync: jest.fn() },
    },
    useAutoSave: {
      currentConversation: null,
      saveMessage: jest.fn(),
      createNewConversation: jest.fn(),
    },
    useConversationResume: {
      resumedConversation: null,
      isResuming: false,
    },
    useFreemiumQuota: {
      usage: { conversations: 0, polls: 0, storageKB: 0 },
      limits: { conversations: 3, polls: 5, storageKB: 100 },
      canCreateConversation: true,
      canCreatePoll: true,
      showConversationWarning: false,
      showPollWarning: false,
      triggerAuthIncentive: jest.fn(),
    },
    usePollConversationLink: {
      linkPollToConversation: jest.fn(),
      getPollLinkMetadata: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Setup default mocks
    mockUseAuth.mockReturnValue(defaultMocks.useAuth as any);
    mockUseConversations.mockReturnValue(defaultMocks.useConversations as any);
    mockUseAutoSave.mockReturnValue(defaultMocks.useAutoSave as any);
    mockUseConversationResume.mockReturnValue(defaultMocks.useConversationResume as any);
    mockUseFreemiumQuota.mockReturnValue(defaultMocks.useFreemiumQuota as any);
    mockUsePollConversationLink.mockReturnValue(defaultMocks.usePollConversationLink as any);
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <GeminiChatInterface />
      </QueryClientProvider>
    );
  };

  describe('guest user workflow', () => {
    it('should show quota indicator for guest users', () => {
      renderComponent();
      
      expect(screen.getByTestId('quota-indicator')).toBeInTheDocument();
      expect(screen.getByText('0/3 conversations')).toBeInTheDocument();
    });

    it('should allow conversation creation within quota', async () => {
      const mockCreateConversation = jest.fn().mockResolvedValue({ id: 'conv-1' });
      mockUseAutoSave.mockReturnValue({
        ...defaultMocks.useAutoSave,
        createNewConversation: mockCreateConversation,
      } as any);

      renderComponent();
      
      const input = screen.getByPlaceholderText(/ask me anything/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(mockCreateConversation).toHaveBeenCalled();
      });
    });

    it('should block conversation creation when quota exceeded', async () => {
      const mockTriggerAuthIncentive = jest.fn();
      mockUseFreemiumQuota.mockReturnValue({
        ...defaultMocks.useFreemiumQuota,
        canCreateConversation: false,
        usage: { conversations: 3, polls: 0, storageKB: 0 },
        triggerAuthIncentive: mockTriggerAuthIncentive,
      } as any);

      renderComponent();
      
      const input = screen.getByPlaceholderText(/ask me anything/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(mockTriggerAuthIncentive).toHaveBeenCalledWith(
          'conversation_limit',
          expect.any(Function)
        );
      });
    });

    it('should show auth incentive modal when quota exceeded', async () => {
      const mockTriggerAuthIncentive = jest.fn((trigger, callback) => {
        callback({
          trigger,
          currentUsage: { conversations: 3, polls: 0, storageKB: 0 },
          limits: { conversations: 3, polls: 5, storageKB: 100 },
        });
      });

      mockUseFreemiumQuota.mockReturnValue({
        ...defaultMocks.useFreemiumQuota,
        canCreateConversation: false,
        triggerAuthIncentive: mockTriggerAuthIncentive,
      } as any);

      renderComponent();
      
      const input = screen.getByPlaceholderText(/ask me anything/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-incentive-modal')).toBeInTheDocument();
        expect(screen.getByText('Modal: conversation_limit')).toBeInTheDocument();
      });
    });

    it('should block poll creation when quota exceeded', async () => {
      const mockTriggerAuthIncentive = jest.fn();
      mockUseFreemiumQuota.mockReturnValue({
        ...defaultMocks.useFreemiumQuota,
        canCreatePoll: false,
        usage: { conversations: 0, polls: 5, storageKB: 0 },
        triggerAuthIncentive: mockTriggerAuthIncentive,
      } as any);

      renderComponent();
      
      // Simulate AI suggesting a poll
      const createPollButton = screen.getByText(/create poll/i);
      fireEvent.click(createPollButton);
      
      await waitFor(() => {
        expect(mockTriggerAuthIncentive).toHaveBeenCalledWith(
          'poll_limit',
          expect.any(Function)
        );
      });
    });
  });

  describe('authenticated user workflow', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com' },
        isAuthenticated: true,
      } as any);

      mockUseFreemiumQuota.mockReturnValue({
        ...defaultMocks.useFreemiumQuota,
        limits: { conversations: 50, polls: 100, storageKB: 10000 },
        canCreateConversation: true,
        canCreatePoll: true,
      } as any);
    });

    it('should not show quota warnings for authenticated users', () => {
      renderComponent();
      
      // Should still show quota indicator but with higher limits
      expect(screen.getByTestId('quota-indicator')).toBeInTheDocument();
      expect(screen.queryByTestId('auth-incentive-modal')).not.toBeInTheDocument();
    });

    it('should allow unlimited conversation creation', async () => {
      const mockCreateConversation = jest.fn().mockResolvedValue({ id: 'conv-1' });
      mockUseAutoSave.mockReturnValue({
        ...defaultMocks.useAutoSave,
        createNewConversation: mockCreateConversation,
      } as any);

      renderComponent();
      
      const input = screen.getByPlaceholderText(/ask me anything/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(mockCreateConversation).toHaveBeenCalled();
      });
    });

    it('should allow poll creation without quota restrictions', async () => {
      renderComponent();
      
      const createPollButton = screen.getByText(/create poll/i);
      fireEvent.click(createPollButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('poll-creator')).toBeInTheDocument();
      });
    });
  });

  describe('conversation resumption with freemium', () => {
    it('should resume conversation and show correct quota usage', () => {
      mockUseConversationResume.mockReturnValue({
        resumedConversation: {
          id: 'conv-1',
          title: 'Resumed Conversation',
          messages: [{ id: 'msg-1', content: 'Previous message', role: 'user' }],
        },
        isResuming: false,
      } as any);

      mockUseFreemiumQuota.mockReturnValue({
        ...defaultMocks.useFreemiumQuota,
        usage: { conversations: 1, polls: 0, storageKB: 25 },
      } as any);

      renderComponent();
      
      expect(screen.getByText('1/3 conversations')).toBeInTheDocument();
      expect(screen.getByText('Previous message')).toBeInTheDocument();
    });
  });

  describe('new chat functionality with freemium', () => {
    it('should allow new chat creation within quota', async () => {
      const mockCreateNewConversation = jest.fn();
      mockUseAutoSave.mockReturnValue({
        ...defaultMocks.useAutoSave,
        currentConversation: { id: 'conv-1' },
        createNewConversation: mockCreateNewConversation,
      } as any);

      renderComponent();
      
      const newChatButton = screen.getByText(/new chat/i);
      fireEvent.click(newChatButton);
      
      await waitFor(() => {
        expect(mockCreateNewConversation).toHaveBeenCalled();
      });
    });

    it('should block new chat creation when quota exceeded', async () => {
      const mockTriggerAuthIncentive = jest.fn();
      mockUseFreemiumQuota.mockReturnValue({
        ...defaultMocks.useFreemiumQuota,
        canCreateConversation: false,
        triggerAuthIncentive: mockTriggerAuthIncentive,
      } as any);

      renderComponent();
      
      const newChatButton = screen.getByText(/new chat/i);
      fireEvent.click(newChatButton);
      
      await waitFor(() => {
        expect(mockTriggerAuthIncentive).toHaveBeenCalledWith(
          'conversation_limit',
          expect.any(Function)
        );
      });
    });
  });

  describe('poll creation integration', () => {
    it('should link polls to conversations with metadata', async () => {
      const mockLinkPoll = jest.fn();
      const mockGetMetadata = jest.fn().mockReturnValue({
        conversationId: 'conv-1',
        messageId: 'msg-1',
      });

      mockUsePollConversationLink.mockReturnValue({
        ...defaultMocks.usePollConversationLink,
        linkPollToConversation: mockLinkPoll,
        getPollLinkMetadata: mockGetMetadata,
      } as any);

      mockUseAutoSave.mockReturnValue({
        ...defaultMocks.useAutoSave,
        currentConversation: { id: 'conv-1' },
      } as any);

      renderComponent();
      
      const createPollButton = screen.getByText(/create poll/i);
      fireEvent.click(createPollButton);
      
      expect(screen.getByTestId('poll-creator')).toBeInTheDocument();
      expect(mockGetMetadata).toHaveBeenCalledWith('conv-1', expect.any(String), expect.any(String));
    });
  });

  describe('modal interactions', () => {
    it('should close auth incentive modal', async () => {
      const mockTriggerAuthIncentive = jest.fn((trigger, callback) => {
        callback({
          trigger,
          currentUsage: { conversations: 3, polls: 0, storageKB: 0 },
          limits: { conversations: 3, polls: 5, storageKB: 100 },
        });
      });

      mockUseFreemiumQuota.mockReturnValue({
        ...defaultMocks.useFreemiumQuota,
        canCreateConversation: false,
        triggerAuthIncentive: mockTriggerAuthIncentive,
      } as any);

      renderComponent();
      
      // Trigger modal
      const input = screen.getByPlaceholderText(/ask me anything/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-incentive-modal')).toBeInTheDocument();
      });
      
      // Close modal
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('auth-incentive-modal')).not.toBeInTheDocument();
      });
    });
  });
});
