import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardFilters } from "../DashboardFilters";
import type { FilterType } from "../types";

// Mock des hooks
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock des storages
vi.mock("@/lib/storage/TagStorage", () => ({
  getAllTags: vi.fn(() => [
    { id: "tag-1", name: "Prioritaire", color: "#ef4444", createdAt: new Date().toISOString() },
    { id: "tag-2", name: "Client", color: "#3b82f6", createdAt: new Date().toISOString() },
  ]),
  createTag: vi.fn((name: string) => ({
    id: `tag-${Date.now()}`,
    name,
    color: "#3b82f6",
    createdAt: new Date().toISOString(),
  })),
}));

vi.mock("@/lib/storage/FolderStorage", () => ({
  getAllFolders: vi.fn(() => [
    { id: "folder-1", name: "Projets", color: "#3b82f6", icon: "📁", createdAt: new Date().toISOString() },
    { id: "folder-2", name: "Clients", color: "#ef4444", icon: "📂", createdAt: new Date().toISOString() },
  ]),
  createFolder: vi.fn((name: string) => ({
    id: `folder-${Date.now()}`,
    name,
    color: "#3b82f6",
    icon: "📁",
    createdAt: new Date().toISOString(),
  })),
}));

const defaultProps = {
  searchQuery: "",
  onSearchChange: vi.fn(),
  filter: "all" as FilterType,
  onFilterChange: vi.fn(),
  viewMode: "grid" as const,
  onViewModeChange: vi.fn(),
  selectedTags: [],
  onTagsChange: vi.fn(),
  selectedFolderId: undefined,
  onFolderChange: vi.fn(),
};

