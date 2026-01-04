import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LandingPage } from "./LandingPage";
import DatePollsDashboard from "./Dashboard";

// Lazy load components
const DateWorkspace = lazy(() => import("@/app/workspace/DateWorkspace"));
const DatePollsJournalSimple = lazy(() => import("./JournalSimple"));
const DatePollsSettingsTabs = lazy(() => import("./SettingsTabs"));
const DatePollsPricingSimple = lazy(() => import("./PricingSimple"));
const DatePollsDocumentationSimple = lazy(() => import("./DocumentationSimple"));
const DatePollsPrivacy = lazy(() => import("@/pages/products/date-polls/DatePollsPrivacy"));
const DatePollsDataControl = lazy(() => import("@/pages/products/date-polls/DatePollsDataControl"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Chargement...</span>
  </div>
);

const DatePollsApp: React.FC = () => {
  const location = useLocation();

  // Page landing avec son propre layout
  if (location.pathname === "/date" || location.pathname === "/date/") {
    return <LandingPage />;
  }

  // Toutes les autres pages
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<DatePollsDashboard />} />
        <Route path="/workspace/date" element={<DateWorkspace />} />
        <Route path="/journal" element={<DatePollsJournalSimple />} />
        <Route path="/settings" element={<DatePollsSettingsTabs />} />
        <Route path="/pricing" element={<DatePollsPricingSimple />} />
        <Route path="/docs" element={<DatePollsDocumentationSimple />} />
        <Route path="/documentation" element={<DatePollsDocumentationSimple />} />
        <Route path="/privacy" element={<DatePollsPrivacy />} />
        <Route path="/data-control" element={<DatePollsDataControl />} />
      </Routes>
    </Suspense>
  );
};

export default DatePollsApp;
