// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { AddressSearch } from "@/components/AddressSearch";
import * as apiClient from "@/lib/apiClient";

describe("AddressSearch component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("does not fetch when query has fewer than 3 characters", async () => {
    const geocodeSpy = vi.spyOn(apiClient, "geocode").mockResolvedValue([]);
    render(<AddressSearch onSelect={vi.fn()} />);

    const input = screen.getByLabelText("Search address");
    fireEvent.change(input, { target: { value: "Ya" } });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(geocodeSpy).not.toHaveBeenCalled();
  });

  it("debounces by 400ms before calling geocode", async () => {
    const geocodeSpy = vi.spyOn(apiClient, "geocode").mockResolvedValue([
      { label: "Yaba, Lagos", lat: 6.5095, lng: 3.3711 },
    ]);
    render(<AddressSearch onSelect={vi.fn()} />);

    const input = screen.getByLabelText("Search address");
    fireEvent.change(input, { target: { value: "Yaba" } });

    // Not yet called at 200ms
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(geocodeSpy).not.toHaveBeenCalled();

    // Called after 400ms
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    expect(geocodeSpy).toHaveBeenCalledWith("Yaba");
  });

  it("renders results and calls onSelect when clicked", async () => {
    const mockResults = [
      { label: "Lekki Phase 1", lat: 6.4474, lng: 3.47 },
      { label: "Lekki Toll Gate", lat: 6.435, lng: 3.45 },
    ];
    vi.spyOn(apiClient, "geocode").mockResolvedValue(mockResults);

    const onSelect = vi.fn();
    render(<AddressSearch onSelect={onSelect} />);

    const input = screen.getByLabelText("Search address");
    fireEvent.change(input, { target: { value: "Lekki" } });

    await act(async () => {
      vi.advanceTimersByTime(450);
    });

    // Check results are rendered
    const item = screen.getByText("Lekki Phase 1");
    expect(item).toBeDefined();

    // Click item
    act(() => {
      fireEvent.click(item);
    });
    expect(onSelect).toHaveBeenCalledWith(mockResults[0]);
  });
});
