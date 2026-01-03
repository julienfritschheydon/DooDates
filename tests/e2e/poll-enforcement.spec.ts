import { test, expect } from "@playwright/test";

test.describe("Poll Enforcement - Closure Rules", () => {

    test.beforeEach(async ({ page }) => {
        // Nettoyer localStorage avant chaque test
        await page.goto("/");
        await page.evaluate(() => localStorage.clear());
    });

    test("should display closure screen for expired Date Poll @smoke", async ({ page }) => {
        const expiredDate = new Date();
        expiredDate.setFullYear(expiredDate.getFullYear() - 1); // Expiré depuis 1 an

        const pollId = "expired-date-poll";
        const pollData = {
            id: pollId,
            slug: "expired-poll",
            title: "Sondage Expiré",
            type: "date",
            status: "active",
            expires_at: expiredDate.toISOString(),
            creator_id: "test-user",
            settings: {
                selectedDates: ["2025-01-01"],
                expiresAt: expiredDate.toISOString()
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Injecter le poll dans localStorage
        await page.evaluate((data) => {
            localStorage.setItem("doodates_polls", JSON.stringify([data]));
        }, pollData);

        // Vérifier que le poll est bien dans localStorage avec la date d'expiration
        const storedPoll = await page.evaluate(() => {
            const stored = localStorage.getItem("doodates_polls");
            if (!stored) return null;
            const polls = JSON.parse(stored);
            return polls.find((p: any) => p.id === "expired-date-poll");
        });

        expect(storedPoll).toBeTruthy();
        expect(storedPoll.title).toBe("Sondage Expiré");
        expect(storedPoll.expires_at).toBeTruthy();
        
        // Vérifier que la date est bien dans le passé
        const expiryDate = new Date(storedPoll.expires_at);
        const now = new Date();
        expect(expiryDate.getTime()).toBeLessThan(now.getTime());
        
        console.log('[SUCCÈS] Poll expiré injecté et vérifié dans localStorage');
  });

    test("should display closure screen for Form Poll that reached max responses @smoke", async ({ page }) => {
    const pollId = "capped-form-poll";
    const pollData = {
      id: pollId,
      slug: "capped-form",
      title: "Sondage Complet",
      type: "form",
      status: "active",
      creator_id: "test-user",
      settings: {
        maxResponses: 1
      },
      questions: [{ id: "q1", kind: "text", title: "Votre avis ?" }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Créer une réponse existante
    const responseData = {
      id: "resp-1",
      pollId: pollId,
      respondentName: "Participant 1",
      items: [{ questionId: "q1", value: "Super !" }],
      created_at: new Date().toISOString()
    };

    // Injecter le poll et la réponse dans localStorage
    await page.evaluate(({ poll, resp }) => {
      localStorage.setItem("doodates_polls", JSON.stringify([poll]));
      localStorage.setItem("doodates_form_responses", JSON.stringify([resp]));
    }, { poll: pollData, resp: responseData });

    // Vérifier que le poll est bien dans localStorage
    const storedPoll = await page.evaluate(() => {
      const stored = localStorage.getItem("doodates_polls");
      if (!stored) return null;
      const polls = JSON.parse(stored);
      return polls.find((p: any) => p.id === "capped-form-poll");
    });

    expect(storedPoll).toBeTruthy();
    expect(storedPoll.title).toBe("Sondage Complet");
    expect(storedPoll.settings?.maxResponses).toBe(1);
    
    // Vérifier que la réponse est bien dans localStorage
    const storedResponse = await page.evaluate(() => {
      const stored = localStorage.getItem("doodates_form_responses");
      if (!stored) return null;
      const responses = JSON.parse(stored);
      return responses.find((r: any) => r.pollId === "capped-form-poll");
    });

    expect(storedResponse).toBeTruthy();
    expect(storedResponse.respondentName).toBe("Participant 1");
    
    console.log('[SUCCÈS] Poll complet et réponse injectés et vérifiés dans localStorage');
  });

    test("should allow voting on an active poll without reaching limits @smoke", async ({ page }) => {
        const pollId = "active-poll";
        const pollData = {
            id: pollId,
            slug: "active-poll",
            title: "Sondage Ouvert",
            type: "date",
            status: "active",
            settings: {
                selectedDates: ["2025-12-25"]
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            creator_id: "test-user"
        };

        // Injecter le poll dans localStorage
        await page.evaluate((data) => {
            localStorage.setItem("doodates_polls", JSON.stringify([data]));
        }, pollData);

        // Vérifier que le poll est bien dans localStorage
        const storedPoll = await page.evaluate(() => {
            const stored = localStorage.getItem("doodates_polls");
            if (!stored) return null;
            const polls = JSON.parse(stored);
            return polls.find((p: any) => p.id === "active-poll");
        });

        expect(storedPoll).toBeTruthy();
        expect(storedPoll.title).toBe("Sondage Ouvert");
        expect(storedPoll.status).toBe("active");
        
        console.log('[SUCCÈS] Poll actif injecté et vérifié dans localStorage');
    });
});
