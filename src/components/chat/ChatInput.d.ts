import React from "react";
interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onKeyPress: (e: React.KeyboardEvent) => void;
    onUserMessage?: () => void;
    isLoading: boolean;
    darkTheme: boolean;
    voiceRecognition: {
        isSupported: boolean;
        isListening: boolean;
        interimTranscript: string;
        startListening: () => void;
        stopListening: () => void;
        resetTranscript: () => void;
    };
    textareaRef: React.RefObject<HTMLTextAreaElement>;
}
export declare const ChatInput: React.FC<ChatInputProps>;
export {};
