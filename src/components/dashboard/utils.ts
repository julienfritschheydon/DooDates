import { DashboardPoll, ConversationItem, FilterType } from "./types";
import { getConversations } from "@/lib/storage/ConversationStorageSimple";

// Trouver la conversation liée à un sondage
// userId optionnel pour filtrer par utilisateur (sécurité)
export function findRelatedConversation(
  poll: DashboardPoll,
  userId?: string | null,
): string | undefined {
  if (poll.relatedConversationId) return poll.relatedConversationId;

  try {
    const allConversations = getConversations();
    // Filtrer par utilisateur si userId est fourni
    const conversations = userId
      ? allConversations.filter((conv) => conv.userId === userId)
      : allConversations;
    
    const match = conversations.find((conv) => {
      const metadata = conv.metadata as any;
      return metadata?.pollGenerated && metadata?.pollId === poll.id;
    });
    return match?.id;
  } catch {
    return undefined;
  }
}

// Couleur du badge de statut
export function getStatusColor(status: DashboardPoll["status"]): string {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-800";
    case "active":
      return "bg-blue-100 text-blue-800";
    case "closed":
      return "bg-blue-100 text-blue-800";
    case "archived":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Label du statut
export function getStatusLabel(status: DashboardPoll["status"]): string {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "active":
      return "Actif";
    case "closed":
      return "Terminé";
    case "archived":
      return "Archivé";
    default:
      return status;
  }
}

// Filtrer les items selon le filtre, la recherche, les tags et les dossiers
export function filterConversationItems(
  items: ConversationItem[],
  filter: FilterType,
  searchQuery: string,
  selectedTags?: string[],
  selectedFolderId?: string | null,
): ConversationItem[] {
  return items.filter((item) => {
    // Filtre par statut (appliqué au poll si existe)
    // Pour "all", on affiche tout
    // Pour les autres filtres (draft, active, closed, archived), on n'affiche que les items avec un poll ayant le statut correspondant
    const matchesFilter = filter === "all" || (item.poll && item.poll.status === filter);

    // Recherche dans le titre de la conversation et du poll
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      item.conversationTitle.toLowerCase().includes(searchLower) ||
      (item.poll?.title?.toLowerCase().includes(searchLower) ?? false) ||
      (item.poll?.description?.toLowerCase().includes(searchLower) ?? false) ||
      (item.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ?? false);

    // Filtre par tags
    const matchesTags =
      !selectedTags ||
      selectedTags.length === 0 ||
      selectedTags.every((tag) => item.tags?.includes(tag));

    // Filtre par dossier
    // Si selectedFolderId === null, on filtre uniquement les items sans dossier
    // Si selectedFolderId === undefined, on affiche tous les items
    // Sinon, on filtre par folderId spécifique
    const matchesFolder =
      selectedFolderId === undefined ||
      (selectedFolderId === null ? !item.folderId : item.folderId === selectedFolderId);

    return matchesFilter && matchesSearch && matchesTags && matchesFolder;
  });
}
