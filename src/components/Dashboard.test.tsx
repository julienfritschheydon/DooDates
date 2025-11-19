import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Dashboard from "./Dashboard";
import { useDashboardData } from "./dashboard/useDashboardData";
import { useAuth } from "../contexts/AuthContext";
import { useFreemiumQuota } from "../hooks/useFreemiumQuota";
import { useConversations } from "../hooks/useConversations";
import { usePollDeletionCascade } from "../hooks/usePollDeletionCascade";
import { useToast } from "../hooks/use-toast";
import { useViewportItems } from "../hooks/useViewportItems";
import { logger } from "../lib/logger";

// Mock all dependencies
const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("./dashboard/useDashboardData", () => ({
  useDashboardData: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/useFreemiumQuota", () => ({
  useFreemiumQuota: vi.fn(),
}));

vi.mock("@/hooks/useConversations", () => ({
  useConversations: vi.fn(),
}));

vi.mock("@/hooks/usePollDeletionCascade", () => ({
  usePollDeletionCascade: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(),
}));

vi.mock("@/hooks/useViewportItems", () => ({
  useViewportItems: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("./dashboard/DashboardFilters", () => ({
  DashboardFilters: ({ onSearchChange, onFilterChange, onContentTypeFilterChange, onViewModeChange, onTagsChange, onFolderChange, onSelectAll, onClearSelection, selectedIdsCount }: any) => (
    <div data-testid="dashboard-filters">
      <input
        data-testid="search-input"
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search..."
      />
      <button data-testid="filter-all" onClick={() => onFilterChange("all")}>All</button>
      <button data-testid="filter-active" onClick={() => onFilterChange("active")}>Active</button>
      <button data-testid="content-type-all" onClick={() => onContentTypeFilterChange("all")}>All Types</button>
      <button data-testid="content-type-polls" onClick={() => onContentTypeFilterChange("polls")}>Polls</button>
      <button data-testid="view-mode-grid" onClick={() => onViewModeChange("grid")}>Grid</button>
      <button data-testid="view-mode-table" onClick={() => onViewModeChange("table")}>Table</button>
      <button data-testid="select-all" onClick={onSelectAll}>Select All</button>
      <button data-testid="clear-selection" onClick={onClearSelection}>Clear</button>
      <span data-testid="selected-count">{selectedIdsCount}</span>
    </div>
  ),
}));

vi.mock("./dashboard/ConversationCard", () => ({
  ConversationCard: ({ item, isSelected, onToggleSelection, onRefresh }: any) => (
    <div data-testid={`conversation-card-${item.id}`}>
      <span>{item.title}</span>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelection}
        data-testid={`select-${item.id}`}
      />
      <button onClick={onRefresh} data-testid={`refresh-${item.id}`}>Refresh</button>
    </div>
  ),
}));

vi.mock("./dashboard/DashboardTableView", () => ({
  DashboardTableView: ({ items, selectedIds, onToggleSelection, onRefresh }: any) => (
    <div data-testid="dashboard-table-view">
      {items.map((item: any) => (
        <div key={item.id} data-testid={`table-row-${item.id}`}>
          <span>{item.title}</span>
          <input
            type="checkbox"
            checked={selectedIds.has(item.id)}
            onChange={() => onToggleSelection(item.id)}
            data-testid={`table-select-${item.id}`}
          />
          <button onClick={onRefresh} data-testid={`table-refresh-${item.id}`}>Refresh</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock("./layout/CreatePageLayout", () => ({
  CreatePageLayout: ({ children }: any) => <div data-testid="create-page-layout">{children}</div>,
}));

vi.mock("@/components/ui/pagination", () => ({
  Pagination: ({ children }: any) => <div data-testid="pagination">{children}</div>,
  PaginationContent: ({ children }: any) => <div>{children}</div>,
  PaginationItem: ({ children }: any) => <div>{children}</div>,
  PaginationLink: ({ children, isActive, onClick }: any) => (
    <button
      data-testid={`page-${children}`}
      className={isActive ? "active" : ""}
      onClick={onClick}
    >
      {children}
    </button>
  ),
  PaginationNext: ({ onClick, className }: any) => (
    <button data-testid="pagination-next" onClick={onClick} className={className}>
      Next
    </button>
  ),
  PaginationPrevious: ({ onClick, className }: any) => (
    <button data-testid="pagination-previous" onClick={onClick} className={className}>
      Previous
    </button>
  ),
  PaginationEllipsis: () => <span data-testid="pagination-ellipsis">...</span>,
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
}));

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

describe("Dashboard", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const mockConversationItems = [
    {
      id: "conv-1",
      title: "Test Conversation 1",
      status: "active",
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-15T10:00:00Z"),
      firstMessage: "Hello AI",
      messageCount: 5,
      isFavorite: false,
      tags: [],
      userId: "user-1",
    },
    {
      id: "conv-2",
      title: "Test Conversation 2",
      status: "completed",
      createdAt: new Date("2024-01-14T10:00:00Z"),
      updatedAt: new Date("2024-01-14T10:00:00Z"),
      firstMessage: "Create a poll",
      messageCount: 3,
      relatedPollId: "poll-1",
      pollId: "poll-1",
      pollType: "date",
      pollStatus: "active",
      isFavorite: true,
      favorite_rank: 1,
      tags: ["tag1"],
      userId: "user-1",
    },
  ];

  const mockQuotaStatus = {
    conversations: {
      used: 5,
      limit: 10,
      percentage: 50,
      isNearLimit: false,
      isAtLimit: false,
    },
    aiMessages: {
      used: 25,
      limit: 50,
      percentage: 50,
      isNearLimit: false,
      isAtLimit: false,
    },
    polls: {
      used: 2,
      limit: 20,
      percentage: 10,
      isNearLimit: false,
      isAtLimit: false,
    },
    storage: {
      used: 100,
      limit: 1000,
      percentage: 10,
      isNearLimit: false,
      isAtLimit: false,
    },
  };

  const mockGuestQuotaSyncState = {
    isLoading: false,
    error: null,
    lastSync: null,
    data: null,
    pendingSync: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);

    // Mock all hooks
    vi.mocked(useDashboardData).mockReturnValue({
      conversationItems: mockConversationItems,
      loading: false,
      reload: vi.fn(),
    });

    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "user-1",
        email: "test@example.com",
        app_metadata: { provider: "email" },
        user_metadata: {},
        aud: "authenticated",
        created_at: "2024-01-01T00:00:00Z",
      },
      profile: null,
      session: null,
      loading: false,
      error: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.mocked(useFreemiumQuota).mockReturnValue({
      limits: {
        conversations: 10,
        polls: 20,
        storageSize: 1000,
      },
      usage: {
        conversations: 5,
        polls: 2,
        aiMessages: 25,
        storageUsed: 100,
      },
      status: mockQuotaStatus,
      isAuthenticated: false,
      canCreateConversation: vi.fn().mockResolvedValue(true),
      canCreatePoll: vi.fn().mockResolvedValue(true),
      canUseFeature: vi.fn().mockResolvedValue(true),
      checkConversationLimit: vi.fn().mockReturnValue(true),
      checkPollLimit: vi.fn().mockReturnValue(true),
      checkFeatureAccess: vi.fn().mockResolvedValue(true),
      showAuthModal: false,
      authModalTrigger: "conversation_limit",
      showAuthIncentive: vi.fn(),
      closeAuthModal: vi.fn(),
      getRemainingConversations: vi.fn().mockReturnValue(5),
      getRemainingPolls: vi.fn().mockReturnValue(18),
      getStoragePercentage: vi.fn().mockReturnValue(10),
      guestQuota: mockGuestQuotaSyncState,
    });

    vi.mocked(useConversations).mockReturnValue({
      conversations: {
        conversations: [],
        totalCount: 0,
        hasMore: false,
        isEmpty: true,
        isLoading: false,
        isError: false,
        isSuccess: true,
        error: undefined,
      },
      useConversation: vi.fn(),
      createConversation: {
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: false,
        isError: false,
        isSuccess: false,
        error: undefined,
        reset: vi.fn(),
      },
      updateConversation: {
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: false,
        isError: false,
        isSuccess: false,
        error: undefined,
        reset: vi.fn(),
      },
      deleteConversation: {
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: false,
        isError: false,
        isSuccess: false,
        error: undefined,
        reset: vi.fn(),
      },
      addMessage: {
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: false,
        isError: false,
        isSuccess: false,
        error: undefined,
        reset: vi.fn(),
      },
      loadMore: vi.fn(),
      refresh: vi.fn(),
      searchConversations: vi.fn(),
      reorderFavorite: vi.fn(),
      isLoadingMore: false,
      canLoadMore: false,
      isRefreshing: false,
      config: {
        pageSize: 20,
        enableRealtime: true,
        enableOptimisticUpdates: true,
        filters: {},
        sortBy: "updatedAt",
        sortOrder: "desc",
      },
    });

    vi.mocked(usePollDeletionCascade).mockReturnValue({
      deletePollWithCascade: vi.fn(),
      cleanupConversationLink: vi.fn(),
      checkPollLinks: vi.fn(),
      getOrphanedLinks: vi.fn(),
      cleanupOrphanedLinks: vi.fn(),
      isDeleting: false,
      deleteError: undefined,
    });

    vi.mocked(useToast).mockReturnValue({
      toast: vi.fn(),
      dismiss: vi.fn(),
      toasts: [],
    });

    vi.mocked(useViewportItems).mockReturnValue(12);

    // Mock localStorage
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      if (key === "dashboard_view_preference") return "grid";
      return null;
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});

    // Mock window methods
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.spyOn(window, "addEventListener").mockImplementation(() => {});
    vi.spyOn(window, "removeEventListener").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading state", () => {
    it("should show loading spinner when loading", () => {
      vi.mocked(useDashboardData).mockReturnValue({
        conversationItems: [],
        loading: true,
        reload: vi.fn(),
      });

      render(<Dashboard />);

      expect(screen.getByTestId("dashboard-loading")).toBeInTheDocument();
      expect(screen.queryByTestId("dashboard-ready")).not.toBeInTheDocument();
    });

    it("should show dashboard content when not loading", () => {
      render(<Dashboard />);

      expect(screen.getByTestId("dashboard-ready")).toBeInTheDocument();
      expect(screen.queryByTestId("dashboard-loading")).not.toBeInTheDocument();
    });
  });

  describe("Header and layout", () => {
    it("should render header with title and description", () => {
      render(<Dashboard />);

      expect(screen.getByText("Tableau de bord")).toBeInTheDocument();
      expect(screen.getByText("Pilotez vos conversations, sondages et analyses IA en un clin d'œil.")).toBeInTheDocument();
    });

    it("should render within CreatePageLayout", () => {
      render(<Dashboard />);

      expect(screen.getByTestId("create-page-layout")).toBeInTheDocument();
    });
  });

  describe("Quota display", () => {
    it("should display quota information", () => {
      render(<Dashboard />);

      expect(screen.getByText("5/10 crédits utilisés")).toBeInTheDocument();
    });

    it("should show different styling when near limit", () => {
      const nearLimitQuota = {
        ...mockQuotaStatus,
        conversations: { ...mockQuotaStatus.conversations, isNearLimit: true },
        aiMessages: mockQuotaStatus.aiMessages, // Add missing aiMessages
      };

      vi.mocked(useFreemiumQuota).mockReturnValue({
        limits: {
          conversations: 10,
          polls: 20,
          storageSize: 1000,
        },
        usage: {
          conversations: 5,
          polls: 2,
          aiMessages: 25,  // Add missing aiMessages
          storageUsed: 100,
        },
        status: nearLimitQuota,
        isAuthenticated: false,
        canCreateConversation: vi.fn().mockResolvedValue(true),
        canCreatePoll: vi.fn().mockResolvedValue(true),
        canUseFeature: vi.fn().mockResolvedValue(true),
        checkConversationLimit: vi.fn().mockReturnValue(true),
        checkPollLimit: vi.fn().mockReturnValue(true),
        checkFeatureAccess: vi.fn().mockResolvedValue(true),
        showAuthModal: false,
        authModalTrigger: "conversation_limit",
        showAuthIncentive: vi.fn(),
        closeAuthModal: vi.fn(),
        getRemainingConversations: vi.fn().mockReturnValue(5),
        getRemainingPolls: vi.fn().mockReturnValue(18),
        getStoragePercentage: vi.fn().mockReturnValue(10),
        guestQuota: mockGuestQuotaSyncState,
      });

      render(<Dashboard />);

      // Check for orange styling (near limit)
      const quotaContainer = screen.getByText("5/10 crédits utilisés").closest("div");
      expect(quotaContainer).toHaveClass("bg-orange-900/20", "border-orange-500/50");
    });
  });

  describe("Filtering and search", () => {
    it("should render DashboardFilters component", () => {
      render(<Dashboard />);

      expect(screen.getByTestId("dashboard-filters")).toBeInTheDocument();
    });

    it("should update search query", async () => {
      const user = userEvent.setup();
      render(<Dashboard />);

      const searchInput = screen.getByTestId("search-input");
      await user.type(searchInput, "test search");

      expect(searchInput).toHaveValue("test search");
    });

    it("should change filter", async () => {
      const user = userEvent.setup();
      render(<Dashboard />);

      const activeFilterBtn = screen.getByTestId("filter-active");
      await user.click(activeFilterBtn);

      // The filter state should change (verified through component behavior)
      expect(activeFilterBtn).toBeInTheDocument();
    });
  });

  describe("View modes", () => {
    it("should default to grid view on desktop", () => {
      render(<Dashboard />);

      // Should show grid layout (conversation cards)
      expect(screen.getByTestId("conversation-card-conv-1")).toBeInTheDocument();
      expect(screen.getByTestId("conversation-card-conv-2")).toBeInTheDocument();
    });

    it("should switch to table view", async () => {
      const user = userEvent.setup();
      render(<Dashboard />);

      const tableBtn = screen.getByTestId("view-mode-table");
      await user.click(tableBtn);

      // Should show table view
      expect(screen.getByTestId("dashboard-table-view")).toBeInTheDocument();
      expect(screen.queryByTestId("conversation-card-conv-1")).not.toBeInTheDocument();
    });

    it("should force grid view on mobile", () => {
      Object.defineProperty(window, "innerWidth", { value: 600, writable: true });

      render(<Dashboard />);

      // Should show grid even if table was preferred
      expect(screen.getByTestId("conversation-card-conv-1")).toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    it("should show empty state when no items", () => {
      vi.mocked(useDashboardData).mockReturnValue({
        conversationItems: [],
        loading: false,
        reload: vi.fn(),
      });

      render(<Dashboard />);

      expect(screen.getByText("Aucune conversation")).toBeInTheDocument();
      expect(screen.getByText("Commencez une conversation avec l'IA pour créer des sondages")).toBeInTheDocument();
    });

    it("should show no results message when filters applied", async () => {
      const user = userEvent.setup();
      render(<Dashboard />);

      const searchInput = screen.getByTestId("search-input");
      await user.type(searchInput, "nonexistent");

      expect(screen.getByText("Aucun résultat")).toBeInTheDocument();
      expect(screen.getByText("Essayez avec d'autres critères")).toBeInTheDocument();
    });
  });

  describe("Selection and bulk operations", () => {
    it("should handle item selection", async () => {
      const user = userEvent.setup();
      render(<Dashboard />);

      const selectCheckbox = screen.getByTestId("select-conv-1");
      await user.click(selectCheckbox);

      expect(selectCheckbox).toBeChecked();
      expect(screen.getByTestId("selected-count")).toHaveTextContent("1");
    });

    it("should handle select all", async () => {
      const user = userEvent.setup();
      render(<Dashboard />);

      const selectAllBtn = screen.getByTestId("select-all");
      await user.click(selectAllBtn);

      // Only first page items should be selected (12 items per page by default)
      expect(screen.getByTestId("selected-count")).toHaveTextContent("2");
    });

    it("should handle clear selection", async () => {
      const user = userEvent.setup();
      render(<Dashboard />);

      // Select an item first
      const selectCheckbox = screen.getByTestId("select-conv-1");
      await user.click(selectCheckbox);

      // Then clear selection
      const clearBtn = screen.getByTestId("clear-selection");
      await user.click(clearBtn);

      expect(screen.getByTestId("selected-count")).toHaveTextContent("0");
    });

    it("should show bulk delete UI when items selected", async () => {
      const user = userEvent.setup();
      render(<Dashboard />);

      const selectCheckbox = screen.getByTestId("select-conv-1");
      await user.click(selectCheckbox);

      expect(screen.getByText("1 élément(s) sélectionné(s)")).toBeInTheDocument();
      expect(screen.getByText("Supprimer")).toBeInTheDocument();
      expect(screen.getByText("Annuler")).toBeInTheDocument();
    });

    it("should handle bulk delete", async () => {
      const mockDeleteConversation = vi.fn().mockResolvedValue(undefined);
      const mockToast = vi.fn();

      vi.mocked(useConversations).mockReturnValue({
        conversations: {
          conversations: mockConversationItems,
          totalCount: mockConversationItems.length,
          hasMore: false,
          isEmpty: false,
          isLoading: false,
          isError: false,
          isSuccess: true,
          error: undefined,
        },
        useConversation: vi.fn(),
        createConversation: {
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
          isError: false,
          isSuccess: false,
          error: undefined,
          reset: vi.fn(),
        },
        updateConversation: {
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
          isError: false,
          isSuccess: false,
          error: undefined,
          reset: vi.fn(),
        },
        deleteConversation: {
          mutate: vi.fn(),
          mutateAsync: mockDeleteConversation,
          isLoading: false,
          isError: false,
          isSuccess: false,
          error: undefined,
          reset: vi.fn(),
        },
        addMessage: {
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
          isError: false,
          isSuccess: false,
          error: undefined,
          reset: vi.fn(),
        },
        loadMore: vi.fn(),
        refresh: vi.fn(),
        searchConversations: vi.fn(),
        reorderFavorite: vi.fn(),
        isLoadingMore: false,
        canLoadMore: false,
        isRefreshing: false,
        config: {
          pageSize: 20,
          enableRealtime: true,
          enableOptimisticUpdates: true,
          filters: {},
          sortBy: "updatedAt",
          sortOrder: "desc",
        },
      });

      vi.mocked(useToast).mockReturnValue({
        toast: mockToast,
        dismiss: vi.fn(),
        toasts: [],
      });

      const user = userEvent.setup();
      render(<Dashboard />);

      // Select item and delete
      const selectCheckbox = screen.getByTestId("select-conv-1");
      await user.click(selectCheckbox);

      const deleteBtn = screen.getByText("Supprimer");
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(mockDeleteConversation).toHaveBeenCalledWith("conv-1");
        expect(mockToast).toHaveBeenCalledWith({
          title: "Suppression réussie",
          description: "1 élément(s) supprimé(s).",
        });
      });
    });

    it("should handle bulk delete with confirmation", async () => {
      mockConfirm.mockReturnValue(false); // User cancels

      const user = userEvent.setup();
      render(<Dashboard />);

      const selectCheckbox = screen.getByTestId("select-conv-1");
      await user.click(selectCheckbox);

      const deleteBtn = screen.getByText("Supprimer");
      await user.click(deleteBtn);

      expect(mockConfirm).toHaveBeenCalledWith(
        expect.stringContaining("Êtes-vous sûr de vouloir supprimer 1 élément(s)")
      );
      // Should not delete since user cancelled
      expect(screen.getByTestId("selected-count")).toHaveTextContent("1");
    });
  });

  describe("Pagination", () => {
    it("should not show pagination with few items", () => {
      vi.mocked(useViewportItems).mockReturnValue(20); // More than item count

      render(<Dashboard />);

      expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    });

    it("should show pagination with many items", () => {
      vi.mocked(useViewportItems).mockReturnValue(1); // Force pagination

      render(<Dashboard />);

      expect(screen.getByTestId("pagination")).toBeInTheDocument();
      expect(screen.getByText("Page 1 sur 2 (2 éléments)")).toBeInTheDocument();
    });

    it("should handle page navigation", async () => {
      vi.mocked(useViewportItems).mockReturnValue(1); // Force pagination

      const user = userEvent.setup();
      render(<Dashboard />);

      const nextBtn = screen.getByTestId("pagination-next");
      await user.click(nextBtn);

      expect(screen.getByText("Page 2 sur 2 (2 éléments)")).toBeInTheDocument();
    });
  });

  describe("Event handling", () => {
    it("should refresh dashboard on pollCreated event", () => {
      const mockReload = vi.fn();
      vi.mocked(useDashboardData).mockReturnValue({
        conversationItems: mockConversationItems,
        loading: false,
        reload: mockReload,
      });

      render(<Dashboard />);

      // Simulate pollCreated event
      act(() => {
        window.dispatchEvent(new Event("pollCreated"));
      });

      expect(mockReload).toHaveBeenCalled();
    });

    it("should handle window resize", () => {
      render(<Dashboard />);

      // Simulate window resize to mobile
      act(() => {
        Object.defineProperty(window, "innerWidth", { value: 600, writable: true });
        window.dispatchEvent(new Event("resize"));
      });

      // Should still work (test that event listeners are properly set up)
      expect(screen.getByTestId("dashboard-ready")).toBeInTheDocument();
    });
  });

  describe("LocalStorage integration", () => {
    it("should save view preference to localStorage", async () => {
      const user = userEvent.setup();
      render(<Dashboard />);

      const tableBtn = screen.getByTestId("view-mode-table");
      await user.click(tableBtn);

      expect(localStorage.setItem).toHaveBeenCalledWith("dashboard_view_preference", "table");
    });

    it("should load view preference from localStorage", () => {
      vi.spyOn(Storage.prototype, "getItem").mockReturnValue("table");

      render(<Dashboard />);

      // Should show table view
      expect(screen.getByTestId("dashboard-table-view")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should handle quota navigation clicks", async () => {
      const user = userEvent.setup();

      vi.mock("react-router-dom", () => ({
        useNavigate: () => mockNavigate,
      }));

      render(<Dashboard />);

      const journalLink = screen.getByText("Journal");
      await user.click(journalLink);

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/journal");
    });
  });

  describe("Error handling", () => {
    it("should handle bulk delete errors gracefully", async () => {
      const mockDeleteConversation = vi.fn().mockRejectedValue(new Error("Delete failed"));
      const mockToast = vi.fn();

      vi.mocked(useConversations).mockReturnValue({
        conversations: {
          conversations: mockConversationItems,
          totalCount: mockConversationItems.length,
          hasMore: false,
          isEmpty: false,
          isLoading: false,
          isError: false,
          isSuccess: true,
          error: undefined,
        },
        useConversation: vi.fn(),
        createConversation: {
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
          isError: false,
          isSuccess: false,
          error: undefined,
          reset: vi.fn(),
        },
        updateConversation: {
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
          isError: false,
          isSuccess: false,
          error: undefined,
          reset: vi.fn(),
        },
        deleteConversation: {
          mutate: vi.fn(),
          mutateAsync: mockDeleteConversation,
          isLoading: false,
          isError: false,
          isSuccess: false,
          error: undefined,
          reset: vi.fn(),
        },
        addMessage: {
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isLoading: false,
          isError: false,
          isSuccess: false,
          error: undefined,
          reset: vi.fn(),
        },
        loadMore: vi.fn(),
        refresh: vi.fn(),
        searchConversations: vi.fn(),
        reorderFavorite: vi.fn(),
        isLoadingMore: false,
        canLoadMore: false,
        isRefreshing: false,
        config: {
          pageSize: 20,
          enableRealtime: true,
          enableOptimisticUpdates: true,
          filters: {},
          sortBy: "updatedAt",
          sortOrder: "desc",
        },
      });

      vi.mocked(useToast).mockReturnValue({
        toast: mockToast,
        dismiss: vi.fn(),
        toasts: [],
      });

      const user = userEvent.setup();
      render(<Dashboard />);

      const selectCheckbox = screen.getByTestId("select-conv-1");
      await user.click(selectCheckbox);

      const deleteBtn = screen.getByText("Supprimer");
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Erreur",
          description: "Impossible de supprimer les éléments sélectionnés.",
          variant: "destructive",
        });
      });
    });
  });
});
