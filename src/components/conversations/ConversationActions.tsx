/**
 * ConversationActions Component
 * DooDates - Conversation History System
 */

import React, { useState, useCallback } from "react";
import {
  MoreHorizontal,
  Play,
  Edit3,
  Trash2,
  Star,
  StarOff,
  Archive,
  ArchiveRestore,
  ExternalLink,
  Copy,
  Download,
  Share2,
} from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { toast } from "../ui/use-toast";
import { cn } from "../../lib/utils";
import type { Conversation, ConversationStatus } from "../../types/conversation";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ConversationActionsProps {
  /** The conversation to perform actions on */
  conversation: Conversation;
  /** Callback when user wants to resume conversation */
  onResume?: (conversationId: string) => void;
  /** Callback when user renames conversation */
  onRename?: (conversationId: string, newTitle: string) => void;
  /** Callback when user deletes conversation */
  onDelete?: (conversationId: string) => void;
  /** Callback when user toggles favorite status */
  onToggleFavorite?: (conversationId: string, isFavorite: boolean) => void;
  /** Callback when user archives/unarchives conversation */
  onToggleArchive?: (conversationId: string, isArchived: boolean) => void;
  /** Callback when user wants to view related poll */
  onViewPoll?: (pollId: string) => void;
  /** Callback when user wants to share conversation */
  onShare?: (conversationId: string) => void;
  /** Callback when user wants to export conversation */
  onExport?: (conversationId: string, format: "json" | "txt" | "pdf") => void;
  /** Show as inline actions instead of dropdown */
  inline?: boolean;
  /** Show only primary actions */
  compact?: boolean;
  /** Language for UI text */
  language?: "fr" | "en";
  /** Custom className */
  className?: string;
}

interface RenameDialogProps {
  isOpen: boolean;
  currentTitle: string;
  onClose: () => void;
  onConfirm: (newTitle: string) => void;
  language: "fr" | "en";
}

