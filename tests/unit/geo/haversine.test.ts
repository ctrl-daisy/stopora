import { describe, it, expect } from "vitest";
import { haversineMetres } from "../../../src/lib/geo/haversine";

describe("haversineMetres", () => {
  it("Lekki Phase 1 to Ikeja City Mall is about 20-25 km", () => {
    const lekki = { lat: 6.4474, lng: 3.47 };
    const ikeja = { lat: 6.614, lng: 3.358 };
    const metres = haversineMetres(lekki, ikeja);
    expect(metres).toBeGreaterThan(20000);
    expect(metres).toBeLessThan(25000);
  });

  it("same point is zero", () => {
    const p = { lat: 6.5, lng: 3.4 };
    expect(haversineMetres(p, p)).toBe(0);
  });
});