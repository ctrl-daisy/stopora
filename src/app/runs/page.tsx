"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getRuns, type RunSummaryItem } from "@/lib/apiClient";
import { formatDistanceKm } from "@/components/SummaryCards";

export default function RunsPage() {
  const [runs, setRuns] = useState<RunSummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRuns()
      .then((data) => {
        setRuns(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load runs");
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            Recent Runs
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Browse and resume your recent delivery plans.
          </p>
        </div>
        <Link
          href="/plan"
          className="min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
        >
          <span>+</span>
          <span>New Run</span>
        </Link>
      </div>

      {isLoading && (
        <div className="py-16 text-center text-gray-500 space-y-3">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm">Loading delivery runs...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {!isLoading && !error && runs.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
          <span className="text-4xl">📦</span>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            No delivery runs yet
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Create your first route to calculate optimal stops and track deliveries.
          </p>
          <Link
            href="/plan"
            className="inline-flex items-center min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition-colors"
          >
            Plan a route
          </Link>
        </div>
      )}

      {!isLoading && runs.length > 0 && (
        <div className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          {runs.map((run) => {
            const dateStr = new Date(run.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const vehicleIcon =
              run.vehicleType === "car"
                ? "🚗"
                : run.vehicleType === "van"
                ? "🚐"
                : "🏍️";

            const summary = run.summary;

            return (
              <Link
                key={run.id}
                href={`/runs/${run.id}`}
                className="block p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors focus:outline-none focus:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg">{vehicleIcon}</span>
                      <h2 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                        {run.name}
                      </h2>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Hub: <span className="font-medium text-gray-700 dark:text-gray-300">{run.startLabel}</span>
                    </p>

                    <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
                      <span>{dateStr}</span>
                      {summary && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Saved {summary.distanceSavedPct.toFixed(1)}% (
                            {formatDistanceKm(
                              Math.max(0, summary.baselineDistanceM - summary.totalDistanceM)
                            )}{" "}
                            km)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      run.status === "completed"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : run.status === "optimized"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {run.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
