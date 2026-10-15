import { DistanceMatrix, GeocodeResult, LatLng } from "@/types";
import { GeoProvider } from "./provider";

const BASE = "https://api.openrouteservice.org";
const TIMEOUT_MS = 10000;

function getKey(): string {
  const key = process.env.ORS_API_KEY;
  if (!key) throw new Error("ORS_API_KEY is missing. Add it to .env.local.");
  return key;
}

async function orsFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (res.status === 401 || res.status === 403) {
      throw new Error(`OpenRouteService rejected the API key (HTTP ${res.status}). Check ORS_API_KEY.`);
    }
    if (res.status === 429) {
      throw new Error("OpenRouteService rate limit reached (HTTP 429). Wait a minute and try again.");
    }
    if (res.status >= 500) {
      throw new Error(`OpenRouteService is having problems (HTTP ${res.status}). Try again later.`);
    }
    if (!res.ok) {
      throw new Error(`OpenRouteService request failed (HTTP ${res.status}).`);
    }
    return res;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("OpenRouteService took too long to respond (over 10 seconds).");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const orsProvider: GeoProvider = {
  async geocode(query: string): Promise<GeocodeResult[]> {
    const text = query.trim();
    if (!text) return [];
    const key = getKey();
    const params = new URLSearchParams({
      text,
      "boundary.country": "NG",
      "focus.point.lat": "6.5244",
      "focus.point.lon": "3.3792",
      size: "5",
    });
    const res = await orsFetch(`${BASE}/geocode/search?${params}`, {
      headers: { Authorization: key },
    });
    const data = await res.json();
    return (data.features ?? []).map((f: any) => ({
      label: f.properties.label,
      // ORS gives [longitude, latitude]
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }));
  },

  async getMatrix(points: LatLng[]): Promise<DistanceMatrix> {
    const key = getKey();
    const res = await orsFetch(`${BASE}/v2/matrix/driving-car`, {
      method: "POST",
      headers: { Authorization: key, "Content-Type": "application/json" },
      body: JSON.stringify({
        // ORS wants [longitude, latitude], the opposite of our LatLng order
        locations: points.map((p) => [p.lng, p.lat]),
        metrics: ["distance", "duration"],
        units: "m",
      }),
    });
    const data = await res.json();
    const { distances, durations } = data as DistanceMatrix;
    for (let i = 0; i < distances.length; i++) {
      for (let j = 0; j < distances[i].length; j++) {
        if (distances[i][j] === null || durations[i][j] === null) {
          const bad = j === 0 ? i : j;
          const name = bad === 0 ? "the start point" : `stop ${bad}`;
          throw new Error(`${name} cannot be reached by road.`);
        }
      }
    }
    return { distances, durations };
  },
};