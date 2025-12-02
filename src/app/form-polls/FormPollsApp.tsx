import React from "react";
import { Routes, Route } from "react-router-dom";

// Placeholder components - à remplacer par les vrais composants
const FormPollsList = () => <div>Liste des formulaires</div>;
const FormPollCreate = () => <div>Créer un formulaire</div>;
const FormPollView = () => <div>Voir un formulaire</div>;

const FormPollsApp: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<FormPollsList />} />
      <Route path="/create" element={<FormPollCreate />} />
      <Route path="/:id" element={<FormPollView />} />
    </Routes>
  );
};

export default FormPollsApp;
