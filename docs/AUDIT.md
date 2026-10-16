# Stopora Audit (Phase 6)

## How I tested
- **Provider**: `GEO_PROVIDER=mock` and `GEO_PROVIDER=ors`
- **Device / screen size**: Desktop (1280x800) and Mobile (360x740 / 375x812)
- **Date**: October 16, 2026

## Problems found
- [ ] (/runs/[id]) Interactive database transaction timeout (Prisma P2028) when adding stops or setting delivery over high-latency Neon connection (default timeout was 5000ms).
- [ ] (/api/runs/[id]/optimize) Unreachable road network or ORS provider errors (rate limit, rejected key, missing key, unreachable point) masked as generic 500 `INTERNAL_ERROR: Unable to complete the request` instead of clear, actionable messages.
- [ ] (/api/*) Database connection failures (PrismaClientInitializationError) return generic internal error without explicit database status.
- [ ] (/plan & /runs/[id]) Slow network loading states: ensure search debouncing and API mutations show clear spinner / pending states.
- [ ] (tests/e2e/dispatcher.spec.ts) E2E test selectors used non-existent "Search" button and outdated button labels ("Find best route" vs "Optimize Route").
- [ ] (next.config.ts) Missing bundle inspection to confirm server secrets (`DATABASE_URL`, `ORS_API_KEY`) never reach client chunks.
- [ ] (.gitignore & git history) Accidental Python `venv/` files and submodule entry staged in repository.

## Fixed
- [x] (.gitignore) Removed `venv/` and submodule from git tracking and added to `.gitignore`.
- [ ] (src/lib/services/runService.ts) Extended interactive transaction timeout to 20,000ms on `addStop`, `removeStop`, and `setDelivered`.
- [ ] (src/lib/api/errors.ts) Surfaced clear error messages for unreachable road points, ORS API key/rate limits, and database downtime.
- [ ] (tests/e2e/dispatcher.spec.ts) Aligned end-to-end Playwright tests with actual mobile UI components and actions.