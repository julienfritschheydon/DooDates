import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { ProductProvider } from "@/contexts/ProductContext";
import { FeatureFlagsProvider } from "@/contexts/FeatureFlagsContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";

// Lazy loaded components
const ProductList = React.lazy(() => import("@/components/products/ProductList"));
const ProductRoutes = React.lazy(() => import("@/app/ProductRoutes"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2">Chargement...</span>
  </div>
);

export const ProductApp: React.FC = () => {
  return (
    <AnalyticsProvider>
      <FeatureFlagsProvider>
        <ProductProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/*" element={<ProductRoutes />} />
              <Route path="/" element={<Navigate to="/products" replace />} />
            </Routes>
          </Suspense>
        </ProductProvider>
      </FeatureFlagsProvider>
    </AnalyticsProvider>
  );
};
