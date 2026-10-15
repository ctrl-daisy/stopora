import { PrismaClient } from "@prisma/client";
import { mockProvider } from "../src/lib/geo/mockProvider";

const db = new PrismaClient();
async function main() {
  const [start] = await mockProvider.geocode("Lekki Phase 1");
  const names = ["Ikeja City Mall", "Victoria Island", "Magodo", "Ikoyi", "Oshodi", "Ajah", "Surulere", "Yaba"];
  const stops = await Promise.all(names.map(async (name, enteredIndex) => {
    const [place] = await mockProvider.geocode(name);
    if (!place) throw new Error(`Missing mock place: ${name}`);
    return { ...place, enteredIndex };
  }));
  const run = await db.run.create({ data: {
    name: "Lekki morning run", startLabel: start.label, startLat: start.lat, startLng: start.lng,
    stops: { create: stops },
  } });
  console.log(`Seeded Lekki morning run: ${run.id}`);
}
main().catch(() => { console.error("Seed failed. Check DATABASE_URL and migrations."); process.exitCode = 1; }).finally(() => db.$disconnect());
