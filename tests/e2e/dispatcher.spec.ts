import { test, expect, type Page } from "@playwright/test";

const PLACES = [
  { label: "Lekki Phase 1", lat: 6.4474, lng: 3.47 },
  { label: "Yaba", lat: 6.5095, lng: 3.3711 },
  { label: "Ikeja", lat: 6.6018, lng: 3.3515 },
];

const SUMMARY = {
  order: [0, 2, 1],
  totalDistanceM: 42300,
  totalDurationS: 5760,
  baselineDistanceM: 58900,
  baselineDurationS: 7200,
  distanceSavedPct: 28.2,
  fuelLitres: 1.3,
  baselineFuelLitres: 1.8,
  algorithm: "held-karp",
};

async function mockApi(page: Page) {
  const stops: { id: string; label: string; lat: number; lng: number }[] = [];

  await page.route("**/*.tile.openstreetmap.org/**", (route) => route.abort());

  await page.route("**/api/geocode*", async (route) => {
    const q = new URL(route.request().url()).searchParams.get("q") ?? "";
    const found = PLACES.filter((p) =>
      p.label.toLowerCase().includes(q.toLowerCase()),
    );
    await route.fulfill({ json: found });
  });

  await page.route("**/api/runs", (route) =>
    route.fulfill({ status: 201, json: { id: "run-1" } }),
  );

  await page.route("**/api/runs/run-1", (route) =>
    route.fulfill({ json: { id: "run-1", stops } }),
  );

  await page.route("**/api/runs/run-1/stops", async (route) => {
    const body = route.request().postDataJSON() as {
      label: string;
      lat: number;
      lng: number;
    };
    stops.push({ id: `s${stops.length + 1}`, ...body });
    await route.fulfill({ status: 201, json: {} });
  });

  await page.route("**/api/runs/run-1/stops/*", async (route) => {
    const id = route.request().url().split("/").pop();
    const index = stops.findIndex((s) => s.id === id);
    if (index >= 0) stops.splice(index, 1);
    await route.fulfill({ status: 204 });
  });

  await page.route("**/api/runs/run-1/optimize", async (route) => {
    stops.reverse();
    await route.fulfill({ json: SUMMARY });
  });
}

async function searchAndPick(page: Page, placeholder: string, name: string) {
  await page.getByPlaceholder(placeholder).fill(name);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name, exact: true }).click();
}

test.describe("dispatcher page", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/plan");
  });

  test("plans a route from start to Google Maps link", async ({ page }) => {
    await searchAndPick(page, "Search Lagos address (e.g. Ikeja, Yaba, Lekki)", "Lekki Phase 1");
    await page.getByRole("button", { name: "Create run & add stops" }).click();

    await searchAndPick(page, "Search a delivery address", "Yaba");
    await searchAndPick(page, "Search a delivery address", "Ikeja");

    await page.getByRole("button", { name: "Find best route" }).click();

    await expect(page.getByText("Distance saved")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open in Google Maps" }),
    ).toHaveAttribute("href", /google\.com\/maps\/dir/);
  });

  test("cannot optimize with fewer than 2 stops", async ({ page }) => {
    await searchAndPick(page, "Search Lagos address (e.g. Ikeja, Yaba, Lekki)", "Lekki Phase 1");
    await page.getByRole("button", { name: "Create run & add stops" }).click();

    await expect(
      page.getByRole("button", { name: "Find best route" }),
    ).toBeDisabled();
  });

  test("removing a stop clears the old result", async ({ page }) => {
    await searchAndPick(page, "Search Lagos address (e.g. Ikeja, Yaba, Lekki)", "Lekki Phase 1");
    await page.getByRole("button", { name: "Create run & add stops" }).click();
    await searchAndPick(page, "Search a delivery address", "Yaba");
    await searchAndPick(page, "Search a delivery address", "Ikeja");
    await page.getByRole("button", { name: "Find best route" }).click();
    await expect(page.getByText("Distance saved")).toBeVisible();

    await page.getByRole("button", { name: "Remove" }).first().click();

    await expect(page.getByText("Distance saved")).toBeHidden();
  });

  test("shows a message when the search is too short", async ({ page }) => {
    await page.getByPlaceholder("Search Lagos address (e.g. Ikeja, Yaba, Lekki)").fill("ab");
    await page.getByRole("button", { name: "Search", exact: true }).click();

    await expect(page.getByText("Type at least 3 characters.")).toBeVisible();
  });
});

test.describe("dispatcher page on a phone", () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test("plans a route at 360 x 740", async ({ page }) => {
    await mockApi(page);
    await page.goto("/plan");

    await searchAndPick(page, "Search Lagos address (e.g. Ikeja, Yaba, Lekki)", "Lekki Phase 1");
    await page.getByRole("button", { name: "Create run & add stops" }).click();
    await searchAndPick(page, "Search a delivery address", "Yaba");
    await searchAndPick(page, "Search a delivery address", "Ikeja");
    await page.getByRole("button", { name: "Find best route" }).click();

    await expect(page.getByText("Distance saved")).toBeVisible();
  });
});