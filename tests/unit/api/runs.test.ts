import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;
if (!url) process.stderr.write("Skipping database API integration: TEST_DATABASE_URL is not set. Use a migrated, disposable test database.\n");
describe.skipIf(!url)("run API integration (TEST_DATABASE_URL, mock geo)", () => {
  let db: typeof import("@/lib/db").db;
  let runs: typeof import("@/app/api/runs/route");
  let runRoute: typeof import("@/app/api/runs/[id]/route");
  let stops: typeof import("@/app/api/runs/[id]/stops/route");
  let stopRoute: typeof import("@/app/api/runs/[id]/stops/[stopId]/route");
  let optimize: typeof import("@/app/api/runs/[id]/optimize/route");
  const ids: string[] = [];
  const request = (body: unknown, method = "POST") => new Request("http://localhost/api/runs", { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
  beforeAll(async () => {
    process.env.DATABASE_URL = url!;
    process.env.GEO_PROVIDER = "mock";
    ({ db } = await import("@/lib/db"));
    runs = await import("@/app/api/runs/route");
    runRoute = await import("@/app/api/runs/[id]/route");
    stops = await import("@/app/api/runs/[id]/stops/route");
    stopRoute = await import("@/app/api/runs/[id]/stops/[stopId]/route");
    optimize = await import("@/app/api/runs/[id]/optimize/route");
  });
  afterAll(async () => {
    if (db) { await db.run.deleteMany({ where: { id: { in: ids } } }); await db.$disconnect(); }
  });
  it("creates, adds five stops, optimizes, delivers and fetches", async () => {
    const response = await runs.POST(request({ name: "Integration run", start: { label: "Lekki", lat: 6.4474, lng: 3.47 } }));
    expect(response.status).toBe(201);
    const run = await response.json(); ids.push(run.id);
    const ctx = { params: Promise.resolve({ id: run.id }) };
    expect((await optimize.POST(request({}), ctx)).status).toBe(400);
    const stopIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const added = await stops.POST(request({ label: `Stop ${i}`, lat: 6.45 + i * 0.02, lng: 3.4 + (i % 2) * 0.08 }), ctx);
      expect(added.status).toBe(201); stopIds.push((await added.json()).id);
    }
    const optimized = await optimize.POST(request({}), ctx);
    expect(optimized.status).toBe(200);
    const summary = await optimized.json();
    expect(summary.order).toHaveLength(6); expect(summary.order[0]).toBe(0);
    expect(summary.distanceSavedPct).toBeGreaterThanOrEqual(0);
    for (const stopId of stopIds) expect((await stopRoute.PATCH(request({ delivered: true }, "PATCH"), { params: Promise.resolve({ id: run.id, stopId }) })).status).toBe(200);
    const fetched = await runRoute.GET(new Request("http://localhost"), ctx);
    const completed = await fetched.json();
    expect(completed.status).toBe("completed");
    expect(completed.stops.every((s: { delivered: boolean; deliveredAt: string | null }) => s.delivered && s.deliveredAt)).toBe(true);
    expect(completed.stops.map((s: { optimizedIndex: number }) => s.optimizedIndex)).toEqual([0, 1, 2, 3, 4]);
    expect(completed.summary.order).toEqual(summary.order);
    expect(completed.summary.algorithm).toBe(summary.algorithm);
    for (const key of ["totalDistanceM", "totalDurationS", "baselineDistanceM", "baselineDurationS", "distanceSavedPct", "fuelLitres", "baselineFuelLitres"]) expect(completed.summary[key]).toBeCloseTo(summary[key], 8);
    await stopRoute.DELETE(new Request("http://localhost", { method: "DELETE" }), { params: Promise.resolve({ id: run.id, stopId: stopIds[0] }) });
    const changed = await (await runRoute.GET(new Request("http://localhost"), ctx)).json();
    expect(changed.status).toBe("draft"); expect(changed.summary).toBeNull();
    expect(changed.stops.map((s: { enteredIndex: number }) => s.enteredIndex)).toEqual([0, 1, 2, 3]);
  }, 60000);
  it("enforces concurrent stop limits and rejects invalid coordinates", async () => {
    const created = await runs.POST(request({ name: "Limit test", start: { label: "Lekki", lat: 6.4474, lng: 3.47 } }));
    const run = await created.json(); ids.push(run.id);
    const ctx = { params: Promise.resolve({ id: run.id }) };
    const bad = await stops.POST(request({ label: "Outside", lat: 3, lng: 3.5 }), ctx);
    expect(bad.status).toBe(422); expect((await bad.json()).error.code).toBe("OUTSIDE_NIGERIA");
    const results = await Promise.all(Array.from({ length: 13 }, (_, i) => stops.POST(request({ label: `Concurrent ${i}`, lat: 6.5, lng: 3.4 }), ctx)));
    expect(results.filter(r => r.status === 201)).toHaveLength(12);
    const rejected = results.find(r => r.status === 400)!;
    expect((await rejected.json()).error.code).toBe("STOP_LIMIT");
    const fetched = await (await runRoute.GET(new Request("http://localhost"), ctx)).json();
    expect(fetched.stops).toHaveLength(12);
    expect(fetched.stops.map((s: { enteredIndex: number }) => s.enteredIndex)).toEqual(Array.from({ length: 12 }, (_, i) => i));
    const wrongStop = await stopRoute.PATCH(request({ delivered: true }, "PATCH"), { params: Promise.resolve({ id: run.id, stopId: "cm123456789012345678901234" }) });
    expect(wrongStop.status).toBe(404);
  }, 60000);
});
