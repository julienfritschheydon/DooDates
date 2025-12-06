import React from "react";
import { ProductSidebar } from "./ProductSidebar";

interface FormPollsSidebarProps {
  onClose?: () => void;
  className?: string;
}

export const FormPollsSidebar: React.FC<FormPollsSidebarProps> = ({ onClose, className }) => {
  return <ProductSidebar productType="form" onClose={onClose} className={className} />;
};
