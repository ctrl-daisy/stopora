import { describe, it, expect } from "vitest";
import { routeCost } from "@/lib/engine/cost";

describe("Route cost calculation (routeCost)", () => {
  const symmetricMatrix = [
    [0, 10, 20],
    [10, 0, 15],
    [20, 15, 0],
  ];

  const asymmetricMatrix = [
    [0, 10, 50],
    [30, 0, 15],
    [5, 40, 0],
  ];

  it("handles single-point or empty routes", () => {
    expect(routeCost([], symmetricMatrix, false)).toBe(0);
    expect(routeCost([0], symmetricMatrix, false)).toBe(0);
    expect(routeCost([0], symmetricMatrix, true)).toBe(0);
  });

  it("computes open route costs correctly", () => {
    // 0 -> 1 -> 2: 10 + 15 = 25
    expect(routeCost([0, 1, 2], symmetricMatrix, false)).toBe(25);
    // 0 -> 2 -> 1: 20 + 15 = 35
    expect(routeCost([0, 2, 1], symmetricMatrix, false)).toBe(35);
  });

  it("adds the return leg to 0 when returnToStart is true", () => {
    // 0 -> 1 -> 2 -> 0: 10 + 15 + 20 = 45
    expect(routeCost([0, 1, 2], symmetricMatrix, true)).toBe(45);
    // 0 -> 2 -> 1 -> 0: 20 + 15 + 10 = 45
    expect(routeCost([0, 2, 1], symmetricMatrix, true)).toBe(45);
  });

  it("correctly evaluates asymmetric matrices", () => {
    // 0 -> 1 -> 2: distances[0][1] (10) + distances[1][2] (15) = 25
    expect(routeCost([0, 1, 2], asymmetricMatrix, false)).toBe(25);

    // 0 -> 1 -> 2 -> 0: 10 + 15 + distances[2][0] (5) = 30
    expect(routeCost([0, 1, 2], asymmetricMatrix, true)).toBe(30);

    // Reversed order: 0 -> 2 -> 1 -> 0: distances[0][2] (50) + distances[2][1] (40) + distances[1][0] (30) = 120
    expect(routeCost([0, 2, 1], asymmetricMatrix, true)).toBe(120);
  });
});
