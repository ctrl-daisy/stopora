import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getMatrix } from "@/lib/geo";
import { solveRoute } from "@/lib/engine";
import { ApiError } from "@/lib/api/errors";
import type { AddStopInput, CreateRunInput } from "@/lib/api/schemas";
import type { VehicleType } from "@/types";
import { buildSummary } from "./routeSummary";

type Tx = Prisma.TransactionClient;
const missing = () => new ApiError(404, "NOT_FOUND", "Run or stop not found.");
async function lockedRun(tx: Tx, id: string) {
  // Serialize all changes to a run, including concurrent stop additions.
  const rows = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Run" WHERE id = ${id} FOR UPDATE`;
  if (!rows.length) throw missing();
  return tx.run.findUniqueOrThrow({ where: { id }, include: { stops: { orderBy: { enteredIndex: "asc" } } } });
}
async function invalidate(tx: Tx, id: string) {
  await tx.stop.updateMany({ where: { runId: id }, data: { optimizedIndex: null } });
  await tx.run.update({ where: { id }, data: { status: "draft", summary: Prisma.DbNull } });
}
export function createRun(input: CreateRunInput) {
  const { start, ...data } = input;
  return db.run.create({ data: { ...data, startLabel: start.label, startLat: start.lat, startLng: start.lng }, include: { stops: true } });
}
export function listRuns() {
  return db.run.findMany({ take: 20, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
}
export async function getRun(id: string) {
  const run = await db.run.findUnique({ where: { id }, include: { stops: true } });
  if (!run) throw missing();
  run.stops.sort((a, b) => (a.optimizedIndex ?? a.enteredIndex) - (b.optimizedIndex ?? b.enteredIndex));
  return run;
}
export function addStop(id: string, input: AddStopInput) {
  return db.$transaction(async tx => {
    const run = await lockedRun(tx, id);
    if (run.stops.length >= 12) throw new ApiError(400, "STOP_LIMIT", "A run can contain at most 12 stops. Remove a stop before adding another.");
    await invalidate(tx, id);
    return tx.stop.create({ data: { ...input, runId: id, enteredIndex: run.stops.length } });
  });
}
export function removeStop(id: string, stopId: string) {
  return db.$transaction(async tx => {
    const run = await lockedRun(tx, id);
    if (!run.stops.some(stop => stop.id === stopId)) throw missing();
    await tx.stop.delete({ where: { id: stopId } });
    const remaining = run.stops.filter(stop => stop.id !== stopId);
    for (const [enteredIndex, stop] of remaining.entries()) await tx.stop.update({ where: { id: stop.id }, data: { enteredIndex } });
    await invalidate(tx, id);
  });
}
export function setDelivered(id: string, stopId: string, delivered: boolean) {
  return db.$transaction(async tx => {
    const run = await lockedRun(tx, id);
    if (!run.stops.some(stop => stop.id === stopId)) throw missing();
    const stop = await tx.stop.update({ where: { id: stopId }, data: { delivered, deliveredAt: delivered ? (run.stops.find(s => s.id === stopId)?.deliveredAt ?? new Date()) : null } });
    const allDelivered = run.stops.every(s => s.id === stopId ? delivered : s.delivered);
    await tx.run.update({ where: { id }, data: { status: allDelivered ? "completed" : run.summary ? "optimized" : "draft" } });
    return stop;
  });
}
export function optimizeRun(id: string) {
  return db.$transaction(async tx => {
    const run = await lockedRun(tx, id);
    if (!run.stops.length) throw new ApiError(400, "NO_STOPS", "Add at least one stop before optimizing this run.");
    const matrix = await getMatrix([{ lat: run.startLat, lng: run.startLng }, ...run.stops.map(({ lat, lng }) => ({ lat, lng }))]);
    const solve = solveRoute(matrix.distances, { returnToStart: run.returnToStart });
    const summary = buildSummary(matrix, solve, run.vehicleType as VehicleType, run.returnToStart);
    for (const [optimizedIndex, matrixIndex] of solve.order.slice(1).entries()) {
      await tx.stop.update({ where: { id: run.stops[matrixIndex - 1].id }, data: { optimizedIndex } });
    }
    await tx.run.update({ where: { id }, data: { summary: summary as unknown as Prisma.InputJsonValue, status: "optimized" } });
    return summary;
  }, { timeout: 60000, maxWait: 10000 });
}
