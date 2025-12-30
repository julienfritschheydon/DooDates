import React from "react";
import ConsumptionJournal from "@/pages/ConsumptionJournal";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

const AvailabilityPollsJournalSimple: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar auto-suffisante avec son hamburger */}
      <ProductSidebar productType="availability" />

      {/* Contenu principal */}
      <div className="flex-1">
        <ConsumptionJournal />
      </div>
    </div>
  );
};

export default AvailabilityPollsJournalSimple;
