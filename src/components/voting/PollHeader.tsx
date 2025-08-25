import React from "react";
import { ChevronLeft, Users } from "lucide-react";
import { Poll, SwipeVote } from "./utils/types";

interface PollHeaderProps {
  poll: Poll | null;
  existingVotes?: SwipeVote[];
  onBack?: () => void;
  totalVotes?: number;
  remainingVotes?: number;
  progressPercent?: number;
}

export const PollHeader: React.FC<PollHeaderProps> = ({
  poll,
  existingVotes = [],
  onBack,
  totalVotes = 0,
  remainingVotes = 0,
  progressPercent = 0,
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
  const localVotes = JSON.parse(localStorage.getItem('dev-votes') || '[]');
  const pollVotes = localVotes.filter((vote: any) => vote.poll_id === poll?.id);
  const uniqueVoters = new Set(pollVotes.map((vote: any) => vote.voter_email)).size;
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
      <div className="flex justify-center gap-2 sm:gap-4 mt-4 mb-2">
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
      </div>
    </div>
  );
};

export default PollHeader;
