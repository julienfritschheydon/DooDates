/**
 * Tests for ConversationCard Component
 * DooDates - Conversation History System
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationCard } from '../ConversationCard';
import type { Conversation } from '../../../types/conversation';

// Mock date-fns to have consistent test results
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => 'il y a 2 heures'),
  fr: {},
  enUS: {}
}));

describe('ConversationCard', () => {
  // Mock conversation data
  const createMockConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
    id: 'conv-1',
    title: 'RÃ©union Ã©quipe dÃ©veloppement',
    status: 'active',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T12:00:00Z'),
    firstMessage: 'Bonjour, je voudrais organiser une rÃ©union avec l\'Ã©quipe de dÃ©veloppement pour discuter du nouveau projet.',
    messageCount: 5,
    isFavorite: false,
    tags: ['travail', 'rÃ©union'],
    ...overrides
  });

  // Mock callbacks
  const mockCallbacks = {
    onResume: jest.fn(),
    onRename: jest.fn(),
    onDelete: jest.fn(),
    onToggleFavorite: jest.fn(),
    onViewPoll: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render conversation title and preview', () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} />);

      expect(screen.getByText('RÃ©union Ã©quipe dÃ©veloppement')).toBeInTheDocument();
      expect(screen.getByText(/Bonjour, je voudrais organiser une rÃ©union/)).toBeInTheDocument();
    });

    it('should display message count and relative time', () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} />);

      expect(screen.getByText('5 messages')).toBeInTheDocument();
      expect(screen.getByText('il y a 2 heures')).toBeInTheDocument();
    });

    it('should show tags when present', () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} />);

      expect(screen.getByText('travail')).toBeInTheDocument();
      expect(screen.getByText('rÃ©union')).toBeInTheDocument();
    });

    it('should truncate long preview text', () => {
      const longMessage = 'A'.repeat(200);
      const conversation = createMockConversation({ firstMessage: longMessage });
      render(<ConversationCard conversation={conversation} />);

      const previewElement = screen.getByText(/A+\.\.\./);
      expect(previewElement.textContent).toHaveLength(104); // 100 chars + "..."
    });
  });

  describe('Status Indicators', () => {
    it('should show active status with yellow indicator', () => {
      const conversation = createMockConversation({ status: 'active' });
      render(<ConversationCard conversation={conversation} />);

      expect(screen.getByText('ðŸŸ¡')).toBeInTheDocument();
      expect(screen.getByText('En cours')).toBeInTheDocument();
    });

    it('should show completed status with green indicator when no poll', () => {
      const conversation = createMockConversation({ status: 'completed' });
      render(<ConversationCard conversation={conversation} />);

      expect(screen.getByText('ðŸŸ¢')).toBeInTheDocument();
      expect(screen.getByText('TerminÃ©e')).toBeInTheDocument();
    });

    it('should show poll link indicator when conversation has related poll', () => {
      const conversation = createMockConversation({ 
        status: 'completed',
        relatedPollId: 'poll-123'
      });
      render(<ConversationCard conversation={conversation} />);

      expect(screen.getByText('ðŸ”—')).toBeInTheDocument();
      expect(screen.getByText('Sondage crÃ©Ã©')).toBeInTheDocument();
      expect(screen.getByText('Voir sondage')).toBeInTheDocument();
    });

    it('should show archived status with folder indicator', () => {
      const conversation = createMockConversation({ status: 'archived' });
      render(<ConversationCard conversation={conversation} />);

      expect(screen.getByText('ðŸ“')).toBeInTheDocument();
      expect(screen.getByText('ArchivÃ©e')).toBeInTheDocument();
    });
  });

  describe('Favorite Status', () => {
    it('should show star icon when conversation is favorite', () => {
      const conversation = createMockConversation({ isFavorite: true });
      render(<ConversationCard conversation={conversation} />);

      const starIcon = screen.getByRole('generic', { hidden: true });
      expect(starIcon).toHaveClass('text-yellow-500', 'fill-current');
    });

    it('should not show star icon when conversation is not favorite', () => {
      const conversation = createMockConversation({ isFavorite: false });
      render(<ConversationCard conversation={conversation} />);

      expect(screen.queryByRole('generic', { hidden: true })).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onResume when title is clicked', async () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      const title = screen.getByText('RÃ©union Ã©quipe dÃ©veloppement');
      await userEvent.click(title);

      expect(mockCallbacks.onResume).toHaveBeenCalledWith('conv-1');
    });

    it('should call onResume when preview text is clicked', async () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      const preview = screen.getByText(/Bonjour, je voudrais organiser une rÃ©union/);
      await userEvent.click(preview);

      expect(mockCallbacks.onResume).toHaveBeenCalledWith('conv-1');
    });

    it('should call onViewPoll when poll link is clicked', async () => {
      const conversation = createMockConversation({ 
        relatedPollId: 'poll-123'
      });
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      const pollLink = screen.getByText('Voir sondage');
      await userEvent.click(pollLink);

      expect(mockCallbacks.onViewPoll).toHaveBeenCalledWith('poll-123');
    });
  });

  describe('Actions Menu', () => {
    it('should open actions menu when more button is clicked', async () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      // Hover to make menu visible
      const card = screen.getByRole('generic', { hidden: true });
      await userEvent.hover(card);

      const moreButton = screen.getByRole('button', { name: /actions/i });
      await userEvent.click(moreButton);

      expect(screen.getByText('Reprendre')).toBeInTheDocument();
      expect(screen.getByText('Renommer')).toBeInTheDocument();
      expect(screen.getByText('Ajouter aux favoris')).toBeInTheDocument();
      expect(screen.getByText('Supprimer')).toBeInTheDocument();
    });

    it('should show "Retirer des favoris" when conversation is favorite', async () => {
      const conversation = createMockConversation({ isFavorite: true });
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      const card = screen.getByRole('generic', { hidden: true });
      await userEvent.hover(card);

      const moreButton = screen.getByRole('button', { name: /actions/i });
      await userEvent.click(moreButton);

      expect(screen.getByText('Retirer des favoris')).toBeInTheDocument();
    });

    it('should call onResume when "Reprendre" is clicked in menu', async () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      const card = screen.getByRole('generic', { hidden: true });
      await userEvent.hover(card);

      const moreButton = screen.getByRole('button', { name: /actions/i });
      await userEvent.click(moreButton);

      const resumeMenuItem = screen.getByText('Reprendre');
      await userEvent.click(resumeMenuItem);

      expect(mockCallbacks.onResume).toHaveBeenCalledWith('conv-1');
    });

    it('should call onToggleFavorite when favorite menu item is clicked', async () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      const card = screen.getByRole('generic', { hidden: true });
      await userEvent.hover(card);

      const moreButton = screen.getByRole('button', { name: /actions/i });
      await userEvent.click(moreButton);

      const favoriteMenuItem = screen.getByText('Ajouter aux favoris');
      await userEvent.click(favoriteMenuItem);

      expect(mockCallbacks.onToggleFavorite).toHaveBeenCalledWith('conv-1');
    });
  });

  describe('Rename Functionality', () => {
    it('should enter rename mode when rename menu item is clicked', async () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      const card = screen.getByRole('generic', { hidden: true });
      await userEvent.hover(card);

      const moreButton = screen.getByRole('button', { name: /actions/i });
      await userEvent.click(moreButton);

      const renameMenuItem = screen.getByText('Renommer');
      await userEvent.click(renameMenuItem);

      const input = screen.getByDisplayValue('RÃ©union Ã©quipe dÃ©veloppement');
      expect(input).toBeInTheDocument();
      expect(input).toHaveFocus();
    });

    it('should call onRename when Enter is pressed in rename input', async () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      const card = screen.getByRole('generic', { hidden: true });
      await userEvent.hover(card);

      const moreButton = screen.getByRole('button', { name: /actions/i });
      await userEvent.click(moreButton);

      const renameMenuItem = screen.getByText('Renommer');
      await userEvent.click(renameMenuItem);

      const input = screen.getByDisplayValue('RÃ©union Ã©quipe dÃ©veloppement');
      await userEvent.clear(input);
      await userEvent.type(input, 'Nouveau titre');
      await userEvent.keyboard('{Enter}');

      expect(mockCallbacks.onRename).toHaveBeenCalledWith('conv-1', 'Nouveau titre');
    });

    it('should cancel rename when Escape is pressed', async () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      const card = screen.getByRole('generic', { hidden: true });
      await userEvent.hover(card);

      const moreButton = screen.getByRole('button', { name: /actions/i });
      await userEvent.click(moreButton);

      const renameMenuItem = screen.getByText('Renommer');
      await userEvent.click(renameMenuItem);

      const input = screen.getByDisplayValue('RÃ©union Ã©quipe dÃ©veloppement');
      await userEvent.clear(input);
      await userEvent.type(input, 'Nouveau titre');
      await userEvent.keyboard('{Escape}');

      expect(screen.getByText('RÃ©union Ã©quipe dÃ©veloppement')).toBeInTheDocument();
      expect(mockCallbacks.onRename).not.toHaveBeenCalled();
    });

    it('should not call onRename if title is unchanged', async () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      const card = screen.getByRole('generic', { hidden: true });
      await userEvent.hover(card);

      const moreButton = screen.getByRole('button', { name: /actions/i });
      await userEvent.click(moreButton);

      const renameMenuItem = screen.getByText('Renommer');
      await userEvent.click(renameMenuItem);

      const input = screen.getByDisplayValue('RÃ©union Ã©quipe dÃ©veloppement');
      await userEvent.keyboard('{Enter}');

      expect(mockCallbacks.onRename).not.toHaveBeenCalled();
    });
  });

  describe('Delete Functionality', () => {
    it('should show delete confirmation dialog when delete is clicked', async () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      const card = screen.getByRole('generic', { hidden: true });
      await userEvent.hover(card);

      const moreButton = screen.getByRole('button', { name: /actions/i });
      await userEvent.click(moreButton);

      const deleteMenuItem = screen.getByText('Supprimer');
      await userEvent.click(deleteMenuItem);

      expect(screen.getByText('Supprimer la conversation')).toBeInTheDocument();
      expect(screen.getByText(/ÃŠtes-vous sÃ»r de vouloir supprimer/)).toBeInTheDocument();
    });

    it('should call onDelete when delete is confirmed', async () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      const card = screen.getByRole('generic', { hidden: true });
      await userEvent.hover(card);

      const moreButton = screen.getByRole('button', { name: /actions/i });
      await userEvent.click(moreButton);

      const deleteMenuItem = screen.getByText('Supprimer');
      await userEvent.click(deleteMenuItem);

      const confirmButton = screen.getByRole('button', { name: 'Supprimer' });
      await userEvent.click(confirmButton);

      expect(mockCallbacks.onDelete).toHaveBeenCalledWith('conv-1');
    });

    it('should not call onDelete when delete is cancelled', async () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      const card = screen.getByRole('generic', { hidden: true });
      await userEvent.hover(card);

      const moreButton = screen.getByRole('button', { name: /actions/i });
      await userEvent.click(moreButton);

      const deleteMenuItem = screen.getByText('Supprimer');
      await userEvent.click(deleteMenuItem);

      const cancelButton = screen.getByText('Annuler');
      await userEvent.click(cancelButton);

      expect(mockCallbacks.onDelete).not.toHaveBeenCalled();
    });

    it('should mention poll preservation in delete dialog when poll exists', async () => {
      const conversation = createMockConversation({ 
        relatedPollId: 'poll-123'
      });
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      const card = screen.getByRole('generic', { hidden: true });
      await userEvent.hover(card);

      const moreButton = screen.getByRole('button', { name: /actions/i });
      await userEvent.click(moreButton);

      const deleteMenuItem = screen.getByText('Supprimer');
      await userEvent.click(deleteMenuItem);

      expect(screen.getByText(/Le sondage associÃ© ne sera pas affectÃ©/)).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should show quick actions on hover', async () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      const card = screen.getByRole('generic', { hidden: true });
      await userEvent.hover(card);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reprendre/i })).toBeVisible();
      });
    });

    it('should show poll quick action when poll exists', async () => {
      const conversation = createMockConversation({ 
        relatedPollId: 'poll-123'
      });
      render(<ConversationCard conversation={conversation} {...mockCallbacks} />);

      const card = screen.getByRole('generic', { hidden: true });
      await userEvent.hover(card);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sondage/i })).toBeVisible();
      });
    });
  });

  describe('Compact Mode', () => {
    it('should apply compact styling when compact prop is true', () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} compact={true} />);

      // Compact mode should truncate preview text to 60 chars instead of 100
      const preview = screen.getByText(/Bonjour, je voudrais organiser une rÃ©union/);
      expect(preview.textContent).toHaveLength(63); // 60 chars + "..."
    });
  });

  describe('Language Support', () => {
    it('should handle English language preference', () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} language="en" />);

      // The component should still render (date formatting is mocked)
      expect(screen.getByText('RÃ©union Ã©quipe dÃ©veloppement')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle conversation with no tags', () => {
      const conversation = createMockConversation({ tags: [] });
      render(<ConversationCard conversation={conversation} />);

      expect(screen.queryByText('travail')).not.toBeInTheDocument();
      expect(screen.queryByText('rÃ©union')).not.toBeInTheDocument();
    });

    it('should handle conversation with many tags', () => {
      const conversation = createMockConversation({ 
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'] 
      });
      render(<ConversationCard conversation={conversation} />);

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('+3')).toBeInTheDocument(); // Shows remaining count
    });

    it('should handle single message count', () => {
      const conversation = createMockConversation({ messageCount: 1 });
      render(<ConversationCard conversation={conversation} />);

      expect(screen.getByText('1 message')).toBeInTheDocument();
    });

    it('should handle empty first message', () => {
      const conversation = createMockConversation({ firstMessage: '' });
      render(<ConversationCard conversation={conversation} />);

      // Should still render the card without crashing
      expect(screen.getByText('RÃ©union Ã©quipe dÃ©veloppement')).toBeInTheDocument();
    });

    it('should handle missing callbacks gracefully', () => {
      const conversation = createMockConversation();
      render(<ConversationCard conversation={conversation} />);

      // Should render without crashing even without callbacks
      expect(screen.getByText('RÃ©union Ã©quipe dÃ©veloppement')).toBeInTheDocument();
    });
  });
});
