"use client";

import React, { useState, useEffect, useRef } from "react";
import type { GeocodeResult } from "@/types";
import { geocode } from "@/lib/apiClient";

interface AddressSearchProps {
  onSelect: (result: GeocodeResult) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  disabled?: boolean;
}

export function AddressSearch({
  onSelect,
  placeholder = "Search Lagos street or area...",
  label = "Search address",
  id = "address-search",
  disabled = false,
}: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [hasSearched, setHasSearched] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search effect (400ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      setHasSearched(false);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const data = await geocode(trimmed);
        setResults(data.slice(0, 5));
        setHasSearched(true);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to search address");
        setResults([]);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" && results.length > 0) {
        setIsOpen(true);
        setSelectedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleSelect = (item: GeocodeResult) => {
    onSelect(item);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={id} className="block text-sm font-semibold mb-1.5 text-gray-800 dark:text-gray-200">
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 || error || (hasSearched && query.trim().length >= 3)) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${id}-results`}
          aria-activedescendant={
            selectedIndex >= 0 ? `${id}-item-${selectedIndex}` : undefined
          }
          className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-base dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        />
        {isLoading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none" aria-label="Loading">
            <svg
              className="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </div>
        )}
      </div>

      {isOpen && (
        <div
          id={`${id}-results`}
          className="absolute z-30 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden dark:bg-gray-800 dark:border-gray-700 max-h-72 overflow-y-auto"
        >
          {isLoading && results.length === 0 && (
            <div className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">
              Searching Lagos addresses...
            </div>
          )}

          {error && (
            <div className="p-4 text-sm text-center text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {!isLoading && !error && hasSearched && results.length === 0 && (
            <div className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">
              No addresses found for &quot;{query}&quot;
            </div>
          )}

          {results.length > 0 && (
            <ul role="listbox" className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {results.map((result, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <li
                    key={`${result.lat}-${result.lng}-${idx}`}
                    id={`${id}-item-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                    onClick={() => handleSelect(result)}
                    className={`min-h-[44px] px-4 py-3 cursor-pointer flex flex-col justify-center transition-colors text-left ${
                      isSelected
                        ? "bg-blue-50 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100"
                        : "hover:bg-gray-50 text-gray-800 dark:text-gray-200 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <span className="font-medium text-sm sm:text-base leading-snug">
                      {result.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
