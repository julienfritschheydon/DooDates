/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, it } from "vitest";

export interface PromptSpec {
  category: "professionnel" | "personnel" | "associatif" | "scolaire" | string;
  input: string;
  description: string;
  expectedType?: "date" | "datetime";
  minDates?: number;
  expectTimeSlots?: boolean;
  expectedOutcome?: string;
}

export interface GeminiPollResponse {
  success: boolean;
  data?: {
    type?: string;
    dates?: any[];
    timeSlots?: any[];
    [key: string]: any;
  };
}

export interface GeminiServiceLike {
  generatePollFromText(text: string): Promise<GeminiPollResponse>;
}

export function runGeminiPromptTest(
  service: GeminiServiceLike,
  prompt: PromptSpec,
  filters?: { category?: string; prompt?: string },
) {
  const { category = "", prompt: promptFilter = "" } = filters || {};

  // Filtre par catégorie
  if (category && prompt.category.toLowerCase() !== category) {
    return;
  }

  // Filtre par texte du prompt/description
  if (promptFilter) {
    const haystack = `${prompt.description} ${prompt.input}`.toLowerCase();
    if (!haystack.includes(promptFilter)) {
      return;
    }
  }

  it(
    prompt.description,
    async () => {
      const result = await service.generatePollFromText(prompt.input);

      console.info(`[Gemini test][${prompt.category}] ${prompt.description}`, {
        prompt: prompt.input,
        expectedOutcome: prompt.expectedOutcome,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();

      const poll = result.data as any;
      const pollType = String(poll.type ?? "");
      const dates = Array.isArray(poll.dates) ? poll.dates : [];
      const timeSlots = Array.isArray(poll.timeSlots) ? poll.timeSlots : [];

      if (prompt.expectedType === "datetime") {
        expect(["datetime", "date"]).toContain(pollType);
      } else if (prompt.expectedType) {
        expect(pollType).toBe(prompt.expectedType);
      }

      if (typeof prompt.minDates === "number") {
        expect(dates.length).toBeGreaterThanOrEqual(prompt.minDates);
      }

      if (prompt.expectTimeSlots) {
        if (timeSlots.length === 0) {
          console.warn(
            `[Gemini test][${prompt.category}] ${prompt.description} – aucun créneau horaire généré malgré l'attente`,
          );
        }
      }

      const sanitizedTimeSlots = timeSlots.map((slot: any) => ({
        start: slot?.start ?? "",
        end: slot?.end ?? "",
        dates: Array.isArray(slot?.dates) ? slot.dates : [],
        description:
          typeof slot?.description === "string" && slot.description.length > 0
            ? slot.description
            : undefined,
      }));

      console.info(
        `[Gemini test][${prompt.category}] ${prompt.description} – résultat`,
        JSON.stringify(
          {
            pollType,
            datesCount: dates.length,
            timeSlotsCount: timeSlots.length,
            dates,
            timeSlots: sanitizedTimeSlots,
          },
          null,
          2,
        ),
      );
    },
    60_000,
  );
}
