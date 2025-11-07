import React from "react";
interface ManageTagsFolderDialogProps {
  conversationId: string;
  currentTags: string[];
  currentFolderId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}
export declare const ManageTagsFolderDialog: React.FC<ManageTagsFolderDialogProps>;
export {};
