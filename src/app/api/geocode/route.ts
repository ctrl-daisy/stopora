import { handle } from "@/lib/api/errors";
import { geocode } from "@/lib/geo";
import { geocodeSchema } from "@/lib/api/schemas";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = checkRateLimit(`geocode:${getClientIp(request)}`);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  return handle(async () => {
    const { q } = geocodeSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    
    return Response.json(
      (await geocode(q)).filter(
        (p) => p.lat >= 4 && p.lat <= 14 && p.lng >= 2.5 && p.lng <= 15
      )
    );
  });
}