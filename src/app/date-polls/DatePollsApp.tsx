import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./LandingPage";
import DatePollsDashboard from "./Dashboard";
import DatePollsPricing from "./Pricing";
import DatePollsDocumentation from "./Documentation";

// Placeholder components - à remplacer par les vrais composants
const DatePollCreate = () => <div>Créer un sondage de dates</div>;
const DatePollView = () => <div>Voir un sondage de dates</div>;

const DatePollsApp: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<DatePollsDashboard />} />
      <Route path="/list" element={<Navigate to="/dashboard" replace />} />
      <Route path="/pricing" element={<DatePollsPricing />} />
      <Route path="/documentation" element={<DatePollsDocumentation />} />
      <Route path="/create" element={<DatePollCreate />} />
      <Route path="/:id" element={<DatePollView />} />
    </Routes>
  );
};

export default DatePollsApp;
