
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.warn("⚠️ .env file not found, using process.env");
}

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function checkGemini() {
    console.log("\n🤖 Checking Gemini API...");
    if (!GEMINI_API_KEY) {
        console.error("❌ VITE_GEMINI_API_KEY is missing");
        return false;
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        // Use the model we are actually using in production
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent("Reply with 'OK' if you can read this.");
        const response = await result.response;
        const text = response.text();

        if (text.includes("OK")) {
            console.log("✅ Gemini API is working (gemini-1.5-flash)");
            return true;
        } else {
            console.error("❌ Gemini API returned unexpected response:", text);
            return false;
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("❌ Gemini API check failed:", errorMessage);
        if (errorMessage.includes("400")) {
            console.error("   -> Likely invalid model name or bad request");
        }
        if (errorMessage.includes("403")) {
            console.error("   -> Likely invalid API key");
        }
        return false;
    }
}

async function checkSupabase() {
    console.log("\n⚡ Checking Supabase API...");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error("❌ VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing");
        return false;
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Check connection by fetching a public table or just checking health
        // We try to fetch 0 rows from 'profiles' just to check connection/auth
        // Note: 'profiles' usually requires auth, so this might return 401 if RLS is strict,
        // but a network error would be different.
        // Better to check a public endpoint if available, or just handle the 401 as "Service Reachable".

        const { data, error, status } = await supabase.from("guest_quotas").select("count", { count: "exact", head: true });

        if (error && status !== 401 && status !== 403) {
            console.error(`❌ Supabase check failed with status ${status}:`, error.message);
            return false;
        }

        // If we get 401/403, it means we reached the server but were denied (which is expected for anon)
        // If we get 200, it's also good.
        console.log(`✅ Supabase API is reachable (Status: ${status})`);
        return true;

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("❌ Supabase connection error:", errorMessage);
        return false;
    }
}

async function runHealthCheck() {
    console.log("🏥 Starting Health Check...");

    const geminiOk = await checkGemini();
    const supabaseOk = await checkSupabase();

    console.log("\n--------------------------------");
    if (geminiOk && supabaseOk) {
        console.log("🎉 All systems operational!");
        process.exit(0);
    } else {
        console.error("💥 Some systems are failing checks.");
        process.exit(1);
    }
}

runHealthCheck();
