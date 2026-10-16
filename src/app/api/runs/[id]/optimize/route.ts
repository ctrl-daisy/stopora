import { handle } from "@/lib/api/errors";
import { optimizeRun } from "@/lib/services/runService";
import { runParamsSchema } from "@/lib/api/schemas";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const limit = checkRateLimit(`optimize:${getClientIp(request)}`);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds);

  return handle(async () => {
    const { id } = runParamsSchema.parse(await context.params);
    return Response.json(await optimizeRun(id));
  });
}