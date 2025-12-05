
import { directGeminiService } from '../src/services/DirectGeminiService';
import { PromptBuilder } from '../src/lib/ai/gemini/prompts/prompt-builder';
import { config as loadEnv } from 'dotenv';
import path from 'path';

// Load env
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

const INPUT_BRUNCH = "Calcule un brunch samedi 23 ou dimanche 24.";
// Added Parsing error case too
const INPUT_PARTENARIATS = "Cherche un créneau entre 11h et 13h mercredi pour un déjeuner partenariats.";

async function runTest(input: string, label: string) {
    console.log(`\n\n=== TESTING INPUT: ${label} ===`);
    const prompt = PromptBuilder.buildDatePollPrompt(input, "");

    // Test temperatures: 0.2 (strict), 0.7 (standard), 1.0 (creative), 1.5 (very creative)
    const temps = [0.2, 0.7, 1.0, 1.5];

    for (const t of temps) {
        console.log(`\n--- Temperature: ${t} ---`);
        try {
            const response = await directGeminiService.generateContent(input, prompt, { temperature: t });

            if (response.success && response.data) {
                console.log("✅ Success!");
                const text = response.data;

                // Quick parse check
                let jsonString = text;
                const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch) {
                    jsonString = codeBlockMatch[1];
                }

                const startIndex = jsonString.indexOf("{");
                const endIndex = jsonString.lastIndexOf("}");

                if (startIndex !== -1 && endIndex !== -1) {
                    console.log("JSON Detected ✅");
                    try {
                        const candidate = jsonString.substring(startIndex, endIndex + 1);
                        const json = JSON.parse(candidate);

                        const dates = json.dates?.length || 0;
                        const slots = json.timeSlots?.length || 0;
                        console.log(`Title: ${json.title}`);
                        console.log(`Dates: ${dates}, Slots: ${slots}`);
                        if (slots > 1) console.log("MULTIPLES SLOTS FOUND! 🏆");
                        else console.log("Single slot only ⚠️");

                    } catch (e: any) {
                        console.log("JSON Parse Failed ❌");
                        console.log("Error:", e.message);
                        console.log("Candidate start:", jsonString.substring(startIndex, startIndex + 50));
                    }
                } else {
                    console.log("NO JSON FOUND ❌");
                    console.log("Text:", text.substring(0, 200));
                }
            } else {
                console.log(`❌ Failed: ${response.message}`);
            }
        } catch (e) {
            console.log(`❌ Exception:`, e);
        }
    }
}

async function main() {
    await runTest(INPUT_BRUNCH, "BRUNCH (Goal: 2 slots)");
    await runTest(INPUT_PARTENARIATS, "PARTENARIATS (Goal: Valid JSON)");
}

main();
