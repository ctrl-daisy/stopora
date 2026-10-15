# Stopora API (Phase 4)

All routes run on the server. JSON requests use `Content-Type: application/json`.
Coordinates must be inside the supported Nigeria bounding box: latitude 4–14,
longitude 2.5–15 (inclusive). IDs are Prisma CUIDs.

Every error is `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }`.
400: invalid JSON (`INVALID_JSON`), invalid body/params/query (`VALIDATION_ERROR`),
13th stop (`STOP_LIMIT`), empty optimization (`NO_STOPS`).
422: invalid or out-of-bounds coordinates (`OUTSIDE_NIGERIA`).
404: missing run, stop, or stop belonging to another run (`NOT_FOUND`).
500: database/provider/unexpected failure (`INTERNAL_ERROR`), without secrets.

No authentication is implemented in this phase; runs are shared across dispatchers.

## POST /api/runs

Creates a draft. `vehicleType` defaults to `motorbike`; `returnToStart` defaults to false.
Vehicle values: `motorbike`, `car`, `van`. Names/labels: 1–200 trimmed characters.

Request:
```json
{"name":"Morning run","vehicleType":"motorbike","returnToStart":false,"start":{"label":"Lekki Phase 1","lat":6.4474,"lng":3.47}}
```
201 response (Run):
```json
{"id":"cm123456789012345678901234","name":"Morning run","vehicleType":"motorbike","returnToStart":false,"startLabel":"Lekki Phase 1","startLat":6.4474,"startLng":3.47,"status":"draft","summary":null,"createdAt":"2026-10-15T08:00:00.000Z","updatedAt":"2026-10-15T08:00:00.000Z","stops":[]}
```
Errors: 400, 422, 500.

## GET /api/runs

No body. 200: array of latest 20 Run records, newest first; excludes `stops`.
Sample: `[{"id":"cm123456789012345678901234","name":"Morning run","vehicleType":"motorbike","returnToStart":false,"startLabel":"Lekki Phase 1","startLat":6.4474,"startLng":3.47,"status":"draft","summary":null,"createdAt":"2026-10-15T08:00:00.000Z","updatedAt":"2026-10-15T08:00:00.000Z"}]`.
Errors: 500.

## GET /api/runs/[id]

No body. 200: Run as above with `stops` sorted by `optimizedIndex` when present,
otherwise `enteredIndex`. Empty example is the POST Run response above.
An optimized Run includes the summary object shown below and Stop records shown below.
Errors: 400, 404, 500.

## POST /api/runs/[id]/stops

Request:
```json
{"label":"Yaba","address":"Yaba, Lagos","lat":6.5095,"lng":3.3711}
```
`address` is optional, max 500 characters. Max 12 stops. Adding clears any existing
optimization and resets the run to draft.
201 response (Stop):
```json
{"id":"cm123456789012345678901235","runId":"cm123456789012345678901234","label":"Yaba","address":"Yaba, Lagos","lat":6.5095,"lng":3.3711,"enteredIndex":0,"optimizedIndex":null,"delivered":false,"deliveredAt":null}
```
Errors: 400, 404, 422, 500.

## DELETE /api/runs/[id]/stops/[stopId]

No body. 204 response, no content. Re-numbers entered indices from zero and clears
all optimized indices and the summary; status becomes draft.
Errors: 400, 404, 500.

## PATCH /api/runs/[id]/stops/[stopId]

Request: `{"delivered":true}` (false undoes delivery).
200: Stop record above with `delivered:true` and an ISO timestamp in `deliveredAt`.
Example: `{"id":"cm123456789012345678901235","runId":"cm123456789012345678901234","label":"Yaba","address":"Yaba, Lagos","lat":6.5095,"lng":3.3711,"enteredIndex":0,"optimizedIndex":0,"delivered":true,"deliveredAt":"2026-10-15T09:00:00.000Z"}`.
The run becomes completed when every stop is delivered. Undoing delivery restores
optimized if a summary exists, otherwise draft. Repeating true retains the original timestamp.
Errors: 400, 404, 500.

## POST /api/runs/[id]/optimize

No body. Requires at least one stop. 200 response (RouteSummary):
```json
{"order":[0,2,1],"totalDistanceM":4000,"totalDurationS":720,"baselineDistanceM":6000,"baselineDurationS":1080,"distanceSavedPct":33.3,"fuelLitres":0.12,"baselineFuelLitres":0.18,"algorithm":"held-karp"}
```
Example values are illustrative. Index 0 is always the start; matrix indices 1…N
refer to stops in entered order. Stored stop indices are zero-based positions
among delivery stops, excluding the start. Distance is metres, duration seconds,
fuel litres. Return trips include the leg home; order never repeats index 0.
Writes stop order, summary, and optimized status atomically. Fetch the Run again
to get stop IDs in optimized order. Existing delivered flags are preserved.
Errors: 400, 404, 500.

## GET /api/geocode?q=Yaba

No body. Query is trimmed, 3–200 characters. 200:
```json
[{"label":"Yaba","lat":6.5095,"lng":3.3711}]
```
Returns an empty array for no matches; provider results outside the supported box
are omitted. Uses server-only ORS credentials when `GEO_PROVIDER=ors`; otherwise mock.
Errors: 400, 500.
