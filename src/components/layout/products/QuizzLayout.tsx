import React from "react";
import { GenericProductLayout } from "./GenericProductLayout";

interface QuizzLayoutProps {
  children: React.ReactNode;
}

export const QuizzLayout: React.FC<QuizzLayoutProps> = ({ children }) => {
  return <GenericProductLayout productType="quizz">{children}</GenericProductLayout>;
};
