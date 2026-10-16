"use client";

import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { StopRecord } from "@/lib/apiClient";

// Fix default leaflet icon paths
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface PlannerMapProps {
  start: {
    label: string;
    lat: number;
    lng: number;
  };
  stops: StopRecord[];
  isOptimized?: boolean;
  returnToStart?: boolean;
  isPinDropMode?: boolean;
  onPinDrop?: (point: { lat: number; lng: number; label: string }) => void;
}

// Marker Icons
const createStartIcon = () =>
  L.divIcon({
    className: "custom-leaflet-marker",
    html: `<div style="background-color: #059669; color: white; width: 32px; height: 32px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">S</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });

const createStopIcon = () =>
  L.divIcon({
    className: "custom-leaflet-marker",
    html: `<div style="background-color: #2563eb; color: white; width: 26px; height: 26px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 3px 5px rgba(0,0,0,0.25);">📍</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -15],
  });

const createNumberedIcon = (num: number) =>
  L.divIcon({
    className: "custom-leaflet-marker",
    html: `<div style="background-color: #1d4ed8; color: white; width: 32px; height: 32px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">${num}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });

function MapController({
  allPoints,
  isOptimized,
}: {
  allPoints: [number, number][];
  isOptimized: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (allPoints.length > 0 && isOptimized) {
      const bounds = L.latLngBounds(allPoints.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, allPoints, isOptimized]);

  return null;
}

function MapClickHandler({
  isPinDropMode,
  onMapClick,
}: {
  isPinDropMode: boolean;
  onMapClick: (latlng: L.LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      if (isPinDropMode) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

export function PlannerMap({
  start,
  stops,
  isOptimized = false,
  returnToStart = false,
  isPinDropMode = false,
  onPinDrop,
}: PlannerMapProps) {
  const [pinDialog, setPinDialog] = useState<{ lat: number; lng: number } | null>(null);
  const [pinLabel, setPinLabel] = useState("");

  const startCoord: [number, number] = [start.lat, start.lng];

  // Route sequence for polyline
  const routePoints: [number, number][] = [startCoord];
  stops.forEach((s) => {
    routePoints.push([s.lat, s.lng]);
  });
  if (returnToStart && stops.length > 0) {
    routePoints.push(startCoord);
  }

  const handleMapClick = (latlng: L.LatLng) => {
    setPinLabel(`Stop ${stops.length + 1}`);
    setPinDialog({ lat: latlng.lat, lng: latlng.lng });
  };

  const submitPin = () => {
    if (pinDialog && onPinDrop) {
      onPinDrop({
        lat: Number(pinDialog.lat.toFixed(5)),
        lng: Number(pinDialog.lng.toFixed(5)),
        label: pinLabel.trim() || `Stop ${stops.length + 1}`,
      });
      setPinDialog(null);
      setPinLabel("");
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div
        className={`w-full flex-1 relative min-h-[260px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm ${
          isPinDropMode ? "cursor-crosshair ring-2 ring-blue-500" : ""
        }`}
      >
        <MapContainer
          center={[6.5244, 3.3792]} // Central Lagos
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController allPoints={routePoints} isOptimized={isOptimized} />
          <MapClickHandler
            isPinDropMode={isPinDropMode}
            onMapClick={handleMapClick}
          />

          {/* Start Point Marker */}
          <Marker position={startCoord} icon={createStartIcon()}>
            <Popup>
              <div className="text-sm font-semibold text-gray-900">
                <span className="text-emerald-700 font-bold block mb-0.5">Start Hub (S)</span>
                {start.label}
              </div>
            </Popup>
          </Marker>

          {/* Stops Markers */}
          {stops.map((stop, idx) => {
            const num = idx + 1;
            const icon = isOptimized ? createNumberedIcon(num) : createStopIcon();
            return (
              <Marker
                key={stop.id || `stop-${idx}`}
                position={[stop.lat, stop.lng]}
                icon={icon}
              >
                <Popup>
                  <div className="text-sm">
                    <span className="font-bold text-blue-700 block mb-0.5">
                      {isOptimized ? `Stop #${num}` : "Delivery Stop"}
                    </span>
                    <p className="font-semibold text-gray-900">{stop.label}</p>
                    {stop.address && (
                      <p className="text-xs text-gray-500 mt-1">{stop.address}</p>
                    )}
                    {stop.delivered && (
                      <span className="inline-block mt-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        ✓ Delivered
                      </span>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Optimized route polyline */}
          {isOptimized && stops.length > 0 && (
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: "#2563eb",
                weight: 4,
                opacity: 0.85,
                lineJoin: "round",
              }}
            />
          )}
        </MapContainer>

        {isPinDropMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-full shadow-lg pointer-events-none">
            📍 Tap anywhere on the map to place a pin
          </div>
        )}

        {/* Pin confirmation modal */}
        {pinDialog && (
          <div className="absolute inset-0 z-[2000] bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-2xl max-w-sm w-full border border-gray-100 dark:border-gray-700 space-y-4">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <span>📍</span> Add Pinned Stop
              </h3>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Stop Name / Customer Label
                </label>
                <input
                  type="text"
                  autoFocus
                  value={pinLabel}
                  onChange={(e) => setPinLabel(e.target.value)}
                  placeholder="e.g. Customer 4"
                  className="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Coords: {pinDialog.lat.toFixed(4)}, {pinDialog.lng.toFixed(4)}
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setPinDialog(null)}
                  className="min-h-[44px] px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitPin}
                  className="min-h-[44px] px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Add Stop
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isOptimized && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 text-center">
          * Line shows visiting order sequence, not the exact road path.
        </p>
      )}
    </div>
  );
}

export default PlannerMap;
