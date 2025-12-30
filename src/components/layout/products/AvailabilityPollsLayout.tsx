import React from "react";
import { GenericProductLayout } from "./GenericProductLayout";

interface AvailabilityPollsLayoutProps {
  children: React.ReactNode;
}

export const AvailabilityPollsLayout: React.FC<AvailabilityPollsLayoutProps> = ({ children }) => {
  return <GenericProductLayout productType="availability">{children}</GenericProductLayout>;
};
