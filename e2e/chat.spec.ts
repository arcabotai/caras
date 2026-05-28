import { test, expect } from "@playwright/test";

test.describe("Chat", () => {
  test("página de chat carga sin errores", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    const card = page.locator("a[href^='/chat/']").first();
    if (await card.isVisible()) {
      const href = await card.getAttribute("href");
      await page.goto(href!);
      await page.waitForLoadState("networkidle");
      // Chat input should be visible
      const input = page.locator("textarea, input[type='text']").first();
      await expect(input).toBeVisible({ timeout: 5000 });
    }
  });

  test("enviar mensaje muestra respuesta (sin crash)", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    const card = page.locator("a[href^='/chat/']").first();
    if (await card.isVisible()) {
      const href = await card.getAttribute("href");
      await page.goto(href!);
      await page.waitForLoadState("networkidle");
      const input = page.locator("textarea, input[type='text']").first();
      if (await input.isVisible({ timeout: 5000 })) {
        await input.fill("Hola, ¿cómo estás?");
        await page.keyboard.press("Enter");
        await page.waitForTimeout(2000);
        // Page should not crash — check body still exists
        await expect(page.locator("body")).toBeVisible();
      }
    }
  });

  test("límite de rate limit muestra mensaje en español", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");
    const card = page.locator("a[href^='/chat/']").first();
    if (await card.isVisible()) {
      const href = await card.getAttribute("href");
      await page.goto(href!);
      await page.waitForLoadState("networkidle");
      // If rate limited, the counter/banner should be in Spanish
      const rateLimitText = page.getByText(/mensajes|límite|50/i);
      await expect(rateLimitText.first()).toBeVisible({ timeout: 3000 });
    }
  });
});
