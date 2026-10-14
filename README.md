# Stopora 🚚

> Find the best order for your delivery stops in Lagos, Nigeria.

Stopora is an intelligent delivery route optimization platform built for dispatchers and delivery riders navigating the unique challenges of Lagos road networks. A dispatcher inputs a start location and up to 12 delivery stops; Stopora calculates the optimal visiting order that minimizes total road travel distance in under 200 ms. 

Stopora displays the calculated sequence on an interactive map, breaks down fuel, time, and Naira (NGN) savings compared to the dispatcher's entered order, and enables seamless Google Maps turn-by-turn navigation handoff for each leg with real-time delivery status tracking.

---

## The Problem

On Lagos roads, dispatchers frequently plan delivery sequences based on the order orders arrived or intuition. Because routing complexity increases factorially—6 stops offer 720 possible visiting orders, while 12 stops balloon to **479,001,600 possible orders**—intuitive sequencing results in backtracking, excessive fuel consumption, increased vehicle wear, and hours lost in traffic. Stopora solves this by finding the mathematically proven shortest route in seconds.

---

## How It Works

1. **Create a Run:** Name the delivery run, select the vehicle type (motorbike, car, or van), toggle whether the vehicle returns to start (round trip) or ends at the final stop (open route), and search for the starting hub.
2. **Add Delivery Stops:** Add up to 12 delivery stops by searching Lagos street addresses or dropping pins directly on the interactive Leaflet map.
3. **Optimize Route:** Tap **Optimize route**. Stopora fetches real road distance and travel time matrices and executes an exact Held-Karp dynamic programming optimization.
4. **Review Metrics & Savings:** View the sequence on the map with numbered markers, along with instant comparative metrics highlighting saved kilometres, travel minutes, fuel in litres, and estimated Naira saved.
5. **Navigate & Deliver:** Dispatchers or riders tap **Navigate** to open any individual leg or full route in Google Maps for turn-by-turn directions, and check off stops as **Delivered** in real time.

---

## Key Features

