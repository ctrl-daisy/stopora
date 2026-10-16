import type { LatLng } from "@/types";

export interface RouteLink {
  label: string;
  url: string;
}

/**
 * Builds a Google Maps turn-by-turn navigation URL for a single leg between two coordinates.
 */
export function buildSingleLegUrl(origin: LatLng, destination: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
}

/**
 * Builds one or more Google Maps navigation URLs for a sequence of points.
 * Google Maps supports a maximum of 9 intermediate waypoints per URL.
 * If there are more than 9 waypoints, the route is split into Part 1 and Part 2.
 */
export function buildFullRouteUrls(points: LatLng[]): RouteLink[] {
  if (points.length < 2) {
    return [];
  }

  // Intermediate waypoints between origin (points[0]) and destination (points[last])
  const intermediateWaypoints = points.slice(1, points.length - 1);

  if (intermediateWaypoints.length <= 9) {
    const origin = points[0];
    const destination = points[points.length - 1];
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    if (intermediateWaypoints.length > 0) {
      const waypointsParam = intermediateWaypoints
        .map((p) => `${p.lat},${p.lng}`)
        .join("|");
      url += `&waypoints=${waypointsParam}`;
    }
    return [{ label: "Open full route in Google Maps", url }];
  }

  // Split into Part 1 and Part 2
  const midIndex = Math.ceil(points.length / 2);
  const part1Points = points.slice(0, midIndex + 1);
  const part2Points = points.slice(midIndex);

  const formatRouteUrl = (pts: LatLng[]): string => {
    const origin = pts[0];
    const destination = pts[pts.length - 1];
    const waypoints = pts.slice(1, pts.length - 1);
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    if (waypoints.length > 0) {
      const waypointsParam = waypoints.map((p) => `${p.lat},${p.lng}`).join("|");
      url += `&waypoints=${waypointsParam}`;
    }
    return url;
  };

  return [
    { label: "Open in Google Maps (Part 1)", url: formatRouteUrl(part1Points) },
    { label: "Open in Google Maps (Part 2)", url: formatRouteUrl(part2Points) },
  ];
}
