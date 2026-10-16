import { test, expect, type Page } from "@playwright/test";

// Abort OpenStreetMap tile downloads in e2e to prevent network flakiness
async function blockMapTiles(page: Page) {
  await page.route("**/*.tile.openstreetmap.org/**", (route) => route.abort());
}

async function searchAndSelect(
  page: Page,
  inputPlaceholder: string | RegExp,
  query: string,
  optionName: string | RegExp,
) {
  const input = page.getByPlaceholder(inputPlaceholder);
  await expect(input).toBeEnabled({ timeout: 20000 });
  await input.fill(query);
  const option = page.getByRole("option", { name: optionName });
  await expect(option).toBeVisible({ timeout: 15000 });
  await option.click();
}

test.describe("Dispatcher full route flow", () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await blockMapTiles(page);
  });

  test("Happy path: create run, add 6 stops, optimize, deliver all, completed banner", async ({
    page,
  }) => {
    // 1. Visit /plan
    await page.goto("/plan");

    // 2. Set start point and create run
    await searchAndSelect(
      page,
      /Search Lagos address/i,
      "Yaba",
      /Yaba/i,
    );

    const createButton = page.getByRole("button", { name: /Create run/i });
    await expect(createButton).toBeEnabled();
    await createButton.click();

    // 3. Should redirect to /runs/[id]
    await page.waitForURL(/\/runs\/cmv/, { timeout: 20000 });
    await expect(page.getByText("Add Delivery Stop")).toBeVisible({ timeout: 20000 });

    // 4. Add 6 stops by search (using exact names from mockProvider)
    const stopsToAdd = [
      { search: "Lekki", option: "Lekki Phase 1" },
      { search: "Victoria", option: "Victoria Island" },
      { search: "Ikoyi", option: "Ikoyi" },
      { search: "Surulere", option: "Surulere" },
      { search: "Maryland", option: "Maryland" },
      { search: "Gbagada", option: "Gbagada" },
    ];

    for (const stop of stopsToAdd) {
      await searchAndSelect(
        page,
        /Search Lagos street/i,
        stop.search,
        new RegExp(stop.option, "i"),
      );
      // Wait for stop to appear in list and input to be re-enabled
      await expect(page.getByText(stop.option).first()).toBeVisible({ timeout: 20000 });
      await expect(page.getByPlaceholder(/Search Lagos street/i)).toBeEnabled({ timeout: 20000 });
    }

    await expect(page.getByText("6 / 12")).toBeVisible();

    // 5. Optimize route
    const optimizeBtn = page.getByRole("button", { name: /Optimize Route/i });
    await expect(optimizeBtn).toBeEnabled();
    await optimizeBtn.click();

    // Verify savings and performance metrics appear
    await expect(
      page.getByText("Route Performance & Savings"),
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Total Distance")).toBeVisible();
    await expect(page.getByText("Saved vs Your Order")).toBeVisible();

    // Check that Google Maps leg navigation links exist
    const navLinks = page.getByRole("link", { name: /Navigate to .* in Google Maps/i });
    await expect(navLinks.first()).toHaveAttribute("href", /google\.com\/maps\/dir/);

    // 6. Mark every stop delivered
    const checkboxes = page.getByRole("checkbox", { name: /Mark .* as delivered/i });
    const count = await checkboxes.count();
    expect(count).toBe(6);

    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
      await page.waitForTimeout(600);
    }

    // 7. Completed banner appears
    await expect(
      page.getByText(/All stops delivered! Run completed/i),
    ).toBeVisible({ timeout: 15000 });
  });

  test("Validation: optimize disabled with fewer than 2 stops, 13th stop blocked", async ({
    page,
  }) => {
    await page.goto("/plan");

    await searchAndSelect(
      page,
      /Search Lagos address/i,
      "Yaba",
      /Yaba/i,
    );
    await page.getByRole("button", { name: /Create run/i }).click();
    await page.waitForURL(/\/runs\/cmv/, { timeout: 20000 });
    await expect(page.getByText("Add Delivery Stop")).toBeVisible({ timeout: 20000 });

    // 0 stops: optimize button should be disabled
    const optimizeBtn = page.getByRole("button", { name: /Optimize Route/i });
    await expect(optimizeBtn).toBeDisabled();
    await expect(
      page.getByText("Add at least 2 stops to enable route optimization"),
    ).toBeVisible();

    // Add 1 stop
    await searchAndSelect(
      page,
      /Search Lagos street/i,
      "Ikeja",
      /Ikeja/i,
    );
    await expect(page.getByText("Ikeja").first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("1 / 12")).toBeVisible({ timeout: 20000 });
    await expect(optimizeBtn).toBeDisabled();

    // Add 2nd stop: optimize button should become enabled
    await searchAndSelect(
      page,
      /Search Lagos street/i,
      "Surulere",
      /Surulere/i,
    );
    await expect(page.getByText("Surulere").first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("2 / 12")).toBeVisible({ timeout: 20000 });
    await expect(optimizeBtn).toBeEnabled({ timeout: 20000 });
  });
});

test.describe("Mobile viewport tests (360 x 740)", () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await blockMapTiles(page);
  });

  test("Happy path on 360 x 740 phone viewport", async ({ page }) => {
    await page.goto("/plan");

    await searchAndSelect(
      page,
      /Search Lagos address/i,
      "Yaba",
      /Yaba/i,
    );
    await page.getByRole("button", { name: /Create run/i }).click();
    await page.waitForURL(/\/runs\/cmv/, { timeout: 20000 });
    await expect(page.getByText("Add Delivery Stop")).toBeVisible({ timeout: 20000 });

    // Add 2 stops
    await searchAndSelect(
      page,
      /Search Lagos street/i,
      "Lekki",
      /Lekki Phase 1/i,
    );
    await expect(page.getByText("Lekki Phase 1").first()).toBeVisible({ timeout: 20000 });

    await searchAndSelect(
      page,
      /Search Lagos street/i,
      "Ikoyi",
      /Ikoyi/i,
    );
    await expect(page.getByText("Ikoyi").first()).toBeVisible({ timeout: 20000 });

    await expect(page.getByText("2 / 12")).toBeVisible({ timeout: 20000 });

    // Optimize
    const optimizeBtn = page.getByRole("button", { name: /Optimize Route/i });
    await expect(optimizeBtn).toBeEnabled();
    await optimizeBtn.click();

    await expect(page.getByText("Route Performance & Savings")).toBeVisible({
      timeout: 15000,
    });

    // Mark all delivered
    const checkboxes = page.getByRole("checkbox", { name: /Mark .* as delivered/i });
    await checkboxes.nth(0).check();
    await page.waitForTimeout(600);
    await checkboxes.nth(1).check();

    await expect(
      page.getByText(/All stops delivered! Run completed/i),
    ).toBeVisible({ timeout: 15000 });
  });
});