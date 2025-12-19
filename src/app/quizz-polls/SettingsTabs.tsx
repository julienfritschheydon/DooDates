import React from "react";
import ProductSettings from "@/components/ProductSettings";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

const QuizzPollsSettingsTabs: React.FC = () => {
    return (
        <div className="flex min-h-screen bg-gray-900">
            {/* Sidebar auto-suffisante avec son hamburger */}
            <ProductSidebar productType="quizz" />

            {/* Contenu principal */}
            <div className="flex-1">
                <ProductSettings
                    productName="DooDates - Quizz"
                    productType="quizz"
                />
            </div>
        </div>
    );
};

export default QuizzPollsSettingsTabs;
