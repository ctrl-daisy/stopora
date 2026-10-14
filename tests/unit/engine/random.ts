/**
 * Seeded pseudo-random number generator (Mulberry32) for deterministic tests.
 */
export function createRng(seed: number = 42): () => number {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates an N x N distance matrix with diagonal 0 and positive costs.
 */
export function generateRandomMatrix(
  n: number,
  symmetric: boolean,
  rng: () => number,
  maxCost: number = 1000
): number[][] {
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else if (symmetric) {
        if (i < j) {
          const val = Math.floor(rng() * maxCost) + 10;
          matrix[i][j] = val;
          matrix[j][i] = val;
        }
      } else {
        matrix[i][j] = Math.floor(rng() * maxCost) + 10;
      }
    }
  }

  return matrix;
}
