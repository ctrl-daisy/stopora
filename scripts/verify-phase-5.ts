import { chromium } from "@playwright/test";
import path from "path";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  console.log("1. Navigating to seeded run...");
  await page.goto("http://localhost:3000/runs/cmvav9om20000uh34ahx05fn1", {
    waitUntil: "networkidle",
  });

  // Wait for the map and stops to be visible
  await page.waitForSelector(".leaflet-container");
  await page.waitForTimeout(1000);

  const beforeScreenshotPath = path.resolve(
    process.cwd(),
    "docs/screenshots/planner-before-optimize.png"
  );
  console.log(`2. Saving screenshot to ${beforeScreenshotPath}...`);
  await page.screenshot({ path: beforeScreenshotPath, fullPage: true });

  console.log("3. Searching for a stop to add ('Marina')...");
  const searchInput = page.getByPlaceholder("Search Lagos street / customer...");
  await searchInput.fill("Marina");
  await page.waitForTimeout(600); // allow debounce

  // Wait for and click result
  const resultOption = page.locator('li[role="option"]', { hasText: "Marina" });
  if (await resultOption.isVisible()) {
    await resultOption.click();
    console.log("   Added stop 'Marina'.");
  } else {
    // Or drop a pin
    console.log("   Using drop pin fallback...");
    await page.getByRole("button", { name: "Drop Pin" }).click();
    await page.locator(".leaflet-container").click({ position: { x: 180, y: 150 } });
    await page.getByRole("button", { name: "Add Stop" }).click();
  }

  await page.waitForTimeout(1000);

  console.log("4. Clicking Optimize Route button...");
  const optimizeBtn = page.getByRole("button", { name: /Optimize Route/i });
  await optimizeBtn.click();

  // Wait for optimization to finish
  console.log("5. Waiting for route optimization results...");
  await page.waitForSelector("text=Route Performance & Savings", { timeout: 15000 });
  await page.waitForTimeout(1000);

  // Verify SummaryCards and Naira
  const nairaText = await page.locator("text=₦").first().textContent();
  console.log(`   Naira savings displayed: ${nairaText}`);

  console.log("6. Ticking 'Delivered' checkbox on Stop #1...");
  const firstDeliveredCheckbox = page.locator('input[type="checkbox"][id^="delivered-"]').first();
  await firstDeliveredCheckbox.check();
  await page.waitForTimeout(600);
  console.log("   Stop marked as delivered.");

  console.log("7. Checking single-leg Navigate link...");
  const firstNavigateLink = page.getByRole("link", { name: /Navigate/i }).first();
  const navHref = await firstNavigateLink.getAttribute("href");
  console.log(`   Navigate URL: ${navHref}`);

  const afterScreenshotPath = path.resolve(
    process.cwd(),
    "docs/screenshots/planner-after-optimize.png"
  );
  console.log(`8. Saving screenshot to ${afterScreenshotPath}...`);
  await page.screenshot({ path: afterScreenshotPath, fullPage: true });

  await browser.close();
  console.log("Verification finished successfully!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
