/**
 * Edge Function: Envoi automatique du rapport de quotas guests
 *
 * Usage:
 * - Appel manuel: POST /functions/v1/send-quota-report
 * - Cron job: Configurer dans Supabase Dashboard > Database > Cron Jobs
 *
 * Configuration cron recommandée:
 * - Quotidien: 0 9 * * * (9h du matin)
 * - Hebdomadaire: 0 9 * * 1 (Lundi 9h)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportData {
  generated_at: string;
  period: string;
  statistics: {
    total_guests: number;
    active_last_24h: number;
    active_last_7d: number;
    total_credits_consumed: number;
    avg_credits_per_guest: number;
    total_ai_messages: number;
    total_conversations: number;
    total_polls: number;
  };
  alerts: {
    critical: Array<{ fingerprint: string; total_credits: number; status: string }>;
    near_limit: number;
    suspicious_activity: Array<{
      fingerprint: string;
      rapid_actions: number;
      minutes_span: number;
    }>;
  };
  top_consumers: Array<{
    fingerprint: string;
    total_credits: number;
    ai_messages: number;
    conversations: number;
    polls: number;
    last_activity: string;
  }>;
  recent_activity_by_type: Record<string, { count: number; total_credits: number }>;
  daily_trend: Array<{
    date: string;
    actions: number;
    total_credits: number;
    unique_guests: number;
  }>;
  by_timezone: Array<{
    timezone: string;
    unique_guests: number;
    total_credits: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase avec service_role
    // Les variables d'environnement sont automatiquement injectées par Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      // Si les variables d'environnement ne sont pas disponibles, essayer de les récupérer depuis les headers
      const authHeader = req.headers.get("Authorization");
      const apiKeyHeader = req.headers.get("apikey");

      // Pour les Edge Functions, SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont automatiquement disponibles
      // Si ce n'est pas le cas, utiliser l'URL depuis la requête
      const inferredUrl = supabaseUrl || req.url.split("/functions/v1/")[0];

      if (!supabaseServiceKey && (authHeader || apiKeyHeader)) {
        // Utiliser la clé fournie dans les headers comme fallback
        const providedKey = authHeader?.replace("Bearer ", "") || apiKeyHeader || "";
        const supabase = createClient(inferredUrl, providedKey);

        // Vérifier si c'est une clé service_role valide
        if (!providedKey.startsWith("eyJ")) {
          return new Response(
            JSON.stringify({
              success: false,
              error:
                "Invalid API key format. Please use your anon public or service_role key from Supabase Dashboard > Settings > API",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 401,
            },
          );
        }
      } else if (!supabaseServiceKey) {
        throw new Error(
          "Missing Supabase environment variables. SUPABASE_SERVICE_ROLE_KEY should be automatically available in Edge Functions.",
        );
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Générer le rapport via la fonction SQL
    const { data: report, error: reportError } = await supabase.rpc("generate_guest_quota_report");

    if (reportError) {
      throw new Error(`Failed to generate report: ${reportError.message}`);
    }

    const reportData = report as ReportData;

    // Formater le rapport pour l'affichage
    const formattedReport = formatReport(reportData);

    // Option 1: Envoyer par email (nécessite configuration SMTP)
    // await sendEmailReport(formattedReport, reportData);

    // Option 2: Envoyer à un webhook (Slack, Discord, etc.)
    const webhookUrl = Deno.env.get("QUOTA_REPORT_WEBHOOK_URL");
    if (webhookUrl) {
      await sendWebhookReport(webhookUrl, formattedReport, reportData);
    }

    // Option 3: Logger dans Supabase (table de logs)
    await logReport(supabase, reportData);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Report generated and sent",
        report: reportData,
        formatted: formattedReport,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error generating quota report:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

/**
 * Formate le rapport pour l'affichage texte
 */
function formatReport(report: ReportData): string {
  const stats = report.statistics;
  const alerts = report.alerts;

  let formatted = `
📊 RAPPORT QUOTAS GUESTS - ${new Date(report.generated_at).toLocaleString("fr-FR")}
${"=".repeat(60)}

📈 STATISTIQUES GLOBALES
  • Total guests: ${stats.total_guests}
  • Actifs (24h): ${stats.active_last_24h}
  • Actifs (7j): ${stats.active_last_7d}
  • Total crédits consommés: ${stats.total_credits_consumed}
  • Moyenne crédits/guest: ${stats.avg_credits_per_guest}
  • Messages IA: ${stats.total_ai_messages}
  • Conversations: ${stats.total_conversations}
  • Polls: ${stats.total_polls}

⚠️ ALERTES
  • Guests critiques (>=45 crédits): ${alerts.critical?.length || 0}
  • Guests proches limite (40-44): ${alerts.near_limit || 0}
  • Activités suspectes: ${alerts.suspicious_activity?.length || 0}

🔝 TOP 10 CONSOMMATEURS (24h)
`;

  report.top_consumers?.slice(0, 10).forEach((guest, index) => {
    formatted += `  ${index + 1}. ${guest.fingerprint.substring(0, 16)}... - ${guest.total_credits} crédits\n`;
  });

  formatted += `\n📊 ACTIVITÉ PAR TYPE (24h)\n`;
  Object.entries(report.recent_activity_by_type || {}).forEach(([action, data]) => {
    formatted += `  • ${action}: ${data.count} actions, ${data.total_credits} crédits\n`;
  });

  if (alerts.critical && alerts.critical.length > 0) {
    formatted += `\n🔴 GUESTS CRITIQUES\n`;
    alerts.critical.forEach((guest) => {
      formatted += `  • ${guest.fingerprint.substring(0, 16)}... - ${guest.total_credits} crédits\n`;
    });
  }

  return formatted;
}

