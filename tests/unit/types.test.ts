import { describe, it, expect } from "vitest";
import type { Stop, RouteSummary } from "@/types";

describe("Shared types contracts", () => {
  it("builds a valid Stop and RouteSummary", () => {
    const sampleStop: Stop = {
      id: "stop-1",
      label: "Victoria Island Delivery",
      address: "123 Adeola Odeku St, Victoria Island, Lagos",
      lat: 6.4281,
      lng: 3.4219,
      delivered: false,
    };

    const sampleSummary: RouteSummary = {
      order: [0, 1],
      totalDistanceM: 14500,
      totalDurationS: 1800,
      baselineDistanceM: 19200,
      baselineDurationS: 2400,
      distanceSavedPct: 24.48,
      fuelLitres: 0.435,
      baselineFuelLitres: 0.576,
      algorithm: "held-karp",
    };

    expect(sampleStop.id).toBe("stop-1");
    expect(sampleStop.delivered).toBe(false);
    expect(sampleSummary.algorithm).toBe("held-karp");
    expect(sampleSummary.order).toEqual([0, 1]);
    expect(sampleSummary.distanceSavedPct).toBeGreaterThan(0);
  });
});
