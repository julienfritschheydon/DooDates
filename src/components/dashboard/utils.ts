import { DashboardPoll, ConversationItem, FilterType } from "./types";
import { getConversations } from "@/lib/storage/ConversationStorageSimple";

// Trouver la conversation liée à un sondage
export function findRelatedConversation(poll: DashboardPoll): string | undefined {
  if (poll.relatedConversationId) return poll.relatedConversationId;

  try {
    const conversations = getConversations();
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
    const matchesFilter = filter === "all" || !item.poll || item.poll.status === filter;

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
    const matchesFolder =
      selectedFolderId === null ||
      selectedFolderId === undefined ||
      item.folderId === selectedFolderId;

    return matchesFilter && matchesSearch && matchesTags && matchesFolder;
  });
}
