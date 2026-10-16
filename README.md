# Stopora 🚚

> Live deployment: **[https://stopora.vercel.app](https://stopora.vercel.app)**

Stopora is a mobile-first web application designed for delivery riders and dispatchers in Lagos, Nigeria to optimize multi-stop delivery routes. By calculating the shortest road distance sequence for up to 12 delivery stops, it reduces travel distance by ~39%, cuts vehicle fuel consumption, and provides turn-by-turn navigation handoff via Google Maps.

---

## Quick Setup (Fresh Clone in 8 Steps)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ctrl-daisy/stopora.git
   cd stopora
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to both `.env.local` and `.env`:
   ```bash
   cp .env.example .env.local
   cp .env.example .env
   ```

4. **Add your PostgreSQL database URL:**
   In `.env.local` and `.env`, set:
   ```env
   DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
   GEO_PROVIDER="mock"
   FUEL_PRICE_NGN_PER_LITRE="1355"
   ```

5. **Run database migrations:**
   ```bash
   npx prisma migrate deploy
   ```

6. **Seed the demo run:**
   ```bash
   npm run db:seed
   ```

7. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

8. **Run tests:**
   ```bash
   npm test
   npm run test:e2e
   ```

---

## NPM Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `dev` | `next dev` | Starts Next.js development server |
| `build` | `next build` | Compiles optimized production bundle |
| `start` | `next start` | Runs built production server |
| `lint` | `eslint .` | Validates code style and rules |
| `typecheck` | `tsc --noEmit` | Strict TypeScript validation |
| `test` | `vitest run` | Runs unit test suites |
| `test:e2e` | `playwright test` | Runs Playwright end-to-end tests |
| `results` | `tsx --env-file-if-exists=.env.local scripts/results.ts` | Evaluates 20 Lagos benchmark runs and updates `docs/RESULTS.md` |
| `bench:engine` | `npx tsx scripts/benchmark-engine.ts` | Runs the 100-run route engine benchmark |

---

## Build Phases

| Phase | Name | Description | Status |
| :---: | :--- | :--- | :---: |
| **1** | **Foundation** | Next.js 15 app scaffold, TypeScript strict mode, Tailwind CSS, shared contracts (`src/types/index.ts`), Vitest, Playwright, and GitHub Actions CI. | **Done** |
| **2** | **Route engine** | Core route optimization algorithms (exact Held-Karp dynamic programming and 2-opt heuristic). | **Done** |
| **3** | **Maps data** | OpenRouteService geocoding and road distance matrices, in-memory cache, and mock provider. | **Done** |
| **4** | **Database and API** | Prisma ORM with PostgreSQL (Neon), run/stop persistence, and API endpoints. | **Done** |
| **5** | **Dispatcher website** | Interactive Leaflet map, address search, route summary metrics, and Google Maps handoff. | **Done** |
| **6** | **Integration, testing and deployment** | System audit, rate limiting, security headers, Playwright E2E suite, 20 Lagos benchmark results, defense guide, and Vercel deployment. | **Done** |

---

## Documentation

- **[Team Defense Guide](docs/DEFENSE.md)**: Master study guide explaining architecture, algorithm choices, phase-by-phase defense questions, and panel Q&A.
- **[Empirical Results](docs/RESULTS.md)**: Benchmark table over 20 Lagos delivery routes showing average distance and fuel savings.
- **[Algorithm Guide](docs/ALGORITHM.md)**: Deep dive into the Travelling Salesperson Problem, factorial explosion, Held-Karp dynamic programming, and road asymmetry.
- **[Audit Checklist](docs/AUDIT.md)**: Full verification checklist and edge case resolution log.
- **[API Reference](docs/API.md)**: REST endpoints specification and JSON payloads.
