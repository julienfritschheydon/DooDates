import React from "react";
import { Routes, Route } from "react-router-dom";

// Placeholder components - à remplacer par les vrais composants
const QuizzList = () => <div>Liste des quizz</div>;
const QuizzCreate = () => <div>Créer un quizz</div>;
const QuizzView = () => <div>Voir un quizz</div>;

const QuizzApp: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<QuizzList />} />
      <Route path="/create" element={<QuizzCreate />} />
      <Route path="/:id" element={<QuizzView />} />
    </Routes>
  );
};

export default QuizzApp;
