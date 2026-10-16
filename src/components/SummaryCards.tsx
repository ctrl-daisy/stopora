"use client";

import React from "react";
import type { RouteSummary } from "@/types";

export interface SummaryCardsProps {
  summary: RouteSummary;
  fuelPricePerLitre?: number;
}

export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes}m`;
  }
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function formatDistanceKm(metres: number): string {
  return (metres / 1000).toFixed(1);
}

export function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString()}`;
}

export function SummaryCards({ summary, fuelPricePerLitre }: SummaryCardsProps) {
  const distanceKm = formatDistanceKm(summary.totalDistanceM);
  const durationStr = formatDuration(summary.totalDurationS);
  const fuelL = summary.fuelLitres.toFixed(1);

  const savedDistanceKm = Math.max(
    0,
    (summary.baselineDistanceM - summary.totalDistanceM) / 1000
  ).toFixed(1);

  const savedPct = summary.distanceSavedPct.toFixed(1);

  const savedFuelLitres = Math.max(0, summary.baselineFuelLitres - summary.fuelLitres);
  const nairaSaved =
    fuelPricePerLitre && fuelPricePerLitre > 0
      ? savedFuelLitres * fuelPricePerLitre
      : null;

  return (
    <div className="w-full space-y-3">
      {/* 4 core metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Distance */}
        <div className="bg-white dark:bg-gray-800 p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Distance
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {distanceKm}
            </span>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">km</span>
          </div>
        </div>

        {/* Estimated Time */}
        <div className="bg-white dark:bg-gray-800 p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Estimated Time
          </span>
          <div className="mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {durationStr}
            </span>
          </div>
        </div>

        {/* Fuel Usage */}
        <div className="bg-white dark:bg-gray-800 p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Fuel Usage
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {fuelL}
            </span>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">L</span>
          </div>
        </div>

        {/* Saved vs Order */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 sm:p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            Saved vs Your Order
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tracking-tight">
              {savedPct}%
            </span>
            <span className="text-xs sm:text-sm font-medium text-emerald-800 dark:text-emerald-300">
              ({savedDistanceKm} km)
            </span>
          </div>
        </div>
      </div>

      {/* Naira Savings Banner if price is provided */}
      {nairaSaved !== null && nairaSaved > 0 && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-between text-sm sm:text-base font-semibold">
          <div className="flex items-center gap-2">
            <span>💰 Estimated Fuel Savings</span>
          </div>
          <span className="text-lg sm:text-xl font-extrabold">
            {formatNaira(nairaSaved)}
          </span>
        </div>
      )}
    </div>
  );
}
