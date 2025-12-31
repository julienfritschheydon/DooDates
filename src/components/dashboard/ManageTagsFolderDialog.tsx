import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tag, Folder } from "lucide-react";
import { getAllTags, type Tag as TagType } from "@/lib/storage/TagStorage";
import { getAllFolders, type Folder as FolderType } from "@/lib/storage/FolderStorage";
import { getConversation } from "@/lib/storage/ConversationStorageSimple";
import { useToast } from "@/hooks/use-toast";

interface ManageTagsFolderDialogProps {
  conversationId: string;
  currentTags: string[];
  currentFolderId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  'data-testid'?: string;
}

export const ManageTagsFolderDialog: React.FC<ManageTagsFolderDialogProps> = ({
  conversationId,
  currentTags,
  currentFolderId,
  open,
  onOpenChange,
  onSuccess,
  'data-testid': dataTestId,
}) => {
  const { toast } = useToast();
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(currentTags));
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId || null);
  const [isSaving, setIsSaving] = useState(false);

  const allTags = getAllTags();
  const allFolders = getAllFolders();

  // Reset state when dialog opens/closes or conversation changes
  useEffect(() => {
    if (open) {
      setSelectedTags(new Set(currentTags));
      setSelectedFolderId(currentFolderId || null);
    }
  }, [open, currentTags, currentFolderId]);

  const handleTagToggle = (tagName: string) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tagName)) {
      newSelected.delete(tagName);
    } else {
      newSelected.add(tagName);
    }
    setSelectedTags(newSelected);
  };

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId === selectedFolderId ? null : folderId);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Get the current conversation
      const conversation = getConversation(conversationId);
      if (!conversation) {
        toast({
          title: "Erreur",
          description: "Conversation introuvable.",
          variant: "destructive",
        });
        return;
      }

      // Update tags
      const tagsArray = Array.from(selectedTags);

      // Update folderId in metadata
      const updatedMetadata = {
        ...conversation.metadata,
        folderId: selectedFolderId || undefined,
      };

      // Update conversation with tags and metadata
      // Since updateConversation hook only accepts UpdateConversationData which doesn't include metadata,
      // we need to update the conversation directly using storage
      const { updateConversation: updateConversationStorage } = await import(
        "@/lib/storage/ConversationStorageSimple"
      );
      const updatedConversation = {
        ...conversation,
        tags: tagsArray,
        metadata: updatedMetadata,
        updatedAt: new Date(),
      };
      updateConversationStorage(updatedConversation);

      toast({
        title: "Mise à jour réussie",
        description: "Les tags et le dossier ont été mis à jour.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les tags et le dossier.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()} data-testid={dataTestId}>
        <DialogHeader>
          <DialogTitle>Gérer les tags et le dossier</DialogTitle>
          <DialogDescription>
            Sélectionnez les tags et le dossier à associer à cette conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4" onClick={(e) => e.stopPropagation()}>
          {/* Tags Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {allTags.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun tag disponible</p>
              ) : (
                allTags.map((tag: TagType) => (
                  <div
                    key={tag.id}
                    className="flex items-center space-x-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={selectedTags.has(tag.name)}
                      onCheckedChange={() => handleTagToggle(tag.name)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Label
                      htmlFor={`tag-${tag.id}`}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Folder Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Dossier
            </Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {allFolders.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun dossier disponible</p>
              ) : (
                <>
                  <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      id="folder-none"
                      checked={selectedFolderId === null}
                      onCheckedChange={() => handleFolderSelect(null)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Label
                      htmlFor="folder-none"
                      className="cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Aucun dossier
                    </Label>
                  </div>
                  {allFolders.map((folder: FolderType) => (
                    <div
                      key={folder.id}
                      className="flex items-center space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        id={`folder-${folder.id}`}
                        checked={selectedFolderId === folder.id}
                        onCheckedChange={() => handleFolderSelect(folder.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label
                        htmlFor={`folder-${folder.id}`}
                        className="flex items-center gap-2 cursor-pointer flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>{folder.icon}</span>
                        <span>{folder.name}</span>
                      </Label>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
