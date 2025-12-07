import React from "react";
import { ProductSidebar } from "./ProductSidebar";

interface DatePollsSidebarProps {
	onClose?: () => void;
	className?: string;
}

export const DatePollsSidebar: React.FC<DatePollsSidebarProps> = ({ onClose, className }) => {
	return <ProductSidebar productType="date" onClose={onClose} className={className} />;
};
