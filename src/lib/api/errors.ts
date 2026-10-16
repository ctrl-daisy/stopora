import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); }
  catch { throw new ApiError(400, "INVALID_JSON", "Body must be valid JSON."); }
}
export async function handle(work: () => Promise<Response>): Promise<Response> {
  try { return await work(); }
  catch (error) {
    if (error instanceof ApiError) return Response.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    if (error instanceof ZodError) {
      const coordinates = error.issues.some(i => ["lat", "lng"].includes(String(i.path.at(-1))));
      return Response.json({ error: { code: coordinates ? "OUTSIDE_NIGERIA" : "VALIDATION_ERROR", message: error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") } }, { status: coordinates ? 422 : 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return Response.json({ error: { code: "NOT_FOUND", message: "Run or stop not found." } }, { status: 404 });
    if (error instanceof Prisma.PrismaClientInitializationError) return Response.json({ error: { code: "DATABASE_UNAVAILABLE", message: "Database is unreachable. Please try again later." } }, { status: 503 });
    if (error instanceof Error) {
      if (error.message.includes("cannot be reached by road")) {
        return Response.json({ error: { code: "UNREACHABLE_STOP", message: error.message } }, { status: 422 });
      }
      if (error.message.includes("rate limit reached")) {
        return Response.json({ error: { code: "RATE_LIMITED", message: error.message } }, { status: 429 });
      }
      if (error.message.includes("OpenRouteService") || error.message.includes("ORS_API_KEY")) {
        return Response.json({ error: { code: "GEO_PROVIDER_ERROR", message: error.message } }, { status: 502 });
      }
    }
    console.error("API request failed", error instanceof Error ? error.name : "UnknownError");
    return Response.json({ error: { code: "INTERNAL_ERROR", message: "Unable to complete the request." } }, { status: 500 });
  }
}
