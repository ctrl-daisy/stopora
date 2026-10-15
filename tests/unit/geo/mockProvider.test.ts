import { describe, it, expect } from "vitest";
import { mockProvider } from "../../../src/lib/geo/mockProvider";

describe("mockProvider", () => {
  it("geocode matches part of a name, ignoring case", async () => {
    const results = await mockProvider.geocode("YAB");
    expect(results.map((r) => r.label)).toContain("Yaba");
  });

  it("geocode returns nothing for an unknown place", async () => {
    expect(await mockProvider.geocode("zzzz")).toEqual([]);
  });

  it("matrix is square, zero on the diagonal, never negative", async () => {
    const points = [
      { lat: 6.4474, lng: 3.47 },
      { lat: 6.5095, lng: 3.3711 },
      { lat: 6.614, lng: 3.358 },
    ];
    const { distances, durations } = await mockProvider.getMatrix(points);
    expect(distances).toHaveLength(3);
    expect(durations).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      expect(distances[i]).toHaveLength(3);
      expect(distances[i][i]).toBe(0);
      for (let j = 0; j < 3; j++) {
        expect(distances[i][j]).toBeGreaterThanOrEqual(0);
        expect(durations[i][j]).toBeGreaterThanOrEqual(0);
      }
    }
  });
});