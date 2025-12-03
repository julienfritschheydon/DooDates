import React from "react";
import { Routes, Route } from "react-router-dom";

// Placeholder components - à remplacer par les vrais composants
const AvailabilityPollsList = () => <div>Liste des sondages de disponibilités</div>;
const AvailabilityPollCreate = () => <div>Créer un sondage de disponibilités</div>;
const AvailabilityPollView = () => <div>Voir un sondage de disponibilités</div>;

const AvailabilityPollsApp: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AvailabilityPollsList />} />
      <Route path="/create" element={<AvailabilityPollCreate />} />
      <Route path="/:id" element={<AvailabilityPollView />} />
    </Routes>
  );
};

export default AvailabilityPollsApp;
