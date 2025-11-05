import React, { useState } from "react";
import { ManageTagsFolderDialog } from "@/components/dashboard/ManageTagsFolderDialog";

const TestDashboardFolder: React.FC = () => {
  const [open, setOpen] = useState(true);

  // Initialiser des tags et dossiers de test
  React.useEffect(() => {
    // Créer des tags de test
    const tags = [
      { id: "tag-1", name: "Test Tag 1", color: "#3b82f6" },
      { id: "tag-2", name: "Test Tag 2", color: "#10b981" },
    ];

    // Créer des dossiers de test
    const folders = [
      { id: "folder-1", name: "Test Folder 1", icon: "📁", color: "#f59e0b" },
    ];

    localStorage.setItem("doodates_tags", JSON.stringify(tags));
    localStorage.setItem("doodates_folders", JSON.stringify(folders));
  }, []);

  return (
    <div className="min-h-screen bg-[#1e1e1e] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">
          Test Dashboard Folder Selection
        </h1>
        <p className="text-gray-400 mb-6">
          Test isolé pour vérifier la sélection de dossiers dans le dialogue
        </p>

        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Ouvrir Dialogue
        </button>

        <ManageTagsFolderDialog
          conversationId="test-conv-1"
          currentTags={[]}
          currentFolderId={undefined}
          open={open}
          onOpenChange={setOpen}
          onSuccess={() => {
            console.log("Success");
          }}
        />
      </div>
    </div>
  );
};

export default TestDashboardFolder;

