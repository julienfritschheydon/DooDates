import React from "react";
import AvailabilityPollsDocumentation from "./Documentation";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

const AvailabilityPollsDocumentationSimple: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar auto-suffisante avec son hamburger */}
      <ProductSidebar productType="availability" />

      {/* Contenu principal */}
      <div className="flex-1">
        <AvailabilityPollsDocumentation />
      </div>
    </div>
  );
};

export default AvailabilityPollsDocumentationSimple;
