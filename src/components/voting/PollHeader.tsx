import React from "react";
import {
  ChevronLeft,
  Users,
  Bot,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
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
    <div className="p-4 relative bg-[#0a0a0a] border-b border-gray-800">
      {/* Titre et description */}
      <div className="text-center">
        <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">
          {poll?.title}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{poll?.description}</p>
        
        {/* Info simple sous le titre */}
        <div className="flex justify-center gap-4 mt-3 text-sm text-gray-400">
          <span>
            {totalParticipants} {totalParticipants === 0 || totalParticipants === 1 ? "participant" : "participants"}
          </span>
          <span>•</span>
          <span>
            Expire le {poll?.expires_at && formatExpiryDate(poll.expires_at)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PollHeader;
