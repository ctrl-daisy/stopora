import { test, expect } from "@playwright/test";

test("smoke: page loads and title contains Stopora", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Stopora/);
  await expect(page.getByRole("heading", { name: "Stopora" })).toBeVisible();
});
