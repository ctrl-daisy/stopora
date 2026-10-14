import { routeCost } from "./cost";

export interface HeldKarpResult {
  order: number[];
  cost: number;
}

/**
 * Exact Travelling Salesperson Problem (TSP) solver using the Held-Karp
 * dynamic programming algorithm with bitmask state representation.
 *
 * Characteristics:
 * - Point 0 is the fixed start point.
 * - Supports open routes (end at last stop) and round trips (return to point 0).
 * - Correctly handles asymmetric distance matrices.
 * - Uses flat typed arrays (Float64Array and Int8Array) for high cache locality and speed.
 *
 * Time Complexity: O(n^2 * 2^n)
 * Space Complexity: O(n * 2^n)
 *
 * @param distances N x N distance matrix.
 * @param returnToStart Whether the route returns to start point 0.
 * @returns Optimal visiting order and its total cost.
 */
export function heldKarp(
  distances: number[][],
  returnToStart: boolean
): HeldKarpResult {
  const n = distances.length;

  if (n === 0) {
    return { order: [], cost: 0 };
  }
  if (n === 1) {
    return { order: [0], cost: 0 };
  }
  if (n === 2) {
    const order = [0, 1];
    return { order, cost: routeCost(order, distances, returnToStart) };
  }

  const numStates = 1 << n;
  // dp[mask * n + u] is the minimum cost to visit the subset of vertices
  // in 'mask' starting at 0 and ending at vertex 'u'.
  const dp = new Float64Array(numStates * n);
  dp.fill(Infinity);

  // parent[mask * n + u] stores the predecessor of vertex 'u' that yielded the minimum cost
  const parent = new Int8Array(numStates * n);
  parent.fill(-1);

  // Base state: mask = 1 (binary ...0001, only vertex 0 visited), ending at vertex 0
  dp[1 * n + 0] = 0;

  // We iterate through all masks where vertex 0 is visited (bit 0 is 1).
  // Because mask is strictly increasing and (mask ^ (1 << u)) < mask for u > 0,
  // all required subproblems are guaranteed to be resolved before they are read.
  for (let mask = 1; mask < numStates; mask += 2) {
    if (mask === 1) continue;

    for (let u = 1; u < n; u++) {
      if ((mask & (1 << u)) === 0) continue;

      const prevMask = mask ^ (1 << u);
      const prevMaskOffset = prevMask * n;
      const uOffset = mask * n + u;

      let minCost = Infinity;
      let bestPrev = -1;

      for (let v = 0; v < n; v++) {
        if ((prevMask & (1 << v)) === 0) continue;

        const prevCost = dp[prevMaskOffset + v];
        if (prevCost === Infinity) continue;

        const candidateCost = prevCost + distances[v][u];
        if (candidateCost < minCost) {
          minCost = candidateCost;
          bestPrev = v;
        }
      }

      dp[uOffset] = minCost;
      parent[uOffset] = bestPrev;
    }
  }

  // Full mask: all vertices 0 to n - 1 are visited
  const fullMask = numStates - 1;
  const fullMaskOffset = fullMask * n;

  let bestCost = Infinity;
  let bestLastVertex = -1;

  for (let u = 1; u < n; u++) {
    const costToU = dp[fullMaskOffset + u];
    if (costToU === Infinity) continue;

    const totalCost = returnToStart ? costToU + distances[u][0] : costToU;
    if (totalCost < bestCost) {
      bestCost = totalCost;
      bestLastVertex = u;
    }
  }

  if (bestLastVertex === -1) {
    throw new Error("Unable to find a valid route in Held-Karp solver.");
  }

  // Reconstruct optimal path from parent pointers
  const order = new Array<number>(n);
  let curr = bestLastVertex;
  let currMask = fullMask;

  for (let step = n - 1; step >= 1; step--) {
    order[step] = curr;
    const p = parent[currMask * n + curr];
    currMask = currMask ^ (1 << curr);
    curr = p;
  }
  order[0] = 0;

  return {
    order,
    cost: routeCost(order, distances, returnToStart),
  };
}
