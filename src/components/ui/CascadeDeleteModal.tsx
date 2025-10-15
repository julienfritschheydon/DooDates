/**
 * CascadeDeleteModal Component
 * Modal de confirmation pour suppression en cascade avec validation i18n
 */

import React, { useState, useCallback, useEffect } from "react";
import { AlertTriangle, MessageCircle, BarChart3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "../../lib/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CascadeItem {
  id: string;
  type: "conversation" | "poll";
  title: string;
}

export interface CascadeDeleteModalProps {
  /** Modal visibility */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Callback when deletion is confirmed */
  onConfirm: () => void;
  /** Items that will be deleted */
  items: CascadeItem[];
  /** Language for UI text */
  language?: "fr" | "en";
  /** Loading state during deletion */
  isDeleting?: boolean;
  /** Custom className */
  className?: string;
}

// ============================================================================
// I18N TRANSLATIONS
// ============================================================================

const translations = {
  fr: {
    title: "Suppression en cascade",
    description: "Vous allez supprimer définitivement les éléments suivants :",
    warning: "Cette action supprimera les DEUX éléments de façon permanente.",
    confirmInstruction: "Pour confirmer, tapez :",
    confirmWord: "SUPPRIMER",
    placeholder: "Tapez SUPPRIMER pour confirmer",
    cancel: "Annuler",
    delete: "Supprimer définitivement",
    deleting: "Suppression en cours...",
    conversation: "Conversation",
    poll: "Sondage",
  },
  en: {
    title: "Cascade deletion",
    description: "You are about to permanently delete the following items:",
    warning: "This action will permanently delete BOTH elements.",
    confirmInstruction: "To confirm, type:",
    confirmWord: "DELETE",
    placeholder: "Type DELETE to confirm",
    cancel: "Cancel",
    delete: "Delete permanently",
    deleting: "Deleting...",
    conversation: "Conversation",
    poll: "Poll",
  },
} as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CascadeDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  language = "fr",
  isDeleting = false,
  className,
}: CascadeDeleteModalProps) {
  const [confirmationText, setConfirmationText] = useState("");

  const t = translations[language];
  const isConfirmationValid = confirmationText === t.confirmWord;

  // Reset confirmation text when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationText("");
    }
  }, [isOpen]);

  // Handle confirmation
  const handleConfirm = useCallback(() => {
    if (isConfirmationValid && !isDeleting) {
      onConfirm();
    }
  }, [isConfirmationValid, isDeleting, onConfirm]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && isConfirmationValid && !isDeleting) {
        e.preventDefault();
        handleConfirm();
      }
      // Note: Escape is handled by Dialog component automatically
    },
    [isConfirmationValid, isDeleting, handleConfirm],
  );

  // Get icon for item type
  const getItemIcon = (type: CascadeItem["type"]) => {
    switch (type) {
      case "conversation":
        return MessageCircle;
      case "poll":
        return BarChart3;
      default:
        return MessageCircle;
    }
  };

  // Get item type label
  const getItemTypeLabel = (type: CascadeItem["type"]) => {
    switch (type) {
      case "conversation":
        return t.conversation;
      case "poll":
        return t.poll;
      default:
        return t.conversation;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn("sm:max-w-[500px]", className)}
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Items to be deleted */}
          <div className="space-y-2">
            {items.map((item) => {
              const Icon = getItemIcon(item.type);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <Icon className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-red-900">
                      {getItemTypeLabel(item.type)}
                    </div>
                    <div className="text-sm text-red-700 truncate">
                      {item.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Warning message */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{t.warning}</p>
            </div>
          </div>

          {/* Confirmation input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              {t.confirmInstruction}{" "}
              <span className="font-mono font-bold text-red-600">
                {t.confirmWord}
              </span>
            </label>
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={t.placeholder}
              className={cn(
                "font-mono",
                isConfirmationValid && "border-green-500 bg-green-50",
                confirmationText &&
                  !isConfirmationValid &&
                  "border-red-500 bg-red-50",
              )}
              disabled={isDeleting}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            {t.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isDeleting}
            className={cn(
              "min-w-[140px]",
              isConfirmationValid && "bg-red-600 hover:bg-red-700",
            )}
          >
            {isDeleting ? t.deleting : t.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CascadeDeleteModal;
