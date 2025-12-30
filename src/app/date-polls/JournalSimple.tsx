import React from "react";
import ConsumptionJournal from "@/pages/ConsumptionJournal";
import { ProductSidebar } from "@/components/layout/products/ProductSidebar";

const DatePollsJournalSimple: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar auto-suffisante avec son hamburger */}
      <ProductSidebar productType="date" />

      {/* Contenu principal */}
      <div className="flex-1">
        <ConsumptionJournal />
      </div>
    </div>
  );
};

export default DatePollsJournalSimple;
