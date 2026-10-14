import { describe, it, expect } from "vitest";
import { heldKarp } from "@/lib/engine/heldKarp";
import { bruteForce } from "./bruteForce";
import { createRng, generateRandomMatrix } from "./random";

describe("Held-Karp dynamic programming solver (heldKarp)", () => {
  it("solves a hand-made 5-point case with an obvious optimal route", () => {
    // Highly obvious path: 0 -> 1 (2) -> 2 (3) -> 3 (4) -> 4 (5) -> 0 (1)
    // All shortcut/deviating edges cost 50
    const obviousMatrix = [
      [0, 2, 50, 50, 50],
      [50, 0, 3, 50, 50],
      [50, 50, 0, 4, 50],
      [50, 50, 50, 0, 5],
      [1, 50, 50, 50, 0],
    ];

    // Round trip
    const roundTrip = heldKarp(obviousMatrix, true);
    expect(roundTrip.order).toEqual([0, 1, 2, 3, 4]);
    expect(roundTrip.cost).toBe(15);

    // Open route (ends at last stop without returning to 0)
    const openRoute = heldKarp(obviousMatrix, false);
    expect(openRoute.order).toEqual([0, 1, 2, 3, 4]);
    expect(openRoute.cost).toBe(14);
  });

  it("matches brute-force exactly across 200 random matrices (3 to 8 points)", () => {
    const rng = createRng(1337);
    const totalRuns = 200;

    for (let i = 0; i < totalRuns; i++) {
      // Rotate through point counts 3 to 8
      const n = 3 + (i % 6);
      const symmetric = i % 2 === 0;
      const returnToStart = Math.floor(i / 2) % 2 === 0;

      const matrix = generateRandomMatrix(n, symmetric, rng);

      const hkResult = heldKarp(matrix, returnToStart);
      const bfResult = bruteForce(matrix, returnToStart);

      // Check costs match optimal brute-force cost
      expect(hkResult.cost).toBeCloseTo(bfResult.cost, 5);

      // Assert order invariant: always starts with 0
      expect(hkResult.order[0]).toBe(0);

      // Assert order invariant: contains every index exactly once
      expect(hkResult.order.length).toBe(n);
      const uniqueIndices = new Set(hkResult.order);
      expect(uniqueIndices.size).toBe(n);
      for (let idx = 0; idx < n; idx++) {
        expect(uniqueIndices.has(idx)).toBe(true);
      }
    }
  });

  it("finishes 13 random points in well under 200 ms", () => {
    const rng = createRng(9999);
    const n = 13;
    const matrix = generateRandomMatrix(n, false, rng);

    // Warm-up run to allow JIT compilation
    heldKarp(matrix, false);

    const start = performance.now();
    const result = heldKarp(matrix, true);
    const duration = performance.now() - start;

    expect(result.order.length).toBe(13);
    expect(result.order[0]).toBe(0);
    expect(new Set(result.order).size).toBe(13);
    expect(result.cost).toBeGreaterThan(0);

    // Target is well under 200ms
    expect(duration).toBeLessThan(200);
  });
});
