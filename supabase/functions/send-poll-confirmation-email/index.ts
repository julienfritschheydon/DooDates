// @ts-expect-error: Deno URL imports are valid in Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Deno URL imports are valid in Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Deno global is available in the Edge Function runtime
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface EmailPayload {
  pollId: string;
  pollType: "date" | "form";
  responseData: {
    selectedDates?: Array<{ date: string; slots?: string[] }>;
    responses?: Array<{ question: string; answer: string }>;
    respondentName?: string;
  };
  recipientEmail: string;
  pollTitle: string;
}

// Template pour Date Poll
function generateDatePollEmailHTML(data: {
  pollTitle: string;
  selectedDates: Array<{ date: string; slots?: string[] }>;
  respondentName?: string;
}): string {
  const datesList = data.selectedDates
    .map(
      (item) => `
    <li style="margin-bottom: 12px;">
      <strong>${new Date(item.date).toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}</strong>
      ${
        item.slots && item.slots.length > 0
          ? `<br/><span style="color: #666; font-size: 14px;">Créneaux: ${item.slots.join(", ")}</span>`
          : ""
      }
    </li>
  `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de vote - ${data.pollTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">DooDates</h1>
              <p style="margin: 8px 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Confirmation de vote</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333; font-size: 24px; font-weight: 600;">
                ${data.pollTitle}
              </h2>
              
              ${
                data.respondentName
                  ? `<p style="margin: 0 0 24px; color: #666; font-size: 16px;">Bonjour ${data.respondentName},</p>`
                  : ""
              }
              
              <p style="margin: 0 0 24px; color: #666; font-size: 16px;">
                Merci d'avoir voté ! Voici un récapitulatif de vos disponibilités :
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; border-radius: 4px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px; color: #333; font-size: 18px; font-weight: 600;">Vos dates sélectionnées</h3>
                <ul style="margin: 0; padding-left: 20px; color: #333; font-size: 16px; line-height: 1.6;">
                  ${datesList}
                </ul>
              </div>
              
              <p style="margin: 0 0 24px; color: #666; font-size: 14px;">
                Vous recevrez une notification lorsque le créateur du sondage aura finalisé la date.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999; font-size: 14px;">
                Cet email a été envoyé automatiquement par DooDates
              </p>
              <p style="margin: 8px 0 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} DooDates - Tous droits réservés
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Template pour Form Poll
function generateFormPollEmailHTML(data: {
  pollTitle: string;
  responses: Array<{ question: string; answer: string }>;
  respondentName?: string;
}): string {
  const responsesList = data.responses
    .map(
      (item) => `
    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0;">
      <p style="margin: 0 0 8px; color: #333; font-size: 16px; font-weight: 600;">
        ${item.question}
      </p>
      <p style="margin: 0; color: #666; font-size: 15px; line-height: 1.6;">
        ${item.answer}
      </p>
    </div>
  `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de réponse - ${data.pollTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">DooDates</h1>
              <p style="margin: 8px 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Confirmation de réponse</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333; font-size: 24px; font-weight: 600;">
                ${data.pollTitle}
              </h2>
              
              ${
                data.respondentName
                  ? `<p style="margin: 0 0 24px; color: #666; font-size: 16px;">Bonjour ${data.respondentName},</p>`
                  : ""
              }
              
              <p style="margin: 0 0 24px; color: #666; font-size: 16px;">
                Merci d'avoir répondu au formulaire ! Voici un récapitulatif de vos réponses :
              </p>
              
              <div style="background-color: #f8f9fa; padding: 24px; border-radius: 4px; margin-bottom: 24px;">
                ${responsesList}
              </div>
              
              <p style="margin: 0 0 24px; color: #666; font-size: 14px;">
                Vos réponses ont été enregistrées avec succès.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999; font-size: 14px;">
                Cet email a été envoyé automatiquement par DooDates
              </p>
              <p style="margin: 8px 0 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} DooDates - Tous droits réservés
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

serve(async (req: Request) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const payload: EmailPayload = await req.json();
    const { pollId, pollType, responseData, recipientEmail, pollTitle } = payload;

    // Vérifier que Resend est configuré
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Générer le HTML selon le type de poll
    let htmlContent: string;
    let subject: string;

    if (pollType === "date") {
      subject = `Confirmation de vote - ${pollTitle}`;
      htmlContent = generateDatePollEmailHTML({
        pollTitle,
        selectedDates: responseData.selectedDates || [],
        respondentName: responseData.respondentName,
      });
    } else if (pollType === "form") {
      subject = `Confirmation de réponse - ${pollTitle}`;
      htmlContent = generateFormPollEmailHTML({
        pollTitle,
        responses: responseData.responses || [],
        respondentName: responseData.respondentName,
      });
    } else {
      return new Response(JSON.stringify({ error: "Unsupported poll type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Envoyer l'email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "DooDates <noreply@doodates.com>",
        to: [recipientEmail],
        subject,
        html: htmlContent,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to send email", details: errorText }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resendData = await resendResponse.json();
    console.log("Email sent successfully:", resendData);

    return new Response(JSON.stringify({ success: true, emailId: resendData.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
