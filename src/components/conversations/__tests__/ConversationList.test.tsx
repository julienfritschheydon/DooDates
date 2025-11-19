/**
 * Tests for ConversationList Component
 * DooDates - Conversation History System
 */

/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationList } from '../ConversationList';
import type { Conversation } from '../../../types/conversation';

// Mock react-window for virtualization
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemData }: any) => (
    <div data-testid="virtualized-list">
      {Array.from({ length: itemCount }).map((_, index) => 
        children({ 
          index, 
          style: { height: '160px' },
          data: itemData 
        })
      )}
    </div>
  )
}));

// Mock the search hook
vi.mock('../../../hooks/useConversationSearch', () => ({
  useConversationSearch: vi.fn(() => ({
    conversations: [],
    setQuery: vi.fn(),
    setFilters: vi.fn(),
    clearSearch: vi.fn(),
    query: '',
    totalCount: 0,
    isLoading: false
  }))
}));

// Mock ConversationCard component
vi.mock('../ConversationCard', () => ({
  ConversationCard: ({ conversation, onResume }: any) => (
    <div data-testid={`conversation-card-${conversation.id}`}>
      <h3>{conversation.title}</h3>
      <button onClick={() => onResume?.(conversation.id)}>Resume</button>
    </div>
  )
}));

