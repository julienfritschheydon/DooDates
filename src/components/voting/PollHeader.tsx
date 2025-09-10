import React from "react";
import { ChevronLeft, Users, Bot, MessageCircle } from "lucide-react";
import { Poll, SwipeVote } from "./utils/types";

interface PollHeaderProps {
  poll: Poll | null;
  existingVotes?: SwipeVote[];
  onBack?: () => void;
  totalVotes?: number;
  remainingVotes?: number;
  progressPercent?: number;
  onViewConversation?: (conversationId: string) => void;
}

export const PollHeader: React.FC<PollHeaderProps> = ({
  poll,
  existingVotes = [],
  onBack,
  totalVotes = 0,
  remainingVotes = 0,
  progressPercent = 0,
  onViewConversation,
}) => {
  // Formater la date d'expiration
  const formatExpiryDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Utiliser directement localStorage comme le Dashboard
  const localVotes = JSON.parse(localStorage.getItem("dev-votes") || "[]");
  const pollVotes = localVotes.filter((vote: any) => vote.poll_id === poll?.id);
  const uniqueVoters = new Set(pollVotes.map((vote: any) => vote.voter_email))
    .size;
  const totalParticipants = uniqueVoters;

  return (
    <div className="p-4 relative bg-white border-b">
      {/* Titre et description sur une ligne sur mobile */}
      <div className="text-center">
        <h1 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">
          {poll?.title}
        </h1>
        <p className="text-gray-600 text-sm mt-1">{poll?.description}</p>
      </div>

      {/* Badges info compacts */}
      <div className="flex justify-center gap-2 sm:gap-4 mt-4 mb-2 flex-wrap">
        <div className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <Users className="w-3 h-3 text-blue-600" />
          <span className="text-blue-800 font-medium text-sm">
            {totalParticipants}
          </span>
          <span className="text-blue-600 text-xs hidden sm:inline">
            {totalParticipants === 0 || totalParticipants === 1
              ? "participant"
              : "participants"}
          </span>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-orange-600 text-xs hidden sm:inline">
            Expire le
          </span>
          <span className="text-orange-800 font-medium text-sm">
            {poll?.expires_at && formatExpiryDate(poll.expires_at)}
          </span>
        </div>

        {/* AI Created Badge */}
        {poll?.created_by_ai && (
          <div className="bg-purple-50 border border-purple-200 rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <Bot className="w-3 h-3 text-purple-600" />
            <span className="text-purple-800 font-medium text-sm">
              Créé par IA
            </span>
          </div>
        )}

        {/* Conversation Link Badge */}
        {poll?.conversation_id && onViewConversation && (
          <button
            onClick={() => onViewConversation(poll.conversation_id!)}
            className="bg-green-50 border border-green-200 rounded-full px-3 py-1.5 flex items-center gap-1.5 hover:bg-green-100 transition-colors"
          >
            <MessageCircle className="w-3 h-3 text-green-600" />
            <span className="text-green-800 font-medium text-sm">
              Voir conversation
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PollHeader;
