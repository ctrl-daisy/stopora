import { DistanceMatrix, GeocodeResult, LatLng } from "@/types";
import { GeoProvider } from "./provider";
import { mockProvider } from "./mockProvider";
import { orsProvider } from "./orsProvider";

const TTL_MS = 10 * 60 * 1000; // 10 minutes

type Entry<T> = { value: T; expires: number };

const geocodeCache = new Map<string, Entry<GeocodeResult[]>>();
const matrixCache = new Map<string, Entry<DistanceMatrix>>();

export function getGeoProvider(): GeoProvider {
  return process.env.GEO_PROVIDER === "ors" ? orsProvider : mockProvider;
}

function providerName(): string {
  return process.env.GEO_PROVIDER === "ors" ? "ors" : "mock";
}

export function clearGeoCache(): void {
  geocodeCache.clear();
  matrixCache.clear();
}

export async function geocode(query: string): Promise<GeocodeResult[]> {
  const key = `${providerName()}:${query.trim().toLowerCase()}`;
  const hit = geocodeCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await getGeoProvider().geocode(query);
  geocodeCache.set(key, { value, expires: Date.now() + TTL_MS });
  return value;
}

export async function getMatrix(points: LatLng[]): Promise<DistanceMatrix> {
  const coords = points
    .map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`)
    .join("|");
  const key = `${providerName()}:${coords}`;
  const hit = matrixCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await getGeoProvider().getMatrix(points);
  matrixCache.set(key, { value, expires: Date.now() + TTL_MS });
  return value;
}