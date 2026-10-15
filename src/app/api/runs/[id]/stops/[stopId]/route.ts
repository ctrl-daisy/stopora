import { handle, readJson } from "@/lib/api/errors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { removeStop, setDelivered } from "@/lib/services/runService";
import { stopParamsSchema, deliveredSchema } from "@/lib/api/schemas";
type Context = { params: Promise<{ id: string; stopId: string }> };
export async function DELETE(_request: Request, context: Context) { return handle(async () => { const { id, stopId } = stopParamsSchema.parse(await context.params); await removeStop(id, stopId); return new Response(null, { status: 204 }); }); }
export async function PATCH(request: Request, context: Context) { return handle(async () => { const { id, stopId } = stopParamsSchema.parse(await context.params); const { delivered } = deliveredSchema.parse(await readJson(request)); return Response.json(await setDelivered(id, stopId, delivered)); }); }
