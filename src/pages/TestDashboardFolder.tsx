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

        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <p className="text-white font-semibold mb-2">
            Instructions pour le test:
          </p>
          <ul className="text-gray-400 text-sm list-disc list-inside space-y-1">
            <li>Le dialogue s'ouvre automatiquement au chargement</li>
            <li>Cliquer sur le checkbox "Test Folder 1"</li>
            <li>Vérifier que <code className="bg-gray-700 px-2 py-1 rounded">data-state="checked"</code> apparaît</li>
            <li>Le sélecteur doit utiliser <code className="bg-gray-700 px-2 py-1 rounded">getByRole("checkbox", { name: /Test Folder 1/i })</code></li>
          </ul>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
        >
          Ouvrir Dialogue
        </button>

        {open && (
          <div className="mt-4 p-4 bg-green-900/20 border border-green-500 rounded-lg">
            <p className="text-green-400 font-semibold">✅ Dialogue ouvert</p>
            <p className="text-gray-400 text-sm mt-2">
              Le dialogue devrait être visible. Vérifiez que le checkbox "Test Folder 1" est cliquable.
            </p>
          </div>
        )}

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

