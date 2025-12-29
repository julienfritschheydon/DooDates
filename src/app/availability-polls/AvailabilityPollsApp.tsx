import React from "react";
import { Routes, Route } from "react-router-dom";

// Placeholder components - à remplacer par les vrais composants
import { LandingPage } from "./LandingPage";
import AvailabilityPollsDashboard from "./Dashboard";
import AvailabilityPollsPricing from "./Pricing";
import AvailabilityPollsDocumentation from "./Documentation";

// Placeholder components - à remplacer par les vrais composants
const AvailabilityPollCreate = () => <div>Créer un sondage de disponibilités</div>;
const AvailabilityPollView = () => <div>Voir un sondage de disponibilités</div>;

const AvailabilityPollsApp: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<AvailabilityPollsDashboard />} />
      <Route path="/pricing" element={<AvailabilityPollsPricing />} />
      <Route path="/documentation" element={<AvailabilityPollsDocumentation />} />
      <Route path="/create" element={<AvailabilityPollCreate />} />
      <Route path="/:id" element={<AvailabilityPollView />} />
    </Routes>
  );
};

export default AvailabilityPollsApp;
