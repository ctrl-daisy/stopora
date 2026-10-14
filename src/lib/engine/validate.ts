/**
 * Validates that a distance matrix meets the engine's requirements.
 *
 * Requirements:
 * - Non-empty
 * - Square (N x N)
 * - Maximum of 51 points
 * - All entries are valid finite non-negative numbers (no negatives, NaN, or Infinity)
 *
 * Note: The matrix can be asymmetric because real road networks may have different
 * travel costs in opposite directions (e.g., one-way streets, divided highways).
 *
 * @param distances Matrix of travel costs between points.
 * @throws Error if any validation check fails.
 */
export function validateMatrix(distances: number[][]): void {
  if (!distances || !Array.isArray(distances) || distances.length === 0) {
    throw new Error("Distance matrix cannot be empty.");
  }

  const n = distances.length;

  if (n > 51) {
    throw new Error(
      `Distance matrix cannot exceed 51 points (received ${n} points).`
    );
  }

  for (let i = 0; i < n; i++) {
    const row = distances[i];
    if (!Array.isArray(row) || row.length !== n) {
      throw new Error(
        `Distance matrix must be square (expected ${n}x${n}, but row ${i} has length ${row ? row.length : "undefined"}).`
      );
    }

    for (let j = 0; j < n; j++) {
      const val = row[j];
      if (typeof val !== "number" || Number.isNaN(val)) {
        throw new Error(
          `Distance matrix contains NaN at row ${i}, column ${j}.`
        );
      }
      if (!Number.isFinite(val)) {
        throw new Error(
          `Distance matrix contains Infinity at row ${i}, column ${j}.`
        );
      }
      if (val < 0) {
        throw new Error(
          `Distance matrix contains negative distance (${val}) at row ${i}, column ${j}.`
        );
      }
    }
  }
}
