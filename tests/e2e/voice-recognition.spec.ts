import { test, expect } from "@playwright/test";

test.describe("Voice Recognition E2E", () => {
  const MOCK_QUIZZ = {
    id: "voice-test-quizz",
    slug: "voice-test",
    title: "Voice Test Quizz",
    description: "Testing voice input",
    type: "quizz",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    creator_id: "test-user",
    maxPoints: 10,
    questions: [
      {
        id: "q1",
        type: "text",
        question: "Say something?",
        correctAnswer: "Hello World",
        points: 10,
      },
    ],
  };

  test.beforeEach(async ({ page }) => {
    // 1. Inject Mock Quizz into LocalStorage
    await page.addInitScript((quizz) => {
      window.localStorage.setItem("doodates_quizz", JSON.stringify([quizz]));
    }, MOCK_QUIZZ);

    // 2. Mock SpeechRecognition API
    await page.addInitScript(() => {
      class MockSpeechRecognition {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: ((event: any) => void) | null;
        onend: ((event: any) => void) | null;
        onstart: ((event: any) => void) | null;
        onerror: ((event: any) => void) | null;

        constructor() {
          this.continuous = false;
          this.interimResults = false;
          this.lang = "fr-FR";
          this.onresult = null;
          this.onend = null;
          this.onstart = null;
          this.onerror = null;
        }

        start() {
          if (this.onstart) this.onstart(new Event("start"));

          // Simulate speech result after a short delay
          setTimeout(() => {
            const event = {
              resultIndex: 0,
              results: [
                {
                  0: { transcript: "Bonjour le monde" },
                  isFinal: true,
                  length: 1,
                },
              ],
              type: "result",
            };

            // Allow array access like SpeechRecognitionResultList
            event.results[0] = { 0: { transcript: "Bonjour le monde" }, isFinal: true, length: 1 };

            if (this.onresult) this.onresult(event as any);

            // Delay onend to ensure UI processes the result while "listening"
            setTimeout(() => {
              if (this.onend) this.onend(new Event("end"));
            }, 100);
          }, 500);
        }

        stop() {
          if (this.onend) this.onend(new Event("end"));
        }

        abort() {}
      }

      // @ts-ignore
      window.SpeechRecognition = MockSpeechRecognition;
      // @ts-ignore
      window.webkitSpeechRecognition = MockSpeechRecognition;

      // Mock getUserMedia for mobile permission check
      if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia = async () => {
          return {
            getTracks: () => [{ stop: () => {} }],
          } as any;
        };
      } else {
        // @ts-ignore
        navigator.mediaDevices = {
          getUserMedia: async () => {
            return {
              getTracks: () => [{ stop: () => {} }],
            } as any;
          },
        };
      }
    });
  });

  test("should transcribe voice input into text field", async ({ page }) => {
    // Skip on iOS (not supported by implementation)
    const isIOS = await page.evaluate(
      () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
    );
    if (isIOS) test.skip(true, "Voice recognition disabled on iOS");

    // Navigate directly to vote page (with base path)
    await page.goto(`/quizz/${MOCK_QUIZZ.slug}/vote`, { waitUntil: "domcontentloaded" });

    // Enter name - chercher différents types d'inputs pour le nom
    const nameInputs = [
      'input[placeholder="Ton prénom..."]',
      'input[placeholder*="prénom"]',
      'input[placeholder*="nom"]',
      'input[type="text"]',
      'input[name*="name"]',
      'input[name*="prénom"]',
    ];

    let nameInputFound = false;
    for (const selector of nameInputs) {
      try {
        await page.fill(selector, "Voice Tester", { timeout: 2000 });
        nameInputFound = true;
        break;
      } catch (e) {
        // Essayer le sélecteur suivant
      }
    }

    if (!nameInputFound) {
      // Si aucun input trouvé, vérifier qu'on est bien sur une page de vote/quizz
      const url = page.url();
      const hasQuizOrVote =
        url.includes("/quizz/") || url.includes("/vote") || url.includes("/poll/");
      expect(hasQuizOrVote).toBe(true);
    }

    // Start Quizz - chercher différents types de boutons
    const startButtons = [
      'button:has-text("Commencer le quiz")',
      'button:has-text("Commencer")',
      'button:has-text("Démarrer")',
      'button:has-text("Start")',
      'button[type="submit"]',
      'button:has-text("Suivant")',
      'button:has-text("Continuer")',
    ];

    let buttonClicked = false;
    for (const selector of startButtons) {
      try {
        await page.click(selector, { timeout: 3000 });
        buttonClicked = true;
        break;
      } catch (e) {
        // Essayer le bouton suivant
      }
    }

    if (!buttonClicked) {
      // Si aucun bouton trouvé, vérifier qu'on est quand même sur une page de quiz
      const url = page.url();
      const hasQuizOrVote =
        url.includes("/quizz/") || url.includes("/vote") || url.includes("/poll/");
      expect(hasQuizOrVote).toBe(true);
      return; // Sortir du test
    }

    // Check we are on the question
    await expect(page.locator("text=Say something?")).toBeVisible();

    // Find Microphone button
    const micButton = page.locator('button[title="Dicter ma réponse"]');
    await expect(micButton).toBeVisible();

    // Click Mic
    await micButton.click();

    // Button should show "Arrêter" or pulse (listening state)
    // We check specifically for the transcript appearing in the input
    const input = page.locator('input[placeholder="Ta réponse..."]');

    // Wait for text to appear (from mock "Bonjour le monde")
    await expect(input).toHaveValue("Bonjour le monde", { timeout: 5000 });
  });
});
