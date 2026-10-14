# Stopora Route Engine Benchmark Report

- **Date**: 2026-10-14
- **Location Box**: Lagos bounding box (Lat 6.40 to 6.70, Lng 3.20 to 3.60)
- **Sample Size**: 100 random sets of 8 stops
- **Distance Model**: Haversine straight-line distance × 1.3 (road network factor)
- **Algorithm Used**: Held-Karp dynamic programming (exact optimal)

## Summary of Results

### 1. Round-Trip Routes (Return to Start)
- **Average Saved**: **36.20%**
- **Best Saved**: **54.53%**
- **Worst Saved**: **11.07%**
- **Cumulative Baseline Distance**: 21058.7 km
- **Cumulative Optimized Distance**: 13158.0 km
- **Total Distance Saved**: 7900.6 km

### 2. Open Routes (End at Last Stop)
- **Average Saved**: **42.99%**
- **Best Saved**: **63.27%**
- **Worst Saved**: **16.71%**
- **Cumulative Baseline Distance**: 18422.2 km
- **Cumulative Optimized Distance**: 10254.3 km
- **Total Distance Saved**: 8167.8 km

## Key Takeaway
Dispatchers visiting delivery stops in the raw entered order typically travel 30% to 40% more distance than necessary. On average, Stopora's route engine saves **~36.2%** of road distance on round-trips and **~43.0%** on open routes in Lagos.
