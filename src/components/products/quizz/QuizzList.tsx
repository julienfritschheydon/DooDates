import React from "react";
import { ProductCard } from "@/components/shared/ProductCard";
import { useProductContext } from "@/contexts/ProductContext";
import { Brain, Trophy } from "lucide-react";

export const QuizzList: React.FC = () => {
  const { state } = useProductContext();
  const quizzList = state.products.filter(p => p.type === "quizz");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Quiz</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Brain className="h-4 w-4" />
          <span>{quizzList.length} quiz</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzList.map((poll) => (
          <ProductCard
            key={poll.id}
            {...poll}
            onView={() => console.log("View", poll.id)}
            onEdit={() => console.log("Edit", poll.id)}
            onDelete={() => console.log("Delete", poll.id)}
          />
        ))}
      </div>
    </div>
  );
};