describe("DashboardFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render search input", () => {
    render(<DashboardFilters {...defaultProps} />);
    const searchInput = screen.getByTestId("search-conversations");
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute("placeholder", "Rechercher une conversation ou un sondage...");
  });

  it("should call onSearchChange when typing in search input", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const { rerender } = render(<DashboardFilters {...defaultProps} searchQuery="" onSearchChange={onSearchChange} />);

    const searchInput = screen.getByTestId("search-conversations");
    
    // Simuler la saisie en utilisant fireEvent pour être sûr que onChange est déclenché
    fireEvent.change(searchInput, { target: { value: "test" } });
    
    // Attendre que l'événement soit traité
    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledWith("test");
    });
  });

  it("should render filter buttons", () => {
    render(<DashboardFilters {...defaultProps} />);
    expect(screen.getByText("Tous")).toBeInTheDocument();
    expect(screen.getByText("Brouillon")).toBeInTheDocument();
    expect(screen.getByText("Actif")).toBeInTheDocument();
    expect(screen.getByText("Terminé")).toBeInTheDocument();
    expect(screen.getByText("Archivé")).toBeInTheDocument();
  });

  it("should highlight active filter", () => {
    render(<DashboardFilters {...defaultProps} filter="active" />);
    const activeButton = screen.getByText("Actif").closest("button");
    expect(activeButton).toHaveClass("bg-blue-500");
  });

  it("should call onFilterChange when clicking filter button", () => {
    const onFilterChange = vi.fn();
    render(<DashboardFilters {...defaultProps} onFilterChange={onFilterChange} />);

    const activeButton = screen.getByText("Actif");
    fireEvent.click(activeButton);

    expect(onFilterChange).toHaveBeenCalledWith("active");
  });

  it("should render view mode toggle buttons", () => {
    render(<DashboardFilters {...defaultProps} />);
    const gridButton = screen.getByTitle("Vue grille");
    const tableButton = screen.getByTitle("Vue table");
    expect(gridButton).toBeInTheDocument();
    expect(tableButton).toBeInTheDocument();
  });

  it("should highlight active view mode", () => {
    render(<DashboardFilters {...defaultProps} viewMode="table" />);
    const tableButton = screen.getByTitle("Vue table");
    expect(tableButton).toHaveClass("bg-blue-500");
  });

  it("should call onViewModeChange when clicking view mode button", () => {
    const onViewModeChange = vi.fn();
    render(<DashboardFilters {...defaultProps} onViewModeChange={onViewModeChange} />);

    const tableButton = screen.getByTitle("Vue table");
    fireEvent.click(tableButton);

    expect(onViewModeChange).toHaveBeenCalledWith("table");
  });

  it("should render tags filter button", () => {
    render(<DashboardFilters {...defaultProps} />);
    expect(screen.getByText(/Tags/i)).toBeInTheDocument();
  });

  it("should show selected tags count", () => {
    render(<DashboardFilters {...defaultProps} selectedTags={["Prioritaire", "Client"]} />);
    expect(screen.getByText(/Tags.*2/i)).toBeInTheDocument();
  });

  it("should open tags menu when clicking tags button", async () => {
    const user = userEvent.setup();
    render(<DashboardFilters {...defaultProps} />);

    const tagsButton = screen.getByText(/Tags/i).closest("button");
    await user.click(tagsButton!);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Nouveau tag...")).toBeInTheDocument();
    });
  });

  it("should toggle tag selection", async () => {
    const user = userEvent.setup();
    const onTagsChange = vi.fn();
    render(<DashboardFilters {...defaultProps} onTagsChange={onTagsChange} />);

    const tagsButton = screen.getByText(/Tags/i).closest("button");
    await user.click(tagsButton!);

    await waitFor(() => {
      expect(screen.getByText("Prioritaire")).toBeInTheDocument();
    });

    const tagCheckbox = screen.getByLabelText(/Prioritaire/i);
    await user.click(tagCheckbox);

    expect(onTagsChange).toHaveBeenCalledWith(["Prioritaire"]);
  });

  it("should create new tag", async () => {
    const user = userEvent.setup();
    const { createTag } = await import("@/lib/storage/TagStorage");
    const onTagsChange = vi.fn();

    render(<DashboardFilters {...defaultProps} onTagsChange={onTagsChange} />);

    const tagsButton = screen.getByText(/Tags/i).closest("button");
    await user.click(tagsButton!);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Nouveau tag...")).toBeInTheDocument();
    });

    const newTagInput = screen.getByPlaceholderText("Nouveau tag...");
    await user.type(newTagInput, "Nouveau Tag");
    await user.click(screen.getByText("Créer"));

    expect(createTag).toHaveBeenCalledWith("Nouveau Tag");
  });

  it("should render folders filter button", () => {
    render(<DashboardFilters {...defaultProps} />);
    expect(screen.getByText(/Tous les dossiers/i)).toBeInTheDocument();
  });

  it("should show selected folder name", () => {
    render(<DashboardFilters {...defaultProps} selectedFolderId="folder-1" />);
    expect(screen.getByText("Projets")).toBeInTheDocument();
  });

  it("should open folders menu when clicking folders button", async () => {
    const user = userEvent.setup();
    render(<DashboardFilters {...defaultProps} />);

    const foldersButton = screen.getByText(/Tous les dossiers/i).closest("button");
    await user.click(foldersButton!);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Nouveau dossier...")).toBeInTheDocument();
    });
  });

  it("should select folder", async () => {
    const user = userEvent.setup();
    const onFolderChange = vi.fn();
    render(<DashboardFilters {...defaultProps} onFolderChange={onFolderChange} />);

    const foldersButton = screen.getByText(/Tous les dossiers/i).closest("button");
    await user.click(foldersButton!);

    await waitFor(() => {
      expect(screen.getByText("Projets")).toBeInTheDocument();
    });

    const folderButton = screen.getByText("Projets");
    await user.click(folderButton);

    expect(onFolderChange).toHaveBeenCalledWith("folder-1");
  });

  it("should create new folder", async () => {
    const user = userEvent.setup();
    const { createFolder } = await import("@/lib/storage/FolderStorage");

    render(<DashboardFilters {...defaultProps} />);

    const foldersButton = screen.getByText(/Tous les dossiers/i).closest("button");
    await user.click(foldersButton!);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Nouveau dossier...")).toBeInTheDocument();
    });

    const newFolderInput = screen.getByPlaceholderText("Nouveau dossier...");
    await user.type(newFolderInput, "Nouveau Dossier");
    await user.click(screen.getByText("Créer"));

    expect(createFolder).toHaveBeenCalledWith("Nouveau Dossier");
  });

  it("should display selected tags as badges", () => {
    render(<DashboardFilters {...defaultProps} selectedTags={["Prioritaire", "Client"]} />);
    expect(screen.getByText("Prioritaire")).toBeInTheDocument();
    expect(screen.getByText("Client")).toBeInTheDocument();
  });

  it("should remove tag from selection when clicking X on badge", async () => {
    const user = userEvent.setup();
    const onTagsChange = vi.fn();
    render(
      <DashboardFilters {...defaultProps} selectedTags={["Prioritaire", "Client"]} onTagsChange={onTagsChange} />,
    );

    const prioritaireBadge = screen.getByText("Prioritaire").closest("span");
    const removeButton = prioritaireBadge?.querySelector("button");
    await user.click(removeButton!);

    expect(onTagsChange).toHaveBeenCalledWith(["Client"]);
  });
});
