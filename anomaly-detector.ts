/* eslint-disable @typescript-eslint/no-explicit-any */
// Détecteur d'Anomalies - Phase 4.3
// Analyse les réponses de Gemini pour identifier les anomalies et les corriger

import fs from "fs";
import path from "path";

interface AnomalyReport {
  type: "critical" | "warning" | "info";
  category: "json" | "logic" | "content" | "security";
  message: string;
  suggestion: string;
  severity: number; // 1-10
  autoFixable: boolean;
  fixApplied?: string;
}

interface GeminiResponse {
  status: number;
  data?: unknown;
  rawResponse: string;
  error?: string;
}

// ... (inside AnomalyDetector class)

// Fix code blocks
this.fixes.set("json_codeblock", (response: GeminiResponse) => {
  const candidates = (response.data as any)?.candidates;
  if (candidates?.[0]?.content?.parts?.[0]?.text) {
    const text = candidates[0].content.parts[0].text;
    // ...
    candidates[0].content.parts[0].text = text;
  }
  return response;
});

// ... (apply similar casts for other fixes)

// ... (inside analyzeGeminiResponse)

const response: GeminiResponse = {
  status: 200,
  data: {
    candidates: [
      {
        content: {
          parts: [
            {
              text: responseText,
            },
          ],
        },
      },
    ],
  },
  rawResponse: responseText,
};

interface AnalysisResult {
  isValid: boolean;
  anomalies: AnomalyReport[];
  fixedResponse?: GeminiResponse;
  confidence: number;
  processingTime: number;
}

class AnomalyDetector {
  private patterns: Map<string, RegExp[]> = new Map();
  private fixes: Map<string, (response: GeminiResponse) => GeminiResponse> = new Map();

  constructor() {
    this.initializePatterns();
    this.initializeFixes();
  }

  private initializePatterns(): void {
    // Patterns JSON
    this.patterns.set("json", [
      /```json\s*[\s\S]*?```/g, // Code blocks
      /{\s*["']?type["']?\s*:\s*["']?form["']?/gi, // Form instead of date
      /["']?dates["']?\s*:\s*\[\s*\]/g, // Empty dates array
      /["']?timeSlots["']?\s*:\s*null/g, // null timeSlots
      /,\s*$/g, // Trailing comma
      /\s*}\s*$/g, // Malformed end
    ]);

    // Patterns Logique
    this.patterns.set("logic", [
      /\b(aujourd'hui|hier)\b/gi, // Past dates
      /\b\d{4}-\d{2}-\d{2}\b.*\b(2023|2024|2025)\b/g, // Old years
      /"dates":\s*\[\s*"([^"]{10})"\s*\].*"\1"/g, // Duplicate dates
    ]);

    // Patterns Contenu
    this.patterns.set("content", [
      /voici|voilà|ci-dessous|ci-joint|voici le/gi, // Introductory text
      /je vous propose|je suggère|je recommande/gi, // Personal suggestions
      /selon|d'après|conformément à/gi, // Referential text
    ]);

    // Patterns Sécurité
    this.patterns.set("security", [
      /<script[^>]*>.*?<\/script>/gis, // Scripts
      /javascript:/gi, // JS protocol
      /on\w+\s*=/gi, // Event handlers
    ]);
  }

  private initializeFixes(): void {
    // Fix code blocks
    this.fixes.set("json_codeblock", (response: GeminiResponse) => {
      const data = response.data as any;
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        let text = data.candidates[0].content.parts[0].text;
        // Remove code blocks
        text = text.replace(/```json\n?|\n?```/g, "").trim();

        // Fix trailing commas
        text = text.replace(/,\s*}/g, "}");
        text = text.replace(/,\s*]/g, "]");

        data.candidates[0].content.parts[0].text = text;
      }
      return response;
    });

    // Fix form instead of date
    this.fixes.set("form_to_date", (response: GeminiResponse) => {
      const data = response.data as any;
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        let text = data.candidates[0].content.parts[0].text;
        // Replace form with date
        text = text.replace(/"type":\s*"form"/g, '"type": "date"');

        data.candidates[0].content.parts[0].text = text;
      }
      return response;
    });

