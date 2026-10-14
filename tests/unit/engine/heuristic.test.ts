import { describe, it, expect } from "vitest";
import { heuristic } from "@/lib/engine/heuristic";
import { routeCost } from "@/lib/engine/cost";
import { createRng, generateRandomMatrix } from "./random";

function getNearestNeighbourCost(
  distances: number[][],
  returnToStart: boolean
): number {
  const n = distances.length;
  const visited = new Uint8Array(n);
  visited[0] = 1;
  const order: number[] = [0];

  for (let step = 1; step < n; step++) {
    const last = order[order.length - 1];
    let nearest = -1;
    let minDistance = Infinity;

    for (let v = 1; v < n; v++) {
      if (visited[v] === 0) {
        const d = distances[last][v];
        if (d < minDistance) {
          minDistance = d;
          nearest = v;
        }
      }
    }

    visited[nearest] = 1;
    order.push(nearest);
  }

  return routeCost(order, distances, returnToStart);
}

describe("Heuristic solver (heuristic)", () => {
  it("never performs worse than nearest-neighbour on 25 random points", () => {
    const rng = createRng(4242);
    const n = 25;

    // Test across several 25-point scenarios (symmetric, asymmetric, open, round trip)
    for (let testIdx = 0; testIdx < 10; testIdx++) {
      const symmetric = testIdx % 2 === 0;
      const returnToStart = Math.floor(testIdx / 2) % 2 === 0;
      const matrix = generateRandomMatrix(n, symmetric, rng);

      const nnCost = getNearestNeighbourCost(matrix, returnToStart);
      const hResult = heuristic(matrix, returnToStart);

      // The 2-opt heuristic result is never worse than nearest-neighbour start
      expect(hResult.cost).toBeLessThanOrEqual(nnCost + 1e-9);

      // Verify invariants
      expect(hResult.order[0]).toBe(0);
      expect(hResult.order.length).toBe(n);
      const unique = new Set(hResult.order);
      expect(unique.size).toBe(n);
      for (let i = 0; i < n; i++) {
        expect(unique.has(i)).toBe(true);
      }
    }
  });

  it("handles small inputs gracefully", () => {
    expect(heuristic([], false)).toEqual({ order: [], cost: 0 });
    expect(heuristic([[0]], false)).toEqual({ order: [0], cost: 0 });

    const matrix2 = [
      [0, 10],
      [15, 0],
    ];
    const res2Open = heuristic(matrix2, false);
    expect(res2Open.order).toEqual([0, 1]);
    expect(res2Open.cost).toBe(10);

    const res2Round = heuristic(matrix2, true);
    expect(res2Round.order).toEqual([0, 1]);
    expect(res2Round.cost).toBe(25);
  });
});
