import React from "react";
import { ConversationItem } from "./types";
interface DashboardTableViewProps {
  items: ConversationItem[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onRefresh: () => void;
}
export declare const DashboardTableView: React.FC<DashboardTableViewProps>;
export {};
