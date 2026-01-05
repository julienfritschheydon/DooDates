import React, { useState } from "react";
import { Menu } from "lucide-react";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";
import { type ProductType } from "@/config/products.config";

interface ProductLandingProps {
  productType: ProductType;
  children: React.ReactNode;
}

export const ProductLanding: React.FC<ProductLandingProps> = ({ productType, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Menu ouvert par défaut

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-[#030712]">
      {/* Sidebar - conditionnel selon l'état */}
      {sidebarOpen && <ProductSidebar productType={productType} onClose={handleMenuToggle} />}

      {/* Main Content */}
      <div className="flex-1 text-white overflow-hidden">
        {/* Hamburger permanent - toggle ouvrir/fermer */}
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={handleMenuToggle}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
           data-testid="productlanding-button">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu de la landing page */}
        {children}
      </div>
    </div>
  );
};
