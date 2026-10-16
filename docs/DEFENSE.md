# Stopora Technical Defense Guide

> The comprehensive study guide for the whole team to master and defend every architectural decision, algorithmic choice, and implementation detail of Stopora.

---

## 1. The Problem and Who It Is For

A dispatch manager in Lagos with up to 12 delivery stops typically dispatches orders in the naive sequence they arrived, wasting scarce fuel and hours sitting in traffic bottlenecks. Stopora solves this by finding the optimal visiting sequence in milliseconds on a smartphone, cutting road distance by nearly 40% and saving thousands of Naira in fuel per run.

---

## 2. System Architecture

```text
[ Dispatcher Smartphone Browser ]
             │
             ▼
   Next.js 15 App Router
   ├─ UI Pages:  src/app/ (/, /plan, /runs, /runs/[id])
   └─ REST APIs: src/app/api/ (* /geocode, /runs, /runs/[id]/optimize)
             │
             ▼
   Service Orchestration (src/lib/services/)
   ├─ runService.ts (Transactional Run & Stop Lifecycle)
   └─ routeSummary.ts (Distance, Duration, Fuel & Naira Aggregator)
        │                 │                    │
        ▼                 ▼                    ▼
   Database Layer   Geo Provider Layer   Route Engine
   (src/lib/db/)     (src/lib/geo/)       (src/lib/engine/)
        │                 │                    │
        ▼                 ▼                    ▼
   [ PostgreSQL ]    [ OpenRouteService ] [ Bellman-Held-Karp ]
     (Neon DB)         (or Mock Lagos)      (Bitmask DP / 2-Opt)
```

---

## 3. Phase Breakdown & Panel Defense Questions

---

### Phase 1: Foundation
- **Who Built It**: Team Member 1 (Foundation Engineer)
- **What It Does**: Established Next.js 15 with App Router, TypeScript strict mode, Tailwind CSS design system, GitHub Actions CI pipeline, and immutable shared data contracts (`src/types/index.ts`).
- **Key Files**:
  - `src/types/index.ts`
  - `src/app/globals.css`
  - `.github/workflows/ci.yml`
  - `tsconfig.json`

#### Three Hardest Panel Questions:
1. **Q: Why lock shared types in `src/types/index.ts` so strictly across the entire project?**  
   *Answer*: In a team setting where six engineers work sequentially across different layers, shared contracts prevent breaking changes, API mismatches, and cascading refactors. Any contract change requires whole-team consensus.
2. **Q: Why did you enforce TypeScript strict mode with no `any` allowed?**  
   *Answer*: Strict null checks and type narrowing prevent runtime exceptions (`TypeError: undefined is not a function`) on critical algorithmic and geocoding matrix manipulation where coordinates or matrix rows could otherwise be undefined.
3. **Q: Why choose Next.js 15 App Router rather than a separate Express backend and Vite frontend?**  
   *Answer*: A unified Next.js App Router project eliminates CORS configuration, shares TypeScript interfaces directly between server routes and client components, minimizes deployment complexity to a single Vercel service, and enables server-side rendering with streaming.

---

### Phase 2: Route Optimization Engine
- **Who Built It**: Team Member 2 (Algorithm Engineer)
- **What It Does**: Solves the Travelling Salesperson Problem (TSP) with exact optimal bitmask dynamic programming (Held-Karp) for 1–13 points in < 10 ms, and Nearest-Neighbour + 2-opt local search for 14–51 points. Correctly supports asymmetric road travel.
- **Key Files**:
  - `src/lib/engine/heldKarp.ts`
  - `src/lib/engine/heuristic.ts`
  - `src/lib/engine/cost.ts`
  - `src/lib/engine/validate.ts`
  - `docs/ALGORITHM.md`

#### Three Hardest Panel Questions:
1. **Q: Why can't you just use brute force ($O(n!)$) for 12 delivery stops?**  
   *Answer*: Twelve stops create $12! = 479,001,600$ permutations. Even at 1,000,000 evaluations per second, brute force takes ~8 minutes of 100% CPU lockup, freezing the server and draining mobile batteries. Held-Karp solves 12 stops in ~10 milliseconds ($O(n^2 2^n)$).
2. **Q: How does your engine handle asymmetric matrices where travel from $A \to B \ne B \to A$?**  
   *Answer*: In Lagos, one-way streets and divided expressways make distances directed. Our Held-Karp implementation uses directed transitions `cost[u][v]` without assuming symmetry, and our 2-opt local search re-evaluates complete path costs using `routeCost()` rather than relying on symmetric 2-opt delta swaps.
