# Stopora Handoff Document

## Current phase
**Phase 4 done: Neon verified; environment repaired; GEO_PROVIDER=mock**

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

## Phase 3: Maps data (done)

**Files:** `src/lib/geo/` (haversine, provider, mockProvider, orsProvider, index)

**Two providers, one switch.** `GEO_PROVIDER=ors` uses OpenRouteService (needs `ORS_API_KEY`). Anything else uses the mock: 15 fixed Lagos places, straight-line distance times 1.3, and 20 km/h average speed. CI and teammates without a key use the mock.

**Usage (server-side only, never import from a client component):**
```ts
import { geocode, getMatrix } from "@/lib/geo";

const places = await geocode("Yaba");           // GeocodeResult[]
const matrix = await getMatrix([start, ...stops]); // DistanceMatrix
```

**Phase 4 warning:** in the points list passed to `getMatrix`, index 0 must be the start point. The engine assumes row 0 is the start. Distances are in metres, durations in seconds.

**Notes:** results are cached in memory for 10 minutes. ORS expects [longitude, latitude], and our code converts from `LatLng` in one place (`orsProvider.ts`). Check the real API by hand with `npm run try:geo`.
## Phase 4: Database and API

Implemented Prisma PostgreSQL models and initial migration, a shared Prisma client,
transactional run service, validation, API routes, demo seed, summary/fuel functions,
and tests. Shared types, engine, and geo modules were not changed.
Work started at the user's explicit instruction while `phase-3-done` was absent;
the Phase 3 geo implementation was present in the checkout.

### Setup

Use Node **22.12+** (the existing Vitest version requires it). Copy `.env.example`
to `.env.local`, set `DATABASE_URL` privately to the Neon Postgres connection string
(with SSL settings supplied by Neon). Set `GEO_PROVIDER=mock` for deterministic
local demos, or `ors` with a private `ORS_API_KEY`. Never commit credentials.
The database scripts load `.env.local` automatically; exported environment values
have precedence. Next.js loads `.env.local` itself.

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

`db:migrate` applies committed migrations with `prisma migrate deploy`; no schema
reset. `db:studio` opens Prisma Studio. `postinstall` generates the Prisma client.
The seed creates a new eight-stop "Lekki morning run" each time and prints its ID;
it does not delete existing runs. Coordinates come from the mock provider's place
list; stops deliberately alternate across Lagos to demonstrate savings.

Fuel consumption values are **assumptions**: motorbike 0.03, car 0.09, van 0.12
litres/km. They are not fleet measurements and should be defended as estimates
or adjusted after collecting real usage data.

### API curl flow

See `docs/API.md` for response contracts and errors. Replace RUN_ID and STOP_ID
with IDs returned by create/add. Base URL defaults to localhost:3000.

```bash
curl -sS 'http://localhost:3000/api/geocode?q=Lekki'
curl -sS -X POST http://localhost:3000/api/runs -H 'Content-Type: application/json' -d '{"name":"Morning run","vehicleType":"motorbike","returnToStart":false,"start":{"label":"Lekki Phase 1","lat":6.4474,"lng":3.47}}'
curl -sS http://localhost:3000/api/runs
curl -sS -X POST http://localhost:3000/api/runs/RUN_ID/stops -H 'Content-Type: application/json' -d '{"label":"Yaba","lat":6.5095,"lng":3.3711}'
curl -sS -X POST http://localhost:3000/api/runs/RUN_ID/optimize
curl -sS http://localhost:3000/api/runs/RUN_ID
curl -sS -X PATCH http://localhost:3000/api/runs/RUN_ID/stops/STOP_ID -H 'Content-Type: application/json' -d '{"delivered":true}'
curl -i -X DELETE http://localhost:3000/api/runs/RUN_ID/stops/STOP_ID
```

### Phase 5 integration

1. Search `/api/geocode?q=...` after at least 3 characters, select the start.
2. POST `/api/runs` with name, vehicle, return option, start; keep returned ID.
3. Search locations and POST stops individually; allow up to 12. DELETE removes
   stops. Both additions and removals clear optimization; refresh run afterwards.
4. POST optimize; display returned summary. GET run again for stops in route order.
   Use `[start, ...orderedStops]` to draw the route, and append start for a round trip.
5. PATCH delivered for each stop, then GET run to refresh status (all delivered
   becomes completed). GET runs loads the latest 20 trips for the history view.

All errors have `{error:{code,message}}`. Handle 400 input/empty-run/stop-limit,
422 coordinates, 404 missing resources, and 500 provider/database failure.
No user authentication or dispatcher isolation is included in Phase 4.

