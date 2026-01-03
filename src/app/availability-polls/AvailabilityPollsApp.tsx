import React from "react";
import { Routes, Route } from "react-router-dom";

// Placeholder components - à remplacer par les vrais composants
import { LandingPage } from "./LandingPage";
import AvailabilityPollsDashboard from "./Dashboard";
import AvailabilityPollsPricing from "./Pricing";
import AvailabilityPollsDocumentation from "./Documentation";

// Vrais composants de création
import { AvailabilityPollCreatorContent } from "../../pages/AvailabilityPollCreatorContent";
import { AvailabilityPollsLayout } from "../../components/layout/products/AvailabilityPollsLayout";

const AvailabilityPollsApp: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<AvailabilityPollsDashboard />} />
      <Route path="/pricing" element={<AvailabilityPollsPricing />} />
      <Route path="/documentation" element={<AvailabilityPollsDocumentation />} />
      <Route path="/workspace/availability" element={
          <AvailabilityPollsLayout>
            <AvailabilityPollCreatorContent />
          </AvailabilityPollsLayout>
        } />
      <Route path="/:id" element={<div>Voir un sondage de disponibilités</div>} />
    </Routes>
  );
};

export default AvailabilityPollsApp;
