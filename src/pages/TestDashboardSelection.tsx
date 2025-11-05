import React, { useState } from "react";
import { ConversationCard } from "@/components/dashboard/ConversationCard";
import { ConversationItem } from "@/components/dashboard/types";

const TestDashboardSelection: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const mockConversation: ConversationItem = {
    id: "test-conv-1",
    title: "Test Conversation",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    firstMessage: "Premier message de test",
    messageCount: 1,
    isFavorite: false,
    tags: [],
    metadata: {},
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">
          Test Dashboard Selection
        </h1>
        <p className="text-gray-400 mb-6">
          Test isolé pour vérifier la sélection de cartes et le border bleu
        </p>

        <div className="mb-4">
          <p className="text-white">
            Sélectionné: {selectedIds.has("test-conv-1") ? "OUI" : "NON"}
          </p>
          <p className="text-gray-400 text-sm">
            La carte devrait avoir border-blue-500 ring-2 ring-blue-500/50 quand sélectionnée
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConversationCard
            item={mockConversation}
            isSelected={selectedIds.has("test-conv-1")}
            onToggleSelection={() => toggleSelection("test-conv-1")}
            onRefresh={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default TestDashboardSelection;

