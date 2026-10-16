// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import {
  SummaryCards,
  formatDuration,
  formatDistanceKm,
  formatNaira,
} from "@/components/SummaryCards";
import type { RouteSummary } from "@/types";

describe("SummaryCards formatting and component", () => {
  it("formats duration correctly in hours and minutes", () => {
    expect(formatDuration(45)).toBe("1m");
    expect(formatDuration(720)).toBe("12m");
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(4500)).toBe("1h 15m");
    expect(formatDuration(7200)).toBe("2h");
  });

  it("formats distance in km with 1 decimal", () => {
    expect(formatDistanceKm(4000)).toBe("4.0");
    expect(formatDistanceKm(18420)).toBe("18.4");
    expect(formatDistanceKm(550)).toBe("0.6");
  });

  it("formats naira amounts correctly with currency symbol", () => {
    expect(formatNaira(850)).toBe("₦850");
    expect(formatNaira(12500)).toBe("₦12,500");
  });

  it("renders metrics properly without naira when fuelPricePerLitre is omitted", () => {
    const summary: RouteSummary = {
      order: [0, 1, 2],
      totalDistanceM: 18400,
      totalDurationS: 3900,
      baselineDistanceM: 25200,
      baselineDurationS: 5400,
      distanceSavedPct: 27.0,
      fuelLitres: 1.65,
      baselineFuelLitres: 2.27,
      algorithm: "held-karp",
    };

    render(<SummaryCards summary={summary} />);

    expect(screen.getByText("18.4")).toBeDefined();
    expect(screen.getByText("1h 5m")).toBeDefined();
    expect(screen.getByText("27.0%")).toBeDefined();
    expect(screen.queryByText(/Estimated Fuel Savings/i)).toBeNull();
  });

  it("renders naira savings when fuelPricePerLitre is provided", () => {
    const summary: RouteSummary = {
      order: [0, 1, 2],
      totalDistanceM: 18400,
      totalDurationS: 3900,
      baselineDistanceM: 25200,
      baselineDurationS: 5400,
      distanceSavedPct: 27.0,
      fuelLitres: 1.65,
      baselineFuelLitres: 2.65, // 1.00 L saved
      algorithm: "held-karp",
    };

    render(<SummaryCards summary={summary} fuelPricePerLitre={850} />);

    expect(screen.getByText(/Estimated Fuel Savings/i)).toBeDefined();
    expect(screen.getByText("₦850")).toBeDefined();
  });
});
