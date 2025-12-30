import React from "react";
import { ProductDashboard } from "@/components/products/ProductDashboard";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

const FormPollsDashboard: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar auto-suffisante avec son hamburger */}
      <ProductSidebar productType="form" />

      {/* Contenu principal */}
      <div className="flex-1">
        <ProductDashboard productType="form" />
      </div>
    </div>
  );
};

export default FormPollsDashboard;
