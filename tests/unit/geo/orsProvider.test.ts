import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { orsProvider } from "../../../src/lib/geo/orsProvider";

function fakeResponse(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe("orsProvider", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env.ORS_API_KEY = "test-key";
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends [lng, lat] and the Authorization header", async () => {
    fetchMock.mockResolvedValue(
      fakeResponse(200, { distances: [[0, 5], [5, 0]], durations: [[0, 60], [60, 0]] })
    );
    await orsProvider.getMatrix([
      { lat: 6.51, lng: 3.37 },
      { lat: 6.44, lng: 3.47 },
    ]);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body).locations).toEqual([
      [3.37, 6.51],
      [3.47, 6.44],
    ]);
    expect(init.headers.Authorization).toBe("test-key");
  });

  it("maps the response to a DistanceMatrix", async () => {
    const body = { distances: [[0, 5], [5, 0]], durations: [[0, 60], [60, 0]] };
    fetchMock.mockResolvedValue(fakeResponse(200, body));
    const result = await orsProvider.getMatrix([
      { lat: 6.51, lng: 3.37 },
      { lat: 6.44, lng: 3.47 },
    ]);
    expect(result).toEqual(body);
  });

  it("names the unreachable stop when ORS returns null", async () => {
    fetchMock.mockResolvedValue(
      fakeResponse(200, {
        distances: [[0, 1, 1], [1, 0, null], [1, 1, 0]],
        durations: [[0, 1, 1], [1, 0, null], [1, 1, 0]],
      })
    );
    const points = [
      { lat: 6.5, lng: 3.3 },
      { lat: 6.6, lng: 3.4 },
      { lat: 6.7, lng: 3.5 },
    ];
    await expect(orsProvider.getMatrix(points)).rejects.toThrow(/stop 2/);
  });

  it.each([
    [401, /API key/],
    [403, /API key/],
    [429, /rate limit/],
    [500, /problems/],
  ])("HTTP %i gives a readable error", async (status, message) => {
    fetchMock.mockResolvedValue(fakeResponse(status));
    await expect(
      orsProvider.getMatrix([{ lat: 6.5, lng: 3.3 }])
    ).rejects.toThrow(message);
  });

  it("geocode maps features to GeocodeResult", async () => {
    fetchMock.mockResolvedValue(
      fakeResponse(200, {
        features: [
          {
            properties: { label: "Yaba, Lagos, Nigeria" },
            geometry: { coordinates: [3.37, 6.51] },
          },
        ],
      })
    );
    const results = await orsProvider.geocode("yaba");
    expect(results).toEqual([
      { label: "Yaba, Lagos, Nigeria", lat: 6.51, lng: 3.37 },
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain("boundary.country=NG");
  });

  it("throws at call time when the key is missing", async () => {
    delete process.env.ORS_API_KEY;
    await expect(orsProvider.geocode("yaba")).rejects.toThrow(/ORS_API_KEY/);
  });
});