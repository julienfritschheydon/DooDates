import React from "react";
import DatePollsDocumentation from "./Documentation";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

const DatePollsDocumentationSimple: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar auto-suffisante avec son hamburger */}
      <ProductSidebar productType="date" />

      {/* Contenu principal */}
      <div className="flex-1">
        <DatePollsDocumentation />
      </div>
    </div>
  );
};

export default DatePollsDocumentationSimple;
