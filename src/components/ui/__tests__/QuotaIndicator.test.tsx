/**
 * Tests for QuotaIndicator component
 * DooDates - Quota Indicator Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import QuotaIndicator from '../QuotaIndicator';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  MessageSquare: () => <div data-testid="message-icon">MessageSquare</div>,
  BarChart3: () => <div data-testid="chart-icon">BarChart3</div>,
  Database: () => <div data-testid="database-icon">Database</div>,
  AlertTriangle: () => <div data-testid="alert-icon">AlertTriangle</div>,
}));

describe('QuotaIndicator', () => {
  const defaultProps = {
    usage: {
      conversations: 2,
      polls: 3,
      storageKB: 50,
    },
    limits: {
      conversations: 3,
      polls: 5,
      storageKB: 100,
    },
    showWarnings: true,
  };

  describe('rendering', () => {
    it('should render all quota types', () => {
      render(<QuotaIndicator {...defaultProps} />);
      
      expect(screen.getByText('2/3')).toBeInTheDocument();
      expect(screen.getByText('3/5')).toBeInTheDocument();
      expect(screen.getByText('50/100 KB')).toBeInTheDocument();
    });

    it('should render correct icons', () => {
      render(<QuotaIndicator {...defaultProps} />);
      
      expect(screen.getByTestId('message-icon')).toBeInTheDocument();
      expect(screen.getByTestId('chart-icon')).toBeInTheDocument();
      expect(screen.getByTestId('database-icon')).toBeInTheDocument();
    });

    it('should render tooltips', () => {
      render(<QuotaIndicator {...defaultProps} />);
      
      expect(screen.getByText('Conversations')).toBeInTheDocument();
      expect(screen.getByText('Polls')).toBeInTheDocument();
      expect(screen.getByText('Storage')).toBeInTheDocument();
    });
  });

  describe('warning states', () => {
    it('should show warning for conversations at 80% usage', () => {
      const props = {
        ...defaultProps,
        usage: {
          conversations: 2,
          polls: 1,
          storageKB: 10,
        },
        limits: {
          conversations: 3,
          polls: 5,
          storageKB: 100,
        },
      };

      render(<QuotaIndicator {...props} />);
      
      // Should show warning color for conversations (2/3 = 66.7%, but close to limit)
      const conversationIndicator = screen.getByText('2/3').closest('div');
      expect(conversationIndicator).toHaveClass('text-amber-600');
    });

    it('should show danger state when at limit', () => {
      const props = {
        ...defaultProps,
        usage: {
          conversations: 3,
          polls: 5,
          storageKB: 100,
        },
      };

      render(<QuotaIndicator {...props} />);
      
      const conversationIndicator = screen.getByText('3/3').closest('div');
      const pollIndicator = screen.getByText('5/5').closest('div');
      const storageIndicator = screen.getByText('100/100 KB').closest('div');
      
      expect(conversationIndicator).toHaveClass('text-red-600');
      expect(pollIndicator).toHaveClass('text-red-600');
      expect(storageIndicator).toHaveClass('text-red-600');
    });

    it('should show normal state when usage is low', () => {
      const props = {
        ...defaultProps,
        usage: {
          conversations: 1,
          polls: 1,
          storageKB: 10,
        },
      };

      render(<QuotaIndicator {...props} />);
      
      const conversationIndicator = screen.getByText('1/3').closest('div');
      expect(conversationIndicator).toHaveClass('text-gray-600');
    });

    it('should not show warnings when showWarnings is false', () => {
      const props = {
        ...defaultProps,
        usage: {
          conversations: 3,
          polls: 5,
          storageKB: 100,
        },
        showWarnings: false,
      };

      render(<QuotaIndicator {...props} />);
      
      // Should not show alert icons
      expect(screen.queryByTestId('alert-icon')).not.toBeInTheDocument();
    });
  });

  describe('progress bars', () => {
    it('should show correct progress bar widths', () => {
      render(<QuotaIndicator {...defaultProps} />);
      
      // Conversations: 2/3 = 66.7%
      const conversationBar = screen.getByText('2/3').parentElement?.querySelector('.bg-blue-500');
      expect(conversationBar).toHaveStyle('width: 66.67%');
      
      // Polls: 3/5 = 60%
      const pollBar = screen.getByText('3/5').parentElement?.querySelector('.bg-green-500');
      expect(pollBar).toHaveStyle('width: 60%');
      
      // Storage: 50/100 = 50%
      const storageBar = screen.getByText('50/100 KB').parentElement?.querySelector('.bg-purple-500');
      expect(storageBar).toHaveStyle('width: 50%');
    });

    it('should handle 100% usage', () => {
      const props = {
        ...defaultProps,
        usage: {
          conversations: 3,
          polls: 5,
          storageKB: 100,
        },
      };

      render(<QuotaIndicator {...props} />);
      
      const conversationBar = screen.getByText('3/3').parentElement?.querySelector('.bg-red-500');
      expect(conversationBar).toHaveStyle('width: 100%');
    });

    it('should handle zero usage', () => {
      const props = {
        ...defaultProps,
        usage: {
          conversations: 0,
          polls: 0,
          storageKB: 0,
        },
      };

      render(<QuotaIndicator {...props} />);
      
      expect(screen.getByText('0/3')).toBeInTheDocument();
      expect(screen.getByText('0/5')).toBeInTheDocument();
      expect(screen.getByText('0/100 KB')).toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('should render in compact mode', () => {
      render(<QuotaIndicator {...defaultProps} compact />);
      
      // Should still show usage numbers but in more compact layout
      expect(screen.getByText('2/3')).toBeInTheDocument();
      expect(screen.getByText('3/5')).toBeInTheDocument();
      expect(screen.getByText('50/100 KB')).toBeInTheDocument();
    });
  });

  describe('storage formatting', () => {
    it('should format large storage values correctly', () => {
      const props = {
        ...defaultProps,
        usage: {
          conversations: 1,
          polls: 1,
          storageKB: 1500,
        },
        limits: {
          conversations: 3,
          polls: 5,
          storageKB: 2000,
        },
      };

      render(<QuotaIndicator {...props} />);
      
      expect(screen.getByText('1500/2000 KB')).toBeInTheDocument();
    });

    it('should handle very small storage values', () => {
      const props = {
        ...defaultProps,
        usage: {
          conversations: 1,
          polls: 1,
          storageKB: 0.5,
        },
        limits: {
          conversations: 3,
          polls: 5,
          storageKB: 100,
        },
      };

      render(<QuotaIndicator {...props} />);
      
      expect(screen.getByText('0.5/100 KB')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<QuotaIndicator {...defaultProps} />);
      
      const conversationIndicator = screen.getByLabelText('Conversations quota: 2 of 3 used');
      const pollIndicator = screen.getByLabelText('Polls quota: 3 of 5 used');
      const storageIndicator = screen.getByLabelText('Storage quota: 50 of 100 KB used');
      
      expect(conversationIndicator).toBeInTheDocument();
      expect(pollIndicator).toBeInTheDocument();
      expect(storageIndicator).toBeInTheDocument();
    });

    it('should have proper role attributes for progress bars', () => {
      render(<QuotaIndicator {...defaultProps} />);
      
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(3);
      
      expect(progressBars[0]).toHaveAttribute('aria-valuenow', '2');
      expect(progressBars[0]).toHaveAttribute('aria-valuemax', '3');
      expect(progressBars[1]).toHaveAttribute('aria-valuenow', '3');
      expect(progressBars[1]).toHaveAttribute('aria-valuemax', '5');
    });
  });

  describe('edge cases', () => {
    it('should handle missing usage data', () => {
      const props = {
        ...defaultProps,
        usage: undefined as any,
      };

      render(<QuotaIndicator {...props} />);
      
      // Should show 0 values
      expect(screen.getByText('0/3')).toBeInTheDocument();
      expect(screen.getByText('0/5')).toBeInTheDocument();
      expect(screen.getByText('0/100 KB')).toBeInTheDocument();
    });

    it('should handle missing limits data', () => {
      const props = {
        ...defaultProps,
        limits: undefined as any,
      };

      render(<QuotaIndicator {...props} />);
      
      // Should handle gracefully without crashing
      expect(screen.getByTestId('message-icon')).toBeInTheDocument();
    });

    it('should handle usage exceeding limits', () => {
      const props = {
        ...defaultProps,
        usage: {
          conversations: 5,
          polls: 8,
          storageKB: 150,
        },
      };

      render(<QuotaIndicator {...props} />);
      
      expect(screen.getByText('5/3')).toBeInTheDocument();
      expect(screen.getByText('8/5')).toBeInTheDocument();
      expect(screen.getByText('150/100 KB')).toBeInTheDocument();
      
      // Should show danger state
      const conversationIndicator = screen.getByText('5/3').closest('div');
      expect(conversationIndicator).toHaveClass('text-red-600');
    });
  });
});
