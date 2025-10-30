/**
 * ConversationCard Component
 * DooDates - Conversation History System
 */

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import {
  MessageCircle,
  Calendar,
  Star,
  MoreVertical,
  Play,
  Edit2,
  Trash2,
  ExternalLink,
  Clock,
} from "lucide-react";

import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
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
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import type { Conversation } from "../../types/conversation";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ConversationCardProps {
  /** Conversation data */
  conversation: Conversation;
  /** Callback when user wants to resume conversation */
  onResume?: (conversationId: string) => void;
  /** Callback when user renames conversation */
  onRename?: (conversationId: string, newTitle: string) => void;
  /** Callback when user deletes conversation */
  onDelete?: (conversationId: string) => void;
  /** Callback when user toggles favorite status */
  onToggleFavorite?: (conversationId: string) => void;
  /** Callback when user wants to view related poll */
  onViewPoll?: (pollId: string) => void;
  /** Current user's language preference */
  language?: "fr" | "en";
  /** Whether the card is in compact mode */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets the appropriate status indicator for a conversation
 */
function getStatusIndicator(status: Conversation["status"], hasRelatedPoll: boolean) {
  switch (status) {
    case "active":
      return {
        emoji: "🟡",
        label: "En cours",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      };
    case "completed":
      return {
        emoji: hasRelatedPoll ? "🔗" : "🟢",
        label: hasRelatedPoll ? "Sondage créé" : "Terminée",
        color: hasRelatedPoll
          ? "bg-blue-100 text-blue-800 border-blue-200"
          : "bg-green-100 text-green-800 border-green-200",
      };
    case "archived":
      return {
        emoji: "📁",
        label: "Archivée",
        color: "bg-gray-100 text-gray-600 border-gray-200",
      };
    default:
      return {
        emoji: "❓",
        label: "Inconnu",
        color: "bg-gray-100 text-gray-600 border-gray-200",
      };
  }
}

/**
 * Truncates text to specified length with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Formats relative time with localization
 */
function formatRelativeTime(date: Date, language: "fr" | "en" = "fr"): string {
  const locale = language === "fr" ? fr : enUS;
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale,
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConversationCard({
  conversation,
  onResume,
  onRename,
  onDelete,
  onToggleFavorite,
  onViewPoll,
  language = "fr",
  compact = false,
  className,
}: ConversationCardProps) {
  // State for rename functionality
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(conversation.title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Derived values
  const hasRelatedPoll = Boolean(conversation.relatedPollId);
  const statusInfo = getStatusIndicator(conversation.status, hasRelatedPoll);
  const relativeTime = formatRelativeTime(conversation.updatedAt, language);
  const previewText = truncateText(conversation.firstMessage, compact ? 60 : 100);

  // Event handlers
  const handleResume = () => {
    onResume?.(conversation.id);
  };

  const handleRenameStart = () => {
    setIsRenaming(true);
    setRenameValue(conversation.title);
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== conversation.title) {
      onRename?.(conversation.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setRenameValue(conversation.title);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      handleRenameCancel();
    }
  };

  const handleDelete = () => {
    onDelete?.(conversation.id);
    setShowDeleteDialog(false);
  };

  const handleToggleFavorite = () => {
    onToggleFavorite?.(conversation.id);
  };

  const handleViewPoll = () => {
    if (conversation.relatedPollId) {
      onViewPoll?.(conversation.relatedPollId);
    }
  };

  return (
    <>
      <Card
        data-testid="conversation-card"
        className={cn(
          "group hover:shadow-md transition-all duration-200 cursor-pointer",
          "border-l-4",
          conversation.status === "active" && "border-l-yellow-400",
          conversation.status === "completed" && hasRelatedPoll && "border-l-blue-400",
          conversation.status === "completed" && !hasRelatedPoll && "border-l-green-400",
          conversation.status === "archived" && "border-l-gray-300",
          compact && "py-2",
          className,
        )}
      >
        <CardHeader className={cn("pb-2", compact && "pb-1 pt-3")}>
          <div className="flex items-start justify-between gap-3">
            {/* Title and Status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {isRenaming ? (
                  <Input
                    data-testid="rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={handleRenameKeyDown}
                    className="h-7 text-sm font-medium"
                    autoFocus
                  />
                ) : (
                  <h3
                    className="font-medium text-sm leading-tight truncate cursor-pointer hover:text-blue-600"
                    onClick={handleResume}
                    title={conversation.title}
                  >
                    {conversation.title}
                  </h3>
                )}

                {conversation.isFavorite && (
                  <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn("text-xs px-2 py-0.5", statusInfo.color)}>
                  <span className="mr-1">{statusInfo.emoji}</span>
                  {statusInfo.label}
                </Badge>

                {hasRelatedPoll && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 text-xs text-blue-600 hover:text-blue-800"
                    onClick={handleViewPoll}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Voir sondage
                  </Button>
                )}
              </div>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleResume}>
                  <Play className="h-4 w-4 mr-2" />
                  Reprendre
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleRenameStart}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Renommer
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleToggleFavorite}>
                  <Star
                    className={cn(
                      "h-4 w-4 mr-2",
                      conversation.isFavorite && "fill-current text-yellow-500",
                    )}
                  />
                  {conversation.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                </DropdownMenuItem>

                {hasRelatedPoll && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleViewPoll}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Voir le sondage
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className={cn("pt-0", compact && "pb-3")}>
          {/* Preview Text */}
          <p
            className="text-sm text-gray-600 mb-3 cursor-pointer hover:text-gray-800"
            onClick={handleResume}
            title={conversation.firstMessage}
          >
            {previewText}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {conversation.messageCount} message
                {conversation.messageCount > 1 ? "s" : ""}
              </span>

              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {relativeTime}
              </span>
            </div>

            {/* Tags */}
            {conversation.tags.length > 0 && (
              <div className="flex gap-1">
                {conversation.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">
                    {tag}
                  </Badge>
                ))}
                {conversation.tags.length > 2 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    +{conversation.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions (always visible) */}
          <div className="flex gap-2 mt-3">
            <Button
              data-testid="resume-button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleResume}
            >
              <Play className="h-3 w-3 mr-1" />
              Reprendre
            </Button>

            {hasRelatedPoll && (
              <Button
                data-testid="view-poll-button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleViewPoll}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Sondage
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la conversation "{conversation.title}" ? Cette
              action est irréversible et supprimera également tous les messages associés.
              {hasRelatedPoll && " Le sondage associé ne sera pas affecté."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-cancel-button">Annuler</AlertDialogCancel>
            <AlertDialogAction
              data-testid="delete-confirm-button"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
