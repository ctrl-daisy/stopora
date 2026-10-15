import { describe, expect, it } from "vitest";
import { fuelLitres, LITRES_PER_KM } from "@/lib/services/fuel";
import { buildSummary } from "@/lib/services/routeSummary";

describe("fuel assumptions", () => {
  it.each(["motorbike", "car", "van"] as const)("estimates %s", vehicle => {
    expect(fuelLitres(10000, vehicle)).toBeCloseTo(10 * LITRES_PER_KM[vehicle]);
    expect(fuelLitres(0, vehicle)).toBe(0);
  });
});
describe("summary", () => {
  const matrix = { distances: [[0, 9, 2], [4, 0, 9], [3, 2, 0]], durations: [[0, 90, 20], [40, 0, 90], [30, 20, 0]] };
  it("uses the selected sequence for both metrics and the entered baseline", () => {
    const summary = buildSummary(matrix, { order: [0, 2, 1], cost: 4, algorithm: "held-karp" }, "car", false);
    expect(summary.fuelLitres).toBeCloseTo(0.00036, 8);
    expect(summary.baselineFuelLitres).toBeCloseTo(0.00162, 8);
    expect(summary).toMatchObject({
      order: [0, 2, 1], totalDistanceM: 4, totalDurationS: 40, baselineDistanceM: 18, baselineDurationS: 180,
      distanceSavedPct: 77.8, algorithm: "held-karp",
    });
  });
  it("reports zero saving for the entered order", () => {
    expect(buildSummary(matrix, { order: [0, 1, 2], cost: 18, algorithm: "held-karp" }, "motorbike", false).distanceSavedPct).toBe(0);
  });
  it("includes the return leg", () => {
    const summary = buildSummary(matrix, { order: [0, 2, 1], cost: 8, algorithm: "held-karp" }, "van", true);
    expect(summary.totalDistanceM).toBe(8);
    expect(summary.totalDurationS).toBe(80);
    expect(summary.baselineDistanceM).toBe(21);
  });
  it("handles zero baseline and never reports negative savings", () => {
    expect(buildSummary({ distances: [[0]], durations: [[0]] }, { order: [0], cost: 0, algorithm: "trivial" }, "van", false).distanceSavedPct).toBe(0);
    const worse = { distances: [[0, 1, 9], [1, 0, 1], [1, 9, 0]], durations: matrix.durations };
    expect(buildSummary(worse, { order: [0, 2, 1], cost: 18, algorithm: "trivial" }, "van", false).distanceSavedPct).toBe(0);
  });
});
