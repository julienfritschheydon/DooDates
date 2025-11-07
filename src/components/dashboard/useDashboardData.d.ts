import { ConversationItem } from "./types";
export declare function useDashboardData(refreshKey: number): {
  conversationItems: ConversationItem[];
  loading: boolean;
  reload: () => Promise<void>;
};
