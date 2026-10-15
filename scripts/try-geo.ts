import { geocode, getMatrix } from "../src/lib/geo";

const queries = ["Lekki Phase 1", "Yaba", "Ikeja City Mall"];

async function main() {
  console.log(`Provider: ${process.env.GEO_PROVIDER ?? "mock"}\n`);

  const names: string[] = [];
  const points: { lat: number; lng: number }[] = [];

  for (const q of queries) {
    const results = await geocode(q);
    console.log(`Search "${q}":`);
    if (results.length === 0) {
      console.log("  no results");
      continue;
    }
    for (const r of results) {
      console.log(`  ${r.label} (${r.lat}, ${r.lng})`);
    }
    names.push(results[0].label);
    points.push({ lat: results[0].lat, lng: results[0].lng });
  }

  if (points.length < 2) {
    console.log("\nNeed at least 2 found places to build a matrix.");
    return;
  }

  const { distances } = await getMatrix(points);
  console.log("\nDistance matrix (km), using the first result of each search:");
  names.forEach((name, i) => {
    const row = distances[i].map((d) => (d / 1000).toFixed(1).padStart(6));
    console.log(`${name.slice(0, 28).padEnd(28)} ${row.join(" ")}`);
  });
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});