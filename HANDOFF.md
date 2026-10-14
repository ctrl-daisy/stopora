# Stopora Handoff Document

## Current phase
**Phase 1: Foundation (Completed)**

---

## What exists now
- **Next.js 15 Application**: Scaffolded using App Router, TypeScript with strict mode enabled, Tailwind CSS, ESLint, and `@/*` path alias.
- **Project Structure & Placeholders**:
  - `src/types/index.ts`: Shared immutable data contracts with complete JSDoc documentation.
  - `src/lib/engine/`: Directory placeholder for Phase 2 (route optimization algorithms).
  - `src/lib/geo/`: Directory placeholder for Phase 3 (geocoding and distance matrix services).
  - `src/lib/db/`: Directory placeholder for Phase 4 (Prisma client).
  - `src/lib/services/`: Directory placeholder for Phase 4 (business logic).
  - `src/app/api/`: Directory placeholder for Phase 4 (REST API endpoints).
  - `src/components/`: Directory placeholder for Phase 5 (UI components).
  - `tests/unit/`: Vitest configuration and initial unit test (`tests/unit/types.test.ts`).
  - `tests/e2e/`: Playwright configuration (Chromium) and smoke test (`tests/e2e/smoke.spec.ts`).
  - `docs/`: Saved project brief (`docs/PROJECT_BRIEF.md`).
- **Placeholder UI**: Home page at `/` with "Stopora" title, tagline, disabled "Plan a route" button, and metadata title set to "Stopora".
- **Environment & Git Setup**: `.env.example` with required keys, `.env.local` configured in `.gitignore`.
- **CI Pipeline**: `.github/workflows/ci.yml` running lint, typecheck, test, and build with `GEO_PROVIDER=mock`.

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
5. **Run end-to-end smoke test**:
   ```bash
   npm run test:e2e
   ```
6. **Build application bundle**:
   ```bash
   npm run build
   ```
7. **Start local development server**:
   ```bash
   npm run dev
   ```

---

## Contracts the next phases must keep

The shared contracts in `src/types/index.ts` represent the binding agreement across all phases. **These types must NOT change without the whole team agreeing.**

- **`LatLng`**: `{ lat: number; lng: number }` — Represents coordinates on a map.
- **`Stop`**: `{ id: string; label: string; address?: string; lat: number; lng: number; delivered: boolean }` — One delivery stop.
- **`DistanceMatrix`**: `{ distances: number[][]; durations: number[][] }` — Travel costs between every pair of points in metres and durations in seconds. Row `i`, column `j` represents travel from point `i` to point `j`. Point `0` is always the start point.
- **`SolveOptions`**: `{ returnToStart: boolean }` — Controls whether the solved route ends at the last stop or returns to start.
- **`SolveResult`**: `{ order: number[]; cost: number; algorithm: "held-karp" | "nn-2opt" | "trivial" }` — Route engine result. `order` contains matrix indices and always starts with index `0`.
- **`VehicleType`**: `"motorbike" | "car" | "van"` — Vehicle identifier for fuel estimates.
- **`RouteSummary`**: `{ order: number[]; totalDistanceM: number; totalDurationS: number; baselineDistanceM: number; baselineDurationS: number; distanceSavedPct: number; fuelLitres: number; baselineFuelLitres: number; algorithm: SolveResult["algorithm"] }` — Comprehensive route summary metrics comparing optimized route to baseline entered order.
- **`GeocodeResult`**: `{ label: string; lat: number; lng: number }` — Search result for an address query.

Additional contract rules:
- Point 0 is always the starting hub.
- Maximum stops per run is 12 (13 total points including the start point).
- API errors must follow the shape: `{ error: { code: string, message: string } }`.

---

## Notes for Phase 2 and 3

Phases 2 and 3 can be developed in parallel as both depend solely on Phase 1 foundation:

### Notes for Phase 2 (Route Engine):
- Implement route calculation inside `src/lib/engine/`.
- Ensure exact Held-Karp dynamic programming for 3 to 13 points runs in under 200 ms.
- Ensure the Nearest-Neighbour + 2-opt heuristic handles 14 to 51 points.
- The route engine must remain isolated from mapping libraries and HTTP requests; it operates strictly on mathematical cost matrices (`DistanceMatrix`).
- Write unit tests comparing Held-Karp with brute force for smaller sets.

### Notes for Phase 3 (Maps Data):
- Implement geo providers in `src/lib/geo/` conforming to a shared `GeoProvider` interface (`geocode` and `getMatrix`).
- Support OpenRouteService (`orsProvider.ts`) with a 10-minute in-memory cache and a mock provider (`mockProvider.ts`) for deterministic offline development and CI.
- Respect `GEO_PROVIDER` environment variable (`ors` or `mock`).
- Coordinate handling rule: internal application uses `{ lat, lng }`; OpenRouteService uses `[lng, lat]`. The geo layer must handle this conversion internally.
