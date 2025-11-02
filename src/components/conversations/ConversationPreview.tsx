/**
 * ConversationPreview Component
 * DooDates - Conversation History System
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  X,
  Play,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Calendar,
  User,
  Bot,
  Clock,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { cn } from "../../lib/utils";
import type { Conversation, ConversationMessage } from "../../types/conversation";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ConversationPreviewProps {
  /** The conversation to preview */
  conversation: Conversation | null;
  /** Whether the preview modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when user wants to resume conversation */
  onResume?: (conversationId: string) => void;
  /** Callback when user wants to view related poll */
  onViewPoll?: (pollId: string) => void;
  /** Language for UI text */
  language?: "fr" | "en";
  /** Custom className */
  className?: string;
}

interface MessageItemProps {
  message: ConversationMessage;
  isFirst: boolean;
  isLast: boolean;
  language: "fr" | "en";
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatMessageTime(date: Date, language: "fr" | "en" = "fr"): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return language === "fr" ? "À l'instant" : "Just now";
  } else if (diffMinutes < 60) {
    return language === "fr" ? `Il y a ${diffMinutes} min` : `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return language === "fr" ? `Il y a ${diffHours}h` : `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return language === "fr" ? `Il y a ${diffDays}j` : `${diffDays}d ago`;
  } else {
    return language === "fr"
      ? date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "archived":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusLabel(status: string, language: "fr" | "en" = "fr"): string {
  const labels = {
    active: language === "fr" ? "Active" : "Active",
    completed: language === "fr" ? "Terminée" : "Completed",
    archived: language === "fr" ? "Archivée" : "Archived",
  };
  return labels[status as keyof typeof labels] || status;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MessageItem({ message, isFirst, isLast, language }: MessageItemProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  // Note: MessageRole only includes 'user' and 'assistant', no 'system' role

  return (
    <div className={cn("flex gap-3 p-4", !isLast && "border-b border-gray-100")}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8">
          {isUser && (
            <>
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </>
          )}
          {isAssistant && (
            <AvatarFallback className="bg-purple-100 text-purple-600">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          )}
        </Avatar>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">
            {isUser && (language === "fr" ? "Vous" : "You")}
            {isAssistant && (language === "fr" ? "Assistant" : "Assistant")}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatMessageTime(message.timestamp, language)}
          </span>
        </div>

        {/* Content */}
        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* Metadata */}
        {message.metadata && Object.keys(message.metadata).length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {Object.entries(message.metadata).map(([key, value]) => (
              <div key={key} className="flex items-center gap-1">
                <span className="font-medium">{key}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationHeader({
  conversation,
  language,
  onResume,
  onViewPoll,
}: {
  conversation: Conversation;
  language: "fr" | "en";
  onResume?: (id: string) => void;
  onViewPoll?: (pollId: string) => void;
}) {
  const text = {
    resume: language === "fr" ? "Reprendre la conversation" : "Resume conversation",
    viewPoll: language === "fr" ? "Voir le sondage" : "View poll",
    messages: language === "fr" ? "messages" : "messages",
    createdOn: language === "fr" ? "Créée le" : "Created on",
    lastActivity: language === "fr" ? "Dernière activité" : "Last activity",
  };

  return (
    <div className="space-y-4">
      {/* Title and Status */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{conversation.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={getStatusColor(conversation.status)}>
              {getStatusLabel(conversation.status, language)}
            </Badge>
            {conversation.isFavorite && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                ⭐ {language === "fr" ? "Favori" : "Favorite"}
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {conversation.relatedPollId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewPoll?.(conversation.relatedPollId!)}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              {text.viewPoll}
            </Button>
          )}
          {conversation.status !== "archived" && (
            <Button
              size="sm"
              onClick={() => onResume?.(conversation.id)}
              className="flex items-center gap-1"
            >
              <Play className="h-3 w-3" />
              {text.resume}
            </Button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span>
            {conversation.messageCount} {text.messages}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            {text.createdOn}{" "}
            {conversation.createdAt.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        </div>
        {conversation.messageCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              {text.lastActivity}: {formatMessageTime(conversation.updatedAt, language)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConversationPreview({
  conversation,
  isOpen,
  onClose,
  onResume,
  onViewPoll,
  language = "fr",
  className,
}: ConversationPreviewProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [scrollToTop, setScrollToTop] = useState(false);

  // Text content based on language
  const text = {
    title: language === "fr" ? "Aperçu de la conversation" : "Conversation preview",
    close: language === "fr" ? "Fermer" : "Close",
    noMessages:
      language === "fr"
        ? "Aucun message dans cette conversation."
        : "No messages in this conversation.",
    messageNavigation: language === "fr" ? "Navigation des messages" : "Message navigation",
    previousMessage: language === "fr" ? "Message précédent" : "Previous message",
    nextMessage: language === "fr" ? "Message suivant" : "Next message",
    scrollToTop: language === "fr" ? "Retour en haut" : "Scroll to top",
    scrollToBottom: language === "fr" ? "Aller en bas" : "Scroll to bottom",
    messagesPreview: language === "fr" ? "Aperçu des messages" : "Messages preview",
  };

  // Reset state when conversation changes
  useEffect(() => {
    if (conversation && isOpen) {
      setCurrentMessageIndex(0);
      setScrollToTop(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id, isOpen]); // Intentionnel : on veut seulement réagir aux changements d'ID et d'ouverture, pas conversation entier

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || !conversation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowUp" && e.ctrlKey) {
        e.preventDefault();
        setCurrentMessageIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowDown" && e.ctrlKey) {
        e.preventDefault();
        setCurrentMessageIndex((prev) => Math.min(conversation.messageCount - 1, prev + 1));
      } else if (e.key === "Home" && e.ctrlKey) {
        e.preventDefault();
        setScrollToTop(true);
      } else if (e.key === "End" && e.ctrlKey) {
        e.preventDefault();
        setScrollToTop(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, conversation, onClose]);

  // Handle resume conversation
  const handleResume = useCallback(() => {
    if (conversation) {
      onResume?.(conversation.id);
      onClose();
    }
  }, [conversation, onResume, onClose]);

  // Handle view poll
  const handleViewPoll = useCallback(() => {
    if (conversation?.relatedPollId) {
      onViewPoll?.(conversation.relatedPollId);
    }
  }, [conversation, onViewPoll]);

  // Navigation handlers
  const handlePreviousMessage = useCallback(() => {
    setCurrentMessageIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextMessage = useCallback(() => {
    if (conversation) {
      setCurrentMessageIndex((prev) => Math.min(conversation.messageCount - 1, prev + 1));
    }
  }, [conversation]);

  // Scroll handlers
  const handleScrollToTop = useCallback(() => {
    setScrollToTop(true);
  }, []);

  const handleScrollToBottom = useCallback(() => {
    setScrollToTop(false);
  }, []);

  if (!conversation) {
    return null;
  }

  const hasMessages = conversation.messageCount > 0;
  const canNavigatePrevious = currentMessageIndex > 0;
  const canNavigateNext = currentMessageIndex < conversation.messageCount - 1;
  const lastActivityTime = conversation.updatedAt;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] flex flex-col", className)}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="sr-only">{text.title}</DialogTitle>
          <ConversationHeader
            conversation={conversation}
            language={language}
            onResume={handleResume}
            onViewPoll={handleViewPoll}
          />
        </DialogHeader>

        <Separator />

        {/* Messages Content */}
        <div className="flex-1 min-h-0 flex flex-col">
          {!hasMessages ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{text.noMessages}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Message Navigation */}
              {hasMessages && (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>
                      {language === "fr"
                        ? `Message ${currentMessageIndex + 1} sur ${conversation.messageCount}`
                        : `Message ${currentMessageIndex + 1} of ${conversation.messageCount}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousMessage}
                      disabled={!canNavigatePrevious}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      {text.previousMessage}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextMessage}
                      disabled={!canNavigateNext || conversation.messageCount <= 1}
                      className="flex items-center gap-1"
                    >
                      {text.nextMessage}
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleScrollToTop}
                      className="flex items-center gap-1"
                    >
                      <ArrowUp className="h-3 w-3" />
                      {text.scrollToTop}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleScrollToBottom}
                      className="flex items-center gap-1"
                    >
                      <ArrowDown className="h-3 w-3" />
                      {text.scrollToBottom}
                    </Button>
                  </div>
                </div>
              )}

              {/* Messages List */}
              <ScrollArea className="flex-1">
                {conversation.messageCount === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    <div className="text-center">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{text.noMessages}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        {text.messagesPreview}: {conversation.firstMessage}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {conversation.messageCount} {language === "fr" ? "messages" : "messages"}
                      </p>
                    </div>
                  </div>
                )}
                {/* Note: Individual messages would be loaded separately in a real implementation */}
              </ScrollArea>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            {language === "fr"
              ? "Utilisez Ctrl+↑/↓ pour naviguer, Échap pour fermer"
              : "Use Ctrl+↑/↓ to navigate, Esc to close"}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              {text.close}
            </Button>
            {conversation.status !== "archived" && (
              <Button onClick={handleResume} className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                {language === "fr" ? "Reprendre" : "Resume"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
