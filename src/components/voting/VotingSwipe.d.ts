import React from "react";
interface VotingSwipeProps {
    pollId: string;
    onBack?: () => void;
    onVoteSubmitted?: () => void;
}
declare const VotingSwipe: React.FC<VotingSwipeProps>;
export default VotingSwipe;
