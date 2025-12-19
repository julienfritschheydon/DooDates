import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

interface DatePollEmailData {
  pollId: string;
  pollTitle: string;
  selectedDates: Array<{
    date: string;
    slots?: string[];
  }>;
  respondentName?: string;
  recipientEmail: string;
}

interface FormPollEmailData {
  pollId: string;
  pollTitle: string;
  responses: Array<{
    question: string;
    answer: string;
  }>;
  respondentName?: string;
  recipientEmail: string;
}

/**
 * Envoie un email de confirmation pour un Date Poll
 */
export async function sendDatePollConfirmationEmail(
  data: DatePollEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info("Sending date poll confirmation email", {
      pollId: data.pollId,
      recipient: data.recipientEmail,
    });

    const { data: result, error } = await supabase.functions.invoke(
      "send-poll-confirmation-email",
      {
        body: {
          pollId: data.pollId,
          pollType: "date",
          pollTitle: data.pollTitle,
          responseData: {
            selectedDates: data.selectedDates,
            respondentName: data.respondentName,
          },
          recipientEmail: data.recipientEmail,
        },
      }
    );

    if (error) {
      logger.error("Failed to send date poll confirmation email", {
        error,
        pollId: data.pollId,
      });
      return { success: false, error: error.message };
    }

    logger.info("Date poll confirmation email sent successfully", {
      pollId: data.pollId,
      emailId: result?.emailId,
    });

    return { success: true };
  } catch (error: any) {
    logger.error("Error sending date poll confirmation email", {
      error: error.message,
      pollId: data.pollId,
    });
    return { success: false, error: error.message };
  }
}

/**
 * Envoie un email de confirmation pour un Form Poll
 */
export async function sendFormPollConfirmationEmail(
  data: FormPollEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info("Sending form poll confirmation email", {
      pollId: data.pollId,
      recipient: data.recipientEmail,
    });

    const { data: result, error } = await supabase.functions.invoke(
      "send-poll-confirmation-email",
      {
        body: {
          pollId: data.pollId,
          pollType: "form",
          pollTitle: data.pollTitle,
          responseData: {
            responses: data.responses,
            respondentName: data.respondentName,
          },
          recipientEmail: data.recipientEmail,
        },
      }
    );

    if (error) {
      logger.error("Failed to send form poll confirmation email", {
        error,
        pollId: data.pollId,
      });
      return { success: false, error: error.message };
    }

    logger.info("Form poll confirmation email sent successfully", {
      pollId: data.pollId,
      emailId: result?.emailId,
    });

    return { success: true };
  } catch (error: any) {
    logger.error("Error sending form poll confirmation email", {
      error: error.message,
      pollId: data.pollId,
    });
    return { success: false, error: error.message };
  }
}

/**
 * Vérifie si l'envoi d'email est activé pour un poll
 */
export function shouldSendConfirmationEmail(settings: any): boolean {
  return !!(settings?.sendEmailCopy && settings?.emailForCopy);
}

/**
 * Fonction wrapper pour FormPollVote (compatibilité avec l'ancien code)
 */
export async function sendVoteConfirmationEmail(params: {
  poll: any;
  response: any;
  questions: any[];
}): Promise<void> {
  const { poll, response, questions } = params;
  
  // Construire le tableau de réponses
  const responses = response.items.map((item: any) => {
    const question = questions.find(q => q.id === item.questionId);
    const questionTitle = question?.title || "Question";
    
    let answerText = "";
    if (typeof item.value === "string") {
      answerText = item.value;
    } else if (Array.isArray(item.value)) {
      answerText = item.value.join(", ");
    } else if (typeof item.value === "object") {
      answerText = JSON.stringify(item.value);
    } else {
      answerText = String(item.value);
    }
    
    return {
      question: questionTitle,
      answer: answerText
    };
  });
  
  // Appeler la fonction principale
  await sendFormPollConfirmationEmail({
    pollId: poll.id,
    pollTitle: poll.title,
    responses,
    respondentName: response.respondentName,
    recipientEmail: response.respondentEmail || poll.settings?.emailForCopy || '',
  });
}
