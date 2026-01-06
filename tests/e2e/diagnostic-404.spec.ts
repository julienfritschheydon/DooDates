import { test, expect } from "@playwright/test";

test("Diagnostic: 404 vs White Screen", async ({ page }) => {
  page.on("console", (msg) => {
    console.log(`[BROWSER-${msg.type()}] ${msg.text()}`);
  });

  page.on("pageerror", (err) => {
    console.error(`[BROWSER-ERROR] ${err.message}`);
    console.error(`[BROWSER-STACK] ${err.stack}`);
  });

  page.on("response", (response) => {
    const url = response.url();
    if (url.includes(".tsx") || url.includes(".ts") || response.status() >= 400) {
      console.log(`[NET-${response.status()}] ${url}`);
    }
  });

  console.log("Navigating to non-existent route /this-route-does-not-exist");
  await page.goto("/this-route-does-not-exist");

  await page.waitForLoadState("networkidle");

  const title = await page.title();
  const url = page.url();
  console.log(`Final URL: ${url}`);
  console.log(`Final Title: ${title}`);

  const body = await page.textContent("body");
  console.log(`Body text preview: ${body?.substring(0, 100)}...`);

  await page.screenshot({ path: "test-results/diagnostic-404.png", fullPage: true });

  // Check if 404 page is rendered
  const h1 = page.locator("h1");
  if (await h1.isVisible()) {
    console.log(`H1 found: ${await h1.textContent()}`);
  } else {
    console.log("No H1 found - possible white screen!");
  }
});
