import React from "react";
import { ConversationItem } from "./types";
interface ConversationCardProps {
    item: ConversationItem;
    isSelected?: boolean;
    onToggleSelection?: () => void;
    onRefresh: () => void;
}
export declare const ConversationCard: React.FC<ConversationCardProps>;
export {};