- **Proven Optimal Routing:** Solves the Travelling Salesman Problem (TSP) for 3 to 13 points (start + up to 12 stops) using the exact **Held-Karp dynamic programming algorithm** in <200 ms.
- **Heuristic Fallback Engine:** Features a Nearest-Neighbour + 2-opt heuristic solver for routes between 14 and 51 points.
- **Real Road Distance & Duration:** Powered by the **OpenRouteService** driving matrix API with an automated in-memory cache and a mock provider for offline development and testing.
- **Interactive Mapping:** Interactive Leaflet map with OpenStreetMap tiles, Lagos-centered address geocoding, pin-dropping, and sequence polyline visualization.
- **Route Options:** Full support for both **Open Routes** (finishing at the final drop) and **Round Trips** (returning to depot/origin).
- **Vehicle Profiles & Fuel Estimations:** Accurate fuel usage models tailored for delivery motorbikes (0.03 L/km), cars (0.09 L/km), and delivery vans (0.12 L/km).
- **Financial & Environmental Savings:** Automatic savings calculations against the baseline entered order (distance %, time saved, litres saved, and ₦ saved based on current fuel prices).
- **Google Maps Handoff:** Direct launch links for individual delivery legs, plus batched full-route links with automated splitting past 9 waypoints to conform to Google Maps constraints.
- **Delivery Tracking:** Interactive checklist to mark stops as delivered on the move.
- **Saved Runs & Persistence:** Store, retrieve, and track past and active runs using PostgreSQL and Prisma ORM.

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) | Unified React web application and server-side API routes |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) | Strong type safety across all project layers and phases |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Responsive, utility-first styling optimized for mobile screens |
| **Database** | [PostgreSQL on Neon](https://neon.tech/) | Serverless cloud PostgreSQL database |
| **ORM** | [Prisma](https://www.prisma.io/) | Type-safe database queries, schema definitions, and migrations |
| **Mapping & UI** | [Leaflet](https://leafletjs.com/) & OpenStreetMap | Open-source mobile-friendly map rendering and pin interactions |
| **Geocoding & Matrix** | [OpenRouteService](https://openrouteservice.org/) | Lagos road-network geocoding and driving distance/duration matrices |
| **Input Validation** | [Zod](https://zod.dev/) | Strict runtime schema validation for API bodies and query parameters |
| **Unit Testing** | [Vitest](https://vitest.dev/) | High-performance unit testing for algorithms, utilities, and services |
| **E2E Testing** | [Playwright](https://playwright.dev/) | End-to-end browser testing for desktop and mobile viewports |
| **CI / CD** | GitHub Actions & [Vercel](https://vercel.com/) | Continuous integration checks and automatic deployment |
| **Package Manager** | `npm` | Dependency and script management |

---

## Architecture Overview

```mermaid
flowchart TD
    B["Browser: Dispatcher / Rider Phone"] -->|Pages| P["Next.js App Router<br/>src/app"]
    B -->|Fetch JSON| A["API Routes<br/>src/app/api"]
    A --> S["Services Layer<br/>src/lib/services"]
    S --> E["Route Engine (Held-Karp / 2-opt)<br/>src/lib/engine"]
    S --> G["Geo Layer (ORS & Cache)<br/>src/lib/geo"]
    S --> D["Prisma Client<br/>src/lib/db"]
    G -->|GEO_PROVIDER=ors| O[("OpenRouteService API")]
    G -->|GEO_PROVIDER=mock| M["Mock Geo Provider<br/>(Local / CI)"]
    D --> PG[("PostgreSQL (Neon)")]
    B -->|Navigate Link| GM["Google Maps App"]
```

### Core Design Principles
- **Engine Isolation:** The route engine operates purely on mathematical cost matrices without coupling to map APIs or network requests.
- **Pluggable Geo Layer:** The geo provider abstraction switches seamlessly between OpenRouteService (`ors`) and an offline mock provider (`mock`) with zero code changes.
- **Server-Side Security:** Geocoding and matrix API keys remain strictly on the backend; the client never exposes provider secrets.
- **Single Source of Truth:** Shared data contracts defined in `src/types/index.ts` guarantee consistency across the frontend, engine, API, and database.

---

## Project Structure

```text
stopora/
├── .github/workflows/ci.yml        # CI pipeline (lint, typecheck, test, build, e2e)
├── docs/
│   ├── PROJECT_BRIEF.md            # Foundational brief and core requirements
│   ├── ALGORITHM.md                # TSP, Held-Karp, and 2-opt algorithm mechanics
│   ├── engine-benchmark.md         # Engine benchmark results on Lagos stops
│   ├── API.md                      # Complete API endpoint specifications
│   ├── screenshots/                # Planner interface screenshots
│   ├── AUDIT.md                    # Pre-deployment audit findings and fixes
│   ├── RESULTS.md                  # Real-world distance and fuel savings report
│   └── DEFENSE.md                  # Comprehensive technical defense guide
├── prisma/
│   ├── schema.prisma               # Prisma data models (Run, Stop)
│   ├── migrations/                 # PostgreSQL database migrations
│   └── seed.ts                     # Database seed ("Lekki morning run")
├── scripts/
│   ├── benchmark-engine.ts         # Engine performance benchmark script
│   ├── try-geo.ts                  # Quick CLI geo verification script
│   └── results.ts                  # Empirical route results generator
├── src/
│   ├── app/                        # Next.js App Router pages and API routes
│   │   ├── page.tsx                # Landing page
│   │   ├── plan/page.tsx           # Run setup screen
│   │   ├── runs/page.tsx           # Recent runs dashboard
│   │   ├── runs/[id]/page.tsx      # Core interactive planner interface
│   │   └── api/                    # REST API endpoints (/api/runs, /api/geocode)
│   ├── components/                 # Reusable UI components (Map, Search, Cards)
│   ├── lib/
│   │   ├── engine/                 # TSP Held-Karp solver & 2-opt heuristic
│   │   ├── geo/                    # OpenRouteService client, mock provider, cache
│   │   ├── db/                     # Global Prisma client instance
│   │   ├── services/               # Business logic (fuel, summary, run operations)
│   │   ├── apiClient.ts            # Client-side typed API fetch helpers
│   │   └── mapsLinks.ts            # Google Maps handoff URL builders
│   └── types/index.ts              # Immutable shared contracts and interfaces
├── tests/
│   ├── unit/                       # Vitest unit test suites
│   └── e2e/                        # Playwright end-to-end test suites
├── .env.example                    # Sample environment variables
├── HANDOFF.md                      # Phase-to-phase continuity log
├── README.md                       # Project documentation
└── ROADMAP.md                      # Six-phase master execution plan
```

---

## Roadmap & Implementation Phases

Stopora is developed across six sequential phases detailed in [ROADMAP.md](ROADMAP.md):

| Phase | Phase Name | Deliverables & Scope | Depends On |
| :---: | :--- | :--- | :--- |
| **1** | **Foundation** | Next.js 15 scaffold, TypeScript strict config, Tailwind CSS, shared contracts (`src/types/index.ts`), CI workflow, and initial tests. | *None* |
| **2** | **Route Engine** | Exact Held-Karp dynamic programming TSP solver, 2-opt heuristic fallback, validation logic, unit benchmarks, and `ALGORITHM.md`. | Phase 1 |
| **3** | **Maps Data** | OpenRouteService client (geocoding & driving matrix), in-memory cache, deterministic mock provider, and coordinate converters. | Phase 1 |
| **4** | **Database & API** | PostgreSQL on Neon with Prisma, run & stop CRUD services, `/api/runs` and `/api/geocode` endpoints, and database seed. | Phases 2 & 3 |
| **5** | **Dispatcher Website** | Mobile-first planner UI, dynamic Leaflet map, address auto-search, summary cards, Google Maps handoff, and delivery status toggles. | Phase 4 |
| **6** | **Ship It** | Playwright E2E testing, comprehensive audit, mobile performance optimization, Lagos road benchmarks, Vercel deployment, and defense guide. | Phase 5 |

---

## Getting Started

Follow these steps to run Stopora locally:

### 1. Prerequisites
- **Node.js** v18.18.0 or newer
- **npm** (bundled with Node.js)
- Access to a **PostgreSQL** instance (e.g. Neon) or local Postgres (for Phase 4+)
- An **OpenRouteService API key** (free tier from [openrouteservice.org](https://openrouteservice.org/))

### 2. Clone the Repository
```bash
git clone https://github.com/[your-username]/stopora.git
cd stopora
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy the template to `.env.local`:
```bash
cp .env.example .env.local
```
Update the parameters in `.env.local`:
```env
# Database connection string (PostgreSQL on Neon)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# OpenRouteService API key (keep secure, never commit)
ORS_API_KEY="your_openrouteservice_api_key_here"

# Provider toggle: 'ors' for live network calls, 'mock' for local tests / CI
GEO_PROVIDER="mock"

# Optional: Fuel price in Nigerian Naira per litre to calculate financial savings
FUEL_PRICE_NGN_PER_LITRE="850"
```

### 5. Setup the Database (From Phase 4 onward)
```bash
npx prisma migrate dev
npm run db:seed
```

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server at `localhost:3000` |
| `npm run build` | Builds the production application bundle |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs Next.js ESLint checks |
| `npm run typecheck` | Validates TypeScript types across the entire project |
| `npm test` | Runs unit tests using Vitest |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run test:e2e` | Executes Playwright end-to-end tests |
| `npm run bench:engine`| Runs the Held-Karp vs entered order benchmark on sample Lagos stops |
| `npm run try:geo` | Verifies geocoding and distance matrix connectivity via CLI |

---

## Algorithm & Optimization Strategy

For any given run of $N$ locations (1 start depot + up to 12 delivery stops), finding the shortest path is an instance of the **Travelling Salesman Problem (TSP)**:

1. **Exact Held-Karp Algorithm (3 to 13 points):**
   - Uses dynamic programming with bitmask state representation to solve TSP in $\mathcal{O}(n^2 2^n)$ time rather than factorial brute force $\mathcal{O}(n!)$.
   - For 13 locations, Held-Karp computes the solution in under 200 ms, examining far fewer subproblems than the 479M+ permutations required by brute force.
   - Handles asymmetric travel matrices (where travel cost from A $\to$ B does not equal B $\to$ A due to one-way streets and Lagos traffic restrictions).
2. **Nearest-Neighbour + 2-Opt Heuristic (14 to 51 points):**
   - For larger stop sets, constructs an initial route via greedy nearest-neighbour and refines it through 2-opt edge-exchange moves that untangle crossing paths without displacing point 0 (start).

---

## Known Boundaries & Assumptions (MVP)

- **12 Stop Limit:** Keeps the route optimization provably optimal, deterministic, and fast within mobile browser constraints.
- **Estimated Road Durations:** Travel times are computed using standard road network speeds rather than real-time fluctuating traffic feeds.
- **Fixed Fuel Rates:** Estimates fuel consumption based on standard urban operating averages (Motorbike: 0.03 L/km, Car: 0.09 L/km, Van: 0.12 L/km).
- **Single Courier Model:** Focuses on single-rider dispatch; multi-vehicle fleet distribution is slated for post-MVP iterations.
- **Map Paths:** Interactive map displays the visit sequence as a numbered direct connection; detailed turn-by-turn routing is delegated to Google Maps.

---

## Documentation Index

- [ROADMAP.md](ROADMAP.md) — Master 6-phase engineering and delivery plan.
- [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md) — Product brief and core requirements.
- [docs/ALGORITHM.md](docs/ALGORITHM.md) — Mathematical formulation and Held-Karp walkthrough.
- [docs/API.md](docs/API.md) — REST API specifications and contract documentation.
- [docs/DEFENSE.md](docs/DEFENSE.md) — Team defense guide and technical Q&A.
- [HANDOFF.md](HANDOFF.md) — Inter-phase status and transition notes.
