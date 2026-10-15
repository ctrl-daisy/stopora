import { handle, readJson } from "@/lib/api/errors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { createRun, listRuns } from "@/lib/services/runService";
import { createRunSchema } from "@/lib/api/schemas";
export async function GET() { return handle(async () => Response.json(await listRuns())); }
export async function POST(request: Request) { return handle(async () => Response.json(await createRun(createRunSchema.parse(await readJson(request))), { status: 201 })); }
