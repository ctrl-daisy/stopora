import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  geocode,
  getMatrix,
  getGeoProvider,
  clearGeoCache,
} from "../../../src/lib/geo/index";
import { mockProvider } from "../../../src/lib/geo/mockProvider";
import { orsProvider } from "../../../src/lib/geo/orsProvider";

function fakeResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

describe("geo index", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    clearGeoCache();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    process.env.ORS_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.GEO_PROVIDER;
  });

  it("uses the mock provider by default", () => {
    delete process.env.GEO_PROVIDER;
    expect(getGeoProvider()).toBe(mockProvider);
  });

  it("uses the ORS provider when GEO_PROVIDER is ors", () => {
    process.env.GEO_PROVIDER = "ors";
    expect(getGeoProvider()).toBe(orsProvider);
  });

  it("a second identical geocode call does not call fetch again", async () => {
    process.env.GEO_PROVIDER = "ors";
    fetchMock.mockResolvedValue(fakeResponse({ features: [] }));
    await geocode("Yaba");
    await geocode("  yaba ");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("a second identical matrix call does not call fetch again", async () => {
    process.env.GEO_PROVIDER = "ors";
    fetchMock.mockResolvedValue(
      fakeResponse({ distances: [[0, 5], [5, 0]], durations: [[0, 60], [60, 0]] })
    );
    const points = [
      { lat: 6.51, lng: 3.37 },
      { lat: 6.44, lng: 3.47 },
    ];
    await getMatrix(points);
    await getMatrix(points);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});