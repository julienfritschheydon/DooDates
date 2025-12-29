import React from "react";
import { Routes, Route } from "react-router-dom";

// Placeholder components - à remplacer par les vrais composants
import { LandingPage } from "./LandingPage";
import FormPollsDashboard from "./Dashboard";
import FormPollsPricing from "./Pricing";
import FormPollsDocumentation from "./DocumentationAdvanced";

// Placeholder components - à remplacer par les vrais composants
const FormPollCreate = () => <div>Créer un formulaire</div>;
const FormPollView = () => <div>Voir un formulaire</div>;

const FormPollsApp: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<FormPollsDashboard />} />
      <Route path="/pricing" element={<FormPollsPricing />} />
      <Route path="/documentation" element={<FormPollsDocumentation />} />
      <Route path="/create" element={<FormPollCreate />} />
      <Route path="/:id" element={<FormPollView />} />
    </Routes>
  );
};

export default FormPollsApp;
