/**
 * ConversationHeader Component
 * Header avec badges bidirectionnels et navigation pour conversations
 */

import React from 'react';
import { MessageCircle, BarChart3, ExternalLink, Play, Calendar, Clock, User, Bot } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import type { Conversation } from '../../types/conversation';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ConversationHeaderProps {
  /** The conversation to display */
  conversation: Conversation;
  /** Language for UI text */
  language?: 'fr' | 'en';
  /** Callback when user wants to resume conversation */
  onResume?: (conversationId: string) => void;
  /** Callback when user wants to view related poll */
  onViewPoll?: (pollId: string) => void;
  /** Show compact version */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

// ============================================================================
// I18N TRANSLATIONS
// ============================================================================

const translations = {
  fr: {
    resume: 'Reprendre la conversation',
    viewPoll: 'Voir le sondage lié',
    linkedToPoll: 'Lié à un sondage',
    messages: 'messages',
    createdOn: 'Créée le',
    lastActivity: 'Dernière activité',
    favorite: 'Favori',
    active: 'Active',
    completed: 'Terminée',
    archived: 'Archivée',
  },
  en: {
    resume: 'Resume conversation',
    viewPoll: 'View linked poll',
    linkedToPoll: 'Linked to poll',
    messages: 'messages',
    createdOn: 'Created on',
    lastActivity: 'Last activity',
    favorite: 'Favorite',
    active: 'Active',
    completed: 'Completed',
    archived: 'Archived',
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatMessageTime(date: Date, language: 'fr' | 'en' = 'fr'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return language === 'fr' ? 'À l\'instant' : 'Just now';
  } else if (diffMinutes < 60) {
    return language === 'fr' 
      ? `Il y a ${diffMinutes} min` 
      : `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return language === 'fr' 
      ? `Il y a ${diffHours}h` 
      : `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return language === 'fr' 
      ? `Il y a ${diffDays}j` 
      : `${diffDays}d ago`;
  } else {
    return language === 'fr'
      ? date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'archived':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusLabel(status: string, language: 'fr' | 'en' = 'fr'): string {
  const labels = {
    active: language === 'fr' ? 'Active' : 'Active',
    completed: language === 'fr' ? 'Terminée' : 'Completed',
    archived: language === 'fr' ? 'Archivée' : 'Archived',
  };
  return labels[status as keyof typeof labels] || status;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConversationHeader({
  conversation,
  language = 'fr',
  onResume,
  onViewPoll,
  compact = false,
  className
}: ConversationHeaderProps) {
  const t = translations[language];
  const hasRelatedPoll = Boolean(conversation.relatedPollId);

  const handleViewPoll = () => {
    if (conversation.relatedPollId) {
      onViewPoll?.(conversation.relatedPollId);
    }
  };

  const handleResume = () => {
    onResume?.(conversation.id);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Title and Status */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className={cn(
            "font-semibold text-gray-900 truncate",
            compact ? "text-base" : "text-lg"
          )}>
            {conversation.title}
          </h2>
          
          {/* Badges Row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Status Badge */}
            <Badge className={cn("text-xs", getStatusColor(conversation.status))}>
              {getStatusLabel(conversation.status, language)}
            </Badge>
            
            {/* Favorite Badge */}
            {conversation.isFavorite && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-200 text-xs">
                ⭐ {t.favorite}
              </Badge>
            )}
            
            {/* Bidirectional Poll Link Badge */}
            {hasRelatedPoll && (
              <Badge 
                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors text-xs"
                onClick={handleViewPoll}
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                {t.linkedToPoll}
                <ExternalLink className="w-3 h-3 ml-1" />
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {hasRelatedPoll && (
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              onClick={handleViewPoll}
              className="flex items-center gap-1"
            >
              <BarChart3 className="h-3 w-3" />
              {compact ? '📊' : t.viewPoll}
            </Button>
          )}
          
          {conversation.status !== 'archived' && (
            <Button
              size={compact ? "sm" : "default"}
              onClick={handleResume}
              className="flex items-center gap-1"
            >
              <Play className="h-3 w-3" />
              {compact ? '▶️' : t.resume}
            </Button>
          )}
        </div>
      </div>

      {/* Metadata */}
      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span>{conversation.messageCount} {t.messages}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {t.createdOn} {conversation.createdAt.toLocaleDateString(
                language === 'fr' ? 'fr-FR' : 'en-US',
                { day: '2-digit', month: '2-digit', year: 'numeric' }
              )}
            </span>
          </div>
          
          {conversation.messageCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>
                {t.lastActivity}: {formatMessageTime(conversation.updatedAt, language)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ConversationHeader;
