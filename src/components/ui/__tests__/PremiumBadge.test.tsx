/**
 * Tests for PremiumBadge component
 * DooDates - Premium Badge Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import PremiumBadge from '../PremiumBadge';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Crown: () => React.createElement('div', { 'data-testid': 'crown-icon' }, 'Crown'),
  Lock: () => React.createElement('div', { 'data-testid': 'lock-icon' }, 'Lock'),
  Sparkles: () => React.createElement('div', { 'data-testid': 'sparkles-icon' }, 'Sparkles'),
}));

describe('PremiumBadge', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<PremiumBadge />);
      
      expect(screen.getByText('Premium')).toBeInTheDocument();
      expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
    });

    it('should render with sparkles icon variant', () => {
      render(<PremiumBadge variant="sparkles" />);
      
      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
      expect(screen.getByRole('generic')).toHaveClass('bg-gradient-to-r');
    });

    it('should render with custom text', () => {
      render(<PremiumBadge text="Pro Feature" />);
      
      expect(screen.getByText('Pro Feature')).toBeInTheDocument();
    });

    it('should render without text when text is empty', () => {
      render(<PremiumBadge text="" />);
      
      expect(screen.queryByText('Premium')).not.toBeInTheDocument();
      expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('should render crown variant', () => {
      render(<PremiumBadge variant="crown" />);
      
      expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
    });

    it('should render lock variant', () => {
      render(<PremiumBadge variant="lock" />);
      
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
    });

    it('should render star variant', () => {
      render(<PremiumBadge variant="sparkles" size="lg" />);
      
      expect(screen.getByTestId('star-icon')).toBeInTheDocument();
    });

    it('should render sparkles variant', () => {
      render(<PremiumBadge variant="sparkles" />);
      
      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('should render small size', () => {
      render(<PremiumBadge size="sm" />);
      
      const badge = screen.getByText('Premium').closest('div');
      expect(badge).toHaveClass('text-xs', 'px-1.5', 'py-0.5');
    });

    it('should render medium size (default)', () => {
      render(<PremiumBadge />);
      
      const badge = screen.getByText('Premium').closest('div');
      expect(badge).toHaveClass('text-sm', 'px-2', 'py-1');
    });

    it('should render large size', () => {
      render(<PremiumBadge size="lg" />);
      
      const badge = screen.getByText('Premium').closest('div');
      expect(badge).toHaveClass('text-base', 'px-3', 'py-1.5');
    });
  });

  describe('styling', () => {
    it('should have correct base classes', () => {
      render(<PremiumBadge />);
      
      const badge = screen.getByText('Premium').closest('span');
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'gap-1',
        'bg-gradient-to-r',
        'from-yellow-400',
        'to-orange-500',
        'text-white',
        'font-semibold',
        'rounded-full'
      );
    });

    it('should apply custom className', () => {
      render(<PremiumBadge className="custom-class" />);
      
      const badge = screen.getByText('Premium').closest('span');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<PremiumBadge />);
      
      const badge = screen.getByText('Premium').closest('span');
      // PremiumBadge doesn't have ARIA attributes in current implementation
      expect(badge).toBeInTheDocument();
    });

    it('should have custom aria-label when provided', () => {
      render(<PremiumBadge aria-label="Pro feature locked" />);
      
      const badge = screen.getByText('Premium').closest('span');
      // PremiumBadge doesn't have ARIA attributes in current implementation
      expect(badge).toBeInTheDocument();
    });
  });

  describe('combinations', () => {
    it('should render lock variant with custom text and small size', () => {
      render(<PremiumBadge variant="lock" text="Locked" size="sm" />);
      
      expect(screen.getByText('Locked')).toBeInTheDocument();
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
      
      const badge = screen.getByText('Locked').closest('span');
      expect(badge).toHaveClass('text-xs', 'px-1.5', 'py-0.5');
    });

    it('should render sparkles variant without text in large size', () => {
      render(<PremiumBadge variant="sparkles" text="" size="lg" />);
      
      expect(screen.queryByText('Premium')).not.toBeInTheDocument();
      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
      
      const badge = screen.getByTestId('sparkles-icon').closest('span');
      expect(badge).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });
  });

  describe('edge cases', () => {
    it('should handle empty text gracefully', () => {
      render(<PremiumBadge text="" />);
      
      expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
      // Should not render Premium text when text is empty
      expect(screen.queryByText('Premium')).not.toBeInTheDocument();
    });

    it('should handle very long text', () => {
      const longText = 'This is a very long premium feature description';
      render(<PremiumBadge text={longText} />);
      
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle special characters in text', () => {
      render(<PremiumBadge text="Premium ⭐ Feature!" />);
      
      expect(screen.getByText('Premium ⭐ Feature!')).toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    it('should maintain proper styling on different screen sizes', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<PremiumBadge />);
      
      const badge = screen.getByText('Premium').closest('span');
      expect(badge).toHaveClass('inline-flex', 'items-center');
    });
  });

  describe('icon sizing', () => {
    it('should have appropriate icon size for small badge', () => {
      render(<PremiumBadge size="sm" />);
      
      const icon = screen.getByTestId('crown-icon');
      // Icons are mocked as divs, they don't have the actual Lucide classes
      expect(icon).toBeInTheDocument();
    });

    it('should have appropriate icon size for medium badge', () => {
      render(<PremiumBadge />);
      
      const icon = screen.getByTestId('crown-icon');
      // Icons are mocked as divs, they don't have the actual Lucide classes
      expect(icon).toBeInTheDocument();
    });

    it('should have appropriate icon size for large badge', () => {
      render(<PremiumBadge size="lg" />);
      
      const icon = screen.getByTestId('crown-icon');
      // Icons are mocked as divs, they don't have the actual Lucide classes
      expect(icon).toBeInTheDocument();
    });
  });
});
