"use client";

import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AddressSearch } from "@/components/AddressSearch";
import { SummaryCards } from "@/components/SummaryCards";
import { StopList } from "@/components/StopList";
import { useToast } from "@/components/Toast";
import {
  getRun,
  addStop,
  deleteStop,
  setStopDelivered,
  optimizeRun,
  type RunRecord,
} from "@/lib/apiClient";
import type { GeocodeResult } from "@/types";

// Dynamic import of Leaflet map with ssr: false
const DynamicPlannerMap = dynamic(() => import("@/components/PlannerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[280px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl">
      <div className="text-center space-y-2">
        <div className="animate-spin w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-xs font-semibold text-gray-500">Loading Lagos map...</p>
      </div>
    </div>
  ),
});

export interface PlannerClientProps {
  runId: string;
  fuelPricePerLitre?: number;
}

export function PlannerClient({ runId, fuelPricePerLitre }: PlannerClientProps) {
  const { showToast } = useToast();

  const [run, setRun] = useState<RunRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isPinDropMode, setIsPinDropMode] = useState(false);
  const [isAddingStop, setIsAddingStop] = useState(false);

  const loadRun = useCallback(async () => {
    try {
      const data = await getRun(runId);
      setRun(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load run", "error");
    } finally {
      setIsLoading(false);
    }
  }, [runId, showToast]);

  useEffect(() => {
    loadRun();
  }, [loadRun]);

  // Add stop via geocoded address
  const handleAddressSelect = async (result: GeocodeResult) => {
    if (!run) return;
    if (run.stops.length >= 12) {
      showToast("Maximum of 12 stops reached. Remove a stop to add another.", "error");
      return;
    }

    setIsAddingStop(true);
    try {
      await addStop(run.id, {
        label: result.label,
        address: result.label,
        lat: result.lat,
        lng: result.lng,
      });
      showToast(`Added stop "${result.label}"`, "success");
      await loadRun();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to add stop", "error");
    } finally {
      setIsAddingStop(false);
    }
  };

  // Add stop via map pin drop
  const handlePinDrop = async (point: { lat: number; lng: number; label: string }) => {
    if (!run) return;
    if (run.stops.length >= 12) {
      showToast("Maximum of 12 stops reached. Remove a stop to add another.", "error");
      setIsPinDropMode(false);
      return;
    }

    setIsAddingStop(true);
    try {
      await addStop(run.id, {
        label: point.label,
        lat: point.lat,
        lng: point.lng,
      });
      showToast(`Added pinned stop "${point.label}"`, "success");
      setIsPinDropMode(false);
      await loadRun();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to add stop", "error");
    } finally {
      setIsAddingStop(false);
    }
  };

  // Remove stop
  const handleRemoveStop = async (stopId: string) => {
    if (!run) return;
    try {
      await deleteStop(run.id, stopId);
      showToast("Stop removed. Route reset to draft.", "info");
      await loadRun();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove stop", "error");
    }
  };

  // Toggle stop delivered
  const handleToggleDelivered = async (stopId: string, delivered: boolean) => {
    if (!run) return;
    try {
      // Optimistic update
      setRun((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          stops: prev.stops.map((s) => (s.id === stopId ? { ...s, delivered } : s)),
        };
      });

      await setStopDelivered(run.id, stopId, delivered);
      await loadRun();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update delivery", "error");
      await loadRun();
    }
  };

  // Optimize run
  const handleOptimize = async () => {
    if (!run) return;
    if (run.stops.length < 2) {
      showToast("Add at least 2 stops before optimizing.", "error");
      return;
    }

    setIsOptimizing(true);
    try {
      await optimizeRun(run.id);
      showToast("Route optimized! Best visit sequence computed.", "success");
      await loadRun();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to optimize route", "error");
    } finally {
      setIsOptimizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm font-semibold text-gray-500">Loading delivery run...</p>
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Run not found</h1>
        <p className="text-sm text-gray-500">The requested run could not be found or has been deleted.</p>
        <Link
          href="/plan"
          className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm"
        >
          Plan a new route
        </Link>
      </div>
    );
  }

  const isOptimized = run.status === "optimized" || run.status === "completed";
  const stopCount = run.stops.length;
  const isAtStopLimit = stopCount >= 12;

  const vehicleIcon =
    run.vehicleType === "car" ? "🚗" : run.vehicleType === "van" ? "🚐" : "🏍️";

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Run Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{vehicleIcon}</span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white truncate">
              {run.name}
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                run.status === "completed"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : isOptimized
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {run.status}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Depot: <span className="font-semibold text-gray-700 dark:text-gray-300">{run.startLabel}</span>
            {run.returnToStart ? " (Round trip)" : " (Open route)"}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
          <span className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {stopCount} of 12 stops
          </span>
        </div>
      </div>

      {/* Main Responsive Grid: Mobile stacked (map top), Desktop side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left / Top Column: Map (about 45% screen height on mobile) */}
        <div className="lg:col-span-6 xl:col-span-7 h-[42vh] sm:h-[48vh] lg:h-[calc(100vh-180px)] min-h-[280px] lg:sticky lg:top-20">
          <DynamicPlannerMap
            start={{
              label: run.startLabel,
              lat: run.startLat,
              lng: run.startLng,
            }}
            stops={run.stops}
            isOptimized={isOptimized}
            returnToStart={run.returnToStart}
            isPinDropMode={isPinDropMode}
            onPinDrop={handlePinDrop}
          />
        </div>

        {/* Right / Bottom Column: Controls, Add Stop, Optimization, Summary, Stop List */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-4">
          {/* Add Stop Controls Card */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Add Delivery Stop
              </span>
              <span className="text-xs font-bold text-gray-500">
                {stopCount} / 12
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-start">
              <div className="flex-1 w-full">
                <AddressSearch
                  placeholder={
                    isAtStopLimit
                      ? "Limit of 12 stops reached"
                      : "Search Lagos street / customer..."
                  }
                  disabled={isAtStopLimit || isAddingStop}
                  onSelect={handleAddressSelect}
                />
              </div>

              {/* Drop a Pin toggle button */}
              <button
                type="button"
                disabled={isAtStopLimit || isAddingStop}
                onClick={() => setIsPinDropMode((prev) => !prev)}
                className={`w-full sm:w-auto min-h-[48px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                  isPinDropMode
                    ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                aria-pressed={isPinDropMode}
              >
                <span>📍</span>
                <span>{isPinDropMode ? "Pinning..." : "Drop Pin"}</span>
              </button>
            </div>

            {isPinDropMode && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold animate-pulse">
                Click/tap anywhere on the map above to set the delivery coordinates.
              </p>
            )}
          </div>

          {/* Large Optimize Route Button */}
          <div>
            <button
              type="button"
              onClick={handleOptimize}
              disabled={stopCount < 2 || isOptimizing}
              className="w-full min-h-[54px] px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-800 dark:disabled:text-gray-600 text-white font-black text-base sm:text-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isOptimizing ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>
                  <span>Optimizing Route in Lagos...</span>
                </>
              ) : isOptimized ? (
                <span>Re-Optimize Route ⚡</span>
              ) : (
                <span>Optimize Route ({stopCount} stops) ⚡</span>
              )}
            </button>
            {stopCount < 2 && (
              <p className="text-xs text-gray-500 text-center mt-1">
                Add at least 2 stops to enable route optimization.
              </p>
            )}
          </div>

          {/* Route Summary Cards (when optimized) */}
          {isOptimized && run.summary && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
                Route Performance & Savings
              </h2>
              <SummaryCards
                summary={run.summary}
                fuelPricePerLitre={fuelPricePerLitre}
              />
            </div>
          )}

          {/* Stop List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {isOptimized ? "Optimized Delivery Order" : "Delivery Stops"}
              </h2>
              <span className="text-xs text-gray-500">
                {run.stops.filter((s) => s.delivered).length} of {stopCount} delivered
              </span>
            </div>

            {stopCount === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-6">
                <span className="text-3xl">📍</span>
                <p className="font-bold text-sm text-gray-700 dark:text-gray-300 mt-2">
                  No stops added yet
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Search an address above or tap &quot;Drop Pin&quot; to place pins on the map.
                </p>
              </div>
            ) : (
              <StopList
                start={{
                  label: run.startLabel,
                  lat: run.startLat,
                  lng: run.startLng,
                }}
                stops={run.stops}
                isOptimized={isOptimized}
                returnToStart={run.returnToStart}
                onRemoveStop={handleRemoveStop}
                onToggleDelivered={handleToggleDelivered}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
