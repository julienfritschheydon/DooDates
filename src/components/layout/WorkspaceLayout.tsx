import React from "react";
import AICreator from "@/pages/AICreator";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

interface WorkspaceLayoutProps {
  productType: "date" | "form" | "availability";
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ productType }) => {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar auto-suffisante avec son hamburger */}
      <ProductSidebar productType={productType} />
      
      {/* Contenu principal sans marges fixes */}
      <div className="flex-1 ml-0 mr-0">
        <AICreator hideSidebar={false} />
      </div>
    </div>
  );
};

export default WorkspaceLayout;
