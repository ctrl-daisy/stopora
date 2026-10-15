import { DistanceMatrix, GeocodeResult, LatLng } from "@/types";

export interface GeoProvider {
  geocode(query: string): Promise<GeocodeResult[]>;
  getMatrix(points: LatLng[]): Promise<DistanceMatrix>;
}