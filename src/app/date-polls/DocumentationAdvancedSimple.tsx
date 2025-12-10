import React from "react";
import DatePollsDocumentationAdvanced from "./DocumentationAdvanced";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

const DatePollsDocumentationAdvancedSimple: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar auto-suffisante avec son hamburger */}
      <ProductSidebar productType="date" />
      
      {/* Contenu principal */}
      <div className="flex-1">
        <DatePollsDocumentationAdvanced />
      </div>
    </div>
  );
};

export default DatePollsDocumentationAdvancedSimple;
