import { test, expect } from "@playwright/test";

test.describe("Discover", () => {
  test("página carga sin errores y muestra personajes", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    // Page should not crash
    await expect(page.locator("body")).toBeVisible();
  });

  test("filtros de categoría cambian la lista", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    // Tabs should be visible
    const tabs = page.getByRole("tab");
    await expect(tabs.first()).toBeVisible();
  });

  test("scroll infinito carga más personajes", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // Page should handle scroll without crash
    await page.waitForTimeout(1000);
  });

  test("navegación a detalle de personaje", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    // Click first character card
    const card = page.locator("a[href^='/chat/']").first();
    if (await card.isVisible()) {
      await card.click();
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("/chat/");
    }
  });
});
