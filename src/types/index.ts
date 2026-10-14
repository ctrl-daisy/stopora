/** A point on the map. */
export type LatLng = { lat: number; lng: number };

/** One delivery stop. */
export type Stop = {
  id: string;
  label: string;
  address?: string;
  lat: number;
  lng: number;
  delivered: boolean;
};

/**
 * Travel costs between every pair of points.
 * distances in metres, durations in seconds.
 * Row i, column j is travel from point i to point j.
 * Point 0 is always the start.
 */
export type DistanceMatrix = { distances: number[][]; durations: number[][] };

/** Options for the route engine. */
export type SolveOptions = { returnToStart: boolean };

/** Engine output. order lists matrix indices and always begins with 0. */
export type SolveResult = {
  order: number[];
  cost: number;
  algorithm: "held-karp" | "nn-2opt" | "trivial";
};

/** Vehicle used for fuel estimates. */
export type VehicleType = "motorbike" | "car" | "van";

/** Everything the planner screen shows after optimizing. */
export type RouteSummary = {
  order: number[];
  totalDistanceM: number;
  totalDurationS: number;
  baselineDistanceM: number;
  baselineDurationS: number;
  distanceSavedPct: number;
  fuelLitres: number;
  baselineFuelLitres: number;
  algorithm: SolveResult["algorithm"];
};

/** One address search result. */
export type GeocodeResult = { label: string; lat: number; lng: number };
