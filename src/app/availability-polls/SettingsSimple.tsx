import React from "react";
import Settings from "@/pages/Settings";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

const AvailabilityPollsSettingsSimple: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar auto-suffisante avec son hamburger */}
      <ProductSidebar productType="availability" />
      
      {/* Contenu principal */}
      <div className="flex-1">
        <Settings />
      </div>
    </div>
  );
};

export default AvailabilityPollsSettingsSimple;
