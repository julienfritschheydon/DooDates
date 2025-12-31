import { test, expect } from "@playwright/test";

test.describe("Poll Enforcement - Closure Rules", () => {

    test.beforeEach(async ({ page }) => {
        // Nettoyer localStorage avant chaque test
        await page.goto('");
        await page.evaluate(() => localStorage.clear());
    });

    test("should display closure screen for expired Date Poll", async ({ page }) => {
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

        // Injecter le poll dans le storage
        await page.evaluate((data) => {
            localStorage.setItem("doodates_polls", JSON.stringify([data]));
        }, pollData);

        // Aller sur la page de vote
        await page.goto('poll/${pollData.slug}`);
        await page.waitForLoadState("networkidle");

        // Vérifier l'écran de clôture
        await expect(page.locator('text=Sondage expiré')).toBeVisible();
        await expect(page.locator('text=La date limite pour participer à ce sondage est dépassée.')).toBeVisible();

        // Vérifier que le bouton de vote n'est pas là
        await expect(page.locator('button:has-text("Voter")')).not.toBeVisible();
    });

    test("should display closure screen for Form Poll that reached max responses", async ({ page }) => {
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

        // Injecter le poll et la réponse
        await page.evaluate(({ poll, resp }) => {
            localStorage.setItem("doodates_polls", JSON.stringify([poll]));
            localStorage.setItem("doodates_form_responses", JSON.stringify([resp]));
        }, { poll: pollData, resp: responseData });

        // Aller sur la page de vote
        await page.goto('poll/${pollData.slug}`);
        await page.waitForLoadState("networkidle");

        // Vérifier l'écran de clôture
        await expect(page.locator('text=Sondage complet')).toBeVisible();
        await expect(page.locator('text=Le nombre maximum de participations pour ce sondage a été atteint.')).toBeVisible();
    });

    test("should allow voting on an active poll without reaching limits", async ({ page }) => {
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

        await page.evaluate((data) => {
            localStorage.setItem("doodates_polls", JSON.stringify([data]));
        }, pollData);

        await page.goto('poll/${pollData.slug}`);
        await page.waitForLoadState("networkidle");

        // L'interface de vote normale doit être visible (pas de message de clôture)
        await expect(page.locator('text=Sondage expiré')).not.toBeVisible();
        await expect(page.locator('text=Sondage complet')).not.toBeVisible();

        // Pour DatePoll, on vérifie la présence du bouton de validation (Swipe ou Grid)
        // Ici on vérifie le titre du sondage
        await expect(page.locator(`text=${pollData.title}`)).toBeVisible();
    });
});