    // Fix empty dates
    this.fixes.set("empty_dates", (response: GeminiResponse) => {
      const data = response.data as any;
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        let text = data.candidates[0].content.parts[0].text;

        try {
          const parsed = JSON.parse(text);
          if (!parsed.dates || parsed.dates.length === 0) {
            // Generate default future dates
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

            parsed.dates = [
              tomorrow.toISOString().split("T")[0],
              nextWeek.toISOString().split("T")[0],
            ];

            text = JSON.stringify(parsed, null, 2);
            data.candidates[0].content.parts[0].text = text;
          }
        } catch (e: unknown) {
          // If JSON parsing fails, we can't fix it
          const errorMessage = e instanceof Error ? e.message : "Unknown parsing error";
        }
      }
      return response;
    });

    // Fix null timeSlots
    this.fixes.set("null_timeslots", (response: GeminiResponse) => {
      const data = response.data as any;
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        let text = data.candidates[0].content.parts[0].text;

        try {
          const parsed = JSON.parse(text);
          if (parsed.timeSlots === null) {
            parsed.timeSlots = [];
            text = JSON.stringify(parsed, null, 2);
            data.candidates[0].content.parts[0].text = text;
          }
        } catch (e: unknown) {
          // If JSON parsing fails, we can't fix it
          const errorMessage = e instanceof Error ? e.message : "Unknown parsing error";
        }
      }
      return response;
    });
  }

  async analyzeResponse(response: GeminiResponse): Promise<AnalysisResult> {
    const startTime = Date.now();
    const anomalies: AnomalyReport[] = [];
    const fixedResponse = await this.applyAutoFixes(response, anomalies);

    const processingTime = Date.now() - startTime;
    const isValid = anomalies.filter((a) => a.type === "critical").length === 0;
    const confidence = this.calculateConfidence(anomalies);

    return {
      isValid,
      anomalies,
      fixedResponse,
      confidence,
      processingTime,
    };
  }

  private analyzeJSONAnomalies(response: GeminiResponse): AnomalyReport[] {
    const anomalies: AnomalyReport[] = [];
    const data = response.data as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Vérifier les code blocks
    if (this.patterns.get("json")![0].test(text)) {
      anomalies.push({
        type: "warning",
        category: "json",
        message: "JSON wrapped in code blocks",
        suggestion: "Remove ```json wrapper",
        severity: 3,
        autoFixable: true,
      });
    }

    // Vérifier si c'est un form au lieu de date
    if (this.patterns.get("json")![1].test(text)) {
      anomalies.push({
        type: "critical",
        category: "json",
        message: "Form type instead of date type",
        suggestion: 'Change type from "form" to "date"',
        severity: 8,
        autoFixable: true,
      });
    }

    // Vérifier les dates vides
    if (this.patterns.get("json")![2].test(text)) {
      anomalies.push({
        type: "critical",
        category: "json",
        message: "Empty dates array",
        suggestion: "Generate valid future dates",
        severity: 9,
        autoFixable: true,
      });
    }

    // Vérifier les timeSlots null
    if (this.patterns.get("json")![3].test(text)) {
      anomalies.push({
        type: "warning",
        category: "json",
        message: "Null timeSlots instead of empty array",
        suggestion: "Replace null with []",
        severity: 2,
        autoFixable: true,
      });
    }

    // Vérifier la syntaxe JSON
    try {
      JSON.parse(text.replace(/```json\n?|\n?```/g, ""));
    } catch (e: unknown) {
      anomalies.push({
        type: "critical",
        category: "json",
        message: `Invalid JSON syntax: ${e instanceof Error ? e.message : "Unknown error"}`,
        suggestion: "Fix JSON syntax errors",
        severity: 10,
        autoFixable: false,
      });
    }

    return anomalies;
  }

  private analyzeLogicAnomalies(response: GeminiResponse): AnomalyReport[] {
    const anomalies: AnomalyReport[] = [];
    const data = response.data as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    try {
      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ""));

      if (parsed.dates && Array.isArray(parsed.dates)) {
        const today = new Date().toISOString().split("T")[0];

        // Vérifier les dates passées
        const pastDates = parsed.dates.filter((date: string) => date < today);
        if (pastDates.length > 0) {
          anomalies.push({
            type: "critical",
            category: "logic",
            message: `Past dates detected: ${pastDates.join(", ")}`,
            suggestion: "Replace with future dates",
            severity: 8,
            autoFixable: true,
          });
        }

        // Vérifier les dates en double
        const uniqueDates = new Set(parsed.dates);
        if (uniqueDates.size !== parsed.dates.length) {
          anomalies.push({
            type: "warning",
            category: "logic",
            message: "Duplicate dates detected",
            suggestion: "Remove duplicate dates",
            severity: 3,
            autoFixable: true,
          });
        }

        // Vérifier les dates trop lointaines
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 2);
        const tooFarDates = parsed.dates.filter((date: string) => new Date(date) > maxDate);
        if (tooFarDates.length > 0) {
          anomalies.push({
            type: "warning",
            category: "logic",
            message: `Dates too far in future: ${tooFarDates.join(", ")}`,
            suggestion: "Use more reasonable date range",
            severity: 2,
            autoFixable: false,
          });
        }
      }

      // Vérifier la cohérence title/description
      if (parsed.title && parsed.description) {
        if (parsed.title.length > 100) {
          anomalies.push({
            type: "warning",
            category: "logic",
            message: "Title too long (>100 chars)",
            suggestion: "Shorten title",
            severity: 1,
            autoFixable: false,
          });
        }

        if (parsed.description.length < 10) {
          anomalies.push({
            type: "info",
            category: "logic",
            message: "Description too short",
            suggestion: "Add more descriptive content",
            severity: 1,
            autoFixable: false,
          });
        }
      }
    } catch (e: unknown) {
      // JSON parsing failed, already handled in JSON anomalies
      const errorMessage = e instanceof Error ? e.message : "Unknown parsing error";
    }

    return anomalies;
  }

  private analyzeContentAnomalies(response: GeminiResponse): AnomalyReport[] {
    const anomalies: AnomalyReport[] = [];
    const data = response.data as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Vérifier le texte introductif
    const introPatterns = this.patterns.get("content")!.slice(0, 3);
    introPatterns.forEach((pattern, index) => {
      if (pattern.test(text)) {
        anomalies.push({
          type: "warning",
          category: "content",
          message: "Introductory text detected",
          suggestion: "Remove explanatory text, return only JSON",
          severity: 4,
          autoFixable: false,
        });
      }
    });

    // Vérifier si le JSON est noyé dans du texte
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch && jsonMatch[0] !== text.trim()) {
      anomalies.push({
        type: "critical",
        category: "content",
        message: "JSON embedded in additional text",
        suggestion: "Extract only JSON portion",
        severity: 7,
        autoFixable: true,
      });
    }

    return anomalies;
  }

  private analyzeSecurityAnomalies(response: GeminiResponse): AnomalyReport[] {
    const anomalies: AnomalyReport[] = [];
    const data = response.data as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Vérifier les scripts
    if (this.patterns.get("security")![0].test(text)) {
      anomalies.push({
        type: "critical",
        category: "security",
        message: "Script tags detected",
        suggestion: "Remove script content",
        severity: 10,
        autoFixable: true,
      });
    }

    // Vérifier les protocoles JavaScript
    if (this.patterns.get("security")![1].test(text)) {
      anomalies.push({
        type: "critical",
        category: "security",
        message: "JavaScript protocol detected",
        suggestion: "Remove javascript: URLs",
        severity: 9,
        autoFixable: true,
      });
    }

    // Vérifier les event handlers
    if (this.patterns.get("security")![2].test(text)) {
      anomalies.push({
        type: "warning",
        category: "security",
        message: "Event handlers detected",
        suggestion: "Remove event handler attributes",
        severity: 6,
        autoFixable: true,
      });
    }

    return anomalies;
  }

  private async applyAutoFixes(
    response: GeminiResponse,
    anomalies: AnomalyReport[],
  ): Promise<GeminiResponse | undefined> {
    let fixedResponse = { ...response };
    let fixesApplied = 0;

    // Appliquer les fixes automatiques
    for (const anomaly of anomalies) {
      if (anomaly.autoFixable) {
        switch (anomaly.category) {
          case "json":
            if (anomaly.message.includes("code blocks")) {
              fixedResponse = this.fixes.get("json_codeblock")!(fixedResponse);
              fixesApplied++;
            } else if (anomaly.message.includes("form instead of date")) {
              fixedResponse = this.fixes.get("form_to_date")!(fixedResponse);
              fixesApplied++;
            } else if (anomaly.message.includes("Empty dates")) {
              fixedResponse = this.fixes.get("empty_dates")!(fixedResponse);
              fixesApplied++;
            } else if (anomaly.message.includes("Null timeSlots")) {
              fixedResponse = this.fixes.get("null_timeslots")!(fixedResponse);
              fixesApplied++;
            }
            break;

          case "content":
            if (anomaly.message.includes("embedded in additional text")) {
              // Extraire seulement la partie JSON
              const data = fixedResponse.data as any;
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
              const jsonMatch = text.match(/\{[\s\S]*\}/);
              if (jsonMatch && data?.candidates?.[0]?.content?.parts?.[0]) {
                data.candidates[0].content.parts[0].text = jsonMatch[0];
                fixesApplied++;
              }
            }
            break;

          case "security": {
            // Supprimer le contenu dangereux
            const data = fixedResponse.data as any;
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            let cleanText = text;

            cleanText = cleanText.replace(/<script[^>]*>.*?<\/script>/gis, "");
            cleanText = cleanText.replace(/javascript:/gi, "");
            cleanText = cleanText.replace(/on\w+\s*=/gi, "");

            if (cleanText !== text && data?.candidates?.[0]?.content?.parts?.[0]) {
              data.candidates[0].content.parts[0].text = cleanText;
              fixesApplied++;
            }
            break;
          }
        }
      }
    }

    if (fixesApplied > 0) {
      return fixedResponse;
    }

    return undefined;
  }

  private calculateConfidence(anomalies: AnomalyReport[]): number {
    if (anomalies.length === 0) return 1.0;

    const criticalCount = anomalies.filter((a) => a.type === "critical").length;
    const warningCount = anomalies.filter((a) => a.type === "warning").length;
    const infoCount = anomalies.filter((a) => a.type === "info").length;

    // Weight the anomalies
    const weightedScore = criticalCount * 10 + warningCount * 5 + infoCount * 1;
    const maxPossibleScore = anomalies.length * 10;

    return Math.max(0, 1 - weightedScore / maxPossibleScore);
  }

  generateReport(analysis: AnalysisResult): string {
    const report = [
      "# Rapport d'Analyse d'Anomalies",
      `Confiance: ${(analysis.confidence * 100).toFixed(1)}%`,
      `Temps de traitement: ${analysis.processingTime}ms`,
      `Statut: ${analysis.isValid ? "✅ Valide" : "❌ Invalide"}`,
      "",
      "## Anomalies détectées:",
    ];

    if (analysis.anomalies.length === 0) {
      report.push("Aucune anomalie détectée.");
    } else {
      analysis.anomalies.forEach((anomaly, index) => {
        report.push(`\n### ${index + 1}. ${anomaly.message}`);
        report.push(`- **Type**: ${anomaly.type}`);
        report.push(`- **Catégorie**: ${anomaly.category}`);
        report.push(`- **Sévérité**: ${anomaly.severity}/10`);
        report.push(`- **Auto-correction**: ${anomaly.autoFixable ? "✅" : "❌"}`);
        report.push(`- **Suggestion**: ${anomaly.suggestion}`);

        if (anomaly.fixApplied) {
          report.push(`- **Correction appliquée**: ${anomaly.fixApplied}`);
        }
      });
    }

    if (analysis.fixedResponse) {
      report.push("\n## Corrections automatiques appliquées");
      report.push("La réponse a été automatiquement corrigée.");
    }

    return report.join("\n");
  }

  saveReport(analysis: AnalysisResult, filename?: string): void {
    const report = this.generateReport(analysis);
    const defaultFilename = `anomaly-report-${Date.now()}.md`;
    const finalFilename = filename || defaultFilename;

    fs.writeFileSync(finalFilename, report, "utf8");
    console.log(`📄 Rapport sauvegardé: ${finalFilename}`);
  }
}

// Fonction utilitaire pour analyser une réponse
async function analyzeGeminiResponse(responseText: string): Promise<AnalysisResult> {
  const detector = new AnomalyDetector();

  const response: GeminiResponse = {
    status: 200,
    data: {
      candidates: [
        {
          content: {
            parts: [
              {
                text: responseText,
              },
            ],
          },
        },
      ],
    },
    rawResponse: responseText,
  };

  return await detector.analyzeResponse(response);
}

// Export pour utilisation
export { AnomalyDetector, analyzeGeminiResponse, AnomalyReport, AnalysisResult };

// Si appelé directement
if (require.main === module) {
  const responseText = process.argv[2];
  if (!responseText) {
    console.log('Usage: npx ts-node anomaly-detector.ts "votre réponse JSON ici"');
    process.exit(1);
  }

  analyzeGeminiResponse(responseText).then((analysis) => {
    const detector = new AnomalyDetector();
    console.log(detector.generateReport(analysis));
    detector.saveReport(analysis);
  });
}
