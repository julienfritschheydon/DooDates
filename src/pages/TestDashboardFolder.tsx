import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Folder } from "lucide-react";

/**
 * Page de test ISOLÉE - Teste UNIQUEMENT le checkbox de dossier
 * 
 * Cette page reproduit juste le checkbox de dossier du dialogue :
 * - Un dialogue avec UN SEUL checkbox de dossier
 * - Rien d'autre (pas de tags, pas de boutons, etc.)
 */
const TestDashboardFolder: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // UN SEUL dossier de test
  const testFolder = { id: "folder-1", name: "Test Folder 1", icon: "📁", color: "#f59e0b" };

  const handleFolderToggle = (folderId: string) => {
    setSelectedFolderId((prev) => (prev === folderId ? null : folderId));
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">
          Test Dashboard Folder (ISOLÉ)
        </h1>
        <p className="text-gray-400 mb-6">
          Test UNIQUEMENT le checkbox de dossier - Rien d'autre
        </p>

        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <p className="text-white font-semibold mb-2">
            État: {selectedFolderId ? (
              <span className="text-green-400">✅ Dossier sélectionné: {selectedFolderId}</span>
            ) : (
              <span className="text-gray-400">❌ Aucun dossier sélectionné</span>
            )}
          </p>
        </div>

        {/* Dialogue minimaliste - UNIQUEMENT le checkbox de dossier */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>Test Dossier (ISOLÉ)</DialogTitle>
              <DialogDescription>
                Test UNIQUEMENT le checkbox de dossier - Pas de tags, pas de boutons
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4" onClick={(e) => e.stopPropagation()}>
              {/* Folder Section - UNIQUEMENT */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  Dossier
                </Label>
                <div className="space-y-2">
                  {/* UN SEUL checkbox de dossier */}
                  <div
                    className="flex items-center space-x-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      id={`folder-${testFolder.id}`}
                      checked={selectedFolderId === testFolder.id}
                      onCheckedChange={() => handleFolderToggle(testFolder.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Label
                      htmlFor={`folder-${testFolder.id}`}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{testFolder.icon}</span>
                      <span>{testFolder.name}</span>
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TestDashboardFolder;

