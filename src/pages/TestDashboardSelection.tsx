import React, { useState } from "react";
import { ConversationCard } from "@/components/dashboard/ConversationCard";
import { ConversationItem } from "@/components/dashboard/types";

const TestDashboardSelection: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const mockConversation: ConversationItem = {
    id: "test-conv-1",
    conversationTitle: "Test Conversation",
    conversationDate: new Date(),
    hasAI: false,
    tags: [],
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

        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <p className="text-white font-semibold mb-2">
            État de sélection: {selectedIds.has("test-conv-1") ? (
              <span className="text-green-400">✅ OUI (SÉLECTIONNÉE)</span>
            ) : (
              <span className="text-gray-400">❌ NON (NON SÉLECTIONNÉE)</span>
            )}
          </p>
          <p className="text-gray-400 text-sm mb-2">
            La carte devrait avoir <code className="bg-gray-700 px-2 py-1 rounded">border-blue-500 ring-2 ring-blue-500/50</code> quand sélectionnée
          </p>
          <div className="mt-2 p-2 bg-gray-900 rounded text-xs">
            <p className="text-gray-300">Classes CSS attendues quand sélectionnée:</p>
            <code className="text-blue-400">border-blue-500</code> ou <code className="text-blue-400">ring-blue-500</code>
          </div>
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

