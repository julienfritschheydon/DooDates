/**
 * Tests for QuotaIndicator component
 * DooDates - UI Components Tests
 */

/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuotaIndicator from '../QuotaIndicator';

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  MessageCircle: () => <div data-testid="message-icon">MessageCircle</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  Crown: () => <div data-testid="crown-icon">Crown</div>,
  AlertTriangle: () => <div data-testid="alert-icon">AlertTriangle</div>,
}));

describe('QuotaIndicator', () => {
  describe('rendering', () => {
    it('should render conversations quota', () => {
      render(<QuotaIndicator type="conversations" used={2} limit={5} showLabel />);
      
      expect(screen.getByText('2/5')).toBeInTheDocument();
      expect(screen.getByText('Conversations')).toBeInTheDocument();
      expect(screen.getByTestId('message-icon')).toBeInTheDocument();
    });

    it('should render polls quota', () => {
      render(<QuotaIndicator type="polls" used={3} limit={5} showLabel />);
      
      expect(screen.getByText('3/5')).toBeInTheDocument();
      expect(screen.getByText('Sondages')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
    });

    it('should render storage quota', () => {
      render(<QuotaIndicator type="storage" used={50} limit={100} showLabel />);
      
      expect(screen.getByText('50/100')).toBeInTheDocument();
      expect(screen.getByText('Stockage')).toBeInTheDocument();
      expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
    });

    it('should hide label when showLabel is false', () => {
      render(<QuotaIndicator type="conversations" used={2} limit={5} showLabel={false} />);
      
      expect(screen.getByText('2/5')).toBeInTheDocument();
      expect(screen.queryByText('Conversations')).not.toBeInTheDocument();
    });
  });

  describe('warning states', () => {
    it('should show normal state when usage is low', () => {
      render(<QuotaIndicator type="conversations" used={1} limit={5} />);
      
      const container = screen.getByTestId('quota-indicator-conversations');
      expect(container).toHaveClass('bg-blue-100');
      expect(container).toHaveClass('border-blue-200');
      expect(screen.getByText('Conversations')).toHaveClass('text-blue-700');
    });

    it('should show warning state when approaching limit (80%)', () => {
      render(<QuotaIndicator type="conversations" used={4} limit={5} />);
      
      const container = screen.getByTestId('quota-indicator-conversations');
      expect(container).toHaveClass('bg-orange-100');
      expect(container).toHaveClass('border-orange-200');
      expect(screen.getByText('Conversations')).toHaveClass('text-orange-700');
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      expect(screen.getByText('Proche de la limite')).toBeInTheDocument();
    });

    it('should show danger state when at limit (100%)', () => {
      render(<QuotaIndicator type="conversations" used={5} limit={5} />);
      
      const container = screen.getByTestId('quota-indicator-conversations');
      expect(container).toHaveClass('bg-red-100');
      expect(container).toHaveClass('border-red-200');
      expect(screen.getByText('Conversations')).toHaveClass('text-red-700');
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      expect(screen.getByText('Limite atteinte')).toBeInTheDocument();
    });

    it('should handle usage exceeding limits', () => {
      render(<QuotaIndicator type="conversations" used={6} limit={5} />);
      
      expect(screen.getByText('6/5')).toBeInTheDocument();
      
      const container = screen.getByTestId('quota-indicator-conversations');
      expect(container).toHaveClass('bg-red-100');
      expect(screen.getByText('Conversations')).toHaveClass('text-red-700');
      expect(screen.getByText('Limite atteinte')).toBeInTheDocument();
    });
  });

  describe('progress bars', () => {
    it('should show correct progress bar width for normal usage', () => {
      render(<QuotaIndicator type="conversations" used={2} limit={5} />);
      
      const container = screen.getByTestId('quota-indicator-conversations');
      const progressBar = container.querySelector('.bg-blue-500');
      expect(progressBar).toHaveStyle('width: 40%'); // 2/5 = 40%
    });

    it('should show correct progress bar width for warning state', () => {
      render(<QuotaIndicator type="conversations" used={4} limit={5} />);
      
      const container = screen.getByTestId('quota-indicator-conversations');
      const progressBar = container.querySelector('.bg-orange-500');
      expect(progressBar).toHaveStyle('width: 80%'); // 4/5 = 80%
    });

    it('should show full progress bar when at limit', () => {
      render(<QuotaIndicator type="conversations" used={5} limit={5} />);
      
      const container = screen.getByTestId('quota-indicator-conversations');
      const progressBar = container.querySelector('.bg-red-500');
      expect(progressBar).toHaveStyle('width: 100%');
    });

    it('should handle zero usage', () => {
      render(<QuotaIndicator type="conversations" used={0} limit={5} />);
      
      expect(screen.getByText('0/5')).toBeInTheDocument();
      
      const container = screen.getByTestId('quota-indicator-conversations');
      const progressBar = container.querySelector('.bg-blue-500');
      expect(progressBar).toHaveStyle('width: 0%');
    });
  });

  describe('size variants', () => {
    it('should render in small size', () => {
      render(<QuotaIndicator type="conversations" used={2} limit={5} size="sm" />);
      
      const container = screen.getByTestId('quota-indicator-conversations');
      expect(container).toHaveClass('px-2', 'py-1');
      expect(screen.getByText('Conversations')).toHaveClass('text-xs');
    });

    it('should render in medium size by default', () => {
      render(<QuotaIndicator type="conversations" used={2} limit={5} />);
      
      const container = screen.getByTestId('quota-indicator-conversations');
      expect(container).toHaveClass('px-3', 'py-2');
      expect(screen.getByText('Conversations')).toHaveClass('text-sm');
    });

    it('should render in large size', () => {
      render(<QuotaIndicator type="conversations" used={2} limit={5} size="lg" />);
      
      const container = screen.getByTestId('quota-indicator-conversations');
      expect(container).toHaveClass('px-4', 'py-3');
      expect(screen.getByText('Conversations')).toHaveClass('text-sm');
    });
  });

  describe('click handling', () => {
    it('should be clickable when onClick is provided', () => {
      const handleClick = vi.fn();
      render(<QuotaIndicator type="conversations" used={2} limit={5} onClick={handleClick} />);
      
      const container = screen.getByTestId('quota-indicator-conversations');
      expect(container).toHaveClass('cursor-pointer');
      
      container.click();
      expect(handleClick).toHaveBeenCalled();
    });

    it('should not be clickable when onClick is not provided', () => {
      render(<QuotaIndicator type="conversations" used={2} limit={5} />);
      
      const container = screen.getByTestId('quota-indicator-conversations');
      expect(container).not.toHaveClass('cursor-pointer');
    });
  });
});