3. **Q: What is the space complexity of your Held-Karp solver, and why use typed arrays?**  
   *Answer*: Space complexity is $O(n 2^n)$. For 13 points, $13 \times 8192 \approx 106,496$ entries. Using flat `Float64Array` and `Int8Array` instead of nested JavaScript objects or Maps eliminates garbage collection overhead and provides contiguous memory cache locality.

---

### Phase 3: Maps Data Layer
- **Who Built It**: Team Member 3 (Geo & Maps Engineer)
- **What It Does**: Provides geocoding and road distance/duration matrices with an interchangeable provider interface. Features an offline mock provider (15 Lagos points with 1.3 road factor) and a production OpenRouteService provider.
- **Key Files**:
  - `src/lib/geo/provider.ts`
  - `src/lib/geo/mockProvider.ts`
  - `src/lib/geo/orsProvider.ts`
  - `src/lib/geo/haversine.ts`
  - `src/lib/geo/index.ts`

#### Three Hardest Panel Questions:
1. **Q: Why provide both a mock provider and an OpenRouteService provider?**  
   *Answer*: The mock provider allows CI pipelines, local development, unit testing, and teammates without private API keys to test the entire application reliably with zero external network dependencies, rate limits, or costs.
2. **Q: How do you handle cases where OpenRouteService reports that a point is unreachable by road?**  
   *Answer*: When ORS returns `null` for a matrix cell (e.g. an address placed on water or an isolated compound), `orsProvider` identifies the exact disconnected stop and throws a descriptive error (`"stop X cannot be reached by road."`), which our API maps to HTTP 422 `UNREACHABLE_STOP`.
3. **Q: Why do you calculate both distance in metres and duration in seconds?**  
   *Answer*: Distance directly governs fuel consumption and vehicle wear-and-tear, while travel duration determines delivery feasibility and gives riders realistic expectations in congested Lagos corridors.

---

### Phase 4: Database & REST API
- **Who Built It**: Team Member 4 (Backend & Database Engineer)
- **What It Does**: Implemented Prisma ORM with PostgreSQL (hosted on Neon DB in Frankfurt), designed serialized transactions with row-level locks, built 8 REST API routes under `/api/*`, and handled optimistic delivery toggling.
- **Key Files**:
  - `prisma/schema.prisma`
  - `src/lib/services/runService.ts`
  - `src/lib/services/routeSummary.ts`
  - `src/lib/api/errors.ts`
  - `src/app/api/runs/route.ts`
  - `src/app/api/runs/[id]/optimize/route.ts`

#### Three Hardest Panel Questions:
1. **Q: How do you prevent race conditions when two requests add stops to the same run simultaneously?**  
   *Answer*: `runService` uses interactive transactions with row-level locking (`SELECT id FROM "Run" WHERE id = $id FOR UPDATE`). This serializes concurrent writes, prevents exceeding the 12-stop limit, and guarantees index consistency.
2. **Q: Why does adding or removing a stop reset the run status to `draft` and clear existing optimizations?**  
   *Answer*: Route optimization is valid only for the exact set of stops evaluated. Adding or removing a stop invalidates the visiting sequence and savings calculations, necessitating re-optimization.
3. **Q: How does your error handling prevent leaking database credentials or internal stack traces?**  
   *Answer*: `src/lib/api/errors.ts` catches all errors in a centralized `handle()` wrapper. Prisma initialization errors and unknown exceptions return generic, user-friendly JSON (`DATABASE_UNAVAILABLE` or `INTERNAL_ERROR`), keeping connection strings and stack traces strictly server-side.

---

### Phase 5: Dispatcher Mobile Website
- **Who Built It**: Team Member 5 (Frontend Engineer)
- **What It Does**: Created a mobile-first web app tailored for dispatchers and riders glancing at phones in traffic. Features Leaflet maps (`ssr: false`), debounced search, numbered markers, single-leg Google Maps navigation links, and delivery checkboxes.
- **Key Files**:
  - `src/components/PlannerClient.tsx`
  - `src/components/PlannerMap.tsx`
  - `src/components/AddressSearch.tsx`
  - `src/components/SummaryCards.tsx`
  - `src/components/StopList.tsx`
  - `src/lib/mapsLinks.ts`

#### Three Hardest Panel Questions:
1. **Q: Why must Leaflet be dynamically imported with `ssr: false`?**  
   *Answer*: Leaflet directly accesses browser window globals (`window`, `document`, `navigator`). During Next.js server-side rendering, `window` does not exist; dynamic import with `ssr: false` ensures Leaflet only executes in the client browser.
