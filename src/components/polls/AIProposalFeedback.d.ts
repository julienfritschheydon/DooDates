interface AIProposalFeedbackProps {
    proposal: {
        userRequest: string;
        generatedContent: any;
        pollContext?: {
            pollId?: string;
            pollTitle?: string;
            pollType?: string;
            action?: string;
        };
    };
    onFeedbackSent?: () => void;
}
export declare function AIProposalFeedback({ proposal, onFeedbackSent }: AIProposalFeedbackProps): import("react/jsx-runtime").JSX.Element;
export {};
