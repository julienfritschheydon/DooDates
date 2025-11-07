import { DashboardPoll, ConversationItem, FilterType } from "./types";
export declare function findRelatedConversation(poll: DashboardPoll, userId?: string | null): string | undefined;
export declare function getStatusColor(status: DashboardPoll["status"]): string;
export declare function getStatusLabel(status: DashboardPoll["status"]): string;
export declare function filterConversationItems(items: ConversationItem[], filter: FilterType, searchQuery: string, selectedTags?: string[], selectedFolderId?: string | null): ConversationItem[];