2. **Q: How do you handle Google Maps URL waypoints when a run has 12 stops?**  
   *Answer*: Google Maps URL Scheme has an undocumented limit of 9 intermediate waypoints. `mapsLinks.ts` automatically splits routes with $> 9$ waypoints into Part 1 and Part 2 navigation links, guaranteeing navigation never fails.
3. **Q: Why use large tap targets ($\ge 44\text{px}$) and high contrast?**  
   *Answer*: Delivery riders operate in bright Nigerian sunlight with glare and vibrations while mounted on motorbikes. Small 24px buttons cause missed taps and dangerous distractions; 44px+ tap targets ensure one-touch accuracy.

---

### Phase 6: Integration, Testing & Deployment
- **Who Built It**: Team Member 6 (Lead Integration & QA Engineer)
- **What It Does**: Executed full system audit, added sliding-window rate limiting and security headers, configured Playwright E2E suites with GitHub Actions Postgres service container, ran empirical benchmark on 20 Lagos runs, and deployed to Vercel.
- **Key Files**:
  - `docs/AUDIT.md`
  - `docs/RESULTS.md`
  - `docs/DEFENSE.md`
  - `tests/e2e/dispatcher.spec.ts`
  - `.github/workflows/ci.yml`
  - `src/lib/rateLimit.ts`

#### Three Hardest Panel Questions:
1. **Q: How do you protect internal geocoding and optimization routes from DDoS and brute force?**  
   *Answer*: We implemented an in-memory sliding-window rate limiter in `src/lib/rateLimit.ts` that enforces a limit of 30 requests per minute per IP on `/api/geocode` and `/api/runs/[id]/optimize`, returning standard HTTP 429 with `Retry-After` headers.
2. **Q: Why run Playwright E2E tests against a real Postgres container in GitHub Actions instead of mocking Prisma?**  
   *Answer*: Mocking the database hides schema drift, transaction timeouts, concurrency locks, and migration syntax errors. Testing against a real PostgreSQL 16 container guarantees production fidelity.
3. **Q: How did you verify that API keys and database secrets never leak into client bundles?**  
   *Answer*: We searched all compiled JavaScript chunks in `.next/static/` using ripgrep for `ORS_API_KEY`, `DATABASE_URL`, and database host patterns. Next.js only exposes variables prefixed with `NEXT_PUBLIC_` to the client, ensuring server credentials remain completely secret.

---

## 4. Empirical Benchmark Numbers (From `docs/RESULTS.md`)

Across 20 realistic Lagos delivery runs ranging from 6 to 10 stops:

| Metric | Baseline (Entered Order) | Stopora Optimized Route | Savings Achieved |
| :--- | :--- | :--- | :--- |
| **Average Total Distance** | **174.3 km** | **104.5 km** | **69.9 km (39.1% saved)** |
| **Average Fuel Consumption** | — | — | **4.90 Litres saved** |
| **Average Naira Saved** | — | — | **₦6,635 saved per run** |

At a prevailing fuel price of **₦1,355 per litre**, a dispatcher conducting 3 delivery runs a day saves **₦19,905 daily**, adding over **₦500,000 monthly** directly back to courier business profitability.

---

## 5. Known Limitations & Honest Next Steps

During the defense, be transparent about what Stopora intentionally does *not* do in MVP scope:

1. **No Live Traffic Adjustments**:
   - *Current*: Distances and times use static road networks and average historical speeds.
   - *Next Step*: Integrate live traffic feeds (such as ORS live incidents or Google Traffic API) to dynamically reroute during severe traffic spikes.
2. **No Delivery Time Windows**:
   - *Current*: Pure TSP prioritizing total distance; does not accommodate constraints like "deliver to Lekki before 11:00 AM".
   - *Next Step*: Upgrade the engine to TSP with Time Windows (TSPTW) using branch-and-bound.
3. **One Rider per Run**:
   - *Current*: Optimizes a single sequence for one vehicle.
   - *Next Step*: Expand to Vehicle Routing Problem (VRP) to partition 50 stops across 4 riders simultaneously.
4. **Map Polyline Displays Sequence, Not Exact Road Geometry**:
   - *Current*: The map draws a clean polyline connecting stops in visiting order; turn-by-turn geometry is delegated to Google Maps via the **Navigate** button.
   - *Next Step*: Fetch and render full GeoJSON road geometry polylines from OpenRouteService directly on Leaflet.
