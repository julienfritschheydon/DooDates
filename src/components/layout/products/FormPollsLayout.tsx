import React from "react";
import { GenericProductLayout } from "./GenericProductLayout";

interface FormPollsLayoutProps {
  children: React.ReactNode;
}

export const FormPollsLayout: React.FC<FormPollsLayoutProps> = ({ children }) => {
  return <GenericProductLayout productType="form">{children}</GenericProductLayout>;
};
