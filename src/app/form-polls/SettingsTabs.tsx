import React from "react";
import ProductSettings from "@/components/ProductSettings";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

const FormPollsSettingsTabs: React.FC = () => {
    return (
        <div className="flex min-h-screen bg-gray-900">
            {/* Sidebar auto-suffisante avec son hamburger */}
            <ProductSidebar productType="form" />

            {/* Contenu principal */}
            <div className="flex-1">
                <ProductSettings
                    productName="DooDates - Formulaires"
                    productType="form"
                />
            </div>
        </div>
    );
};

export default FormPollsSettingsTabs;
