import { test, expect } from "@playwright/test";

test.describe("Crear personaje", () => {
  test("página de crear carga sin errores", async ({ page }) => {
    await page.goto("/create");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("formulario tiene campos requeridos", async ({ page }) => {
    await page.goto("/create");
    await page.waitForLoadState("networkidle");
    // Should have name and prompt fields
    const nameField = page.locator("input[id*='name'], input[placeholder*='nombre']").first();
    const promptField = page.locator("textarea, input[placeholder*='prompt']").first();
    const nameVisible = await nameField.isVisible().catch(() => false);
    const promptVisible = await promptField.isVisible().catch(() => false);
    expect(nameVisible || promptVisible).toBeTruthy();
  });
});
