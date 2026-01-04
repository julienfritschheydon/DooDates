import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const IPINFO_TOKEN = Deno.env.get("IPINFO_TOKEN");
const DEFAULT_COUNTRY = "FR";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Try Cloudflare Header
    const cfCountry = req.headers.get("cf-ipcountry");
    if (cfCountry) {
      return new Response(
        JSON.stringify({
          country: cfCountry.toUpperCase(),
          source: "cloudflare",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 2. Try IPinfo Fallback
    let ip = req.headers.get("x-forwarded-for") || "";
    if (ip.includes(",")) ip = ip.split(",")[0].trim();

    // Skip local/private IPs
    if (
      ip &&
      ip !== "::1" &&
      ip !== "127.0.0.1" &&
      !ip.startsWith("192.168.") &&
      !ip.startsWith("10.")
    ) {
      try {
        const url = `https://ipinfo.io/${ip}/json${IPINFO_TOKEN ? `?token=${IPINFO_TOKEN}` : ""}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          return new Response(
            JSON.stringify({
              country: data.country,
              region: data.region,
              city: data.city,
              timezone: data.timezone,
              ip: ip,
              source: "ipinfo",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      } catch (error) {
        console.error("IPinfo error:", error);
      }
    }

    // 3. Fallback
    return new Response(
      JSON.stringify({
        country: DEFAULT_COUNTRY,
        source: "fallback",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
