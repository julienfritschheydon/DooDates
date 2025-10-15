/**
 * Tests for ConversationHistory Component
 * DooDates - Conversation History System
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ConversationHistory } from '../ConversationHistory';
import { useConversations } from '../../../hooks/useConversations';
import { useConversationSearch } from '../../../hooks/useConversationSearch';
import type { Conversation, ConversationStatus } from '../../../types/conversation';

// Mock the hooks
vi.mock('../../../hooks/useConversations');
vi.mock('../../../hooks/useConversationSearch');

// Mock the child components
vi.mock('../ConversationList', () => ({
  ConversationList: ({ onPreviewConversation, onCreateConversation }: any) => (
    <div data-testid="conversation-list">
      <button onClick={() => onPreviewConversation?.({ id: 'conv-1', title: 'Test Conversation' })}>
        Preview Conversation
      </button>
      <button onClick={() => onCreateConversation?.()}>
        Create Conversation
      </button>
    </div>
  ),
}));

jest.mock('../ConversationSearch', () => ({
  ConversationSearch: ({ onQueryChange, onFiltersChange }: any) => (
    <div data-testid="conversation-search">
      <input
        placeholder="Search conversations"
        onChange={(e) => onQueryChange?.(e.target.value)}
      />
      <button onClick={() => onFiltersChange?.({ status: 'active' })}>
        Apply Filter
      </button>
    </div>
  ),
}));

jest.mock('../ConversationPreview', () => ({
  ConversationPreview: ({ isOpen, onClose, onResume, onViewPoll }: any) => (
    isOpen ? (
      <div data-testid="conversation-preview">
        <button onClick={() => onClose?.()}>Close Preview</button>
        <button onClick={() => onResume?.('conv-1')}>Resume</button>
        <button onClick={() => onViewPoll?.('poll-1')}>View Poll</button>
      </div>
    ) : null
  ),
}));

const mockUseConversations = vi.mocked(useConversations);
const mockUseConversationSearch = vi.mocked(useConversationSearch);

describe('ConversationHistory', () => {
  const mockConversations: Conversation[] = [
    {
      id: 'conv-1',
      title: 'Meeting Planning',
      status: 'active',
      isFavorite: false,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:30:00Z'),
      firstMessage: 'Hello, I need help organizing a meeting.',
      messageCount: 3,
      tags: [],
    },
    {
      id: 'conv-2',
      title: 'Project Discussion',
      status: 'completed',
      isFavorite: true,
      createdAt: new Date('2024-01-02T10:00:00Z'),
      updatedAt: new Date('2024-01-02T11:00:00Z'),
      firstMessage: 'Let\'s discuss the project timeline.',
      messageCount: 5,
      tags: ['project'],
    },
  ];

  const mockCallbacks = {
    onResumeConversation: jest.fn(),
    onViewPoll: jest.fn(),
    onCreateConversation: jest.fn(),
  };

  const mockSearchHook = {
    query: '',
    setQuery: jest.fn(),
    filters: {},
    setFilters: jest.fn(),
    searchResults: [],
    isSearching: false,
    clearSearch: jest.fn(),
    clearFilters: jest.fn(),
    hasActiveFilters: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseConversations.mockReturnValue({
      data: mockConversations,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
    } as any);

    mockUseConversationSearch.mockReturnValue(mockSearchHook as any);
  });

  describe('Basic Rendering', () => {
    it('renders the component with title and subtitle', () => {
      render(<ConversationHistory {...mockCallbacks} />);

      expect(screen.getByText('Historique des conversations')).toBeInTheDocument();
      expect(screen.getByText('GÃ©rez et consultez vos conversations passÃ©es')).toBeInTheDocument();
    });

    it('renders in compact mode without subtitle', () => {
      render(<ConversationHistory {...mockCallbacks} compact />);

      expect(screen.getByText('Historique des conversations')).toBeInTheDocument();
      expect(screen.queryByText('GÃ©rez et consultez vos conversations passÃ©es')).not.toBeInTheDocument();
    });

    it('renders child components', () => {
      render(<ConversationHistory {...mockCallbacks} />);

      expect(screen.getByTestId('conversation-search')).toBeInTheDocument();
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ConversationHistory {...mockCallbacks} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Loading State', () => {
    it('shows loading state', () => {
      mockUseConversations.mockReturnValue({
        data: [],
        isLoading: true,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any);

      render(<ConversationHistory {...mockCallbacks} />);

      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
    });

    it('hides refresh button during loading', () => {
      mockUseConversations.mockReturnValue({
        data: [],
        isLoading: true,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any);

      render(<ConversationHistory {...mockCallbacks} />);

      expect(screen.queryByText('RÃ©essayer')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message and retry button', () => {
      const mockOnDelete = vi.fn();
      mockUseConversations.mockReturnValue({
        data: [],
        isLoading: false,
        isError: true,
        error: new Error('Network error'),
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      render(<ConversationHistory {...mockCallbacks} />);

      expect(screen.getByText('Erreur de connexion. VÃ©rifiez votre connexion internet.')).toBeInTheDocument();
      expect(screen.getByText('RÃ©essayer')).toBeInTheDocument();
    });

    it('calls refetch when retry button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnDelete = vi.fn();
      mockUseConversations.mockReturnValue({
        data: [],
        isLoading: false,
        isError: true,
        error: new Error('Server error'),
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      render(<ConversationHistory {...mockCallbacks} />);

      const retryButton = screen.getByText('RÃ©essayer');
      await user.click(retryButton);

      expect(mockUseConversations.mock.results[0].value.refetch).toHaveBeenCalled();
    });

    it('shows different error messages based on error type', () => {
      mockUseConversations.mockReturnValue({
        data: [],
        isLoading: false,
        isError: true,
        error: new Error('500 Internal Server Error'),
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      render(<ConversationHistory {...mockCallbacks} />);

      expect(screen.getByText('Erreur serveur. Veuillez rÃ©essayer plus tard.')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no conversations and no filters', () => {
      mockUseConversations.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      render(<ConversationHistory {...mockCallbacks} />);

      expect(screen.getByText('Aucune conversation trouvÃ©e')).toBeInTheDocument();
      expect(screen.getByText('CrÃ©er votre premiÃ¨re conversation')).toBeInTheDocument();
    });

    it('calls onCreateConversation when create button is clicked', async () => {
      const user = userEvent.setup();
      mockUseConversations.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      render(<ConversationHistory {...mockCallbacks} />);

      const createButton = screen.getByText('CrÃ©er votre premiÃ¨re conversation');
      await user.click(createButton);

      expect(mockCallbacks.onCreateConversation).toHaveBeenCalled();
    });

    it('does not show empty state when filters are active', () => {
      mockUseConversations.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any);

      mockUseConversationSearch.mockReturnValue({
        ...mockSearchHook,
        hasActiveFilters: true,
      } as any);

      render(<ConversationHistory {...mockCallbacks} />);

      expect(screen.queryByText('Aucune conversation trouvÃ©e')).not.toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('shows refresh button when not loading', () => {
      render(<ConversationHistory {...mockCallbacks} />);

      expect(screen.getByText('RÃ©essayer')).toBeInTheDocument();
    });

    it('shows refreshing state when refetching', () => {
      mockUseConversations.mockReturnValue({
        data: mockConversations,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: true,
      } as any);

      render(<ConversationHistory {...mockCallbacks} />);

      expect(screen.getByText('Actualisation...')).toBeInTheDocument();
    });

    it('calls refetch when refresh button is clicked', async () => {
      const user = userEvent.setup();
      const mockRefetch = vi.fn();
      mockUseConversations.mockReturnValue({
        data: mockConversations,
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetch,
        isRefetching: false,
      } as any);

      render(<ConversationHistory {...mockCallbacks} />);

      const refreshButton = screen.getByText('RÃ©essayer');
      await user.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Search Integration', () => {
    it('passes search props to ConversationSearch component', () => {
      render(<ConversationHistory {...mockCallbacks} />);

      const searchInput = screen.getByPlaceholderText('Search conversations');
      expect(searchInput).toBeInTheDocument();
    });

    it('updates query when search input changes', async () => {
      const user = userEvent.setup();
      render(<ConversationHistory {...mockCallbacks} />);

      const searchInput = screen.getByPlaceholderText('Search conversations');
      await user.type(searchInput, 'test query');

      expect(mockSearchHook.setQuery).toHaveBeenCalledWith('test query');
    });

    it('updates filters when filter is applied', async () => {
      const user = userEvent.setup();
      render(<ConversationHistory {...mockCallbacks} />);

      const filterButton = screen.getByText('Apply Filter');
      await user.click(filterButton);

      expect(mockSearchHook.setFilters).toHaveBeenCalledWith({ status: 'active' });
    });
  });

  describe('Preview Modal', () => {
    it('opens preview when conversation is selected', async () => {
      const user = userEvent.setup();
      render(<ConversationHistory {...mockCallbacks} />);

      const previewButton = screen.getByText('Preview Conversation');
      await user.click(previewButton);

      expect(screen.getByTestId('conversation-preview')).toBeInTheDocument();
    });

    it('closes preview when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConversationHistory {...mockCallbacks} />);

      // Open preview
      const previewButton = screen.getByText('Preview Conversation');
      await user.click(previewButton);

      // Close preview
      const closeButton = screen.getByText('Close Preview');
      await user.click(closeButton);

      expect(screen.queryByTestId('conversation-preview')).not.toBeInTheDocument();
    });

    it('handles resume from preview', async () => {
      const user = userEvent.setup();
      render(<ConversationHistory {...mockCallbacks} />);

      // Open preview
      const previewButton = screen.getByText('Preview Conversation');
      await user.click(previewButton);

      // Resume conversation
      const resumeButton = screen.getByText('Resume');
      await user.click(resumeButton);

      expect(mockCallbacks.onResumeConversation).toHaveBeenCalledWith('conv-1');
      expect(screen.queryByTestId('conversation-preview')).not.toBeInTheDocument();
    });

    it('handles view poll from preview', async () => {
      const user = userEvent.setup();
      render(<ConversationHistory {...mockCallbacks} />);

      // Open preview
      const previewButton = screen.getByText('Preview Conversation');
      await user.click(previewButton);

      // View poll
      const viewPollButton = screen.getByText('View Poll');
      await user.click(viewPollButton);

      expect(mockCallbacks.onViewPoll).toHaveBeenCalledWith('poll-1');
    });
  });

  describe('Language Support', () => {
    it('renders English text when language is set to en', () => {
      render(<ConversationHistory {...mockCallbacks} language="en" />);

      expect(screen.getByText('Conversation History')).toBeInTheDocument();
      expect(screen.getByText('Manage and view your past conversations')).toBeInTheDocument();
    });

    it('shows English error messages', () => {
      mockUseConversations.mockReturnValue({
        data: [],
        isLoading: false,
        isError: true,
        error: new Error('Network error'),
        refetch: jest.fn(),
        isRefetching: false,
      } as any);

      render(<ConversationHistory {...mockCallbacks} language="en" />);

      expect(screen.getByText('Connection error. Please check your internet connection.')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('shows English empty state', () => {
      mockUseConversations.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
      } as any);

      render(<ConversationHistory {...mockCallbacks} language="en" />);

      expect(screen.getByText('No conversations found')).toBeInTheDocument();
      expect(screen.getByText('Create your first conversation')).toBeInTheDocument();
    });
  });

  describe('Initial Filters', () => {
    it('passes initial filters to search hook', () => {
      const initialFilters = { status: ['active' as ConversationStatus] };
      render(<ConversationHistory {...mockCallbacks} initialFilters={initialFilters} />);

      expect(mockUseConversationSearch).toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    it('passes sort parameters to useConversations hook', () => {
      render(<ConversationHistory {...mockCallbacks} />);

      expect(mockUseConversations).toHaveBeenCalledWith({
        filters: {},
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        enabled: true,
      });
    });
  });

  describe('Data Flow', () => {
    it('displays search results when query is present', () => {
      const searchResults = [mockConversations[0]];
      mockUseConversationSearch.mockReturnValue({
        ...mockSearchHook,
        query: 'test',
        searchResults,
      } as any);

      render(<ConversationHistory {...mockCallbacks} />);

      // The component should pass searchResults to ConversationList when query exists
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
    });

    it('displays all conversations when no query', () => {
      mockUseConversationSearch.mockReturnValue({
        ...mockSearchHook,
        query: '',
        searchResults: [],
      } as any);

      render(<ConversationHistory {...mockCallbacks} />);

      // The component should pass all conversations to ConversationList when no query
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<ConversationHistory {...mockCallbacks} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Historique des conversations');
    });

    it('has accessible buttons', () => {
      render(<ConversationHistory {...mockCallbacks} />);

      const refreshButton = screen.getByRole('button', { name: /rÃ©essayer/i });
      expect(refreshButton).toBeInTheDocument();
    });
  });
});
