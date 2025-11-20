import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Calendar from "./Calendar";
import { logger } from "../lib/logger";

// Mock des dépendances
vi.mock("../lib/logger", () => ({
  logger: {
    time: vi.fn(() => "timer-id"),
    timeEnd: vi.fn(),
    log: vi.fn(),
  },
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  ChevronLeft: () => <div data-testid="chevron-left">←</div>,
  ChevronRight: () => <div data-testid="chevron-right">→</div>,
}));

// Mock tooltip components
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
}));

describe.skip("Calendar", () => {
  const mockProps = {
    visibleMonths: [new Date(2024, 0, 1)], // January 2024
    selectedDates: ["2024-01-15"],
    onDateToggle: vi.fn(),
    onMonthChange: vi.fn(),
    onMonthsChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set today to a date that won't interfere with tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 10)); // January 10, 2024
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Basic rendering", () => {
    it("should render calendar with correct structure", () => {
      render(<Calendar {...mockProps} />);

      expect(screen.getByTestId("calendar")).toBeInTheDocument();
      expect(screen.getByText("janvier 2024")).toBeInTheDocument();

      // Check weekdays are rendered
      expect(screen.getByText("Lun")).toBeInTheDocument();
      expect(screen.getByText("Mar")).toBeInTheDocument();
      expect(screen.getByText("Mer")).toBeInTheDocument();
      expect(screen.getByText("Jeu")).toBeInTheDocument();
      expect(screen.getByText("Ven")).toBeInTheDocument();
      expect(screen.getByText("Sam")).toBeInTheDocument();
      expect(screen.getByText("Dim")).toBeInTheDocument();
    });

    it("should render correct number of days for January 2024", () => {
      render(<Calendar {...mockProps} />);

      // January 2024 has 31 days
      // Check that day numbers are rendered
      for (let i = 1; i <= 31; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument();
      }
    });

    it("should render navigation buttons", () => {
      render(<Calendar {...mockProps} />);

      expect(screen.getByTestId("chevron-left")).toBeInTheDocument();
      expect(screen.getByTestId("chevron-right")).toBeInTheDocument();
    });
  });

  describe("Date selection", () => {
    it("should call onDateToggle when clicking on a future date", async () => {
      const user = userEvent.setup();
      render(<Calendar {...mockProps} />);

      const day16 = screen.getByText("16"); // Future date (today is Jan 10)
      await user.click(day16);

      expect(mockProps.onDateToggle).toHaveBeenCalledWith(new Date(2024, 0, 16));
    });

    it("should not call onDateToggle when clicking on a past date", async () => {
      const user = userEvent.setup();
      render(<Calendar {...mockProps} />);

      const day5 = screen.getByText("5"); // Past date (today is Jan 10)
      await user.click(day5);

      expect(mockProps.onDateToggle).not.toHaveBeenCalled();
    });

    it("should highlight selected dates", () => {
      render(<Calendar {...mockProps} />);

      const day15 = screen.getByText("15");
      const day15Button = day15.closest("button");

      expect(day15Button).toHaveClass("bg-blue-600", "text-white");
    });

    it("should highlight today", () => {
      render(<Calendar {...mockProps} />);

      const day10 = screen.getByText("10");
      const day10Button = day10.closest("button");

      expect(day10Button).toHaveClass(
        "bg-blue-900/30",
        "text-blue-400",
        "border-2",
        "border-blue-700",
      );
    });

    it("should disable past dates", () => {
      render(<Calendar {...mockProps} />);

      const day5 = screen.getByText("5");
      const day5Button = day5.closest("button");

      expect(day5Button).toBeDisabled();
      expect(day5Button).toHaveClass("cursor-not-allowed", "text-gray-600", "bg-[#1e1e1e]");
    });
  });

  describe("Navigation", () => {
    it("should call onMonthChange when clicking navigation buttons", async () => {
      const user = userEvent.setup();
      render(<Calendar {...mockProps} />);

      const prevButton = screen.getByLabelText("Mois précédent");
      const nextButton = screen.getByLabelText("Mois suivant");

      await user.click(prevButton);
      expect(mockProps.onMonthChange).toHaveBeenCalledWith("prev");

      await user.click(nextButton);
      expect(mockProps.onMonthChange).toHaveBeenCalledWith("next");
    });

    it("should handle multiple months", () => {
      const multiMonthProps = {
        ...mockProps,
        visibleMonths: [new Date(2024, 0, 1), new Date(2024, 1, 1)], // Jan and Feb 2024
      };

      render(<Calendar {...multiMonthProps} />);

      expect(screen.getByText("janvier 2024")).toBeInTheDocument();
      expect(screen.getByText("février 2024")).toBeInTheDocument();
    });
  });

  describe("Calendar generation", () => {
    it("should correctly align first day of month", () => {
      // January 1, 2024 was a Monday
      // So first day should be in Monday position (index 0 in our grid)
      render(<Calendar {...mockProps} />);

      const day1 = screen.getByText("1");
      const day1Button = day1.closest("button");

      // The button should have data-date attribute
      expect(day1Button).toHaveAttribute("data-date", "2024-01-01");
    });

    it("should generate correct date strings", () => {
      render(<Calendar {...mockProps} />);

      const day1 = screen.getByText("1");
      const day1Button = day1.closest("button");
      expect(day1Button).toHaveAttribute("data-date", "2024-01-01");

      const day31 = screen.getByText("31");
      const day31Button = day31.closest("button");
      expect(day31Button).toHaveAttribute("data-date", "2024-01-31");
    });

    it("should handle leap year February", () => {
      const feb2024Props = {
        ...mockProps,
        visibleMonths: [new Date(2024, 1, 1)], // February 2024 (leap year)
      };

      render(<Calendar {...feb2024Props} />);

      expect(screen.getByText("février 2024")).toBeInTheDocument();
      // February 2024 has 29 days (leap year)
      expect(screen.getByText("29")).toBeInTheDocument();
      expect(screen.queryByText("30")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<Calendar {...mockProps} />);

      expect(screen.getByLabelText("Mois précédent")).toBeInTheDocument();
      expect(screen.getByLabelText("Mois suivant")).toBeInTheDocument();
    });

    it("should have data-date attributes for all valid dates", () => {
      render(<Calendar {...mockProps} />);

      for (let i = 1; i <= 31; i++) {
        const day = screen.getByText(i.toString());
        const button = day.closest("button");
        const expectedDate = `2024-01-${i.toString().padStart(2, "0")}`;
        expect(button).toHaveAttribute("data-date", expectedDate);
      }
    });
  });

  describe("Event handling", () => {
    it("should prevent event propagation on date click", async () => {
      const user = userEvent.setup();
      const mockParentHandler = vi.fn();

      // Create a parent div with click handler
      const { container } = render(
        <div onClick={mockParentHandler}>
          <Calendar {...mockProps} />
        </div>,
      );

      const day16 = screen.getByText("16");
      await user.click(day16);

      // Parent handler should not be called due to stopPropagation
      expect(mockParentHandler).not.toHaveBeenCalled();
      expect(mockProps.onDateToggle).toHaveBeenCalled();
    });

    it("should prevent event propagation on pointer down", () => {
      render(<Calendar {...mockProps} />);

      const day16 = screen.getByText("16");
      const day16Button = day16.closest("button");

      const mockEvent = {
        stopPropagation: vi.fn(),
      };

      fireEvent.pointerDown(day16Button!, mockEvent as any);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe("Desktop scroll handling", () => {
    it("should call onMonthsChange when scrolling near end", () => {
      const scrollProps = {
        ...mockProps,
        visibleMonths: Array.from({ length: 10 }, (_, i) => new Date(2024, i, 1)), // 10 months
      };

      render(<Calendar {...scrollProps} />);

      const scrollContainer = screen.getByTestId("calendar").querySelector(".overflow-x-auto");
      expect(scrollContainer).toBeInTheDocument();

      // Mock scroll event
      const mockScrollEvent = {
        currentTarget: {
          scrollLeft: 800, // Near the end
          scrollWidth: 1000,
          clientWidth: 200,
        },
      };

      fireEvent.scroll(scrollContainer!, mockScrollEvent);

      // Should trigger loading more months
      expect(mockProps.onMonthsChange).toHaveBeenCalled();
      const newMonths = mockProps.onMonthsChange.mock.calls[0][0];
      expect(newMonths.length).toBeGreaterThan(scrollProps.visibleMonths.length);
    });

    it("should not load more months when limit reached", () => {
      const manyMonthsProps = {
        ...mockProps,
        visibleMonths: Array.from({ length: 60 }, (_, i) => new Date(2024, i % 12, 1)), // 60 months (5 years)
      };

      render(<Calendar {...manyMonthsProps} />);

      const scrollContainer = screen.getByTestId("calendar").querySelector(".overflow-x-auto");

      const mockScrollEvent = {
        currentTarget: {
          scrollLeft: 800,
          scrollWidth: 1000,
          clientWidth: 200,
        },
      };

      fireEvent.scroll(scrollContainer!, mockScrollEvent);

      // Should not load more months (already at limit)
      expect(mockProps.onMonthsChange).not.toHaveBeenCalled();
    });
  });

  describe("Performance and logging", () => {
    it("should call logger timing functions", () => {
      render(<Calendar {...mockProps} />);

      expect(logger.time).toHaveBeenCalledWith("Calendar - Rendu total", "calendar");
      expect(logger.timeEnd).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("should handle empty visibleMonths gracefully", () => {
      const emptyProps = {
        ...mockProps,
        visibleMonths: [],
      };

      expect(() => render(<Calendar {...emptyProps} />)).not.toThrow();
    });

    it("should handle undefined onMonthsChange", () => {
      const noMonthsChangeProps = {
        ...mockProps,
        onMonthsChange: undefined,
      };

      render(<Calendar {...noMonthsChangeProps} />);

      const scrollContainer = screen.getByTestId("calendar").querySelector(".overflow-x-auto");

      const mockScrollEvent = {
        currentTarget: {
          scrollLeft: 800,
          scrollWidth: 1000,
          clientWidth: 200,
        },
      };

      // Should not throw when onMonthsChange is undefined
      expect(() => {
        fireEvent.scroll(scrollContainer!, mockScrollEvent);
      }).not.toThrow();
    });

    it.skip("should handle different selectedDates formats", () => {
      const variousDatesProps = {
        ...mockProps,
        selectedDates: ["2024-01-01", "2024-01-15", "2024-01-31"],
      };

      render(<Calendar {...variousDatesProps} />);

      // Should highlight all selected dates
      const day1 = screen.getByText("1");
      const day15 = screen.getByText("15");
      const day31 = screen.getByText("31");

      expect(day1.closest("button")).toHaveClass("bg-blue-600");
      expect(day15.closest("button")).toHaveClass("bg-blue-600");
      expect(day31.closest("button")).toHaveClass("bg-blue-600");
    });
  });
});
