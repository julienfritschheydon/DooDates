import React from "react";
import { type PollSuggestion } from "../lib/gemini";
interface GeminiChatInterfaceProps {
    onPollCreated?: (pollData: PollSuggestion) => void;
    onNewChat?: () => void;
    onUserMessage?: () => void;
    resumeLastConversation?: boolean;
    hideStatusBar?: boolean;
    darkTheme?: boolean;
    voiceRecognition?: ReturnType<typeof import("../hooks/useVoiceRecognition").useVoiceRecognition>;
}
export type GeminiChatHandle = {
    submitMessage: (text: string) => Promise<void>;
};
declare const GeminiChatInterface: React.ForwardRefExoticComponent<GeminiChatInterfaceProps & React.RefAttributes<GeminiChatHandle>>;
export default GeminiChatInterface;
