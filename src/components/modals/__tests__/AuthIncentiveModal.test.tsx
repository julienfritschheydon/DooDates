/**
 * Tests for AuthIncentiveModal component
 * DooDates - Authentication Incentive Modal Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthIncentiveModal from '../AuthIncentiveModal';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Crown: () => <div data-testid="crown-icon">Crown</div>,
  MessageSquare: () => <div data-testid="message-icon">MessageSquare</div>,
  BarChart3: () => <div data-testid="chart-icon">BarChart3</div>,
  Database: () => <div data-testid="database-icon">Database</div>,
  X: () => <div data-testid="x-icon">X</div>,
}));

describe('AuthIncentiveModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSignUp: jest.fn(),
    onSignIn: jest.fn(),
    trigger: 'conversation_limit' as const,
    currentUsage: {
      conversations: 3,
      maxConversations: 10,
      polls: 2,
      maxPolls: 5,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render when open', () => {
      render(<AuthIncentiveModal {...defaultProps} />);
      
      expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
      expect(screen.getByText('You\'ve reached your conversation limit')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<AuthIncentiveModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Upgrade to Premium')).not.toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<AuthIncentiveModal {...defaultProps} />);
      
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });
  });

  describe('trigger scenarios', () => {
    it('should show conversation limit message', () => {
      render(<AuthIncentiveModal {...defaultProps} trigger="conversation_limit" />);
      
      expect(screen.getByText('You\'ve reached your conversation limit')).toBeInTheDocument();
      expect(screen.getByText('3/3 conversations used')).toBeInTheDocument();
    });

    it('should show poll limit message', () => {
      render(<AuthIncentiveModal {...defaultProps} trigger="poll_limit" />);
      
      expect(screen.getByText('You\'ve reached your poll limit')).toBeInTheDocument();
      expect(screen.getByText('2/5 polls used')).toBeInTheDocument();
    });

    it('should show storage limit message', () => {
      render(<AuthIncentiveModal {...defaultProps} trigger="storage_full" />);
      
      expect(screen.getByText('You\'ve reached your storage limit')).toBeInTheDocument();
      expect(screen.getByText('50/100 KB used')).toBeInTheDocument();
    });

    it('should show premium feature message', () => {
      render(<AuthIncentiveModal {...defaultProps} trigger="feature_locked" />);
      
      expect(screen.getByText('Premium Feature')).toBeInTheDocument();
      expect(screen.getByText('This feature is available for premium users only')).toBeInTheDocument();
    });
  });

  describe('premium benefits', () => {
    it('should display all premium benefits', () => {
      render(<AuthIncentiveModal {...defaultProps} />);
      
      expect(screen.getByText('50 conversations')).toBeInTheDocument();
      expect(screen.getByText('100 polls')).toBeInTheDocument();
      expect(screen.getByText('10 MB storage')).toBeInTheDocument();
      expect(screen.getByText('Priority support')).toBeInTheDocument();
    });

    it('should show correct icons for benefits', () => {
      render(<AuthIncentiveModal {...defaultProps} />);
      
      expect(screen.getByTestId('message-icon')).toBeInTheDocument();
      expect(screen.getByTestId('chart-icon')).toBeInTheDocument();
      expect(screen.getByTestId('database-icon')).toBeInTheDocument();
      expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('should render sign up and sign in buttons', () => {
      render(<AuthIncentiveModal {...defaultProps} />);
      
      expect(screen.getByText('Sign Up Free')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('should handle sign up button click', () => {
      const mockOnClose = jest.fn();
      render(<AuthIncentiveModal {...defaultProps} onClose={mockOnClose} />);
      
      fireEvent.click(screen.getByText('Sign Up Free'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle sign in button click', () => {
      const mockOnClose = jest.fn();
      render(<AuthIncentiveModal {...defaultProps} onClose={mockOnClose} />);
      
      fireEvent.click(screen.getByText('Sign In'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle close button click', () => {
      const mockOnClose = jest.fn();
      render(<AuthIncentiveModal {...defaultProps} onClose={mockOnClose} />);
      
      fireEvent.click(screen.getByTestId('x-icon').closest('button')!);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('usage display', () => {
    it('should show current usage correctly', () => {
      const props = {
        ...defaultProps,
        currentUsage: {
          conversations: 2,
          maxConversations: 3,
          polls: 4,
          maxPolls: 5,
        },
      };

      render(<AuthIncentiveModal {...props} trigger="conversation_limit" />);
      expect(screen.getByText('2/3 conversations used')).toBeInTheDocument();
    });

    it('should handle zero usage', () => {
      const props = {
        ...defaultProps,
        currentUsage: {
          conversations: 0,
          maxConversations: 10,
          polls: 0,
          maxPolls: 5,
        },
      };

      render(<AuthIncentiveModal {...props} trigger="conversation_limit" />);
      expect(screen.getByText('0/3 conversations used')).toBeInTheDocument();
    });

    it('should handle high storage usage with proper formatting', () => {
      const props = {
        ...defaultProps,
        currentUsage: {
          conversations: 1,
          maxConversations: 3,
          polls: 1,
          maxPolls: 5,
        },
      };

      render(<AuthIncentiveModal {...props} trigger="storage_full" />);
      expect(screen.getByText('1500/2000 KB used')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<AuthIncentiveModal {...defaultProps} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-labelledby');
      expect(modal).toHaveAttribute('aria-describedby');
    });

    it('should focus trap within modal', async () => {
      render(<AuthIncentiveModal {...defaultProps} />);
      
      const signUpButton = screen.getByText('Sign Up Free');
      const signInButton = screen.getByText('Sign In');
      const closeButton = screen.getByTestId('x-icon').closest('button')!;

      // Should be able to tab between interactive elements
      signUpButton.focus();
      expect(document.activeElement).toBe(signUpButton);

      fireEvent.keyDown(signUpButton, { key: 'Tab' });
      await waitFor(() => {
        expect(document.activeElement).toBe(signInButton);
      });
    });

    it('should close on Escape key', () => {
      const mockOnClose = jest.fn();
      render(<AuthIncentiveModal {...defaultProps} onClose={mockOnClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('responsive behavior', () => {
    it('should render properly on different screen sizes', () => {
      // Test mobile-like viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<AuthIncentiveModal {...defaultProps} />);
      
      // Modal should still render all content
      expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
      expect(screen.getByText('50 conversations')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle missing usage data gracefully', () => {
      const props = {
        ...defaultProps,
        currentUsage: undefined as any,
      };

      render(<AuthIncentiveModal {...props} />);
      
      // Should not crash and still show modal
      expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
    });

    it('should handle missing limits data gracefully', () => {
      const props = {
        ...defaultProps,
        currentUsage: undefined,
      };

      render(<AuthIncentiveModal {...props} />);
      
      // Should not crash and still show modal
      expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
    });

    it('should handle unknown trigger types', () => {
      const props = {
        ...defaultProps,
        trigger: 'storage_full' as const,
      };

      render(<AuthIncentiveModal {...props} />);
      
      // Should fallback to generic message
      expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
    });
  });
});
