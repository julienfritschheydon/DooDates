import React from "react";
import { ProductCard } from "@/components/shared/ProductCard";
import { useProductContext } from "@/contexts/ProductContext";
import { FileText, MessageSquare } from "lucide-react";

export const FormPollList: React.FC = () => {
  const { state, actions } = useProductContext();
  const formPolls = state.products.filter((p) => p.type === "form");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Formulaires</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FileText className="h-4 w-4" />
          <span>
            {formPolls.length} formulaire{formPolls.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formPolls.map((poll) => (
          <ProductCard
            key={poll.id}
            {...poll}
            isFavorite={poll.is_favorite}
            onView={() => console.log("View", poll.id)}
            onEdit={() => console.log("Edit", poll.id)}
            onDelete={() => console.log("Delete", poll.id)}
            onToggleFavorite={() => actions.toggleFavorite(poll.id, !poll.is_favorite)}
          />
        ))}
      </div>
    </div>
  );
};
