import { describe, expect, it } from "vitest";
import { createRunSchema, addStopSchema, deliveredSchema, runParamsSchema, stopParamsSchema, geocodeSchema } from "@/lib/api/schemas";
const start = { label: "Lekki", lat: 6.4474, lng: 3.47 };
const good = { name: "Morning", vehicleType: "motorbike", returnToStart: false, start };
describe("API schemas", () => {
  it("accepts valid inputs and defaults", () => {
    expect(createRunSchema.safeParse(good).success).toBe(true);
    expect(createRunSchema.parse({ name: "Run", start }).vehicleType).toBe("motorbike");
    expect(addStopSchema.safeParse({ ...start, address: "Road" }).success).toBe(true);
    expect(deliveredSchema.safeParse({ delivered: false }).success).toBe(true);
    expect(runParamsSchema.safeParse({ id: "cm123456789012345678901234" }).success).toBe(true);
    expect(stopParamsSchema.safeParse({ id: "cm123456789012345678901234", stopId: "cm123456789012345678901235" }).success).toBe(true);
    expect(geocodeSchema.safeParse({ q: "Yaba" }).success).toBe(true);
  });
  it.each([{ name: " " }, { name: "x".repeat(201) }, { vehicleType: "truck" }, { returnToStart: "false" }, { extra: true }, { start: null }])("rejects invalid run field %j", patch => {
    expect(createRunSchema.safeParse({ ...good, ...patch }).success).toBe(false);
  });
  it.each([{ label: "" }, { lat: 3.99 }, { lat: 14.01 }, { lat: "6" }, { lat: NaN }, { lng: 2.49 }, { lng: 15.01 }, { lng: Infinity }, { address: 5 }, { address: "a".repeat(501) }])("rejects invalid stop field %j", patch => {
    expect(addStopSchema.safeParse({ ...start, ...patch }).success).toBe(false);
  });
  it.each([{}, { delivered: "true" }, { delivered: true, extra: 1 }])("rejects invalid delivery %j", input => expect(deliveredSchema.safeParse(input).success).toBe(false));
  it("rejects bad parameters and short search", () => {
    expect(runParamsSchema.safeParse({ id: "bad" }).success).toBe(false);
    expect(stopParamsSchema.safeParse({ id: "cm123456789012345678901234", stopId: "bad" }).success).toBe(false);
    expect(geocodeSchema.safeParse({ q: "ab" }).success).toBe(false);
  });
});
