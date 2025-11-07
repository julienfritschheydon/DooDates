import { Poll, FormResponse, FormQuestionShape } from "@/lib/pollStorage";
interface EmailResponseData {
    poll: Poll;
    response: FormResponse;
    questions: FormQuestionShape[];
}
/**
 * Envoie un email de confirmation avec les réponses du votant
 */
export declare function sendVoteConfirmationEmail(data: EmailResponseData): Promise<void>;
export {};
