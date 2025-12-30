import React from "react";
import FormPollsDocumentationAdvanced from "./DocumentationAdvanced";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

const FormPollsDocumentationAdvancedSimple: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar auto-suffisante avec son hamburger */}
      <ProductSidebar productType="form" />

      {/* Contenu principal */}
      <div className="flex-1">
        <FormPollsDocumentationAdvanced />
      </div>
    </div>
  );
};

export default FormPollsDocumentationAdvancedSimple;
