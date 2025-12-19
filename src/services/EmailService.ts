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
 * Génère le HTML de l'email de confirmation pour un Form Poll
 */
function generateFormPollEmailHTML(data: {
  pollTitle: string;
  responses: Array<{ question: string; answer: string }>;
  respondentName?: string;
}): string {
  const respondentName = data.respondentName || "Anonyme";
  const responsesList = data.responses
    .map(
      (item) => `
    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0;">
      <p style="margin: 0 0 8px; color: #333; font-size: 16px; font-weight: 600;">
        ${escapeHtml(item.question)}
      </p>
      <p style="margin: 0; color: #666; font-size: 15px; line-height: 1.6;">
        ${escapeHtml(item.answer)}
      </p>
    </div>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vos réponses : ${escapeHtml(data.pollTitle)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">DooDates</h1>
              <p style="margin: 8px 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Confirmation de réponse</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333; font-size: 24px; font-weight: 600;">
                ${escapeHtml(data.pollTitle)}
              </h2>
              <p style="margin: 0 0 24px; color: #666; font-size: 16px;">Bonjour ${escapeHtml(respondentName)},</p>
              <p style="margin: 0 0 24px; color: #666; font-size: 16px;">
                Merci d'avoir répondu au formulaire ! Voici un récapitulatif de vos réponses :
              </p>
              <div style="background-color: #f8f9fa; padding: 24px; border-radius: 4px; margin-bottom: 24px;">
                ${responsesList}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 */
function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return String(text);
  }
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Formate la réponse selon le type de question
 */
function formatAnswer(value: any, question: any): string {
  if (typeof value === "string") {
    // Pour les questions single, trouver le label de l'option
    if (question.kind === "single" && question.options) {
      const option = question.options.find((opt: any) => opt.id === value);
      return option?.label || value;
    }
    return value;
  } else if (Array.isArray(value)) {
    // Pour les questions multiple, trouver les labels des options
    if (question.kind === "multiple" && question.options) {
      return value
        .map((optId: string) => {
          const option = question.options.find((opt: any) => opt.id === optId);
          return option?.label || optId;
        })
        .join(", ");
    }
    return value.join(", ");
  } else if (typeof value === "object" && value !== null) {
    // Pour les questions matrix
    if (question.kind === "matrix") {
      const entries = Object.entries(value);
      return entries
        .map(([rowId, colValue]) => {
          const row = question.matrixRows?.find((r: any) => r.id === rowId);
          const rowLabel = row?.label || rowId;
          
          if (Array.isArray(colValue)) {
            // Multiple choice matrix
            const colLabels = colValue
              .map((colId: string) => {
                const col = question.matrixColumns?.find((c: any) => c.id === colId);
                return col?.label || colId;
              })
              .join(", ");
            return `${rowLabel}: ${colLabels}`;
          } else {
            // Single choice matrix
            const col = question.matrixColumns?.find((c: any) => c.id === colValue);
            const colLabel = col?.label || colValue;
            return `${rowLabel}: ${colLabel}`;
          }
        })
        .join("; ");
    }
    return JSON.stringify(value);
  } else if (typeof value === "number") {
    // Pour les questions rating et NPS
    if (question.kind === "rating" && question.ratingScale) {
      return `${value}/${question.ratingScale}`;
    } else if (question.kind === "nps") {
      return `${value}/10`;
    }
    return String(value);
  }
  return String(value);
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
  
  // Valider que l'email est présent
  if (!response.respondentEmail) {
    throw new Error('Email du votant manquant');
  }
  
  // Construire le tableau de réponses avec formatage approprié
  const formattedResponses = response.items.map((item: any) => {
    const question = questions.find((q: any) => q.id === item.questionId);
    const questionTitle = question?.title || "Question";
    const answerText = formatAnswer(item.value, question);
    
    return {
      question: questionTitle,
      answer: answerText
    };
  });
  
  // Générer le HTML de l'email
  const html = generateFormPollEmailHTML({
    pollTitle: poll.title,
    responses: formattedResponses,
    respondentName: response.respondentName,
  });
  
  // En mode test/dev, logger à la console
  if (typeof process !== "undefined" && (process.env?.NODE_ENV === "test" || !import.meta.env?.PROD)) {
    console.log('📧 Email à envoyer:', {
      to: response.respondentEmail,
      subject: `Vos réponses : ${poll.title}`,
      html,
    });
  }
  
  // En production, appeler la fonction principale
  if (import.meta.env?.PROD) {
    await sendFormPollConfirmationEmail({
      pollId: poll.id,
      pollTitle: poll.title,
      responses: formattedResponses,
      respondentName: response.respondentName,
      recipientEmail: response.respondentEmail,
    });
  }
}
