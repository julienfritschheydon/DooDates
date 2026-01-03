import React from "react";
import { Routes, Route } from "react-router-dom";

// Placeholder components - à remplacer par les vrais composants
import { LandingPage } from "./LandingPage";
import FormPollsDashboard from "./Dashboard";
import FormPollsPricing from "./Pricing";
import FormPollsDocumentation from "./DocumentationAdvanced";

// Vrais composants de création
import FormPollCreator from "../../components/polls/FormPollCreator";
import { FormPollsLayout } from "../../components/layout/products/FormPollsLayout";

const FormPollsApp: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<FormPollsDashboard />} />
      <Route path="/pricing" element={<FormPollsPricing />} />
      <Route path="/documentation" element={<FormPollsDocumentation />} />
      <Route path="/workspace/form" element={
          <FormPollsLayout>
            <FormPollCreator />
          </FormPollsLayout>
        } />
      <Route path="/:id" element={<div>Voir un formulaire</div>} />
    </Routes>
  );
};

export default FormPollsApp;
