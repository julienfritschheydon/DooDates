import React from "react";
import FormPollsPricing from "./Pricing";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

const FormPollsPricingSimple: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar auto-suffisante avec son hamburger */}
      <ProductSidebar productType="form" />
      
      {/* Contenu principal */}
      <div className="flex-1">
        <FormPollsPricing />
      </div>
    </div>
  );
};

export default FormPollsPricingSimple;
