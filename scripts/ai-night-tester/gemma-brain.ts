/**
 * AI Night Tester - Gemma Brain
 * 
 * Interface with Ollama/Gemma for AI-powered decision making
 */

import { config } from './ai-night-tester.config';
import type {
    GemmaContext,
    GemmaActionResponse,
    GemmaIssueResponse,
    TestAction,
    PageState,
    InteractiveElement,
} from './types';

export class GemmaBrain {
    private baseUrl: string;
    private model: string;
    private timeout: number;

    constructor() {
        this.baseUrl = config.ollama.baseUrl;
        this.model = config.ollama.model;
        this.timeout = config.ollama.timeout;
    }

    /**
     * Check if Ollama is running and Gemma is available
     */
    async checkConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) return false;

            const data = await response.json();
            const models = data.models || [];
            const hasGemma = models.some((m: { name: string }) =>
                m.name.includes('gemma')
            );

            if (!hasGemma) {
                console.warn(`⚠️ Gemma not found. Available models: ${models.map((m: { name: string }) => m.name).join(', ')}`);
                console.warn(`Run: ollama pull ${this.model}`);
            }

            return hasGemma;
        } catch (error) {
            console.error('❌ Cannot connect to Ollama:', error);
            return false;
        }
    }

    /**
     * Warm up the model by making a simple request
     * This loads the model into memory so subsequent calls are fast
     */
    async warmUp(): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: 'Say OK',
                    stream: false,
                    options: { num_predict: 5 },
                }),
                signal: AbortSignal.timeout(60000), // 60s timeout for cold start
            });

            if (!response.ok) {
                console.warn('⚠️ Warm-up request failed');
            }
        } catch (error) {
            console.warn('⚠️ Warm-up failed:', error);
        }
    }

    /**
     * Send a prompt to Gemma and get a response
     */
    private async generate(prompt: string): Promise<string> {
        const startTime = Date.now();
        console.log(`   📤 Sending to Ollama (${this.model})...`);

        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt,
                stream: false,
                options: {
                    temperature: 0.3,
                    num_predict: 200,  // Reduced for faster response
                },
            }),
            signal: AbortSignal.timeout(this.timeout),
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (!response.ok) {
            console.log(`   ❌ Ollama error after ${elapsed}s: ${response.status}`);
            throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`   📥 Response received in ${elapsed}s`);
        return data.response || '';
    }

    /**
     * Decide the next action to take based on current page state
     */
    async decideNextAction(context: GemmaContext): Promise<GemmaActionResponse> {
        console.log(`   📝 Building prompt (${context.currentPage.interactiveElements.length} elements)...`);
        const prompt = this.buildActionPrompt(context);
        console.log(`   📝 Prompt length: ${prompt.length} chars`);

        try {
            const response = await this.generate(prompt);
            console.log(`   🔍 Parsing response...`);
            const result = this.parseActionResponse(response, context.currentPage);
            console.log(`   ✅ Action decided: ${result.action.type}`);
            return result;
        } catch (error) {
            console.error('   ❌ Error getting action from Gemma:', error);
            console.log(`   🔄 Using fallback action...`);
            return this.getFallbackAction(context.currentPage);
        }
    }

    /**
     * Analyze if current state indicates a bug/issue
     */
    async analyzeForIssues(pageState: PageState): Promise<GemmaIssueResponse> {
        // First check for obvious issues (no AI needed)
        if (pageState.consoleErrors.length > 0) {
            return {
                isIssue: true,
                severity: 'major',
                description: `Console errors detected: ${pageState.consoleErrors.join('; ')}`,
            };
        }

        if (pageState.httpErrors.length > 0) {
            const critical = pageState.httpErrors.some(e => e.status >= 500);
            return {
                isIssue: true,
                severity: critical ? 'critical' : 'major',
                description: `HTTP errors: ${pageState.httpErrors.map(e => `${e.status} ${e.url}`).join('; ')}`,
            };
        }

        // Use Gemma for visual/behavioral analysis
        const prompt = this.buildIssueAnalysisPrompt(pageState);

        try {
            const response = await this.generate(prompt);
            return this.parseIssueResponse(response);
        } catch (error) {
            console.error('Error analyzing issues with Gemma:', error);
            return { isIssue: false };
        }
    }

    /**
     * Build prompt for action decision
     * @param context - Current testing context
     * @param noveltyScores - Optional map of selector -> novelty score (0-1)
     */
    buildActionPrompt(context: GemmaContext, noveltyScores?: Map<string, number>): string {
        const { currentPage, recentActions, activeMission } = context;

        // Simplify elements list with optional novelty indicators
        const elements = currentPage.interactiveElements
            .slice(0, 20)  // Limit to 20 elements
            .map((el, i) => {
                let noveltyTag = '';
                if (noveltyScores) {
                    const score = noveltyScores.get(el.selector) ?? 1;
                    if (score >= 0.8) noveltyTag = '🆕 ';      // Never clicked
                    else if (score <= 0.3) noveltyTag = '🔁 '; // Frequently clicked
                }
                return `${i + 1}. ${noveltyTag}[${el.type || el.tagName}] "${el.text.substring(0, 50)}"`;
            })
            .join('\n');

        const recentActionsStr = recentActions
            .slice(-5)
            .map(a => `- ${a.type}: ${a.description || a.selector || a.url}`)
            .join('\n');

        let missionInfo = '';
        if (activeMission) {
            missionInfo = `
MISSION: ${activeMission.name}
OBJECTIF: ${activeMission.goal}
`;
        }

        const noveltyRule = noveltyScores
            ? 'RÈGLE: PRIORISE les éléments 🆕 (nouveaux). ÉVITE les éléments 🔁 (déjà cliqués plusieurs fois).'
            : 'RÈGLE: Choisis un élément nouveau si possible et avance vers l\'objectif de la mission.';

        return `Testeur QA. Choisis le NUMÉRO de l'élément à cliquer.${missionInfo}

PAGE: ${currentPage.url}

ÉLÉMENTS:
${elements}

DERNIÈRES ACTIONS: ${recentActionsStr || 'aucune'}

${noveltyRule}

TA RÉPONSE (JUSTE LE NUMÉRO, ex: 1):`;
    }


    /**
     * Build prompt for issue analysis
     */
    private buildIssueAnalysisPrompt(pageState: PageState): string {
        return `Testeur UX/UI Critique. Analyse cette page pour des défauts de DESIGN.

URL: ${pageState.url}
TITRE: ${pageState.title}

CONTENU TEXTUEL (extrait):
${pageState.bodyText.substring(0, 800)}

CHERCHE CES PROBLÈMES (REGARD CRITIQUE):
1. Incohérence de style (Mélange Anglais/Français, Majuscules aléatoires)
2. Menu ou Header encombré ou cassé (ex: double hamburger, menu vide)
3. Bouton sans texte explicite ou avec mauvaise couleur (ex: bouton bleu dans un thème violet)
4. Texte de remplacement ("Lorem ipsum")
5. Message d'erreur visible
6. Débordement de contenu hors de l'écran (surtout sur mobile)

RÉPONDS: "OK" si le design semble solide.
SINON: "ISSUE: [Critique du design/UX]"`;
    }

    /**
     * Parse Gemma's action response (Numeric)
     */
    private parseActionResponse(response: string, pageState: PageState): GemmaActionResponse {
        try {
            // Find first number in response
            const match = response.match(/\d+/);
            if (!match) throw new Error('No number found');

            const index = parseInt(match[0], 10) - 1; // 1-based to 0-based
            const element = pageState.interactiveElements[index];

            if (!element) throw new Error(`Invalid element index: ${index}`);

            return {
                action: {
                    type: 'click',
                    selector: element.selector,
                    description: `Click on "${element.text.substring(0, 50)}"`,
                },
                reasoning: `Selected action #${index + 1} from list`,
            };
        } catch (error) {
            console.warn(`Failed to parse response "${response}":`, error);
            return this.getFallbackAction(pageState);
        }
    }

    /**
     * Parse Gemma's issue response (Text based)
     */
    private parseIssueResponse(response: string): GemmaIssueResponse {
        try {
            if (response.includes('ISSUE:')) {
                return {
                    isIssue: true,
                    severity: 'minor', // Verify manually
                    description: response.replace('ISSUE:', '').trim(),
                    suggestion: 'Check UI for reported issue',
                };
            }
            return { isIssue: false };
        } catch {
            return { isIssue: false };
        }
    }

    /**
     * Fallback action when Gemma fails
     */
    private getFallbackAction(pageState: PageState): GemmaActionResponse {
        // Find first clickable element
        const clickable = pageState.interactiveElements.find(
            el => el.isVisible && (el.type === 'button' || el.type === 'link')
        );

        if (clickable) {
            return {
                action: {
                    type: 'click',
                    selector: clickable.selector,
                    description: `Click on ${clickable.text.substring(0, 30)}`,
                },
                reasoning: 'Fallback: clicking first available element',
            };
        }

        // If no clickable, try to navigate to a priority route
        return {
            action: {
                type: 'navigate',
                url: config.priorityRoutes[Math.floor(Math.random() * config.priorityRoutes.length)],
                description: 'Navigate to priority route',
            },
            reasoning: 'Fallback: no interactive elements found',
        };
    }

    /**
     * Summarize the entire session into a narrative
     */
    async summarizeSession(history: string): Promise<string> {
        const prompt = `Tu es un Expert UX/UI critique (Nielsen Norman Group).
Résume cette session de test en te concentrant sur l'EXPÉRIENCE UTILISATEUR et le DESIGN.
Critique les couleurs (si mentionnées), la clarté des menus et le "Flow".

CONTENU:
${history.substring(0, 3000)}

RÉPONDS en 3-4 phrases percutantes. Sois direct sur ce qui ne va pas.`;

        try {
            const response = await this.generate(prompt);
            return response || "Résumé indisponible.";
        } catch {
            return "Échec de la génération du résumé.";
        }
    }
}
