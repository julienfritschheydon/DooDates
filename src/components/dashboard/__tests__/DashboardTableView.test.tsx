import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DashboardTableView } from "../DashboardTableView";
import { ConversationItem } from "../types";

// Mock des hooks
vi.mock("@/hooks/useConversations", () => ({
  useConversations: () => ({
    deleteConversation: {
      mutateAsync: vi.fn(),
    },
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/components/polls/PollActions", () => ({
  default: () => <div data-testid="poll-actions">Poll Actions</div>,
}));

const mockItems: ConversationItem[] = [
  {
    id: "conv-1",
    conversationTitle: "Conversation 1",
    conversationDate: new Date("2024-01-01"),
    hasAI: false,
  },
  {
    id: "conv-2",
    conversationTitle: "Conversation 2",
    conversationDate: new Date("2024-01-02"),
    hasAI: true,
    poll: {
      id: "poll-1",
      slug: "poll-1",
      title: "Sondage 1",
      description: "Description",
      type: "date",
      status: "active",
      created_at: "2024-01-01",
      participants_count: 5,
      votes_count: 10,
    },
  },
];

const renderComponent = (
  items = mockItems,
  selectedIds: Set<string> = new Set(),
  onToggleSelection = vi.fn(),
  onRefresh = vi.fn(),
) => {
  return render(
    <BrowserRouter>
      <DashboardTableView
        items={items}
        selectedIds={selectedIds}
        onToggleSelection={onToggleSelection}
        onRefresh={onRefresh}
      />
    </BrowserRouter>,
  );
};

describe("DashboardTableView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render table with items", () => {
    renderComponent();

    expect(screen.getByText("Conversation 1")).toBeInTheDocument();
    expect(screen.getByText("Sondage 1")).toBeInTheDocument();
  });

  it("should render table headers", () => {
    renderComponent();

    expect(screen.getByText("Titre")).toBeInTheDocument();
    expect(screen.getByText("Statut")).toBeInTheDocument();
    expect(screen.getByText("Statistiques")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("should show AI badge when item has AI", () => {
    renderComponent();

    expect(screen.getByText("💬 IA")).toBeInTheDocument();
  });

  it("should show poll status badge", () => {
    renderComponent();

    expect(screen.getByText("Actif")).toBeInTheDocument();
  });

  it("should show poll statistics", () => {
    renderComponent();

    expect(screen.getByText("5")).toBeInTheDocument(); // participants
    expect(screen.getByText("10")).toBeInTheDocument(); // votes
  });

  it("should render empty state when no items", () => {
    const { container } = renderComponent([]);
    expect(container.firstChild).toBeNull();
  });

  it("should highlight selected row", () => {
    const selectedIds = new Set(["conv-1"]);
    const { container } = renderComponent(mockItems, selectedIds);

    // Check that selected row has the blue background class
    const selectedRow = container.querySelector(".bg-blue-900\\/20");
    expect(selectedRow).toBeInTheDocument();
    
    // Check that checkbox div has blue background
    const selectedCheckbox = container.querySelector(".bg-blue-600");
    expect(selectedCheckbox).toBeInTheDocument();
  });
});
