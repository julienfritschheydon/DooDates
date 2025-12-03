import React from "react";
import { Routes, Route } from "react-router-dom";

// Placeholder components - à remplacer par les vrais composants
const DatePollsList = () => <div>Liste des sondages de dates</div>;
const DatePollCreate = () => <div>Créer un sondage de dates</div>;
const DatePollView = () => <div>Voir un sondage de dates</div>;

const DatePollsApp: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DatePollsList />} />
      <Route path="/create" element={<DatePollCreate />} />
      <Route path="/:id" element={<DatePollView />} />
    </Routes>
  );
};

export default DatePollsApp;
