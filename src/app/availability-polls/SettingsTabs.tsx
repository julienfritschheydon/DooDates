import React from "react";
import ProductSettings from "@/components/ProductSettings";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

const AvailabilityPollsSettingsTabs: React.FC = () => {
    return (
        <div className="flex min-h-screen bg-gray-900">
            {/* Sidebar auto-suffisante avec son hamburger */}
            <ProductSidebar productType="availability" />

            {/* Contenu principal */}
            <div className="flex-1">
                <ProductSettings
                    productName="DooDates - Sondages de Disponibilité"
                    productType="availability"
                />
            </div>
        </div>
    );
};

export default AvailabilityPollsSettingsTabs;
