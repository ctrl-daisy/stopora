import type { DistanceMatrix, SolveResult, VehicleType, RouteSummary } from "@/types";
import { routeCost } from "@/lib/engine";
import { fuelLitres } from "./fuel";

export function buildSummary(matrix: DistanceMatrix, solve: SolveResult, vehicle: VehicleType, returnToStart: boolean): RouteSummary {
  const baseline = matrix.distances.map((_, i) => i);
  const totalDistanceM = routeCost(solve.order, matrix.distances, returnToStart);
  const baselineDistanceM = routeCost(baseline, matrix.distances, returnToStart);
  return {
    order: solve.order,
    totalDistanceM,
    totalDurationS: routeCost(solve.order, matrix.durations, returnToStart),
    baselineDistanceM,
    baselineDurationS: routeCost(baseline, matrix.durations, returnToStart),
    distanceSavedPct: baselineDistanceM === 0 ? 0 : Math.max(0, Math.round((1 - totalDistanceM / baselineDistanceM) * 1000) / 10),
    fuelLitres: fuelLitres(totalDistanceM, vehicle),
    baselineFuelLitres: fuelLitres(baselineDistanceM, vehicle),
    algorithm: solve.algorithm,
  };
}
