import React from "react";
import { ProductSidebar } from "./ProductSidebar";

interface AvailabilityPollsSidebarProps {
  onClose?: () => void;
  className?: string;
}

export const AvailabilityPollsSidebar: React.FC<AvailabilityPollsSidebarProps> = ({
  onClose,
  className,
}) => {
  return <ProductSidebar productType="availability" onClose={onClose} className={className} />;
};
