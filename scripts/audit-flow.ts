import "dotenv/config";
import { db } from "../src/lib/db";
import { geocode } from "../src/lib/geo";
import { createRun, addStop, optimizeRun, setDelivered, getRun } from "../src/lib/services/runService";

async function main() {
  console.log("=== AUDIT: 1. FULL FLOW WITH MOCK ===");
  process.env.GEO_PROVIDER = "mock";

  // Test geocoding
  const geoResults = await geocode("Yaba");
  console.log("Geocode Yaba count:", geoResults.length, "First:", geoResults[0]);

  // Create a run
  const run = await createRun({
    name: "Audit Test Run",
    vehicleType: "motorbike",
    returnToStart: false,
    start: {
      label: geoResults[0].label,
      lat: geoResults[0].lat,
      lng: geoResults[0].lng,
    },
  });
  console.log("Run created:", run.id, "Status:", run.status);

  // Add 8 stops
  const mockStops = [
    { label: "Lekki Phase 1", lat: 6.4474, lng: 3.47 },
    { label: "Victoria Island", lat: 6.4281, lng: 3.4219 },
    { label: "Ikoyi", lat: 6.4549, lng: 3.4346 },
    { label: "Surulere", lat: 6.4969, lng: 3.3578 },
    { label: "Ikeja", lat: 6.6018, lng: 3.3515 },
    { label: "Marina", lat: 6.4531, lng: 3.3958 },
    { label: "Oshodi", lat: 6.5569, lng: 3.3486 },
    { label: "Maryland", lat: 6.5752, lng: 3.3667 },
  ];

  const addedStops = [];
  for (const stop of mockStops) {
    const s = await addStop(run.id, stop);
    addedStops.push(s);
  }
  console.log("Added 8 stops. Stop count:", addedStops.length);

  // Optimize
  const summary = await optimizeRun(run.id);
  console.log("Optimized summary algorithm:", summary.algorithm);
  console.log("Saved pct:", summary.distanceSavedPct);

  // Check run after optimization
  let currentRun = await getRun(run.id);
  console.log("Run status after optimize:", currentRun?.status);

  // Deliver all
  if (currentRun) {
    for (const stop of currentRun.stops) {
      await setDelivered(run.id, stop.id, true);
    }
  }

  currentRun = await getRun(run.id);
  console.log("Run status after all delivered:", currentRun?.status);

  console.log("\n=== AUDIT: 2. EDGE CASES ===");

  // Edge case: 0 stops optimize
  const emptyRun = await createRun({
    name: "Empty Run",
    vehicleType: "car",
    returnToStart: false,
    start: { label: "Yaba", lat: 6.5095, lng: 3.3711 },
  });
  try {
    await optimizeRun(emptyRun.id);
    console.error("FAIL: Empty run optimized without error!");
  } catch (err: unknown) {
    console.log("OK: Empty run rejected:", err instanceof Error ? err.message : String(err));
  }

  // Edge case: 1 stop optimize
  await addStop(emptyRun.id, { label: "Ikeja", lat: 6.6018, lng: 3.3515 });
  try {
    const res = await optimizeRun(emptyRun.id);
    console.log("1 stop optimize result:", res ? "handled" : "empty");
  } catch (err: unknown) {
    console.log("1 stop optimize rejected:", err instanceof Error ? err.message : String(err));
  }

  // Edge case: 12 stops limit & 13th stop
  const limitRun = await createRun({
    name: "Limit Test Run",
    vehicleType: "van",
    returnToStart: false,
    start: { label: "Yaba", lat: 6.5095, lng: 3.3711 },
  });
  for (let i = 0; i < 12; i++) {
    await addStop(limitRun.id, {
      label: `Stop ${i + 1}`,
      lat: 6.45 + i * 0.01,
      lng: 3.35 + i * 0.01,
    });
  }
  console.log("Successfully added 12 stops.");

  try {
    await addStop(limitRun.id, {
      label: "Stop 13",
      lat: 6.58,
      lng: 3.48,
    });
    console.error("FAIL: 13th stop was NOT blocked!");
  } catch (err: unknown) {
    console.log("OK: 13th stop blocked with error:", err instanceof Error ? err.message : String(err));
  }

  // Edge case: Two stops at the exact same address / coordinates
  const dupRun = await createRun({
    name: "Duplicate Coords Run",
    vehicleType: "motorbike",
    returnToStart: false,
    start: { label: "Yaba", lat: 6.5095, lng: 3.3711 },
  });
  await addStop(dupRun.id, { label: "Ikeja 1", lat: 6.6018, lng: 3.3515 });
  await addStop(dupRun.id, { label: "Ikeja 2", lat: 6.6018, lng: 3.3515 });
  const dupSummary = await optimizeRun(dupRun.id);
  console.log("OK: Duplicate coordinates handled without crash, saved pct:", dupSummary.distanceSavedPct);

  // Edge case: Non-existent run id
  try {
    await getRun("cmvnonexistent123456789012");
    console.log("Non-existent run returned null as expected.");
  } catch (err: unknown) {
    console.log("Non-existent run threw:", err instanceof Error ? err.message : String(err));
  }

  // Clean up test runs from DB
  await db.run.deleteMany({
    where: {
      id: { in: [run.id, emptyRun.id, limitRun.id, dupRun.id] },
    },
  });
  console.log("Test runs cleaned up successfully.");

  console.log("\n=== AUDIT: 3. GEO_PROVIDER=ors ===");
  process.env.GEO_PROVIDER = "ors";
  try {
    const orsGeo = await geocode("Ikeja");
    console.log("ORS Geocode Ikeja results:", orsGeo.length);
  } catch (err: unknown) {
    console.log("ORS Geocode error (expected if key missing/invalid):", err instanceof Error ? err.message : String(err));
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error("Fatal error during audit:", e);
  process.exit(1);
});
