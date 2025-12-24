import React, { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { QuizzCreate } from "@/components/products/quizz/QuizzCreate";
import { QuizzLayout } from "@/components/layout/products/QuizzLayout";
import { LandingPage } from "./LandingPage";

// Lazy load pour optimiser le bundle
const QuizzDashboard = lazy(() => import("./Dashboard"));
const QuizzResults = lazy(() => import("@/components/polls/QuizzResults"));
const QuizzDocumentation = lazy(() => import("./Documentation"));
const QuizzPricing = lazy(() => import("./Pricing"));
const ChildHistory = lazy(() => import("./ChildHistory"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
    <span className="ml-2 text-gray-600">Chargement...</span>
  </div>
);

const QuizzApp: React.FC = () => {
  const location = useLocation();

  // Page landing avec son propre layout (page marketing principale)
  if (location.pathname === "/quizz" || location.pathname === "/quizz/") {
    return <LandingPage />;
  }

  // Toutes les autres pages utilisent le layout avec sidebar
  return (
    <QuizzLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/dashboard" element={<QuizzDashboard />} />
          <Route path="/create" element={<QuizzCreate />} />
          <Route path="/history" element={<ChildHistory />} />
          <Route path="/history/:childName" element={<ChildHistory />} />
          <Route path="/docs" element={<QuizzDocumentation />} />
          <Route path="/documentation" element={<QuizzDocumentation />} />
          <Route path="/pricing" element={<QuizzPricing />} />
          <Route path="/:slug/results" element={<QuizzResults />} />
        </Routes>
      </Suspense>
    </QuizzLayout>
  );
};

export default QuizzApp;
