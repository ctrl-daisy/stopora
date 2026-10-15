import type { VehicleType } from "@/types";

// Assumptions, not measured consumption: litres/km; adjust for fleet and traffic.
export const LITRES_PER_KM: Record<VehicleType, number> = {
  motorbike: 0.03, car: 0.09, van: 0.12,
};
export function fuelLitres(distanceM: number, vehicle: VehicleType): number {
  return distanceM / 1000 * LITRES_PER_KM[vehicle];
}