/**
 * Envoie le rapport à un webhook (Slack, Discord, etc.)
 */
async function sendWebhookReport(
  webhookUrl: string,
  formattedReport: string,
  reportData: ReportData,
): Promise<void> {
  const stats = reportData.statistics;
  const alerts = reportData.alerts;

  // Format Slack avec blocks pour un meilleur rendu
  const blocks: Array<{
    type: string;
    text?: { type: string; text: string };
    fields?: Array<{ type: string; text: string }>;
  }> = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `📊 Rapport Quotas Guests - ${new Date(reportData.generated_at).toLocaleDateString("fr-FR")}`,
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*📈 STATISTIQUES GLOBALES*",
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Total guests:*\n${stats.total_guests}`,
        },
        {
          type: "mrkdwn",
          text: `*Actifs (24h):*\n${stats.active_last_24h}`,
        },
        {
          type: "mrkdwn",
          text: `*Actifs (7j):*\n${stats.active_last_7d}`,
        },
        {
          type: "mrkdwn",
          text: `*Total crédits:*\n${stats.total_credits_consumed}`,
        },
        {
          type: "mrkdwn",
          text: `*Moyenne/Guest:*\n${stats.avg_credits_per_guest}`,
        },
        {
          type: "mrkdwn",
          text: `*Messages IA:*\n${stats.total_ai_messages}`,
        },
        {
          type: "mrkdwn",
          text: `*Conversations:*\n${stats.total_conversations}`,
        },
        {
          type: "mrkdwn",
          text: `*Polls:*\n${stats.total_polls}`,
        },
      ],
    },
  ];

  // Section Alertes
  if (alerts.critical?.length || alerts.near_limit || alerts.suspicious_activity?.length) {
    blocks.push(
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*⚠️ ALERTES*",
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Guests critiques (>=45):*\n${alerts.critical?.length || 0}`,
          },
          {
            type: "mrkdwn",
            text: `*Proches limite (40-44):*\n${alerts.near_limit || 0}`,
          },
          {
            type: "mrkdwn",
            text: `*Activités suspectes:*\n${alerts.suspicious_activity?.length || 0}`,
          },
        ],
      },
    );

    // Liste des guests critiques si présents
    if (alerts.critical && alerts.critical.length > 0) {
      const criticalList = alerts.critical
        .slice(0, 5)
        .map((g) => `• ${g.fingerprint.substring(0, 16)}... - ${g.total_credits} crédits`)
        .join("\n");

      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🔴 Guests Critiques:*\n\`\`\`${criticalList}\`\`\``,
        },
      });
    }
  }

  // Top consommateurs
  if (reportData.top_consumers && reportData.top_consumers.length > 0) {
    blocks.push(
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*🔝 TOP 5 CONSOMMATEURS (24h)*",
        },
      },
    );

    const topList = reportData.top_consumers
      .slice(0, 5)
      .map(
        (g, i) =>
          `${i + 1}. ${g.fingerprint.substring(0, 16)}... - ${g.total_credits} crédits (${g.ai_messages} IA, ${g.conversations} conv)`,
      )
      .join("\n");

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `\`\`\`${topList}\`\`\``,
      },
    });
  }

  const payload = {
    text: formattedReport, // Fallback texte si blocks ne fonctionnent pas
    blocks: blocks,
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Webhook failed: ${response.statusText} - ${errorText}`);
  }
}

/**
 * Log le rapport dans Supabase (optionnel)
 */
async function logReport(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  reportData: ReportData,
): Promise<void> {
  // Créer une table de logs si nécessaire
  // CREATE TABLE IF NOT EXISTS quota_report_logs (
  //   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  //   report_data JSONB,
  //   created_at TIMESTAMPTZ DEFAULT NOW()
  // );

  try {
    await supabase.from("quota_report_logs").insert({
      report_data: reportData,
    });
  } catch (error) {
    // Table peut ne pas exister, ignorer l'erreur
    console.log("Could not log report (table may not exist):", error);
  }
}
