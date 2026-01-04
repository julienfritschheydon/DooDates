import React, { Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { LandingPage } from "./LandingPage";
import FormPollsDashboard from "./Dashboard";

// Lazy load components
const FormWorkspace = lazy(() => import("@/app/workspace/FormWorkspace"));
const FormPollsJournalSimple = lazy(() => import("./JournalSimple"));
const FormPollsSettingsTabs = lazy(() => import("./SettingsTabs"));
const FormPollsPricingSimple = lazy(() => import("./PricingSimple"));
const FormPollsDocumentationSimple = lazy(() => import("./DocumentationSimple"));
const FormPollsDocumentationAdvancedSimple = lazy(() => import("./DocumentationAdvancedSimple"));
const FormPollsPrivacy = lazy(() => import("@/pages/products/form-polls/FormPollsPrivacy"));
const FormPollsDataControl = lazy(() => import("@/pages/products/form-polls/FormPollsDataControl"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    <span className="ml-2 text-gray-600">Chargement...</span>
  </div>
);

const FormPollsApp: React.FC = () => {
  const location = useLocation();

  // Page landing avec son propre layout
  if (location.pathname === "/form-polls" || location.pathname === "/form-polls/") {
    return <LandingPage />;
  }

  // Toutes les autres pages
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<FormPollsDashboard />} />
        <Route path="/workspace/form" element={<FormWorkspace />} />
        <Route path="/journal" element={<FormPollsJournalSimple />} />
        <Route path="/settings" element={<FormPollsSettingsTabs />} />
        <Route path="/pricing" element={<FormPollsPricingSimple />} />
        <Route path="/docs" element={<FormPollsDocumentationSimple />} />
        <Route path="/documentation" element={<FormPollsDocumentationSimple />} />
        <Route path="/documentation/advanced" element={<FormPollsDocumentationAdvancedSimple />} />
        <Route path="/privacy" element={<FormPollsPrivacy />} />
        <Route path="/data-control" element={<FormPollsDataControl />} />
      </Routes>
    </Suspense>
  );
};

export default FormPollsApp;
