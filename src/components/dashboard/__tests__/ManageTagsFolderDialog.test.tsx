import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ManageTagsFolderDialog } from "../ManageTagsFolderDialog";

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
    { id: "tag-3", name: "Interne", color: "#10b981", createdAt: new Date().toISOString() },
  ]),
}));

vi.mock("@/lib/storage/FolderStorage", () => ({
  getAllFolders: vi.fn(() => [
    {
      id: "folder-1",
      name: "Projets",
      color: "#3b82f6",
      icon: "📁",
      createdAt: new Date().toISOString(),
    },
    {
      id: "folder-2",
      name: "Clients",
      color: "#ef4444",
      icon: "📂",
      createdAt: new Date().toISOString(),
    },
  ]),
}));

vi.mock("@/lib/storage/ConversationStorageSimple", () => ({
  getConversation: vi.fn((id: string) => ({
    id,
    title: "Test Conversation",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    firstMessage: "Test",
    messageCount: 1,
    isFavorite: false,
    tags: [],
    metadata: {},
  })),
  updateConversation: vi.fn(),
}));

const defaultProps = {
  conversationId: "conv-1",
  currentTags: [],
  currentFolderId: undefined,
  open: true,
  onOpenChange: vi.fn(),
  onSuccess: vi.fn(),
};

describe("ManageTagsFolderDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render dialog when open", () => {
    render(<ManageTagsFolderDialog {...defaultProps} />);
    expect(screen.getByText("Gérer les tags et le dossier")).toBeInTheDocument();
  });

  it("should not render dialog when closed", () => {
    render(<ManageTagsFolderDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("Gérer les tags et le dossier")).not.toBeInTheDocument();
  });

  it("should display all available tags", () => {
    render(<ManageTagsFolderDialog {...defaultProps} />);
    expect(screen.getByText("Prioritaire")).toBeInTheDocument();
    expect(screen.getByText("Client")).toBeInTheDocument();
    expect(screen.getByText("Interne")).toBeInTheDocument();
  });

  it("should display all available folders", () => {
    render(<ManageTagsFolderDialog {...defaultProps} />);
    expect(screen.getByText("Projets")).toBeInTheDocument();
    expect(screen.getByText("Clients")).toBeInTheDocument();
  });

  it("should show current tags as selected", () => {
    render(<ManageTagsFolderDialog {...defaultProps} currentTags={["Prioritaire", "Client"]} />);
    const prioritaireCheckbox = screen.getByLabelText(/Prioritaire/i);
    const clientCheckboxes = screen.getAllByLabelText(/Client/i);
    expect(prioritaireCheckbox).toBeChecked();
    // Prendre le premier checkbox Client (il peut y en avoir plusieurs dans le DOM)
    expect(clientCheckboxes[0]).toBeChecked();
  });

  it("should show current folder as selected", () => {
    render(<ManageTagsFolderDialog {...defaultProps} currentFolderId="folder-1" />);
    const folderCheckbox = screen.getByLabelText(/Projets/i);
    expect(folderCheckbox).toBeChecked();
  });

  it("should toggle tag selection", async () => {
    const user = userEvent.setup();
    render(<ManageTagsFolderDialog {...defaultProps} />);

    const prioritaireCheckbox = screen.getByLabelText(/Prioritaire/i);
    await user.click(prioritaireCheckbox);

    expect(prioritaireCheckbox).toBeChecked();
  });

  it("should toggle folder selection", async () => {
    const user = userEvent.setup();
    render(<ManageTagsFolderDialog {...defaultProps} />);

    const folderCheckbox = screen.getByLabelText(/Projets/i);
    await user.click(folderCheckbox);

    expect(folderCheckbox).toBeChecked();
  });

  it("should allow selecting 'Aucun dossier'", async () => {
    const user = userEvent.setup();
    render(<ManageTagsFolderDialog {...defaultProps} currentFolderId="folder-1" />);

    const aucunDossierCheckbox = screen.getByLabelText(/Aucun dossier/i);
    await user.click(aucunDossierCheckbox);

    expect(aucunDossierCheckbox).toBeChecked();
  });

  it("should call onOpenChange when clicking cancel", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ManageTagsFolderDialog {...defaultProps} onOpenChange={onOpenChange} />);

    const cancelButton = screen.getByText("Annuler");
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should reset state when dialog closes and reopens", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ManageTagsFolderDialog {...defaultProps} />);

    // Sélectionner un tag
    const prioritaireCheckbox = screen.getByLabelText(/Prioritaire/i);
    await user.click(prioritaireCheckbox);

    // Fermer le dialogue
    rerender(<ManageTagsFolderDialog {...defaultProps} open={false} />);

    // Rouvrir le dialogue
    rerender(<ManageTagsFolderDialog {...defaultProps} open={true} />);

    // Vérifier que l'état est réinitialisé
    const prioritaireCheckboxAfter = screen.getByLabelText(/Prioritaire/i);
    expect(prioritaireCheckboxAfter).not.toBeChecked();
  });
});
