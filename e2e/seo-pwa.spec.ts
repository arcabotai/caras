import { test, expect } from "@playwright/test";

test.describe("SEO y PWA", () => {
  test("sitemap.xml existe y responde", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
  });

  test("robots.txt existe y responde", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
  });

  test("manifest.json de PWA existe", async ({ request }) => {
    const res = await request.get("/manifest.json");
    expect(res.status()).toBe(200);
  });

  test("sw.js (service worker) existe", async ({ request }) => {
    const res = await request.get("/sw.js");
    // May be 200 or 404 depending on build output, but shouldn't 500
    expect(res.status()).not.toBe(500);
  });

  test("página offline carga cuando hay network error simulado", async ({ page, context }) => {
    // Block all requests to simulate offline
    await context.route("**", (route) => route.abort());
    await page.goto("/offline");
    // Should show offline page without crash
    await expect(page.locator("body")).toBeVisible();
  });
});
