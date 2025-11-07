/**
 * Authentication Incentive Modal for Freemium Users
 * DooDates - Freemium Quota Management
 */
import React from "react";
import { type AuthIncentiveType } from "../../services/QuotaService";
interface AuthIncentiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSignUp: () => void;
    onSignIn: () => void;
    trigger: AuthIncentiveType;
    currentUsage?: {
        conversations: number;
        maxConversations: number;
        polls?: number;
        maxPolls?: number;
    };
}
declare const AuthIncentiveModal: React.FC<AuthIncentiveModalProps>;
export default AuthIncentiveModal;