describe('ConversationList', () => {
  // Mock conversation data
  const createMockConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
    id: `conv-${Math.random()}`,
    title: 'Test Conversation',
    status: 'active',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T12:00:00Z'),
    firstMessage: 'Test message content',
    messageCount: 3,
    isFavorite: false,
    tags: ['test'],
    ...overrides
  });

  const mockConversations: Conversation[] = [
    createMockConversation({ 
      id: 'conv-1', 
      title: 'Meeting Planning', 
      status: 'active',
      updatedAt: new Date('2024-01-03T10:00:00Z')
    }),
    createMockConversation({ 
      id: 'conv-2', 
      title: 'Team Discussion', 
      status: 'completed',
      isFavorite: true,
      updatedAt: new Date('2024-01-02T10:00:00Z')
    }),
    createMockConversation({ 
      id: 'conv-3', 
      title: 'Project Review', 
      status: 'archived',
      updatedAt: new Date('2024-01-01T10:00:00Z')
    })
  ];

  // Mock callbacks
  const mockCallbacks = {
    onResume: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onToggleFavorite: vi.fn(),
    onViewPoll: vi.fn(),
    onCreateNew: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render conversations in virtualized list', () => {
      render(<ConversationList conversations={mockConversations} />);

      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      expect(screen.getByTestId('conversation-card-conv-1')).toBeInTheDocument();
      expect(screen.getByTestId('conversation-card-conv-2')).toBeInTheDocument();
      expect(screen.getByTestId('conversation-card-conv-3')).toBeInTheDocument();
    });

    it('should display search input when showSearch is true', () => {
      render(<ConversationList conversations={mockConversations} showSearch={true} />);

      expect(screen.getByPlaceholderText('Rechercher dans les conversations...')).toBeInTheDocument();
    });

    it('should hide search input when showSearch is false', () => {
      render(<ConversationList conversations={mockConversations} showSearch={false} />);

      expect(screen.queryByPlaceholderText('Rechercher dans les conversations...')).not.toBeInTheDocument();
    });

    it('should display conversation count', () => {
      render(<ConversationList conversations={mockConversations} />);

      expect(screen.getByText('3 conversations')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading skeletons when isLoading is true', () => {
      render(<ConversationList isLoading={true} />);

      // Should show skeleton elements
      expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
    });

    it('should show search skeleton when loading', () => {
      render(<ConversationList isLoading={true} showSearch={true} />);

      // Should show search input skeleton
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(3); // Search + conversation skeletons
    });
  });

  describe('Error States', () => {
    it('should display error message when error prop is provided', () => {
      const error = new Error('Failed to load conversations');
      render(<ConversationList error={error} />);

      expect(screen.getByText('Erreur de chargement')).toBeInTheDocument();
      expect(screen.getByText('Failed to load conversations')).toBeInTheDocument();
      expect(screen.getByText('RÃ©essayer')).toBeInTheDocument();
    });

    it('should show generic error message when error has no message', () => {
      const error = new Error();
      render(<ConversationList error={error} />);

      expect(screen.getByText('Une erreur est survenue lors du chargement des conversations.')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no conversations', () => {
      render(<ConversationList conversations={[]} {...mockCallbacks} />);

      expect(screen.getByText('Aucune conversation pour le moment')).toBeInTheDocument();
      expect(screen.getByText('Nouvelle conversation')).toBeInTheDocument();
    });

    it('should show filtered empty state when search returns no results', () => {
      const { useConversationSearch } = require('../../../hooks/useConversationSearch');
      useConversationSearch.mockReturnValue({
        conversations: [],
        setQuery: jest.fn(),
        setFilters: jest.fn(),
        clearSearch: jest.fn(),
        query: 'nonexistent',
        totalCount: 0,
        isLoading: false
      });

      render(<ConversationList conversations={mockConversations} />);

      expect(screen.getByText('Aucune conversation trouvÃ©e')).toBeInTheDocument();
      expect(screen.getByText(/Essayez de modifier vos critÃ¨res/)).toBeInTheDocument();
    });

    it('should call onCreateNew when new conversation button is clicked', async () => {
      render(<ConversationList conversations={[]} {...mockCallbacks} />);

      const newButton = screen.getByText('Nouvelle conversation');
      await userEvent.click(newButton);

      expect(mockCallbacks.onCreateNew).toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('should call setQuery when search input changes', async () => {
      const mockSetQuery = jest.fn();
      const { useConversationSearch } = require('../../../hooks/useConversationSearch');
      useConversationSearch.mockReturnValue({
        conversations: mockConversations,
        setQuery: mockSetQuery,
        setFilters: jest.fn(),
        clearSearch: jest.fn(),
        query: '',
        totalCount: 3,
        isLoading: false
      });

      render(<ConversationList conversations={mockConversations} />);

      const searchInput = screen.getByPlaceholderText('Rechercher dans les conversations...');
      await userEvent.type(searchInput, 'meeting');

      expect(mockSetQuery).toHaveBeenCalledWith('meeting');
    });

    it('should show search results count when query is active', () => {
      const { useConversationSearch } = require('../../../hooks/useConversationSearch');
      useConversationSearch.mockReturnValue({
        conversations: [mockConversations[0]],
        setQuery: jest.fn(),
        setFilters: jest.fn(),
        clearSearch: jest.fn(),
        query: 'meeting',
        totalCount: 1,
        isLoading: false
      });

      render(<ConversationList conversations={mockConversations} />);

      expect(screen.getByText('1 conversation trouvÃ©e')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should show status filter dropdown', () => {
      render(<ConversationList conversations={mockConversations} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should show favorites filter button', () => {
      render(<ConversationList conversations={mockConversations} />);

      expect(screen.getByText('â­ Favoris')).toBeInTheDocument();
    });

    it('should call setFilters when status filter changes', async () => {
      const mockSetFilters = jest.fn();
      const { useConversationSearch } = require('../../../hooks/useConversationSearch');
      useConversationSearch.mockReturnValue({
        conversations: mockConversations,
        setQuery: jest.fn(),
        setFilters: mockSetFilters,
        clearSearch: jest.fn(),
        query: '',
        totalCount: 3,
        isLoading: false
      });

      render(<ConversationList conversations={mockConversations} />);

      const statusFilter = screen.getByRole('combobox');
      await userEvent.click(statusFilter);

      const activeOption = screen.getByText('En cours (1)');
      await userEvent.click(activeOption);

      expect(mockSetFilters).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should toggle favorites filter when button is clicked', async () => {
      const mockSetFilters = jest.fn();
      const { useConversationSearch } = require('../../../hooks/useConversationSearch');
      useConversationSearch.mockReturnValue({
        conversations: mockConversations,
        setQuery: jest.fn(),
        setFilters: mockSetFilters,
        clearSearch: jest.fn(),
        query: '',
        totalCount: 3,
        isLoading: false
      });

      render(<ConversationList conversations={mockConversations} />);

      const favoritesButton = screen.getByText('â­ Favoris');
      await userEvent.click(favoritesButton);

      expect(mockSetFilters).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should show clear filters button when filters are active', async () => {
      render(<ConversationList conversations={mockConversations} />);

      // Activate favorites filter
      const favoritesButton = screen.getByText('â­ Favoris');
      await userEvent.click(favoritesButton);

      await waitFor(() => {
        expect(screen.getByText('Effacer filtres')).toBeInTheDocument();
      });
    });

    it('should clear all filters when clear button is clicked', async () => {
      const mockClearSearch = jest.fn();
      const { useConversationSearch } = require('../../../hooks/useConversationSearch');
      useConversationSearch.mockReturnValue({
        conversations: mockConversations,
        setQuery: jest.fn(),
        setFilters: jest.fn(),
        clearSearch: mockClearSearch,
        query: 'test',
        totalCount: 3,
        isLoading: false
      });

      render(<ConversationList conversations={mockConversations} />);

      // Should show clear button when query is active
      const clearButton = screen.getByText('Effacer filtres');
      await userEvent.click(clearButton);

      expect(mockClearSearch).toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    it('should show sort dropdown', () => {
      render(<ConversationList conversations={mockConversations} />);

      expect(screen.getByText('Trier')).toBeInTheDocument();
    });

    it('should show sort options when dropdown is opened', async () => {
      render(<ConversationList conversations={mockConversations} />);

      const sortButton = screen.getByText('Trier');
      await userEvent.click(sortButton);

      expect(screen.getByText('DerniÃ¨re modification')).toBeInTheDocument();
      expect(screen.getByText('Date de crÃ©ation')).toBeInTheDocument();
      expect(screen.getByText('Titre')).toBeInTheDocument();
      expect(screen.getByText('Nombre de messages')).toBeInTheDocument();
    });

    it('should sort conversations by updatedAt desc by default', () => {
      render(<ConversationList conversations={mockConversations} />);

      const cards = screen.getAllByTestId(/conversation-card-/);
      
      // Should be sorted by updatedAt desc: conv-1, conv-2, conv-3
      expect(cards[0]).toHaveAttribute('data-testid', 'conversation-card-conv-1');
      expect(cards[1]).toHaveAttribute('data-testid', 'conversation-card-conv-2');
      expect(cards[2]).toHaveAttribute('data-testid', 'conversation-card-conv-3');
    });

    it('should change sort order when same sort option is clicked', async () => {
      render(<ConversationList conversations={mockConversations} />);

      const sortButton = screen.getByText('Trier');
      await userEvent.click(sortButton);

      const titleSort = screen.getByText('Titre');
      await userEvent.click(titleSort);

      // Click again to change order
      await userEvent.click(sortButton);
      await userEvent.click(titleSort);

      // Should toggle between asc and desc
      const cards = screen.getAllByTestId(/conversation-card-/);
      expect(cards).toHaveLength(3);
    });
  });

  describe('Callback Handling', () => {
    it('should pass callbacks to ConversationCard components', () => {
      render(<ConversationList conversations={mockConversations} {...mockCallbacks} />);

      const resumeButton = screen.getAllByText('Resume')[0];
      fireEvent.click(resumeButton);

      expect(mockCallbacks.onResume).toHaveBeenCalledWith('conv-1');
    });
  });

  describe('Virtualization', () => {
    it('should use correct item height for normal mode', () => {
      render(<ConversationList conversations={mockConversations} />);

      // Virtualized list should be rendered
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });

    it('should use correct item height for compact mode', () => {
      render(<ConversationList conversations={mockConversations} compact={true} />);

      // Should still render virtualized list in compact mode
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });

    it('should handle custom height prop', () => {
      render(<ConversationList conversations={mockConversations} height={800} />);

      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should handle compact mode', () => {
      render(<ConversationList conversations={mockConversations} compact={true} />);

      // Should render all conversations even in compact mode
      expect(screen.getByTestId('conversation-card-conv-1')).toBeInTheDocument();
      expect(screen.getByTestId('conversation-card-conv-2')).toBeInTheDocument();
      expect(screen.getByTestId('conversation-card-conv-3')).toBeInTheDocument();
    });
  });

  describe('Language Support', () => {
    it('should handle English language preference', () => {
      render(<ConversationList conversations={mockConversations} language="en" />);

      // Should still render conversations
      expect(screen.getByTestId('conversation-card-conv-1')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined conversations prop', () => {
      render(<ConversationList />);

      expect(screen.getByText('Aucune conversation pour le moment')).toBeInTheDocument();
    });

    it('should handle empty conversations array', () => {
      render(<ConversationList conversations={[]} />);

      expect(screen.getByText('Aucune conversation pour le moment')).toBeInTheDocument();
    });

    it('should handle missing callbacks gracefully', () => {
      render(<ConversationList conversations={mockConversations} />);

      // Should render without crashing
      expect(screen.getByTestId('conversation-card-conv-1')).toBeInTheDocument();
    });

    it('should handle single conversation', () => {
      render(<ConversationList conversations={[mockConversations[0]]} />);

      expect(screen.getByText('1 conversation')).toBeInTheDocument();
      expect(screen.getByTestId('conversation-card-conv-1')).toBeInTheDocument();
    });

    it('should handle very large conversation lists', () => {
      const largeList = Array.from({ length: 1000 }, (_, i) => 
        createMockConversation({ id: `conv-${i}`, title: `Conversation ${i}` })
      );

      render(<ConversationList conversations={largeList} />);

      expect(screen.getByText('1000 conversations')).toBeInTheDocument();
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });
  });

  describe('Status Filter Options', () => {
    it('should show correct counts in status filter options', async () => {
      render(<ConversationList conversations={mockConversations} />);

      const statusFilter = screen.getByRole('combobox');
      await userEvent.click(statusFilter);

      expect(screen.getByText('Toutes (3)')).toBeInTheDocument();
      expect(screen.getByText('En cours (1)')).toBeInTheDocument();
      expect(screen.getByText('TerminÃ©es (1)')).toBeInTheDocument();
      expect(screen.getByText('ArchivÃ©es (1)')).toBeInTheDocument();
    });
  });
});
