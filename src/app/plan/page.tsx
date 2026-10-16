"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AddressSearch } from "@/components/AddressSearch";
import { useToast } from "@/components/Toast";
import { createRun } from "@/lib/apiClient";
import type { GeocodeResult, VehicleType } from "@/types";

export default function PlanPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState("Morning run");
  const [vehicleType, setVehicleType] = useState<VehicleType>("motorbike");
  const [returnToStart, setReturnToStart] = useState(false);
  const [startPoint, setStartPoint] = useState<GeocodeResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Please provide a name for this run.", "error");
      return;
    }
    if (!startPoint) {
      showToast("Please select a starting point using the search box.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const newRun = await createRun({
        name: name.trim(),
        vehicleType,
        returnToStart,
        start: {
          label: startPoint.label,
          lat: startPoint.lat,
          lng: startPoint.lng,
        },
      });

      router.push(`/runs/${newRun.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to create run", "error");
      setIsSubmitting(false);
    }
  };

  const vehicles: { type: VehicleType; label: string; icon: string }[] = [
    { type: "motorbike", label: "Motorbike", icon: "🏍️" },
    { type: "car", label: "Car", icon: "🚗" },
    { type: "van", label: "Van", icon: "🚐" },
  ];

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-4 py-8">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            Plan a new delivery run
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Set up your vehicle and starting depot to begin adding stops.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Run Name */}
          <div>
            <label
              htmlFor="run-name"
              className="block text-sm font-semibold mb-1.5 text-gray-800 dark:text-gray-200"
            >
              Run name
            </label>
            <input
              id="run-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lekki morning deliveries"
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Vehicle Type Toggle */}
          <div>
            <span className="block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
              Vehicle type
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {vehicles.map((v) => (
                <button
                  key={v.type}
                  type="button"
                  onClick={() => setVehicleType(v.type)}
                  className={`min-h-[56px] p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 font-bold text-sm transition-all ${
                    vehicleType === v.type
                      ? "border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-500 shadow-sm"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                  aria-pressed={vehicleType === v.type}
                >
                  <span className="text-xl">{v.icon}</span>
                  <span>{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Return to Start Switch */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
            <div>
              <span className="block font-bold text-sm text-gray-900 dark:text-white">
                Return to start depot
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                End route back at your starting point (round trip)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px]">
              <input
                type="checkbox"
                checked={returnToStart}
                onChange={(e) => setReturnToStart(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-600 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Start Point Address Search */}
          <div className="space-y-2">
            <AddressSearch
              id="start-address"
              label="Starting depot / hub location"
              placeholder="Search Lagos address (e.g. Ikeja, Yaba, Lekki)..."
              onSelect={(res) => setStartPoint(res)}
            />

            {startPoint && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 text-sm">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="font-bold text-emerald-600 shrink-0">📍 Selected Hub:</span>
                  <span className="font-semibold truncate">{startPoint.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStartPoint(null)}
                  className="min-h-[44px] min-w-[44px] text-xs font-bold text-emerald-700 hover:text-red-600 dark:text-emerald-400 dark:hover:text-red-400 p-2"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !startPoint}
            className="w-full min-h-[52px] py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
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
                <span>Creating run...</span>
              </>
            ) : (
              <span>Create run & add stops →</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
