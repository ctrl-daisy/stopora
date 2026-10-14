import { describe, it, expect } from "vitest";
import { solveRoute, routeCost } from "@/lib/engine";
import { createRng, generateRandomMatrix } from "./random";

describe("Engine top-level solver (solveRoute)", () => {
  it("re-exports routeCost properly", () => {
    expect(typeof routeCost).toBe("function");
    expect(routeCost([0, 1], [[0, 5], [5, 0]], false)).toBe(5);
  });

  it("handles 1 point with algorithm 'trivial'", () => {
    const matrix = [[0]];
    const openRes = solveRoute(matrix, { returnToStart: false });
    expect(openRes).toEqual({
      order: [0],
      cost: 0,
      algorithm: "trivial",
    });

    const roundRes = solveRoute(matrix, { returnToStart: true });
    expect(roundRes).toEqual({
      order: [0],
      cost: 0,
      algorithm: "trivial",
    });
  });

  it("handles 2 points with algorithm 'trivial'", () => {
    const matrix = [
      [0, 12],
      [18, 0],
    ];

    const openRes = solveRoute(matrix, { returnToStart: false });
    expect(openRes).toEqual({
      order: [0, 1],
      cost: 12,
      algorithm: "trivial",
    });

    const roundRes = solveRoute(matrix, { returnToStart: true });
    expect(roundRes).toEqual({
      order: [0, 1],
      cost: 30, // 12 + 18
      algorithm: "trivial",
    });
  });

  it("uses Held-Karp for 3 to 13 points", () => {
    const rng = createRng(100);

    // Test 3 points
    const m3 = generateRandomMatrix(3, true, rng);
    const res3 = solveRoute(m3, { returnToStart: true });
    expect(res3.algorithm).toBe("held-karp");
    expect(res3.order.length).toBe(3);

    // Test 13 points
    const m13 = generateRandomMatrix(13, false, rng);
    const res13 = solveRoute(m13, { returnToStart: false });
    expect(res13.algorithm).toBe("held-karp");
    expect(res13.order.length).toBe(13);
  });

  it("uses heuristic (nn-2opt) for 14 or more points", () => {
    const rng = createRng(200);

    const m14 = generateRandomMatrix(14, false, rng);
    const res14 = solveRoute(m14, { returnToStart: true });
    expect(res14.algorithm).toBe("nn-2opt");
    expect(res14.order.length).toBe(14);
    expect(res14.order[0]).toBe(0);

    const m30 = generateRandomMatrix(30, true, rng);
    const res30 = solveRoute(m30, { returnToStart: false });
    expect(res30.algorithm).toBe("nn-2opt");
    expect(res30.order.length).toBe(30);
    expect(res30.order[0]).toBe(0);
  });

  it("validates inputs before optimizing", () => {
    expect(() => solveRoute([], { returnToStart: true })).toThrowError(/empty/i);
    expect(() =>
      solveRoute([[0, 1]], { returnToStart: true })
    ).toThrowError(/square/i);
  });
});
