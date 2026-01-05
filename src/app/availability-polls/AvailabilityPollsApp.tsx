import React, { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { LandingPage } from "./LandingPage";
import AvailabilityPollsDashboard from "./Dashboard";

// Lazy load components
const AvailabilityWorkspace = lazy(() => import("@/app/workspace/AvailabilityWorkspace"));
const AvailabilityPollsJournalSimple = lazy(() => import("./JournalSimple"));
const AvailabilityPollsSettingsTabs = lazy(() => import("./SettingsTabs"));
const AvailabilityPollsPricingSimple = lazy(() => import("./PricingSimple"));
const AvailabilityPollsDocumentationSimple = lazy(() => import("./DocumentationSimple"));
const AvailabilityPollsPrivacy = lazy(
  () => import("@/pages/products/availability-polls/AvailabilityPollsPrivacy"),
);
const AvailabilityPollsDataControl = lazy(
  () => import("@/pages/products/availability-polls/AvailabilityPollsDataControl"),
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    <span className="ml-2 text-gray-600">Chargement...</span>
  </div>
);

const AvailabilityPollsApp: React.FC = () => {
  const location = useLocation();

  // Page landing avec son propre layout
  if (location.pathname === "/availability" || location.pathname === "/availability/") {
    return <LandingPage />;
  }

  // Toutes les autres pages
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<AvailabilityPollsDashboard />} />
        <Route path="/workspace/availability" element={<AvailabilityWorkspace />} />
        <Route path="/journal" element={<AvailabilityPollsJournalSimple />} />
        <Route path="/settings" element={<AvailabilityPollsSettingsTabs />} />
        <Route path="/pricing" element={<AvailabilityPollsPricingSimple />} />
        <Route path="/docs" element={<AvailabilityPollsDocumentationSimple />} />
        <Route path="/documentation" element={<AvailabilityPollsDocumentationSimple />} />
        <Route path="/privacy" element={<AvailabilityPollsPrivacy />} />
        <Route path="/data-control" element={<AvailabilityPollsDataControl />} />
      </Routes>
    </Suspense>
  );
};

export default AvailabilityPollsApp;
