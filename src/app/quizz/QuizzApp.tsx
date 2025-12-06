import React from "react";
import { Routes, Route } from "react-router-dom";
import { QuizzList } from "@/components/products/quizz/QuizzList";
import { QuizzCreate } from "@/components/products/quizz/QuizzCreate";
import { QuizzDetail } from "@/components/products/quizz/QuizzDetail";

const QuizzApp: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<QuizzList />} />
      <Route path="/create" element={<QuizzCreate />} />
      <Route path="/:id" element={<QuizzDetail />} />
    </Routes>
  );
};

export default QuizzApp;
