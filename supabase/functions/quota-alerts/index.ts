// Deno Edge Function with different runtime
// @ts-expect-error - Deno modules
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Deno modules
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-expect-error - Deno modules
import { Resend } from "https://esm.sh/resend@2.0.0";

// @ts-expect-error - Deno types
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface SupabaseClient {
  from: (table: string) => SupabaseQueryBuilder;
}

interface SupabaseQueryBuilder {
  select: (columns: string) => SupabaseQueryBuilder;
  gte: (column: string, value: unknown) => SupabaseQueryBuilder;
  order: (column: string, options?: { ascending: boolean }) => SupabaseQueryBuilder;
  limit: (limit: number) => SupabaseQueryBuilder;
  then: <T>(onFulfilled: (value: SupabaseResponse<T>) => T | PromiseLike<T>) => Promise<T>;
}

interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

interface SupabaseError {
  message: string;
}

interface QuotaAlert {
  user_id: string;
  fingerprint?: string;
  total_credits_consumed: number;
  threshold: number;
  alert_type: "high_usage" | "suspicious_activity";
}

interface QuotaData {
  user_id: string;
  total_credits_consumed: number;
}

interface GuestQuotaData {
  id: string;
  fingerprint: string;
  total_credits_consumed: number;
}

interface ActivityEntry {
  user_id: string;
  action: string;
  credits: number;
  created_at: string;
}

interface UserActivity {
  [userId: string]: {
    totalCredits: number;
    entries: ActivityEntry[];
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "julien.fritsch@gmail.com";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Check for authorization (admin only)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { method } = req;

    if (method === "POST") {
      // Trigger quota alert check
      const alerts = await checkQuotaAlerts(supabase);

      if (alerts.length > 0) {
        await sendAlertEmails(resend, alerts, adminEmail);
      }

      return new Response(
        JSON.stringify({
          success: true,
          alerts_found: alerts.length,
          alerts: alerts,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (method === "GET") {
      // Get current alert status
      const alerts = await checkQuotaAlerts(supabase);

      return new Response(
        JSON.stringify({
          success: true,
          alerts_count: alerts.length,
          alerts: alerts,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Quota alerts error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function checkQuotaAlerts(supabase: SupabaseClient): Promise<QuotaAlert[]> {
  const alerts: QuotaAlert[] = [];

  // Check authenticated users quota
  const userQuotasResponse = await supabase
    .from("quota_tracking")
    .select("*")
    .gte("total_credits_consumed", 50);

  const { data: userQuotas, error: userError } = (await userQuotasResponse) as SupabaseResponse<
    QuotaData[]
  >;

  if (!userError && userQuotas) {
    userQuotas.forEach((quota: QuotaData) => {
      alerts.push({
        user_id: quota.user_id,
        total_credits_consumed: quota.total_credits_consumed,
        threshold: 50,
        alert_type: "high_usage",
      });
    });
  }

  // Check guest quotas
  const guestQuotasResponse = await supabase
    .from("guest_quotas")
    .select("*")
    .gte("total_credits_consumed", 50);

  const { data: guestQuotas, error: guestError } = (await guestQuotasResponse) as SupabaseResponse<
    GuestQuotaData[]
  >;

  if (!guestError && guestQuotas) {
    guestQuotas.forEach((quota: GuestQuotaData) => {
      alerts.push({
        user_id: quota.id,
        fingerprint: quota.fingerprint,
        total_credits_consumed: quota.total_credits_consumed,
        threshold: 50,
        alert_type: "high_usage",
      });
    });
  }

  // Check for suspicious activity (rapid consumption)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const recentActivityResponse = await supabase
    .from("guest_quota_journal")
    .select("user_id, action, credits, created_at")
    .gte("created_at", oneHourAgo)
    .order("created_at", { ascending: false });

  const { data: recentActivity, error: activityError } =
    (await recentActivityResponse) as SupabaseResponse<ActivityEntry[]>;

  if (!activityError && recentActivity) {
    // Group by user and count total credits in last hour
    const userActivity = recentActivity.reduce((acc: UserActivity, entry: ActivityEntry) => {
      const userId = entry.user_id;
      if (!acc[userId]) {
        acc[userId] = { totalCredits: 0, entries: [] };
      }
      acc[userId].totalCredits += entry.credits;
      acc[userId].entries.push(entry);
      return acc;
    }, {});

    // Alert on users with > 30 credits in 1 hour
    Object.entries(userActivity).forEach(
      ([userId, activity]: [string, { totalCredits: number; entries: ActivityEntry[] }]) => {
        if (activity.totalCredits > 30) {
          alerts.push({
            user_id: userId,
            total_credits_consumed: activity.totalCredits,
            threshold: 30,
            alert_type: "suspicious_activity",
          });
        }
      },
    );
  }

  return alerts;
}

async function sendAlertEmails(resend: Resend, alerts: QuotaAlert[], adminEmail: string) {
  const highUsageAlerts = alerts.filter((a) => a.alert_type === "high_usage");
  const suspiciousAlerts = alerts.filter((a) => a.alert_type === "suspicious_activity");

  if (highUsageAlerts.length === 0 && suspiciousAlerts.length === 0) {
    return; // No alerts to send
  }

  let emailContent = `
    <h2>🚨 DooDates Quota Alert Report</h2>
    <p>Generated: ${new Date().toLocaleString()}</p>
  `;

  if (highUsageAlerts.length > 0) {
    emailContent += `
      <h3>⚠️ High Usage Users (>50 credits)</h3>
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th style="padding: 8px; background: #f5f5f5;">User ID</th>
            <th style="padding: 8px; background: #f5f5f5;">Fingerprint</th>
            <th style="padding: 8px; background: #f5f5f5;">Total Credits</th>
          </tr>
        </thead>
        <tbody>
    `;

    highUsageAlerts.forEach((alert) => {
      emailContent += `
        <tr>
          <td style="padding: 8px;">${alert.user_id.substring(0, 8)}...</td>
          <td style="padding: 8px;">${alert.fingerprint || "N/A"}</td>
          <td style="padding: 8px; font-weight: bold;">${alert.total_credits_consumed}</td>
        </tr>
      `;
    });

    emailContent += `
        </tbody>
      </table>
    `;
  }

  if (suspiciousAlerts.length > 0) {
    emailContent += `
      <h3>🔍 Suspicious Activity (>30 credits in 1 hour)</h3>
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th style="padding: 8px; background: #f5f5f5;">User ID</th>
            <th style="padding: 8px; background: #f5f5f5;">Credits (1h)</th>
          </tr>
        </thead>
        <tbody>
    `;

    suspiciousAlerts.forEach((alert) => {
      emailContent += `
        <tr>
          <td style="padding: 8px;">${alert.user_id.substring(0, 8)}...</td>
          <td style="padding: 8px; font-weight: bold; color: red;">${alert.total_credits_consumed}</td>
        </tr>
      `;
    });

    emailContent += `
        </tbody>
      </table>
    `;
  }

  emailContent += `
    <hr>
    <p><small>This is an automated alert from DooDates quota monitoring system.</small></p>
    <p><small>To review these users, visit the admin dashboard.</small></p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: "DooDates Alerts <alerts@doodates.com>",
      to: [adminEmail],
      subject: `🚨 DooDates Quota Alert - ${alerts.length} users detected`,
      html: emailContent,
    });

    if (error) {
      console.error("Failed to send alert email:", error);
      throw error;
    }

    console.log("Alert email sent successfully:", data);
  } catch (error) {
    console.error("Error sending alert email:", error);
    throw error;
  }
}
