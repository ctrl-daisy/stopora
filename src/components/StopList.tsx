"use client";

import React from "react";
import type { StopRecord } from "@/lib/apiClient";
import { buildSingleLegUrl, buildFullRouteUrls } from "@/lib/mapsLinks";

export interface StopListProps {
  start: {
    label: string;
    lat: number;
    lng: number;
  };
  stops: StopRecord[];
  isOptimized: boolean;
  returnToStart?: boolean;
  onRemoveStop: (stopId: string) => void;
  onToggleDelivered: (stopId: string, delivered: boolean) => void;
}

export function StopList({
  start,
  stops,
  isOptimized,
  returnToStart = false,
  onRemoveStop,
  onToggleDelivered,
}: StopListProps) {
  // Check if every stop is marked as delivered
  const allDelivered = stops.length > 0 && stops.every((s) => s.delivered);

  // Prepare full route coordinates for Google Maps link(s)
  const fullRoutePoints = [
    { lat: start.lat, lng: start.lng },
    ...stops.map((s) => ({ lat: s.lat, lng: s.lng })),
  ];
  if (returnToStart && stops.length > 0) {
    fullRoutePoints.push({ lat: start.lat, lng: start.lng });
  }

  const fullRouteLinks = buildFullRouteUrls(fullRoutePoints);

  return (
    <div className="w-full space-y-4">
      {/* Completed Banner */}
      {allDelivered && (
        <div
          role="status"
          className="bg-emerald-600 text-white p-4 rounded-2xl shadow-md flex items-center justify-between gap-3 text-sm sm:text-base font-bold animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🎉</span>
            <span>All stops delivered! Run completed.</span>
          </div>
          <span className="bg-emerald-700/60 text-emerald-100 text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
            Completed
          </span>
        </div>
      )}

      {/* Stop Items */}
      <div className="space-y-2.5">
        {stops.map((stop, index) => {
          // Calculate origin for single leg navigation
          const originPoint =
            index === 0
              ? { lat: start.lat, lng: start.lng }
              : { lat: stops[index - 1].lat, lng: stops[index - 1].lng };

          const destinationPoint = { lat: stop.lat, lng: stop.lng };
          const legUrl = buildSingleLegUrl(originPoint, destinationPoint);

          return (
            <div
              key={stop.id}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all flex items-center justify-between gap-3 shadow-sm ${
                stop.delivered
                  ? "bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-800 opacity-75"
                  : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Visit index badge */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border-2 ${
                    isOptimized
                      ? "bg-blue-600 border-blue-100 text-white dark:bg-blue-700 dark:border-blue-900"
                      : "bg-gray-100 border-gray-200 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  }`}
                >
                  {index + 1}
                </div>

                {/* Stop info */}
                <div className="min-w-0">
                  <p
                    className={`font-bold text-sm sm:text-base truncate text-gray-900 dark:text-gray-100 ${
                      stop.delivered ? "line-through text-gray-500 dark:text-gray-400" : ""
                    }`}
                  >
                    {stop.label}
                  </p>
                  {stop.address && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {stop.address}
                    </p>
                  )}
                  {stop.delivered && (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ Delivered
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Navigate Button */}
                <a
                  href={legUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-3.5 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
                  aria-label={`Navigate to ${stop.label} in Google Maps`}
                >
                  <span>↗</span>
                  <span className="hidden xs:inline">Navigate</span>
                </a>

                {/* Delivered Checkbox */}
                <label
                  htmlFor={`delivered-${stop.id}`}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
                  title="Mark as delivered"
                >
                  <input
                    id={`delivered-${stop.id}`}
                    type="checkbox"
                    checked={stop.delivered}
                    onChange={(e) => onToggleDelivered(stop.id, e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                    aria-label={`Mark ${stop.label} as delivered`}
                  />
                </label>

                {/* Remove Stop Button */}
                <button
                  type="button"
                  onClick={() => onRemoveStop(stop.id)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg"
                  aria-label={`Remove stop ${stop.label}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Route Navigation Links (Split past 9 waypoints if necessary) */}
      {stops.length > 0 && fullRouteLinks.length > 0 && (
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          {fullRouteLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[48px] flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-black text-white dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-xl text-sm font-bold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <span>🗺️</span>
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
