import React from "react";
import { ProductCard } from "@/components/shared/ProductCard";
import { useProductContext } from "@/contexts/ProductContext";
import { Calendar, Clock, Users } from "lucide-react";

export const DatePollList: React.FC = () => {
  const { state, actions } = useProductContext();
  
  const datePolls = state.products.filter(p => p.type === "date");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Sondages de Dates</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{datePolls.length} sondage{datePolls.length > 1 ? "s" : ""}</span>
        </div>
      </div>

      {datePolls.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun sondage de dates
          </h3>
          <p className="text-gray-600 mb-4">
            Créez votre premier sondage pour trouver les meilleures dates
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datePolls.map((poll) => (
            <ProductCard
              key={poll.id}
              {...poll}
              onView={() => console.log("View", poll.id)}
              onEdit={() => console.log("Edit", poll.id)}
              onDelete={() => console.log("Delete", poll.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
