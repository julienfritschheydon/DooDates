// @ts-nocheck - Tests de charge avec interface unifiée dynamique
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPollService } from "../index";
import { isDatePoll } from "../date-polls";
import { isFormPoll } from "../form-polls";
import { isQuizz } from "../quizz";

describe("Unified Service Load Tests", () => {
  let localStorageMock: any;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    vi.clearAllMocks();
  });

  it("should handle 1000+ date polls creation efficiently", async () => {
    const dateService = await createPollService("date");
    const startTime = performance.now();
    
    // Créer 1000 date polls
    const polls = Array.from({ length: 1000 }, (_, i) => ({
      id: `date_${i}`,
      creator_id: `user_${i}`,
      title: `Sondage date ${i}`,
      description: `Description ${i}`,
      slug: `sondage-${i}`,
      settings: {
        selectedDates: [`2025-01-${(i % 28) + 1}`],
        timeGranularity: 30,
        allowAnonymousVotes: true,
      },
      status: "active" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: "date" as const,
      dates: [`2025-01-${(i % 28) + 1}`],
    }));

    // Ajouter tous les polls
    for (const poll of polls) {
      // @ts-ignore - TypeScript conflit avec interface unifiée
      await dateService.addPoll(poll);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Vérifier performance < 2 secondes
    expect(duration).toBeLessThan(2000);
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1000);
  });

  it("should handle 1000+ form polls creation efficiently", async () => {
    const service = await createPollService("form");
    const startTime = performance.now();
    
    // Créer 1000 form polls
    const polls = Array.from({ length: 1000 }, (_, i) => ({
      id: `form_${i}`,
      creator_id: `user_${i}`,
      title: `Sondage formulaire ${i}`,
      description: `Description ${i}`,
      slug: `sondage-form-${i}`,
      settings: {
        allowAnonymousVotes: true,
        showResults: true,
      },
      status: "active" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: "form" as const,
      questions: [
        {
          id: `q_${i}`,
          title: `Question ${i}`,
          kind: "single" as const,
          required: true,
        },
      ],
    }));

    // Ajouter tous les polls
    for (const poll of polls) {
      // @ts-ignore - TypeScript conflit avec interface unifiée
      await service.addPoll(poll);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Vérifier performance < 2 secondes
    expect(duration).toBeLessThan(2000);
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1000);
  });

  it("should identify poll types efficiently", () => {
    const polls = [
      { type: "date", dates: [] },
      { type: "form", questions: [] },
      { type: "quizz", questions: [], scoring: {} },
      { dates: [] }, // type implicite date
      { questions: [] }, // type implicite form
    ];

    const startTime = performance.now();

    // Tester 10 000 identifications
    for (let i = 0; i < 10000; i++) {
      for (const poll of polls) {
        isDatePoll(poll);
        isFormPoll(poll);
        isQuizz(poll);
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Vérifier performance < 100ms pour 15 000 vérifications
    expect(duration).toBeLessThan(100);
  });

  it("should handle concurrent operations efficiently", async () => {
    const dateService = await createPollService("date");
    const formService = await createPollService("form");

    const startTime = performance.now();

    // Opérations concurrentes
    const operations = [
      ...Array.from({ length: 100 }, (_, i) => 
        // @ts-ignore - TypeScript conflit avec interface unifiée
        dateService.addPoll({
          id: `concurrent_date_${i}`,
          creator_id: "user_1",
          title: `Concurrent Date ${i}`,
          type: "date" as const,
          dates: [`2025-01-${(i % 28) + 1}`],
          settings: {
            selectedDates: [`2025-01-${(i % 28) + 1}`],
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      ),
      ...Array.from({ length: 100 }, (_, i) => 
        // @ts-ignore - TypeScript conflit avec interface unifiée
        formService.addPoll({
          id: `concurrent_form_${i}`,
          creator_id: "user_1",
          title: `Concurrent Form ${i}`,
          type: "form" as const,
          questions: [{ id: `q_${i}`, title: `Question ${i}`, kind: "single" as const }],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      ),
    ];

    await Promise.all(operations);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Vérifier performance < 3 secondes pour 200 opérations concurrentes
    expect(duration).toBeLessThan(3000);
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(200);
  });
});
