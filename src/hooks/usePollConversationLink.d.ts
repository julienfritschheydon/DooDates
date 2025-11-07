/**
 * Hook for managing bidirectional links between polls and conversations
 * DooDates - Poll-Conversation Linking System
 */
export interface PollLinkMetadata {
    conversationId: string;
    messageId: string;
    conversationTitle?: string;
    generatedAt: string;
}
export interface ConversationLinkMetadata {
    pollId: string;
    pollTitle: string;
    createdAt: string;
}
export declare const usePollConversationLink: () => {
    linkPollToConversation: (conversationId: string, pollData: {
        pollId: string;
        pollTitle: string;
        messageId?: string;
    }) => Promise<boolean>;
    getPollLinkMetadata: (conversationId: string, messageId: string, conversationTitle?: string) => PollLinkMetadata;
    navigateToConversation: (conversationId: string) => void;
    navigateToPoll: (pollId: string) => void;
    hasLinkedPoll: (conversationId: string) => boolean;
    getLinkedPoll: (conversationId: string) => ConversationLinkMetadata;
    isLinking: boolean;
    linkError: import("../types/conversation").ConversationError;
};
export default usePollConversationLink;
