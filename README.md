# Stopora 🚚

Stopora is a web application designed for delivery riders and dispatchers in Lagos, Nigeria to optimize multi-stop delivery routes. By calculating the shortest road distance sequence for up to 12 delivery stops, it saves travel distance, time, and fuel while offering turn-by-turn navigation handoff via Google Maps.

## How to Install and Run

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
   Copy `.env.example` to `.env.local` and configure your credentials:
   ```bash
   cp .env.example .env.local
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## NPM Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `dev` | `next dev` | Starts the Next.js local development server |
| `build` | `next build` | Builds the production bundle |
| `start` | `next start` | Runs the built production server |
| `lint` | `next lint` | Executes ESLint validation |
| `test` | `vitest run` | Runs unit test suites once using Vitest |
| `test:watch` | `vitest` | Runs Vitest in interactive watch mode |
| `test:e2e` | `playwright test` | Runs Playwright end-to-end tests (Chromium) |
| `typecheck` | `tsc --noEmit` | Validates TypeScript types across the project |
| `bench:engine` | `npx tsx scripts/benchmark-engine.ts` | Runs the 100-run route engine benchmark across the Lagos bounding box |

## Build Phases

| Phase | Name | Description | Status |
| :---: | :--- | :--- | :---: |
| **1** | **Foundation** | Next.js 15 app scaffold, TypeScript strict mode, Tailwind CSS, shared contracts (`src/types/index.ts`), Vitest, Playwright, and GitHub Actions CI. | **Done** |
| **2** | **Route engine** | Core route optimization algorithms (exact Held-Karp dynamic programming and 2-opt heuristic). | **Done** |
| **3** | **Maps data** | OpenRouteService geocoding and road distance matrices, in-memory cache, and mock provider. | Up next |
| **4** | **Database and API** | Prisma ORM with PostgreSQL (Neon), run/stop persistence, and API endpoints. | Not started |
| **5** | **Dispatcher website** | Interactive Leaflet map, address search, route summary metrics, and Google Maps handoff. | Not started |
| **6** | **Integration, testing and deployment** | End-to-end test suite, full system audit, live Vercel deployment, and defense guide. | Not started |
