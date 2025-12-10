import React from "react";
import FormPollsDocumentation from "./Documentation";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

const FormPollsDocumentationSimple: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar auto-suffisante avec son hamburger */}
      <ProductSidebar productType="form" />
      
      {/* Contenu principal */}
      <div className="flex-1">
        <FormPollsDocumentation />
      </div>
    </div>
  );
};

export default FormPollsDocumentationSimple;
