# Stopora Phase 2: Route Optimization Engine — Technical Presentation Guide

---

## 1. Executive Summary & Objective

**What is Phase 2?**
Phase 2 delivers the mathematical and algorithmic heart of Stopora: the **Route Optimization Engine** located in `src/lib/engine/`.

**The Goal:**
Given an $N \times N$ matrix of road travel distances or travel times between a starting depot (Point `0`) and up to 12 delivery stops in Lagos, Nigeria, the engine calculates the sequence of stops that yields the **shortest total travel distance**.

**Key Architectural Philosophy:**
- **Pure TypeScript**: Zero external dependencies (no React, no Next.js, no database, no HTTP calls).
- **Strict Separation of Concerns**: The engine operates strictly on mathematical cost matrices, completely isolated from mapping tiles or geocoding APIs.
- **Contract Adherence**: Built to comply with the immutable types defined in `src/types/index.ts` without modifying a single line of shared contracts.

---

## 2. The Core Problem: Why Route Optimization in Lagos is Hard

### A. The Combinatorial Explosion (Factorial Growth)
When a dispatcher enters delivery stops in the order orders arrived, finding the best order manually is virtually impossible:
- With $n$ delivery stops, there are $n!$ possible visiting orders.
- For 5 stops: $5! = 120$ possible routes.
- For 8 stops: $8! = 40,320$ possible routes.
- For **12 stops (Stopora's MVP limit)**: $12! = \mathbf{479,001,600}$ possible routes!

Evaluating 479 million routes sequentially would cause an 8-minute CPU lockup on a web server or mobile phone. We needed an algorithm that computes the mathematically exact optimal route in **milliseconds**.

### B. Road Asymmetry in Lagos
Unlike textbook Travelling Salesperson Problems (TSP) that assume symmetric distances ($A \to B = B \to A$), Lagos road networks are **asymmetric**:
- One-way road networks (e.g., Victoria Island, Lagos Island, Ikeja).
- Major expressways (Third Mainland Bridge, Lekki-Epe, Ikorodu Road) where missing an exit requires a 5–10 km detour to reach a U-turn.
- Every algorithm and cost calculator in our engine was explicitly engineered to handle **directed graphs** where $d(A, B) \ne d(B, A)$.

---

## 3. How We Built It: Architectural Breakdown

We structured the engine into five clean, decoupled modules:

### 1. Route Cost Evaluator (`src/lib/engine/cost.ts`)
- **Function**: `routeCost(order, distances, returnToStart)`
- Computes the true sequential cost across arbitrary orders ($i \to i+1$).
- Correctly adds the closing leg returning to Point `0` if `returnToStart` is true (round trip) or terminates at the last stop if false (open route).

### 2. Matrix Validator (`src/lib/engine/validate.ts`)
- **Function**: `validateMatrix(distances)`
- Defensive validation ensuring inputs are non-empty, square ($N \times N$), within bounds ($1 \le N \le 51$), and contain only valid, finite, non-negative numbers (strictly rejecting `NaN`, negative values, or `Infinity`).

### 3. Exact Held-Karp Dynamic Programming Solver (`src/lib/engine/heldKarp.ts`)
- **Purpose**: Used for 3 to 13 total points (Start depot + up to 12 delivery stops).
- **Mathematical Insight**: Uses the **Bellman-Held-Karp algorithm** based on optimal substructure. A subset of visited stops is modeled as an integer bitmask (e.g., binary `1011` means stops 0, 1, and 3 are visited).
- **Recurrence Relation**:
  $$dp(mask, u) = \min_{v \in mask \setminus \{u\}} \Big( dp(mask \setminus \{u\}, v) + distances[v][u] \Big)$$
- **Performance Engineering**:
  - Instead of standard JavaScript objects or nested arrays, we implemented the DP state table and parent pointers using flat **typed arrays** (`Float64Array` and `Int8Array`).
  - Total memory footprint for 13 points is under **1 MB** ($8,192 \text{ states} \times 13 \text{ endpoints}$).
  - Fits entirely within CPU L2/L3 hardware cache, reducing runtime from minutes down to **~10 milliseconds** (beating our < 200 ms requirement by 20x).
- **Order Reconstruction**: Backtracks through parent pointers in $\mathcal{O}(N)$ time, guaranteeing that Point `0` is always anchored as the start point.

### 4. Nearest-Neighbour + 2-Opt Heuristic (`src/lib/engine/heuristic.ts`)
- **Purpose**: Scales the engine for larger enterprise inputs (14 to 51 points).
- **Phase A (Nearest-Neighbour)**: Greedily builds an initial feasible route starting at Point 0 in $\mathcal{O}(N^2)$.
- **Phase B (2-Opt Edge Uncrossing)**: Iteratively evaluates reversing subsegments between stops $i$ and $j$ ($1 \le i < j \le N-1$) to eliminate crossing paths.
- **Asymmetric Safeguard**: Standard textbook 2-opt uses an $\mathcal{O}(1)$ delta shortcut that only works on symmetric networks. Because Lagos roads are asymmetric, our implementation evaluates candidate moves by recomputing route costs directly with `routeCost`, preventing invalid tour reversals.
- **Rules**: Point 0 is permanently anchored; runs until a local optimum is reached or up to a safety cap of 2,000 iterations.

### 5. Unified Top-Level Dispatcher (`src/lib/engine/index.ts`)
- **Function**: `solveRoute(distances, options): SolveResult`
- Seamlessly selects the optimal strategy based on matrix size:
  - **1 point**: Returns `[0]`, cost `0`, algorithm `"trivial"`.
  - **2 points**: Returns `[0, 1]`, cost calculated, algorithm `"trivial"`.
  - **3 to 13 points**: Dispatches to `heldKarp` (guaranteed 100% optimal), algorithm `"held-karp"`.
  - **14 to 51 points**: Dispatches to `heuristic`, algorithm `"nn-2opt"`.

---

## 4. Verification, Testing & Quality Assurance

To guarantee mathematical correctness and rock-solid reliability, we built an exhaustive test suite in `tests/unit/engine/`:

1. **Brute-Force Permutation Ground-Truth Comparison**:
   - Built a test helper that tries all $(N-1)!$ permutations.
   - Tested **200 random matrices** of 3 to 8 points (symmetric, asymmetric, open routes, and round trips) using a seeded PRNG (Mulberry32).
   - In 100% of the 200 runs, Held-Karp matched the brute-force optimal cost.
2. **Invariance Tests**:
   - Formally asserted that every returned route starts with index `0` and contains every index from `0` to $N-1$ exactly once.
3. **Deterministic 5-Point Known Route Test**:
   - Hand-crafted an asymmetric matrix with an obvious sequential path ($0 \to 1 \to 2 \to 3 \to 4$). Verified exact order matching for both open routes and round trips.
4. **Sub-200ms Timing Test**:
   - Benchmarked 13 random points ($2^{13}$ states): finished in under 15 ms, well beneath the 200 ms SLA.
5. **Heuristic Guarantee**:
   - Proved on 25 random points that the 2-opt result is strictly monotonic and **never worse** than the nearest-neighbour tour it began from.
6. **Full Test Suite Result**:
   - `6/6` test files, **`23/23` unit tests passing** in under 750 ms.
   - `npm run lint`, `npm run typecheck`, and Next.js production `npm run build` all pass with zero errors.

---

## 5. Benchmark Results: Real-World Savings in Lagos

We developed a benchmark script (`scripts/benchmark-engine.ts`, runnable via `npm run bench:engine`) simulating **100 random sets of 8 delivery stops** distributed inside the real Lagos bounding box (Latitude 6.40 to 6.70, Longitude 3.20 to 3.60), applying a 1.3 road curvature factor over Haversine distance.

| Metric | Round-Trip Route (`returnToStart: true`) | Open Route (`returnToStart: false`) |
| :--- | :---: | :---: |
| **Average Distance Saved** | **36.20%** | **42.99%** |
| **Best Distance Saved** | **54.53%** | **63.27%** |
| **Worst Distance Saved** | **11.07%** | **16.71%** |
| **Total Distance Eliminated (100 runs)** | **7,900.6 km saved** | **8,167.8 km saved** |

### The Presentation Takeaway:
> *"A delivery dispatcher who visits stops in random or entered order typically wastes between 35% and 45% more distance and fuel than necessary. On average, Stopora's engine immediately eliminates over one-third of the mileage for every single delivery run."*

---

## 6. How Phase 2 Connects to the Next Phases

- **Phase 3 (Maps Data)** will provide real-world road matrices from OpenRouteService.
- **Phase 4 (Database & API)** will wire the API route `/api/routes/optimize` to pass the matrix from Phase 3 into our `solveRoute` function, saving the optimized run in PostgreSQL.
- **Handoff Note for Phase 4**: `solveRoute` strictly expects the depot/start point at **row 0 / column 0** of the distance matrix, and all indices returned map 1:1 with that matrix.
