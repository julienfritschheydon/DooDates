import React from "react";
import { GenericProductLayout } from "./GenericProductLayout";

interface DatePollsLayoutProps {
  children: React.ReactNode;
}

export const DatePollsLayout: React.FC<DatePollsLayoutProps> = ({ children }) => {
  return <GenericProductLayout productType="date">{children}</GenericProductLayout>;
};