### Verification

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
The integration test `tests/unit/api/runs.test.ts` skips with a clear message when
`TEST_DATABASE_URL` is absent. To run it, supply a **separate disposable migrated
Postgres database**; it creates its own run and deletes only that run afterwards:

```bash
DATABASE_URL="$TEST_DATABASE_URL" npm run db:migrate
GEO_PROVIDER=mock npm test
```

The test exercises route handlers through create, five stop additions, optimize,
delivery, fetch, and removal/invalidation. TEST_DATABASE_URL must be exported for
the test process; npm test does not automatically load `.env.local`.


### Phase 4 verified results

- Initial migration applied successfully to temporary PostgreSQL 16.
- `npm run db:seed` succeeded; live curl create/add/optimize/get succeeded.
- Lint, typecheck, production build passed using Node 22.
- All 74 tests passed with TEST_DATABASE_URL, including concurrent stop additions.
- Neon migration and seed now passed. Live curl create/add/optimize/get/deliver/delete passed against Neon with a temporary mock geo override.
- Current checks: lint, typecheck, build passed; 72 tests passed, 2 database tests skipped because TEST_DATABASE_URL is unset.
- Configured ORS key returns HTTP 403 for both geocoding and matrix requests. Replace/check ORS_API_KEY before using real road routing. `.env.local` remains set to `GEO_PROVIDER=ors`; it was not changed for testing.

The seeded run with GEO_PROVIDER=mock returned this real HTTP optimize response
on the local test database (mock estimates, not actual road routing):

```json
{
  "order": [
    0,
    6,
    2,
    4,
    8,
    7,
    5,
    1,
    3
  ],
  "totalDistanceM": 81643.66061908338,
  "totalDurationS": 14695.85891143501,
  "baselineDistanceM": 199936.93078657167,
  "baselineDurationS": 35988.6475415829,
  "distanceSavedPct": 59.2,
  "fuelLitres": 2.4493098185725017,
  "baselineFuelLitres": 5.99810792359715,
  "algorithm": "held-karp"
}
```

Lint now uses ESLint directly because `next lint` is unavailable in this installed
Next CLI; generated build files are excluded. No engine/geo/type changes were needed.


### Neon verification follow-up

The eight-stop demo was seeded on Neon with ID `cmv9m18xc00006ivpio93d0i8`.
Its persisted optimization was verified with a temporary server environment override
`GEO_PROVIDER=mock`, because the configured OpenRouteService key was rejected.
The response matches the mock summary above: 199936.93 m baseline, 81643.66 m
optimized, 59.2% estimated saving. This does not verify real road routing.
The Next.js server must be restarted after updating the private ORS_API_KEY.
No secrets were added to tracked files. Shared types, engine, and geo are unchanged.


## Environment setup

- Copy .env.example to BOTH .env and .env.local, then fill in the values.
- IMPORTANT: Prisma needs .env, not just .env.local. Prisma CLI commands (migrate, generate, seed, studio) only read .env. Next.js reads .env.local. Keep both files identical.
- Neon connection strings must include sslmode=require. Use the direct connection (no "-pooler" in the host) for migrations.
- The Neon project is in AWS Europe Central 1 (Frankfurt). On Vercel, set the function region to fra1.
- GEO_PROVIDER="mock" works without an ORS key. Use "ors" for real road data.
- Never commit .env or .env.local. Share secrets privately, never in the group chat.

## Environment repair verification

The bare Prisma CLI automatically loads `.env`; the existing npm database wrappers
explicitly load `.env.local`. Both private files now contain identical values,
so either invocation uses the same database. Next.js confirmed loading both files
in the production build. `.env.example` contains empty values only, and `.gitignore`
explicitly excludes both private files. The supplied ORS key was empty, so the
current provider is mock; earlier ORS-key failure notes above are historical.

Commands and results:

- `npx prisma generate`: succeeded; environment loaded from `.env`.
- `npx prisma migrate dev --name init`: succeeded, already in sync; the existing
  initial migration was previously applied, so no duplicate migration was created.
- `npm run db:seed`: succeeded.
- Prisma query verified seed `cmv9mf71400006il3i0lm56uk`, "Lekki morning run", 8 stops.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: passed, 72 tests; 2 integration tests skipped because TEST_DATABASE_URL
  is unset. The application database was not reused as the test database.
- `npm run build`: passed; Next.js loaded `.env.local` and `.env`.

The connection retained both `sslmode=require` and `channel_binding=require`;
no compatibility workaround or database reset was needed. No shared types,
engine, or geo modules were changed. This commit includes only the environment
template, ignore rules, Prisma files, and handoff; the other Phase 4 implementation
files remain uncommitted per the requested commit scope. Nothing was pushed.
