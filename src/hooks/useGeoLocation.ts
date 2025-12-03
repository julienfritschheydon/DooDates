import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { logError } from "@/lib/error-handling";

export interface GeoLocation {
  country: string;
  region?: string;
  city?: string;
  timezone?: string;
  ip?: string;
  source: "cloudflare" | "ipinfo" | "fallback";
}

const STORAGE_KEY = "doodates_geo";

export function useGeoLocation() {
  const [geo, setGeo] = useState<GeoLocation | null>(() => {
    // Try to load from storage first
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (geo) return; // Already have data

    const fetchGeo = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("geo-detection");

        if (error) throw error;

        if (data) {
          setGeo(data);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          console.log("[Geo] Detected:", data.country, `(${data.source})`);
        }
      } catch (err: any) {
        logError(err, { component: "geo", operation: "fetchGeo" });
        setError(err.message);
        // Fallback
        const fallback: GeoLocation = { country: "FR", source: "fallback" };
        setGeo(fallback);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
      } finally {
        setLoading(false);
      }
    };

    fetchGeo();
  }, [geo]);

  return { geo, loading, error };
}
