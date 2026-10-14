/**
 * Calculates the total travel cost for a sequence of points according to a distance matrix.
 *
 * @param order The visiting sequence of point indices (e.g., [0, 2, 1, 3]).
 * @param distances Square distance matrix where distances[from][to] is the travel cost.
 * @param returnToStart Whether to add the closing leg from the last visited stop back to point 0.
 * @returns The total cost of the route.
 */
export function routeCost(
  order: number[],
  distances: number[][],
  returnToStart: boolean
): number {
  if (order.length <= 1) {
    if (order.length === 1 && returnToStart) {
      return distances[order[0]]?.[0] ?? 0;
    }
    return 0;
  }

  let total = 0;
  for (let i = 0; i < order.length - 1; i++) {
    const from = order[i];
    const to = order[i + 1];
    total += distances[from][to];
  }

  if (returnToStart) {
    const last = order[order.length - 1];
    total += distances[last][0];
  }

  return total;
}
