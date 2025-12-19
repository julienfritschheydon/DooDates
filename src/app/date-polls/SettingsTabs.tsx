import React from "react";
import ProductSettings from "@/components/ProductSettings";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

const DatePollsSettingsTabs: React.FC = () => {
    return (
        <div className="flex min-h-screen bg-gray-900">
            {/* Sidebar auto-suffisante avec son hamburger */}
            <ProductSidebar productType="date" />

            {/* Contenu principal */}
            <div className="flex-1">
                <ProductSettings
                    productName="DooDates - Sondages de Dates"
                    productType="date"
                />
            </div>
        </div>
    );
};

export default DatePollsSettingsTabs;
