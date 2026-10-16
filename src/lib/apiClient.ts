import type { GeocodeResult, RouteSummary } from "@/types";

export interface StopRecord {
  id: string;
  runId: string;
  label: string;
  address?: string | null;
  lat: number;
  lng: number;
  enteredIndex: number;
  optimizedIndex: number | null;
  delivered: boolean;
  deliveredAt: string | null;
}

export interface RunRecord {
  id: string;
  name: string;
  vehicleType: "motorbike" | "car" | "van" | string;
  returnToStart: boolean;
  startLabel: string;
  startLat: number;
  startLng: number;
  status: "draft" | "optimized" | "completed" | string;
  summary: RouteSummary | null;
  createdAt: string;
  updatedAt: string;
  stops: StopRecord[];
}

export type RunSummaryItem = Omit<RunRecord, "stops">;

export interface CreateRunInput {
  name: string;
  vehicleType?: "motorbike" | "car" | "van";
  returnToStart?: boolean;
  start: {
    label: string;
    lat: number;
    lng: number;
  };
}

export interface AddStopInput {
  label: string;
  address?: string;
  lat: number;
  lng: number;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as unknown as T;
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

/**
 * Searches addresses via /api/geocode.
 */
export async function geocode(query: string): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`/api/geocode?${params.toString()}`);
  return handleResponse<GeocodeResult[]>(res);
}

/**
 * Creates a new delivery run via POST /api/runs.
 */
export async function createRun(input: CreateRunInput): Promise<RunRecord> {
  const res = await fetch("/api/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<RunRecord>(res);
}

/**
 * Fetches recent runs via GET /api/runs.
 */
export async function getRuns(): Promise<RunSummaryItem[]> {
  const res = await fetch("/api/runs");
  return handleResponse<RunSummaryItem[]>(res);
}

/**
 * Fetches a single run by ID with stops via GET /api/runs/[id].
 */
export async function getRun(id: string): Promise<RunRecord> {
  const res = await fetch(`/api/runs/${encodeURIComponent(id)}`);
  return handleResponse<RunRecord>(res);
}

/**
 * Adds a stop to a run via POST /api/runs/[id]/stops.
 */
export async function addStop(runId: string, input: AddStopInput): Promise<StopRecord> {
  const res = await fetch(`/api/runs/${encodeURIComponent(runId)}/stops`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<StopRecord>(res);
}

/**
 * Removes a stop from a run via DELETE /api/runs/[id]/stops/[stopId].
 */
export async function deleteStop(runId: string, stopId: string): Promise<void> {
  const res = await fetch(
    `/api/runs/${encodeURIComponent(runId)}/stops/${encodeURIComponent(stopId)}`,
    {
      method: "DELETE",
    }
  );
  return handleResponse<void>(res);
}

/**
 * Marks a stop as delivered or undelivered via PATCH /api/runs/[id]/stops/[stopId].
 */
export async function setStopDelivered(
  runId: string,
  stopId: string,
  delivered: boolean
): Promise<StopRecord> {
  const res = await fetch(
    `/api/runs/${encodeURIComponent(runId)}/stops/${encodeURIComponent(stopId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delivered }),
    }
  );
  return handleResponse<StopRecord>(res);
}

/**
 * Optimizes a run via POST /api/runs/[id]/optimize.
 */
export async function optimizeRun(runId: string): Promise<RouteSummary> {
  const res = await fetch(`/api/runs/${encodeURIComponent(runId)}/optimize`, {
    method: "POST",
  });
  return handleResponse<RouteSummary>(res);
}
