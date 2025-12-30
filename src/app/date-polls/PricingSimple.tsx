import React from "react";
import DatePollsPricing from "./Pricing";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

const DatePollsPricingSimple: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar auto-suffisante avec son hamburger */}
      <ProductSidebar productType="date" />

      {/* Contenu principal */}
      <div className="flex-1">
        <DatePollsPricing />
      </div>
    </div>
  );
};

export default DatePollsPricingSimple;
