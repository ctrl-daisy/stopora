import { handle, readJson } from "@/lib/api/errors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { addStop } from "@/lib/services/runService";
import { runParamsSchema, addStopSchema } from "@/lib/api/schemas";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) { return handle(async () => { const { id } = runParamsSchema.parse(await context.params); return Response.json(await addStop(id, addStopSchema.parse(await readJson(request))), { status: 201 }); }); }
