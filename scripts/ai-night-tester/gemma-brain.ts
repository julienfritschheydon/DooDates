/**
 * AI Night Tester - Gemma Brain
 *
 * Interface with Ollama for AI-powered decision making.
 * Uses a dual-model approach:
 * - Fast model (e.g. Qwen 0.5B) for rapid navigation
 * - Deep model (e.g. Gemma 2B) for thorough issue analysis
 */

import { config } from "./ai-night-tester.config";
import type {
  GemmaContext,
  GemmaActionResponse,
  GemmaIssueResponse,
  TestAction,
  PageState,
  InteractiveElement,
} from "./types";
import fs from "fs";

export class GemmaBrain {
  private baseUrl: string;
  private fastModel: string;
  private deepModel: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.ollama.baseUrl;
    this.fastModel = config.ollama.fastModel;
    this.deepModel = config.ollama.deepModel;
    this.timeout = config.ollama.timeout;
  }

  /**
   * Check if Ollama is running and models are available
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return false;

      const data = await response.json();
      const models = data.models || [];
      const hasFast = models.some((m: { name: string }) =>
        m.name.includes(this.fastModel.split(":")[0]),
      );
      const hasDeep = models.some((m: { name: string }) =>
        m.name.includes(this.deepModel.split(":")[0]),
      );

      if (!hasFast || !hasDeep) {
        console.warn(`⚠️ Missing models. Fast: ${hasFast}, Deep: ${hasDeep}`);
      }

      return hasFast;
    } catch (error) {
      console.error("❌ Cannot connect to Ollama:", error);
      return false;
    }
  }

  /**
   * Warm up the models
   */
  async warmUp(): Promise<void> {
    const models = [this.fastModel, this.deepModel];
    for (const model of models) {
      try {
        await fetch(`${this.baseUrl}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model,
            prompt: "Say OK",
            stream: false,
            options: { num_predict: 5 },
          }),
          signal: AbortSignal.timeout(60000),
        });
      } catch {
        /* ignore */
      }
    }
  }

  /**
   * Send a prompt to Ollama and get a response
   */
  private async generate(prompt: string, modelType: "fast" | "deep" = "fast"): Promise<string> {
    const startTime = Date.now();
    const model = modelType === "fast" ? this.fastModel : this.deepModel;
    console.log(`   📤 Sending to Ollama (${model})...`);

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        prompt,
        stream: false,
        options: {
          temperature: modelType === "fast" ? 0.0 : 0.1,
          top_p: 0.9,
          num_ctx: modelType === "fast" ? 2048 : 4096, // Smaller context for fast model
          num_predict: modelType === "fast" ? 20 : 512, // Very short for navigation
          stop: modelType === "fast" ? ["\n"] : [], // Stop early for nav
        },
        keep_alive: "10m", // Keep in memory for 10 minutes
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      console.log(`   ❌ Ollama error after ${elapsed}s: ${response.status}`);
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`   📥 Response received in ${elapsed}s`);
    return data.response || "";
  }

  /**
   * Decide the next action using the FAST model
   */
  async decideNextAction(context: GemmaContext): Promise<GemmaActionResponse> {
    const prompt = this.buildActionPrompt(context);
    try {
      const response = await this.generate(prompt, "fast");
      return this.parseActionResponse(response, context.currentPage);
    } catch (error) {
      console.error("   ❌ Error getting action:", error);
      return this.getFallbackAction(context.currentPage);
    }
  }

  /**
   * Analyze for issues using the DEEP model
   */
  async analyzeForIssues(pageState: PageState): Promise<GemmaIssueResponse> {
    if (pageState.consoleErrors.length > 0)
      return { isIssue: true, severity: "major", description: "Console errors detected" };

    const prompt = this.buildIssueAnalysisPrompt(pageState);
    try {
      const response = await this.generate(prompt, "deep");
      return this.parseIssueResponse(response);
    } catch {
      return { isIssue: false };
    }
  }

  /**
   * Build prompt for action decision
   */
  buildActionPrompt(context: GemmaContext, noveltyScores?: Map<string, number>): string {
    const { currentPage, recentActions, activeMission } = context;

    // FILTER: Remove disabled elements - they're wasted clicks (especially past dates)
    const enabledElements = currentPage.interactiveElements.filter((el) => !el.isDisabled);

    const elements = enabledElements
      .slice(0, 40)
      .map((el, i) => {
        let noveltyTag = "";
        if (noveltyScores) {
          const score = noveltyScores.get(el.selector) ?? 1;
          if (score >= 0.8) noveltyTag = "🆕 ";
          else if (score <= 0.3) noveltyTag = "🔁 ";
        }

        const isField = el.type?.startsWith("input") || el.tagName === "textarea";
        const typeLabel = isField ? "[FIELD]" : "[UI]";
        const status = el.isDisabled ? " [DISABLED]" : "";
        const placeholder = el.placeholder ? ` [PLH: "${el.placeholder}"]` : "";
        const value = el.value ? ` [VAL: "${el.value}"]` : isField ? " [EMPTY]" : "";

        return `${i + 1}. ${noveltyTag}${typeLabel} [${el.type || el.tagName}] "${el.text.substring(0, 40)}"${status}${placeholder}${value}`;
      })
      .join("\n");

    // DEBUG: Check what we send
    console.log(`\n📋 [Elements (Top 40)]:\n${elements}`);

    const recentActionsStr = recentActions
      .slice(-5)
      .map((a) => `- ${a.type}: ${a.description || a.selector}`)
      .join("\n");

    return `TON BUT: Remplir les formulaires et EXPLORER pour accomplir la mission.
NOTE: Pour créer un sondage, tu DOIS: 1. Saisir un TITRE, 2. Choisir une seule DATE, 3. Cliquer sur PUBLIER LE SONDAGE.
RÉPONDS UNIQUEMENT PAR LES IDs (ex: 1 ou 1,2,3).
SI BESOIN D'ÉCRIRE: ID:TEXTE (ex: 1:Réunion Equipe).
MAX 3 ACTIONS SÉPARÉES PAR DES VIRGULES.

PAGE: ${currentPage.url}
MISSIONS: ${activeMission?.goal || "Explorer l'app"}

ÉLÉMENTS:
${elements}

TA RÉPONSE (IDs UNIQUEMENT):`;
  }

  private buildIssueAnalysisPrompt(pageState: PageState): string {
    return `Testeur UX Expert. Analyse cette page pour des bugs visuels ou fonctionnels.
URL: ${pageState.url}
TEXTE: ${pageState.bodyText.substring(0, 800)}
RÉPONDS: "OK" ou "ISSUE: [Description]"`;
  }

  private parseActionResponse(response: string, pageState: PageState): GemmaActionResponse {
    const actions: TestAction[] = [];
    const parts = response.split(",").map((p) => p.trim());

    // CRITICAL: Must use the SAME filtered list as buildActionPrompt for correct indexing
    const enabledElements = pageState.interactiveElements.filter((el) => !el.isDisabled);

    for (const part of parts) {
      try {
        // Type action (NUM: TEXT)
        const typeMatch = part.match(/^(\d+)\s*:\s*(.*)$/);
        if (typeMatch) {
          const index = parseInt(typeMatch[1], 10) - 1;
          const value = typeMatch[2].trim();
          const element = enabledElements[index];
          if (element && (element.type?.startsWith("input") || element.tagName === "textarea")) {
            actions.push({
              type: "type",
              selector: element.selector,
              value,
              description: `Type "${value}"`,
            });
            continue;
          }
          if (element) {
            actions.push({
              type: "click",
              selector: element.selector,
              description: `Click on ${element.text}`,
            });
            continue;
          }
        }

        // Click action (NUM)
        const clickMatch = part.match(/^(\d+)$/);
        if (clickMatch) {
          const index = parseInt(clickMatch[1], 10) - 1;
          const element = enabledElements[index];
          if (element) {
            actions.push({
              type: "click",
              selector: element.selector,
              description: `Click on ${element.text}`,
            });
          }
        }
      } catch {
        /* skip invalid partial */
      }
    }

    if (actions.length > 0) {
      return { actions, reasoning: `Combo: ${response}` };
    }

    return this.getFallbackAction(pageState);
  }

  private parseIssueResponse(response: string): GemmaIssueResponse {
    if (response.includes("ISSUE:")) {
      return {
        isIssue: true,
        severity: "minor",
        description: response.replace("ISSUE:", "").trim(),
      };
    }
    return { isIssue: false };
  }

  private getFallbackAction(pageState: PageState): GemmaActionResponse {
    const clickable = pageState.interactiveElements.find((el) => el.isVisible && !el.isDisabled);
    if (clickable)
      return {
        actions: [{ type: "click", selector: clickable.selector, description: `Fallback click` }],
        reasoning: "Fallback",
      };
    return {
      actions: [{ type: "navigate", url: config.app.baseUrl, description: "Return home" }],
      reasoning: "Stuck",
    };
  }

  async summarizeSession(history: string): Promise<string> {
    try {
      const response = await this.generate(
        `Résume en 2 phrases UX les points forts et faibles :\n${history}`,
        "deep",
      );
      return response || "Pas de résumé.";
    } catch {
      return "Échec résumé.";
    }
  }
}
