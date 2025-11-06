import { Poll, FormResponse, FormQuestionShape } from "@/lib/pollStorage";
import { ErrorFactory } from "@/lib/error-handling";

interface EmailResponseData {
  poll: Poll;
  response: FormResponse;
  questions: FormQuestionShape[];
}

/**
 * Envoie un email de confirmation avec les réponses du votant
 */
export async function sendVoteConfirmationEmail(data: EmailResponseData): Promise<void> {
  const { poll, response, questions } = data;

  if (!response.respondentEmail) {
    throw ErrorFactory.validation("Email du votant manquant", "Email du votant manquant");
  }

  // Générer le contenu HTML de l'email
  const emailHtml = generateEmailHtml(data);

  // TODO: Intégration avec Resend API
  // Pour l'instant, log en console (MVP)
  console.log("📧 Email à envoyer:", {
    to: response.respondentEmail,
    subject: `Vos réponses : ${poll.title}`,
    html: emailHtml,
  });

  // PHASE 2 : Vraie implémentation avec Resend
  /*
  const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("⚠️ VITE_RESEND_API_KEY manquante, email non envoyé");
    return;
  }
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: "DooDates <noreply@doodates.com>",
      to: response.respondentEmail,
      subject: `Vos réponses : ${poll.title}`,
      html: emailHtml,
    }),
  });
  
  if (!response.ok) {
    throw ErrorFactory.api("Erreur lors de l'envoi de l'email", "Erreur lors de l'envoi de l'email");
  }
  */
}

/**
 * Génère le HTML de l'email de confirmation
 */
function generateEmailHtml(data: EmailResponseData): string {
  const { poll, response, questions } = data;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; }
        .question { margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px; }
        .question-title { font-weight: bold; margin-bottom: 8px; }
        .answer { color: #3B82F6; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Vos réponses : ${poll.title}</h1>
          <p>Merci d'avoir participé !</p>
        </div>
        <div class="content">
          <p><strong>Nom :</strong> ${response.respondentName || "Anonyme"}</p>
          <p><strong>Date :</strong> ${new Date(response.created_at).toLocaleString("fr-FR")}</p>
          <hr>
  `;

  // Ajouter chaque question/réponse
  response.items.forEach((item) => {
    const question = questions.find((q) => q.id === item.questionId);
    if (!question) return;

    let answerDisplay = "";
    const kind = question.kind || question.type || "single";

    if (kind === "text" || kind === "long-text") {
      answerDisplay = String(item.value);
    } else if (kind === "single") {
      const option = question.options?.find((o) => o.id === item.value);
      answerDisplay = option?.label || String(item.value);
    } else if (kind === "multiple") {
      const ids = Array.isArray(item.value) ? item.value : [];
      const labels = ids.map((id) => {
        const opt = question.options?.find((o) => o.id === id);
        return opt?.label || id;
      });
      answerDisplay = labels.join(", ");
    } else if (kind === "rating" || kind === "nps") {
      answerDisplay = `${item.value}/${kind === "nps" ? 10 : question.ratingScale || 5}`;
    } else if (kind === "matrix") {
      const matrixVal = item.value as Record<string, string | string[]>;
      if (matrixVal && typeof matrixVal === "object" && !Array.isArray(matrixVal)) {
        const rowLabels: string[] = [];
        if (question.matrixRows && question.matrixColumns) {
          question.matrixRows.forEach((row) => {
            const rowAnswer = matrixVal[row.id];
            if (rowAnswer) {
              const colIds = Array.isArray(rowAnswer) ? rowAnswer : [rowAnswer];
              const colLabels = colIds.map((cid) => {
                const col = question.matrixColumns?.find((c) => c.id === cid);
                return col ? col.label : cid;
              });
              rowLabels.push(`${row.label}: ${colLabels.join(", ")}`);
            }
          });
        }
        answerDisplay = rowLabels.join(" • ");
      }
    }

    html += `
      <div class="question">
        <div class="question-title">${question.title}</div>
        <div class="answer">${answerDisplay || "—"}</div>
      </div>
    `;
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  html += `
        </div>
        <div class="footer">
          <p>Cet email a été généré automatiquement par DooDates.</p>
          <p><a href="${origin}/poll/${poll.slug || poll.id}/results">Voir les résultats</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}
