
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
dotenv.config({ path: '.env.local' });
import 'dotenv/config'; // defaults

// Dynamic import will happen inside scrape() to ensure env vars are loaded first

// Create output file with date
const now = new Date();
const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
const outputFile = join(process.cwd(), `competitor-analysis-${dateStr}_${timeStr}.txt`);

// Load DooDates features context
const doodatesFeaturesPath = join(process.cwd(), 'scripts', 'doodates-features.md');
let doodatesFeaturesContext = '';
try {
    doodatesFeaturesContext = readFileSync(doodatesFeaturesPath, 'utf-8');
    console.log('✓ Loaded DooDates features context');
} catch (error) {
    console.warn('⚠ Could not load doodates-features.md, analysis will proceed without context');
}

interface Target {
    name: string;
    url: string;
    category: 'Date Polls' | 'Forms' | 'Availability Polls' | 'AI Quizz';
}

// Source: Docs/product-suivi.md
const targets: Target[] = [
    // 📅 1. Date Polls (Sondages de Dates)
    {
        name: 'Doodle',
        url: 'https://help.doodle.com/hc/en-us/sections/360003058852-Product-Updates',
        category: 'Date Polls'
    },
    {
        name: 'Calendly',
        url: 'https://calendly.com/blog/category/product-news',
        category: 'Date Polls'
    },
    {
        name: 'Rallly',
        url: 'https://github.com/lukevella/rallly/releases',
        category: 'Date Polls'
    },
    {
        name: 'Framadate',
        url: 'https://framagit.org/framasoft/framadate/framadate/-/blob/master/CHANGELOG.md',
        category: 'Date Polls'
    },

    // 📝 2. Formulaires (Forms)
    {
        name: 'Typeform',
        url: 'https://help.typeform.com/hc/en-us/articles/29035269414036-Changelog',
        category: 'Forms'
    },
    {
        name: 'Tally.so',
        url: 'https://tally.so/changelog',
        category: 'Forms'
    },
    {
        name: 'Google Forms',
        url: 'https://support.google.com/docs/answer/16319311?hl=en',
        category: 'Forms'
    },
    {
        name: 'Jotform',
        url: 'https://www.jotform.com/blog/product/',
        category: 'Forms'
    },

    // 🗓️ 3. Availability Polls (Dispos / Grilles)
    {
        name: 'Calendly Meeting Polls',
        url: 'https://calendly.com/features/meeting-polls',
        category: 'Availability Polls'
    },

    // 🧠 4. AI Quizz & Learning
    {
        name: 'Kahoot',
        url: 'https://kahoot.com/blog/',
        category: 'AI Quizz'
    },
    {
        name: 'Quizlet',
        url: 'https://quizlet.com/blog',
        category: 'AI Quizz'
    }
];

