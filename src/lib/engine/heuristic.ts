import { routeCost } from "./cost";

export interface HeuristicResult {
  order: number[];
  cost: number;
}

/**
 * Reverses a subsegment of an array between indices i and j (inclusive).
 */
function reverseSegment(arr: number[], i: number, j: number): number[] {
  const result = arr.slice();
  let left = i;
  let right = j;
  while (left < right) {
    const tmp = result[left];
    result[left] = result[right];
    result[right] = tmp;
    left++;
    right--;
  }
  return result;
}

/**
 * Heuristic route optimizer for larger inputs (14 to 51 points).
 *
 * Process:
 * 1. Nearest-neighbour construction starting at point 0.
 * 2. 2-opt local search improvement that never moves point 0.
 *    Because the distance matrix can be asymmetric, candidate costs
 *    are evaluated using routeCost rather than the symmetric shortcut.
 * 3. Stops when no improving move exists or when 2,000 iterations are reached.
 *
 * @param distances N x N distance matrix.
 * @param returnToStart Whether the route returns to start point 0.
 * @returns Best visiting order found and its total cost.
 */
export function heuristic(
  distances: number[][],
  returnToStart: boolean
): HeuristicResult {
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

  // 1. Nearest-neighbour construction from point 0
  const visited = new Uint8Array(n);
  visited[0] = 1;
  const initialOrder: number[] = [0];

  for (let step = 1; step < n; step++) {
    const last = initialOrder[initialOrder.length - 1];
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

    if (nearest === -1) {
      throw new Error("Unable to build nearest-neighbour route.");
    }

    visited[nearest] = 1;
    initialOrder.push(nearest);
  }

  let currentOrder = initialOrder;
  let currentCost = routeCost(currentOrder, distances, returnToStart);

  // 2. 2-opt improvement that never moves point 0 (i starts at 1)
  let iterations = 0;
  const MAX_ITERATIONS = 2000;

  while (iterations < MAX_ITERATIONS) {
    let bestCandidate: number[] | null = null;
    let bestCost = currentCost;

    for (let i = 1; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const candidate = reverseSegment(currentOrder, i, j);
        const cost = routeCost(candidate, distances, returnToStart);

        if (cost < bestCost - 1e-9) {
          bestCost = cost;
          bestCandidate = candidate;
        }
      }
    }

    if (!bestCandidate) {
      // No improving move exists
      break;
    }

    currentOrder = bestCandidate;
    currentCost = bestCost;
    iterations++;
  }

  return {
    order: currentOrder,
    cost: currentCost,
  };
}
