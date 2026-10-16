import { describe, it, expect } from "vitest";
import { checkRateLimit } from "../../src/lib/rateLimit";

describe("checkRateLimit", () => {
  it("allows requests up to the limit, then blocks", () => {
    const key = "test-key-1";
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    }
    const blocked = checkRateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks different keys separately", () => {
    expect(checkRateLimit("a-key", 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit("b-key", 1, 60_000).allowed).toBe(true);
  });
});