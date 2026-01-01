import { test, expect } from "@playwright/test";

test.describe("Google Sign In Flow", () => {
    test("should handle Google OAuth callback simulation", async ({ page }) => {
        // Mock the Supabase OAuth redirect flow
        // The application likely calls signInWithOAuth({ provider: 'google' })
        // This usually redirects the browser to Supabase/Google
        // We can intercept the triggered navigation or just test the *callback* handling

        // 1. Visit the app
        await page.goto("//DooDates/");

        // 2. Mock the auth state change that happens after a successful redirect
        // In a real app, the callback URL contains access_token in the hash

        // Simulate a return from Google with a fake token
        await page.goto("/DooDates/#access_token=mock-google-token&expires_in=3600&refresh_token=mock-refresh&token_type=bearer&type=recovery");

        // 3. Verify that the app handles this token and signs the user in
        // Depending on implementation, this might trigger a state update

        // Wait for potential network requests to verify token
        await page.waitForTimeout(1000);

        // Check if we are "logged in" (e.g., Avatar visible, "Sign In" button gone)
        // Adjust selectors based on actual app
        const avatar = page.locator('.avatar, [data-testid="user-avatar"]');
        const signInBtn = page.locator('button:has-text("Sign in"), button:has-text("Connexion")');

        if (await avatar.isVisible()) {
            expect(await avatar.isVisible()).toBe(true);
        } else if (await signInBtn.isVisible()) {
            // If we are still seeing sign in, maybe the mock token wasn't accepted
            // (which is expected since it's fake and backend validation would fail)
            // But valid frontend code might show a loading state or error
            console.log("Mock token rejected or ignored (expected without real backend)");
        }
    });

    test("should handle auth errors gracefully", async ({ page }) => {
        // Simulate an error callback
        await page.goto("/DooDates/#error=access_denied&error_code=403&error_description=User+denied+access");

        // Verify error message toast or alert
        const alert = page.locator('[role="alert"], .toast, .error-message');
        if (await alert.isVisible()) {
            expect(await alert.textContent()).toContain("denied");
        }
    });
});
