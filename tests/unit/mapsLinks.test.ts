import { describe, it, expect } from "vitest";
import { buildSingleLegUrl, buildFullRouteUrls } from "@/lib/mapsLinks";
import type { LatLng } from "@/types";

describe("mapsLinks", () => {
  const start: LatLng = { lat: 6.5244, lng: 3.3792 };
  const stop1: LatLng = { lat: 6.4474, lng: 3.47 };
  const stop2: LatLng = { lat: 6.5095, lng: 3.3711 };

  it("builds a single leg directions URL", () => {
    const url = buildSingleLegUrl(start, stop1);
    expect(url).toContain("https://www.google.com/maps/dir/?api=1");
    expect(url).toContain("origin=6.5244,3.3792");
    expect(url).toContain("destination=6.4474,3.47");
    expect(url).toContain("travelmode=driving");
  });

  it("builds a full route URL without waypoints if only 2 points", () => {
    const links = buildFullRouteUrls([start, stop1]);
    expect(links).toHaveLength(1);
    expect(links[0].label).toBe("Open full route in Google Maps");
    expect(links[0].url).toContain("origin=6.5244,3.3792");
    expect(links[0].url).toContain("destination=6.4474,3.47");
    expect(links[0].url).not.toContain("waypoints=");
  });

  it("builds a single full route URL with waypoints when <= 9 waypoints", () => {
    // 1 start + 5 stops + 1 destination = 5 intermediate waypoints (<= 9)
    const points: LatLng[] = [
      start,
      { lat: 6.45, lng: 3.41 },
      { lat: 6.46, lng: 3.42 },
      { lat: 6.47, lng: 3.43 },
      { lat: 6.48, lng: 3.44 },
      { lat: 6.49, lng: 3.45 },
      stop2,
    ];

    const links = buildFullRouteUrls(points);
    expect(links).toHaveLength(1);
    expect(links[0].label).toBe("Open full route in Google Maps");
    expect(links[0].url).toContain("waypoints=");
    expect(links[0].url).toContain("6.45,3.41|6.46,3.42|6.47,3.43|6.48,3.44|6.49,3.45");
  });

  it("splits route into Part 1 and Part 2 when there are more than 9 intermediate waypoints", () => {
    // 1 start + 11 intermediate stops + 1 destination = 11 intermediate waypoints (> 9)
    const points: LatLng[] = [start];
    for (let i = 1; i <= 12; i++) {
      points.push({ lat: 6.4 + i * 0.01, lng: 3.3 + i * 0.01 });
    }

    const links = buildFullRouteUrls(points);
    expect(links).toHaveLength(2);
    expect(links[0].label).toBe("Open in Google Maps (Part 1)");
    expect(links[1].label).toBe("Open in Google Maps (Part 2)");

    // Both parts should have valid URL structures
    expect(links[0].url).toContain("travelmode=driving");
    expect(links[1].url).toContain("travelmode=driving");

    // The destination of Part 1 should connect with the origin of Part 2
    const midIndex = Math.ceil(points.length / 2);
    const midPoint = points[midIndex];
    expect(links[0].url).toContain(`destination=${midPoint.lat},${midPoint.lng}`);
    expect(links[1].url).toContain(`origin=${midPoint.lat},${midPoint.lng}`);
  });

  it("returns empty array for fewer than 2 points", () => {
    expect(buildFullRouteUrls([])).toEqual([]);
    expect(buildFullRouteUrls([start])).toEqual([]);
  });
});
