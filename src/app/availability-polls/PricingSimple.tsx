import React from "react";
import AvailabilityPollsPricing from "./Pricing";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

const AvailabilityPollsPricingSimple: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar auto-suffisante avec son hamburger */}
      <ProductSidebar productType="availability" />

      {/* Contenu principal */}
      <div className="flex-1">
        <AvailabilityPollsPricing />
      </div>
    </div>
  );
};

export default AvailabilityPollsPricingSimple;
