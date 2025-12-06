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

  // Pages avec leur propre layout (pages marketing)
  if (location.pathname === "/quizz" || location.pathname === "/quizz/") {
    return <LandingPage />;
  }

  if (location.pathname === "/quizz/documentation") {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <QuizzDocumentation />
      </Suspense>
    );
  }

  if (location.pathname === "/quizz/pricing") {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <QuizzPricing />
      </Suspense>
    );
  }

  return (
    <QuizzLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/dashboard" element={<QuizzDashboard />} />
          <Route path="/create" element={<QuizzCreate />} />
          <Route path="/history" element={<ChildHistory />} />
          <Route path="/history/:childName" element={<ChildHistory />} />
          <Route path="/:slug/results" element={<QuizzResults />} />
        </Routes>
      </Suspense>
    </QuizzLayout>
  );
};

export default QuizzApp;
