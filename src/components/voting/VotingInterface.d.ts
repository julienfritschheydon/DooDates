import React from "react";
interface VotingInterfaceProps {
    pollId: string;
    onBack?: () => void;
    adminToken?: string;
}
export declare const VotingInterface: React.FC<VotingInterfaceProps>;
export {};
