import { routeCost } from "@/lib/engine/cost";

export interface BruteForceResult {
  order: number[];
  cost: number;
}

/**
 * Brute-force TSP solver that evaluates all (N-1)! permutations
 * fixing point 0 as the starting point.
 */
export function bruteForce(
  distances: number[][],
  returnToStart: boolean
): BruteForceResult {
  const n = distances.length;
  if (n === 0) return { order: [], cost: 0 };
  if (n === 1) return { order: [0], cost: 0 };

  const stops: number[] = [];
  for (let i = 1; i < n; i++) {
    stops.push(i);
  }

  let bestCost = Infinity;
  let bestOrder: number[] = [];

  function permute(current: number[], remaining: number[]) {
    if (remaining.length === 0) {
      const cost = routeCost(current, distances, returnToStart);
      if (cost < bestCost) {
        bestCost = cost;
        bestOrder = [...current];
      }
      return;
    }

    for (let i = 0; i < remaining.length; i++) {
      const nextRemaining = remaining.slice(0, i).concat(remaining.slice(i + 1));
      current.push(remaining[i]);
      permute(current, nextRemaining);
      current.pop();
    }
  }

  permute([0], stops);

  return {
    order: bestOrder,
    cost: bestCost,
  };
}