interface DeleteDialogProps {
  isOpen: boolean;
  conversationTitle: string;
  onClose: () => void;
  onConfirm: () => void;
  language: "fr" | "en";
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function RenameDialog({ isOpen, currentTitle, onClose, onConfirm, language }: RenameDialogProps) {
  const [title, setTitle] = useState(currentTitle);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const text = {
    title: language === "fr" ? "Renommer la conversation" : "Rename conversation",
    description:
      language === "fr"
        ? "Donnez un nouveau nom à cette conversation."
        : "Give this conversation a new name.",
    placeholder: language === "fr" ? "Nom de la conversation" : "Conversation name",
    cancel: language === "fr" ? "Annuler" : "Cancel",
    save: language === "fr" ? "Enregistrer" : "Save",
    saving: language === "fr" ? "Enregistrement..." : "Saving...",
  };

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || title.trim() === currentTitle) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(title.trim());
      onClose();
      toast({
        title: language === "fr" ? "Conversation renommée" : "Conversation renamed",
        description:
          language === "fr"
            ? "Le nom de la conversation a été mis à jour."
            : "The conversation name has been updated.",
      });
    } catch (error) {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          language === "fr"
            ? "Impossible de renommer la conversation."
            : "Failed to rename conversation.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [title, currentTitle, onConfirm, onClose, language]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  // Reset title when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
    }
  }, [isOpen, currentTitle]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{text.title}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={text.placeholder}
            maxLength={100}
            autoFocus
            disabled={isSubmitting}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {text.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || title.trim() === currentTitle}
          >
            {isSubmitting ? text.saving : text.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  isOpen,
  conversationTitle,
  onClose,
  onConfirm,
  language,
}: DeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const text = {
    title: language === "fr" ? "Supprimer la conversation" : "Delete conversation",
    description:
      language === "fr"
        ? "Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible."
        : "Are you sure you want to delete this conversation? This action cannot be undone.",
    conversationName: language === "fr" ? "Conversation :" : "Conversation:",
    cancel: language === "fr" ? "Annuler" : "Cancel",
    delete: language === "fr" ? "Supprimer" : "Delete",
    deleting: language === "fr" ? "Suppression..." : "Deleting...",
  };

  const handleConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      toast({
        title: language === "fr" ? "Conversation supprimée" : "Conversation deleted",
        description:
          language === "fr"
            ? "La conversation a été supprimée définitivement."
            : "The conversation has been permanently deleted.",
      });
    } catch (error) {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description:
          language === "fr"
            ? "Impossible de supprimer la conversation."
            : "Failed to delete conversation.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [onConfirm, language]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{text.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {text.description}
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm font-medium">
              {text.conversationName} {conversationTitle}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{text.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? text.deleting : text.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConversationActions({
  conversation,
  onResume,
  onRename,
  onDelete,
  onToggleFavorite,
  onToggleArchive,
  onViewPoll,
  onShare,
  onExport,
  inline = false,
  compact = false,
  language = "fr",
  className,
}: ConversationActionsProps) {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Text content based on language
  const text = {
    resume: language === "fr" ? "Reprendre" : "Resume",
    rename: language === "fr" ? "Renommer" : "Rename",
    delete: language === "fr" ? "Supprimer" : "Delete",
    favorite: language === "fr" ? "Ajouter aux favoris" : "Add to favorites",
    unfavorite: language === "fr" ? "Retirer des favoris" : "Remove from favorites",
    archive: language === "fr" ? "Archiver" : "Archive",
    unarchive: language === "fr" ? "Désarchiver" : "Unarchive",
    viewPoll: language === "fr" ? "Voir le sondage" : "View poll",
    share: language === "fr" ? "Partager" : "Share",
    copy: language === "fr" ? "Copier le lien" : "Copy link",
    export: language === "fr" ? "Exporter" : "Export",
    exportJson: language === "fr" ? "Exporter en JSON" : "Export as JSON",
    exportTxt: language === "fr" ? "Exporter en texte" : "Export as text",
    exportPdf: language === "fr" ? "Exporter en PDF" : "Export as PDF",
    moreActions: language === "fr" ? "Plus d'actions" : "More actions",
  };

  // Action handlers
  const handleResume = useCallback(() => {
    onResume?.(conversation.id);
  }, [onResume, conversation.id]);

  const handleRename = useCallback(
    (newTitle: string) => {
      onRename?.(conversation.id, newTitle);
      setShowRenameDialog(false);
    },
    [onRename, conversation.id],
  );

  const handleDelete = useCallback(() => {
    onDelete?.(conversation.id);
    setShowDeleteDialog(false);
  }, [onDelete, conversation.id]);

  const handleToggleFavorite = useCallback(() => {
    const newFavoriteStatus = !conversation.isFavorite;
    onToggleFavorite?.(conversation.id, newFavoriteStatus);

    toast({
      title: newFavoriteStatus
        ? language === "fr"
          ? "Ajouté aux favoris"
          : "Added to favorites"
        : language === "fr"
          ? "Retiré des favoris"
          : "Removed from favorites",
      description: newFavoriteStatus
        ? language === "fr"
          ? "Cette conversation est maintenant dans vos favoris."
          : "This conversation is now in your favorites."
        : language === "fr"
          ? "Cette conversation a été retirée de vos favoris."
          : "This conversation has been removed from your favorites.",
    });
  }, [onToggleFavorite, conversation.id, conversation.isFavorite, language]);

  const handleToggleArchive = useCallback(() => {
    const newArchivedStatus = conversation.status !== "archived";
    onToggleArchive?.(conversation.id, newArchivedStatus);

    toast({
      title: newArchivedStatus
        ? language === "fr"
          ? "Conversation archivée"
          : "Conversation archived"
        : language === "fr"
          ? "Conversation désarchivée"
          : "Conversation unarchived",
      description: newArchivedStatus
        ? language === "fr"
          ? "Cette conversation a été archivée."
          : "This conversation has been archived."
        : language === "fr"
          ? "Cette conversation a été désarchivée."
          : "This conversation has been unarchived.",
    });
  }, [onToggleArchive, conversation.id, conversation.status, language]);

  const handleViewPoll = useCallback(() => {
    if (conversation.relatedPollId) {
      onViewPoll?.(conversation.relatedPollId);
    }
  }, [onViewPoll, conversation.relatedPollId]);

  const handleShare = useCallback(() => {
    onShare?.(conversation.id);
  }, [onShare, conversation.id]);

  const handleCopyLink = useCallback(async () => {
    try {
      const url = `${window.location.origin}/conversations/${conversation.id}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: language === "fr" ? "Lien copié" : "Link copied",
        description:
          language === "fr"
            ? "Le lien de la conversation a été copié dans le presse-papiers."
            : "The conversation link has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: language === "fr" ? "Impossible de copier le lien." : "Failed to copy link.",
        variant: "destructive",
      });
    }
  }, [conversation.id, language]);

  const handleExport = useCallback(
    (format: "json" | "txt" | "pdf") => {
      onExport?.(conversation.id, format);
      toast({
        title: language === "fr" ? "Export en cours" : "Export started",
        description:
          language === "fr"
            ? `L'export de la conversation en ${format.toUpperCase()} a commencé.`
            : `Conversation export to ${format.toUpperCase()} has started.`,
      });
    },
    [onExport, conversation.id, language],
  );

  // Primary actions (always visible)
  const primaryActions = [
    {
      key: "resume",
      label: text.resume,
      icon: Play,
      onClick: handleResume,
      variant: "default" as const,
      show: conversation.status !== "archived",
    },
    {
      key: "favorite",
      label: conversation.isFavorite ? text.unfavorite : text.favorite,
      icon: conversation.isFavorite ? StarOff : Star,
      onClick: handleToggleFavorite,
      variant: "outline" as const,
      show: true,
    },
  ];

  // Secondary actions (in dropdown)
  const secondaryActions = [
    {
      key: "rename",
      label: text.rename,
      icon: Edit3,
      onClick: () => setShowRenameDialog(true),
      show: !compact,
    },
    {
      key: "archive",
      label: conversation.status === "archived" ? text.unarchive : text.archive,
      icon: conversation.status === "archived" ? ArchiveRestore : Archive,
      onClick: handleToggleArchive,
      show: true,
    },
    {
      key: "viewPoll",
      label: text.viewPoll,
      icon: ExternalLink,
      onClick: handleViewPoll,
      show: Boolean(conversation.relatedPollId),
    },
    {
      key: "share",
      label: text.share,
      icon: Share2,
      onClick: handleShare,
      show: !compact && Boolean(onShare),
    },
    {
      key: "copyLink",
      label: text.copy,
      icon: Copy,
      onClick: handleCopyLink,
      show: !compact,
    },
    {
      key: "exportJson",
      label: text.exportJson,
      icon: Download,
      onClick: () => handleExport("json"),
      show: !compact && Boolean(onExport),
    },
    {
      key: "exportTxt",
      label: text.exportTxt,
      icon: Download,
      onClick: () => handleExport("txt"),
      show: !compact && Boolean(onExport),
    },
    {
      key: "exportPdf",
      label: text.exportPdf,
      icon: Download,
      onClick: () => handleExport("pdf"),
      show: !compact && Boolean(onExport),
    },
    {
      key: "delete",
      label: text.delete,
      icon: Trash2,
      onClick: () => setShowDeleteDialog(true),
      show: true,
      destructive: true,
    },
  ];

  if (inline) {
    // Inline layout - show primary actions as buttons
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {primaryActions
          .filter((action) => action.show)
          .map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.key}
                variant={action.variant}
                size="sm"
                onClick={action.onClick}
                className="flex items-center gap-1"
              >
                <Icon className="h-3 w-3" />
                {!compact && action.label}
              </Button>
            );
          })}

        {/* Secondary actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-3 w-3" />
              {!compact && text.moreActions}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {secondaryActions
              .filter((action) => action.show)
              .map((action, index) => {
                const Icon = action.icon;
                const isLast = index === secondaryActions.filter((a) => a.show).length - 1;
                const needsSeparator = action.key === "delete" || action.key === "exportJson";

                return (
                  <React.Fragment key={action.key}>
                    {needsSeparator && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={action.onClick}
                      className={cn(action.destructive && "text-red-600 focus:text-red-600")}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {action.label}
                    </DropdownMenuItem>
                  </React.Fragment>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dialogs */}
        <RenameDialog
          isOpen={showRenameDialog}
          currentTitle={conversation.title}
          onClose={() => setShowRenameDialog(false)}
          onConfirm={handleRename}
          language={language}
        />

        <DeleteDialog
          isOpen={showDeleteDialog}
          conversationTitle={conversation.title}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          language={language}
        />
      </div>
    );
  }

  // Dropdown layout - all actions in dropdown menu
  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{text.moreActions}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Primary actions */}
          {primaryActions
            .filter((action) => action.show)
            .map((action) => {
              const Icon = action.icon;
              return (
                <DropdownMenuItem key={action.key} onClick={action.onClick}>
                  <Icon className="mr-2 h-4 w-4" />
                  {action.label}
                </DropdownMenuItem>
              );
            })}

          <DropdownMenuSeparator />

          {/* Secondary actions */}
          {secondaryActions
            .filter((action) => action.show)
            .map((action, index) => {
              const Icon = action.icon;
              const needsSeparator = action.key === "delete" || action.key === "exportJson";

              return (
                <React.Fragment key={action.key}>
                  {needsSeparator && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={action.onClick}
                    className={cn(action.destructive && "text-red-600 focus:text-red-600")}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </DropdownMenuItem>
                </React.Fragment>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <RenameDialog
        isOpen={showRenameDialog}
        currentTitle={conversation.title}
        onClose={() => setShowRenameDialog(false)}
        onConfirm={handleRename}
        language={language}
      />

      <DeleteDialog
        isOpen={showDeleteDialog}
        conversationTitle={conversation.title}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        language={language}
      />
    </div>
  );
}
