import React from "react";
import { ProductSidebar } from "./ProductSidebar";

interface QuizzSidebarProps {
  onClose?: () => void;
  className?: string;
}

export const QuizzSidebar: React.FC<QuizzSidebarProps> = ({ onClose, className }) => {
  return <ProductSidebar productType="quizz" onClose={onClose} className={className} />;
};