async function scrape() {
    console.log('Starting competitor monitoring...');
    const outputLines: string[] = [];
    const failedSites: string[] = [];
    outputLines.push(`Competitor Analysis Report - ${new Date().toISOString()}\n`);
    outputLines.push('='.repeat(80) + '\n');

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        const errorMsg = 'Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in environment variables.';
        console.error(errorMsg);
        console.error('These are required for the Supabase Edge Function (SecureGeminiService).');
        outputLines.push(errorMsg + '\n');
        // We don't return here to allow testing, but the service will fail gracefully.
    } else {
        console.log('Supabase credentials found.');
        outputLines.push('✓ Supabase credentials found.\n\n');
    }

    // Dynamic import to ensure env vars are loaded
    const { GeminiService } = await import('../src/lib/ai/gemini/gemini-service');
    // Use the Singleton instance
    const geminiService = GeminiService.getInstance();

    const browser = await puppeteer.launch({
        headless: true
    });

    for (const target of targets) {
        try {
            console.log(`\nChecking ${target.name}...`);
            outputLines.push(`\n${'='.repeat(80)}\n`);
            outputLines.push(`Source: ${target.name}\n`);
            outputLines.push(`URL: ${target.url}\n`);
            outputLines.push('-'.repeat(80) + '\n');

            const page = await browser.newPage();

            // Set a reasonable timeout and user agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // Try networkidle0 first, fallback to domcontentloaded for slow pages
            try {
                await page.goto(target.url, {
                    waitUntil: 'networkidle0',
                    timeout: 10000
                });
            } catch (error: any) {
                if (error?.message?.includes('timeout') || error?.message?.includes('Navigation timeout')) {
                    console.log(`⚠ Timeout with networkidle0, retrying with domcontentloaded...`);
                    // Retry with less strict wait condition
                    await page.goto(target.url, {
                        waitUntil: 'domcontentloaded',
                        timeout: 10000
                    });
                    // Give it a bit more time to load content
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    throw error;
                }
            }

            const title = await page.title();
            console.log(`Title: ${title}`);
            outputLines.push(`Page Title: ${title}\n\n`);

            // Extract text content
            const content = await page.evaluate(() => {
                // Get visible text, somewhat cleaned up
                return document.body.innerText.replace(/\s+/g, ' ').trim().substring(0, 10000); // Limit context window
            });

            console.log(`Extracted ${content.length} characters. Analyzing with GeminiService...`);
            outputLines.push(`Category: ${target.category}\n`);

            const fullPrompt = `You are analyzing competitor updates for DooDates, a scheduling and polling platform with 4 product axes:
1. **Date Polls** (event scheduling with multiple date options)
2. **Forms** (surveys and data collection)
3. **Availability Polls** (time slot grids for finding common availability)
4. **AI Quizz & Learning** (interactive quizzes and educational content)

IMPORTANT - DooDates Current Features:
${doodatesFeaturesContext ? `
${doodatesFeaturesContext}

DO NOT recommend features that DooDates already has (marked with ✅).
FOCUS on features DooDates is missing (marked with ❌) or innovative approaches to existing features.
` : 'Feature context not available - provide general recommendations.'}

Analyze the following text from ${target.name} (Category: ${target.category}).

Extract ONLY information relevant to DooDates' product strategy:
- New features DooDates doesn't have yet (check against ❌ list above)
- Innovative UX/UI approaches worth noting
- Strategic shifts (pricing, integrations, AI features)
- Technical innovations (performance, accessibility)

If the content is just navigation, marketing fluff, or features DooDates already has, respond with exactly: "No relevant updates found."

Provide a concise summary (max 3-4 sentences) focusing on actionable insights DooDates can learn from.

TEXT TO ANALYZE:
---
${content}
---`;

            // Call generateWithPrompt with everything in the prompt
            const analysis = await geminiService.generateWithPrompt(fullPrompt);

            console.log('--- Analysis ---');
            outputLines.push('ANALYSIS:\n');
            if (analysis) {
                console.log(analysis);
                outputLines.push(analysis + '\n');
            } else {
                const failMsg = 'Analysis failed or returned empty.';
                console.log(failMsg);
                outputLines.push(failMsg + '\n');
            }
            console.log('----------------');
            outputLines.push('\n');

            await page.close();
        } catch (error) {
            const errorMsg = `Error processing ${target.name}: ${error}`;
            console.error(errorMsg);
            outputLines.push(`ERROR: ${errorMsg}\n\n`);
            failedSites.push(`${target.name} (${target.url})`);
        }
    }

    await browser.close();
    console.log('\nMonitoring complete.');

    // Insert failed sites summary at the beginning (after credentials check)
    if (failedSites.length > 0) {
        const failedSummary = [
            '\n⚠️  SITES WITH ERRORS\n',
            '='.repeat(80) + '\n',
            `${failedSites.length} site(s) could not be analyzed:\n\n`,
            ...failedSites.map(site => `- ${site}\n`),
            '\n' + '='.repeat(80) + '\n\n'
        ];
        // Find insertion point (after credentials check)
        const insertIndex = outputLines.findIndex(line => line.includes('Supabase credentials'));
        if (insertIndex !== -1) {
            outputLines.splice(insertIndex + 1, 0, ...failedSummary);
        }
    }

    // Generate summary by product category
    console.log('\nGenerating product summaries...');
    outputLines.push('\n' + '='.repeat(80) + '\n');
    outputLines.push('SUMMARY BY PRODUCT AXIS\n');
    outputLines.push('='.repeat(80) + '\n\n');

    const categories: Array<'Date Polls' | 'Forms' | 'Availability Polls' | 'AI Quizz'> = [
        'Date Polls',
        'Forms',
        'Availability Polls',
        'AI Quizz'
    ];

    for (const category of categories) {
        const categoryTargets = targets.filter(t => t.category === category);
        const categoryNames = categoryTargets.map(t => t.name).join(', ');

        outputLines.push(`## ${category}\n`);
        outputLines.push(`Competitors analyzed: ${categoryNames}\n\n`);

        // Generate summary for this category using Gemini
        const summaryPrompt = `Based on the competitor analysis report for ${category}, provide a strategic summary for DooDates.

Extract the TOP 3-5 most important insights across all competitors in this category.
Focus on:
- Features DooDates should prioritize (check against ❌ missing features)
- Strategic opportunities
- UX/UI innovations worth implementing

Format as a bulleted list with actionable recommendations.

Category: ${category}
Competitors: ${categoryNames}`;

        try {
            const summary = await geminiService.generateWithPrompt(summaryPrompt);
            if (summary && !summary.includes('No relevant updates')) {
                outputLines.push(summary + '\n\n');
            } else {
                outputLines.push('No significant insights found for this category.\n\n');
            }
        } catch (error) {
            outputLines.push('Could not generate summary for this category.\n\n');
        }

        outputLines.push('-'.repeat(80) + '\n\n');
    }

    // Write results to file
    outputLines.push('\n' + '='.repeat(80) + '\n');
    outputLines.push(`Report completed at ${new Date().toISOString()}\n`);

    const outputContent = outputLines.join('');
    writeFileSync(outputFile, outputContent, 'utf-8');
    console.log(`\n✓ Results saved to: ${outputFile}`);
}

scrape().catch(console.error);
