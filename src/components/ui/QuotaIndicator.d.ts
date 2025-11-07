/**
 * Visual quota indicator component for freemium users
 * DooDates - Freemium UI Components
 */
import React from "react";
interface QuotaIndicatorProps {
    type: "conversations" | "polls" | "storage";
    used: number;
    limit: number;
    className?: string;
    showLabel?: boolean;
    size?: "sm" | "md" | "lg";
    onClick?: () => void;
}
declare const QuotaIndicator: React.FC<QuotaIndicatorProps>;
export default QuotaIndicator;
