import { expect, it, vi } from "vitest";
import { handle, readJson } from "@/lib/api/errors";
import { createRunSchema } from "@/lib/api/schemas";

it("returns a consistent 400 for malformed request JSON", async () => {
  const response = await handle(async () => Response.json(await readJson(new Request("http://localhost", { method: "POST", body: "{" }))));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: { code: "INVALID_JSON", message: "Body must be valid JSON." } });
});
it("keeps upstream JSON failures internal", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const response = await handle(async () => { throw new SyntaxError("provider secret"); });
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("provider secret");
  } finally { log.mockRestore(); }
});
it("returns 422 for out-of-bounds Nigeria coordinates", async () => {
  const response = await handle(async () => Response.json(createRunSchema.parse({ name: "Bad", start: { label: "Outside", lat: 30, lng: 3.5 } })));
  expect(response.status).toBe(422);
  expect((await response.json()).error.code).toBe("OUTSIDE_NIGERIA");
});
