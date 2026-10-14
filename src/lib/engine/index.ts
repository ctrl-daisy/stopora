import type { SolveOptions, SolveResult } from "@/types";
import { routeCost } from "./cost";
import { heldKarp } from "./heldKarp";
import { heuristic } from "./heuristic";
import { validateMatrix } from "./validate";

/**
 * Solves the routing optimization problem for a given distance matrix.
 *
 * Engine selection strategy:
 * - 1 point: returns [0], cost 0, algorithm "trivial"
 * - 2 points: returns [0, 1], cost calculated, algorithm "trivial"
 * - 3 to 13 points: exact Held-Karp dynamic programming, algorithm "held-karp"
 * - 14 to 51 points: Nearest-Neighbour + 2-opt heuristic, algorithm "nn-2opt"
 *
 * @param distances N x N distance matrix where distances[i][j] is travel cost from i to j.
 * @param options Routing options such as returnToStart.
 * @returns SolveResult containing optimal/heuristic order, cost, and algorithm used.
 */
export function solveRoute(
  distances: number[][],
  options: SolveOptions
): SolveResult {
  validateMatrix(distances);

  const n = distances.length;
  const { returnToStart } = options;

  if (n === 1) {
    return {
      order: [0],
      cost: 0,
      algorithm: "trivial",
    };
  }

  if (n === 2) {
    const order = [0, 1];
    return {
      order,
      cost: routeCost(order, distances, returnToStart),
      algorithm: "trivial",
    };
  }

  if (n <= 13) {
    const result = heldKarp(distances, returnToStart);
    return {
      order: result.order,
      cost: result.cost,
      algorithm: "held-karp",
    };
  }

  const result = heuristic(distances, returnToStart);
  return {
    order: result.order,
    cost: result.cost,
    algorithm: "nn-2opt",
  };
}

export { routeCost } from "./cost";
export { validateMatrix } from "./validate";
export { heldKarp } from "./heldKarp";
export { heuristic } from "./heuristic";
