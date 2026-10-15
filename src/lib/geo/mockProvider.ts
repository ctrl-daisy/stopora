import { DistanceMatrix, GeocodeResult, LatLng } from "@/types";
import { GeoProvider } from "./provider";
import { haversineMetres } from "./haversine";

const PLACES: GeocodeResult[] = [
  { label: "Lekki Phase 1", lat: 6.4474, lng: 3.47 },
  { label: "Victoria Island", lat: 6.4281, lng: 3.4219 },
  { label: "Ikeja City Mall", lat: 6.614, lng: 3.358 },
  { label: "Yaba", lat: 6.5095, lng: 3.3711 },
  { label: "Surulere", lat: 6.5, lng: 3.35 },
  { label: "Ikoyi", lat: 6.4549, lng: 3.4246 },
  { label: "Ajah", lat: 6.4698, lng: 3.5852 },
  { label: "Oshodi", lat: 6.5568, lng: 3.3489 },
  { label: "Maryland", lat: 6.5667, lng: 3.364 },
  { label: "Gbagada", lat: 6.555, lng: 3.387 },
  { label: "Festac", lat: 6.466, lng: 3.284 },
  { label: "Apapa", lat: 6.4489, lng: 3.3586 },
  { label: "Lagos Island", lat: 6.4549, lng: 3.3947 },
  { label: "Magodo", lat: 6.615, lng: 3.398 },
  { label: "Ikorodu", lat: 6.6194, lng: 3.5105 },
];

const ROAD_FACTOR = 1.3; // roads are longer than straight lines
const SPEED_M_PER_S = 20000 / 3600; // 20 km/h Lagos traffic

export const mockProvider: GeoProvider = {
  async geocode(query: string): Promise<GeocodeResult[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return PLACES.filter((p) => p.label.toLowerCase().includes(q));
  },

  async getMatrix(points: LatLng[]): Promise<DistanceMatrix> {
    const distances = points.map((a) =>
      points.map((b) => haversineMetres(a, b) * ROAD_FACTOR)
    );
    const durations = distances.map((row) =>
      row.map((d) => d / SPEED_M_PER_S)
    );
    return { distances, durations };
  },
};