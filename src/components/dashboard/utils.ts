import { DashboardPoll, ConversationItem, FilterType, ContentTypeFilter } from "./types";
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
      const metadata = conv.metadata || {};
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
  contentTypeFilter?: ContentTypeFilter,
): ConversationItem[] {
  return items.filter((item) => {
    // Filtre par statut (appliqué au poll si existe)
    // Pour "all", on affiche tout
    // Pour les autres filtres (draft, active, closed, archived), on n'affiche que les items avec un poll ayant le statut correspondant
    const matchesFilter = filter === "all" || (item.poll && item.poll.status === filter);

    // Filtre par type de contenu
    const matchesContentType =
      !contentTypeFilter ||
      contentTypeFilter === "all" ||
      (contentTypeFilter === "conversations" && !item.poll) ||
      (contentTypeFilter === "date" && item.poll?.type === "date") ||
      (contentTypeFilter === "availability" && item.poll?.type === "availability") ||
      (contentTypeFilter === "form" && item.poll?.type === "form") ||
      (contentTypeFilter === "quizz" && item.poll?.type === "quizz");

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

    return matchesFilter && matchesContentType && matchesSearch && matchesTags && matchesFolder;
  });
}

export function getThemeColors(type: ContentTypeFilter) {
  switch (type) {
    case "form":
      return {
        bg: "bg-violet-900/20",
        border: "border-violet-500/50",
        text: "text-violet-400",
        progressBg: "bg-violet-500",
        hoverText: "group-hover:text-violet-300",
        buttonText: "text-violet-400 hover:text-violet-300 hover:bg-violet-900/20",
        primaryButton: "bg-violet-600 hover:bg-violet-700",
        checkbox: "bg-violet-600 border-violet-600",
        lightBadge: "bg-violet-500/20 text-violet-400",
        selectionBg: "bg-violet-900/20",
        activeBorder: "border-violet-500",
        ring: "ring-violet-500/50",
        linkText: "text-violet-400 hover:text-violet-300",
      };
    case "availability":
      return {
        bg: "bg-green-900/20",
        border: "border-green-500/50",
        text: "text-green-400",
        progressBg: "bg-green-500",
        hoverText: "group-hover:text-green-300",
        buttonText: "text-green-400 hover:text-green-300 hover:bg-green-900/20",
        primaryButton: "bg-green-600 hover:bg-green-700",
        checkbox: "bg-green-600 border-green-600",
        lightBadge: "bg-green-500/20 text-green-400",
        selectionBg: "bg-green-900/20",
        activeBorder: "border-green-500",
        ring: "ring-green-500/50",
        linkText: "text-green-400 hover:text-green-300",
      };
    case "quizz":
      return {
        bg: "bg-amber-900/20",
        border: "border-amber-500/50",
        text: "text-amber-400",
        progressBg: "bg-amber-500",
        hoverText: "group-hover:text-amber-300",
        buttonText: "text-amber-400 hover:text-amber-300 hover:bg-amber-900/20",
        primaryButton: "bg-amber-600 hover:bg-amber-700",
        checkbox: "bg-amber-600 border-amber-600",
        lightBadge: "bg-amber-500/20 text-amber-400",
        selectionBg: "bg-amber-900/20",
        activeBorder: "border-amber-500",
        ring: "ring-amber-500/50",
        linkText: "text-amber-400 hover:text-amber-300",
      };
    default: // date, all, conversations
      return {
        bg: "bg-blue-900/20",
        border: "border-blue-500/50",
        text: "text-blue-400",
        progressBg: "bg-blue-500",
        hoverText: "group-hover:text-blue-300",
        buttonText: "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20",
        primaryButton: "bg-blue-600 hover:bg-blue-700",
        checkbox: "bg-blue-600 border-blue-600",
        lightBadge: "bg-blue-500/20 text-blue-400",
        selectionBg: "bg-blue-900/20",
        activeBorder: "border-blue-500",
        ring: "ring-blue-500/50",
        linkText: "text-blue-400 hover:text-blue-300",
      };
  }
}
