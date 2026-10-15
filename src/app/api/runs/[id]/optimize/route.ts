import { handle } from "@/lib/api/errors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { optimizeRun } from "@/lib/services/runService";
import { runParamsSchema } from "@/lib/api/schemas";
type Context = { params: Promise<{ id: string }> };
export async function POST(_request: Request, context: Context) { return handle(async () => { const { id } = runParamsSchema.parse(await context.params); return Response.json(await optimizeRun(id)); }); }
