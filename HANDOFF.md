# Stopora Handoff Document

## Current phase
**Phase 2: Route engine (Completed)**

---

## What exists now
- **Next.js 15 Application**: Scaffolded using App Router, TypeScript with strict mode enabled, Tailwind CSS, ESLint, and `@/*` path alias.
- **Shared Immutable Contracts**:
  - `src/types/index.ts`: Data contracts (`LatLng`, `Stop`, `DistanceMatrix`, `SolveOptions`, `SolveResult`, `VehicleType`, `RouteSummary`, `GeocodeResult`).
- **Route Optimization Engine (`src/lib/engine/`)**:
  - `cost.ts`: `routeCost(order, distances, returnToStart)` computing exact sequence travel costs, adding return leg when `returnToStart` is true.
  - `validate.ts`: `validateMatrix(distances)` ensuring matrices are non-empty, square, $\le 51$ points, non-negative, and free of `NaN` or `Infinity`. Supports asymmetric travel costs.
  - `heldKarp.ts`: Exact bitmask dynamic programming solver using typed arrays (`Float64Array`, `Int8Array`) for open routes and round trips. Runs 13 points in ~10 ms (well under the 200 ms requirement).
  - `heuristic.ts`: Nearest-Neighbour construction + 2-opt local search keeping point 0 anchored, re-evaluating candidate moves with `routeCost` to handle asymmetric roads. Caps at 2,000 iterations.
  - `index.ts`: `solveRoute(distances, options)` dispatcher selecting `"trivial"` for 1–2 points, `"held-karp"` for 3–13 points, and `"nn-2opt"` for 14–51 points. Re-exports `routeCost`.
- **Benchmark Suite & Documentation**:
  - `scripts/benchmark-engine.ts` with npm script `npm run bench:engine`.
  - `docs/engine-benchmark.md`: Benchmark results over 100 random sets of 8 stops across the Lagos bounding box.
  - `docs/ALGORITHM.md`: Comprehensive defense preparation study guide detailing TSP combinatorial explosion, Held-Karp step-by-step worked example, memory/time complexities, 2-opt ASCII diagram, and road asymmetry.
- **Unit & End-to-End Tests**:
  - `tests/unit/types.test.ts`: Contract verification.
  - `tests/unit/engine/validate.test.ts`: Error handling for empty, non-square, oversize, negative, NaN, and Infinity matrices.
  - `tests/unit/engine/cost.test.ts`: Open route, round trip, and asymmetric matrix calculations.
  - `tests/unit/engine/heldKarp.test.ts`: Verification against brute-force across 200 random matrices, 5-point obvious route check, and 13-point < 200 ms timing test.
  - `tests/unit/engine/heuristic.test.ts`: Monotonic improvement guarantee over nearest-neighbour on 25 points.
  - `tests/unit/engine/solveRoute.test.ts`: Dispatching logic, algorithm labels, and validation.
  - `tests/e2e/smoke.spec.ts`: Playwright smoke test.
- **Placeholders for Next Phases**:
  - `src/lib/geo/`: Geo layer (Phase 3).
  - `src/lib/db/`: Prisma client (Phase 4).
  - `src/lib/services/`: Route summary & dispatch service (Phase 4).
  - `src/app/api/`: REST API endpoints (Phase 4).
  - `src/components/`: Dispatcher UI components (Phase 5).

---

## Engine API & Usage Example

The route engine is pure TypeScript with no network, database, or UI dependencies.

```ts
import { solveRoute, routeCost } from "@/lib/engine";

// 4 points: index 0 is the start point; indices 1, 2, 3 are delivery stops
const distances = [
  [0, 10, 15, 20],
  [10, 0, 35, 25],
  [15, 35, 0, 30],
  [20, 25, 30, 0],
];

// Optimize for round trip (return to start point 0)
const roundTripResult = solveRoute(distances, { returnToStart: true });
console.log(roundTripResult);
// Output:
// {
//   order: [0, 1, 3, 2],
//   cost: 80,
//   algorithm: "held-karp"
// }

// Optimize for open route (end at final stop)
const openRouteResult = solveRoute(distances, { returnToStart: false });
console.log(openRouteResult);
// Output:
// {
//   order: [0, 2, 3, 1],
//   cost: 70,
//   algorithm: "held-karp"
// }

// Calculate cost of any arbitrary sequence
const manualCost = routeCost([0, 2, 1, 3], distances, false);
console.log(manualCost); // 75
```

---

## Benchmark Results (Lagos Bounding Box)

Run via `npm run bench:engine` (100 sets of 8 stops inside Lagos `lat: 6.40–6.70`, `lng: 3.20–3.60` with road network factor 1.3):

| Route Type | Average Saved vs Entered Order | Best Saved | Worst Saved |
| :--- | :--- | :--- | :--- |
| **Round Trip** (`returnToStart: true`) | **36.20%** | **54.53%** | **11.07%** |
| **Open Route** (`returnToStart: false`) | **42.99%** | **63.27%** | **16.71%** |

On average, Stopora reduces travel distance by **~36% to 43%** compared with raw entered dispatcher order.

---

## Important Note for Phase 4 (Services & API)

> [!IMPORTANT]
> `solveRoute(distances, options)` strictly assumes and requires that **index `0` represents the starting point (hub)**.
> All indices returned in `result.order` map directly to the rows and columns of the input distance matrix and always start with `0`.
> When constructing the matrix in Phase 4 services, ensure the start coordinates are mapped to row/col 0, and delivery stops are mapped to rows/cols 1 through $N-1$.

---

## How to run

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Run lint check**:
   ```bash
   npm run lint
   ```
3. **Run TypeScript check**:
   ```bash
   npm run typecheck
   ```
4. **Run unit tests**:
   ```bash
   npm test
   ```
5. **Run engine benchmark**:
   ```bash
   npm run bench:engine
   ```
6. **Run end-to-end smoke test**:
   ```bash
   npm run test:e2e
   ```
7. **Build application bundle**:
   ```bash
   npm run build
   ```
