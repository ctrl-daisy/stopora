# Stopora Route Optimization Algorithm Guide

This document is the team study guide for understanding and defending the route optimization algorithms implemented in Stopora (`src/lib/engine/`).

---

## 1. The Travelling Salesperson Problem (TSP)

### What is the problem?
In logistics and delivery dispatch, a driver begins at a depot or start location (Point `0`), visits a designated set of delivery stops, and either:
1. **Round Trip**: Returns to the depot (Point `0`).
2. **Open Route**: Finishes the day at the final delivery stop without returning.

The goal is to determine the sequence of stops that minimizes the total travel cost (road distance in metres or travel duration in seconds). In computer science and operations research, this is known as the **Travelling Salesperson Problem (TSP)**.

### Why real road networks are Asymmetric
In textbook TSP examples, distances are often assumed to be symmetric: the distance from point $A$ to point $B$ is identical to the distance from $B$ to $A$ ($d(A, B) = d(B, A)$).

On real roads in Lagos, Nigeria, distance and travel times are almost always **asymmetric**:
- **One-way streets** (common on Lagos Island, Victoria Island, and Ikeja).
- **Divided expressways** (e.g., Third Mainland Bridge, Lekki-Epe Expressway, Ikorodu Road) requiring drivers to travel kilometers to a designated U-turn.
- **Traffic bottlenecks and roundabouts**.

Therefore, $d(A, B) \ne d(B, A)$. Every algorithm in Stopora's engine is built from the ground up to correctly handle **directed, asymmetric cost matrices**.

---

## 2. Why Brute Force Fails (Factorial Explosion)

The most naive approach to finding the shortest route is to test every possible permutation of stops and pick the shortest.

If there are $n$ delivery stops following the start point:
- The first stop has $n$ choices.
- The second stop has $n - 1$ choices.
- The third stop has $n - 2$ choices.
- Total possible permutations = $n!$ (n factorial).

| Number of Delivery Stops ($n$) | Total Permutations ($n!$) | Time at 1,000,000 routes/sec |
| :--- | :--- | :--- |
| 4 | 24 | Instantaneous (< 0.03 ms) |
| 6 | 720 | Instantaneous (< 1 ms) |
| 8 | 40,320 | ~40 ms |
| 10 | 3,628,800 | ~3.6 seconds |
| **12 (Stopora Max)** | **479,001,600** | **~8 minutes of 100% CPU lockup** |
| 15 | 1,307,674,368,000 | ~15.1 days |
| 20 | $2.43 \times 10^{18}$ | ~77,000 years |

For a dispatcher waiting on a smartphone in Lagos, an 8-minute wait is unacceptable. If multiple dispatchers request routes simultaneously, the server would crash.

---

## 3. Held-Karp Dynamic Programming (Exact Optimal)

To solve the problem optimally and instantly for up to 12 stops, Stopora uses the **Bellman-Held-Karp algorithm** (1962).

### The Core Insight: Optimal Substructure
Suppose a driver visits the subset of stops $\{1, 3, 5\}$ and is currently standing at stop $5$. 
It does not matter whether the driver visited $0 \to 1 \to 3 \to 5$ or $0 \to 3 \to 1 \to 5$ in the past; going forward, the future cost to visit the remaining stops depends **only** on:
1. The **set** of stops already visited ($\{1, 3, 5\}$).
2. The **current stop** where the driver is located ($5$).

We only need to record the *single minimum cost* to reach stop $5$ having visited the subset $\{1, 3, 5\}$. We discard all other suboptimal paths through that subset!

### Bitmask Representation
A subset of visited stops is represented compactly as an integer bitmask:
- Bit $k$ is $1$ if stop $k$ has been visited.
- Bit $k$ is $0$ if stop $k$ has not been visited.
- Since Point $0$ is always visited first, bit $0$ is always $1$ (mask is odd).

For $N = 13$ points (1 start + 12 stops):
- Maximum mask value is $2^{13} - 1 = 8,191$.
- Total number of subsets is $2^{13} = 8,192$.

### Recurrence Relation
Let $dp(mask, u)$ be the minimum cost of a path that starts at Point $0$, visits all vertices present in $mask$, and terminates at vertex $u$ ($u \in mask, u \ne 0$):

$$dp(mask, u) = \min_{v \in mask \setminus \{u\}} \Big( dp(mask \setminus \{u\}, v) + distances[v][u] \Big)$$

- **Base Case**:
  Only Point $0$ is visited: $mask = 1$ ($2^0$).
  $$dp(1, 0) = 0$$
  For all $u \ne 0$: $dp(1, u) = \infty$.

- **Subproblem Ordering**:
  Because $(mask \setminus \{u\}) < mask$ for all $u > 0$, iterating $mask$ in standard ascending integer order ($1, 3, 5, \dots, 2^N - 1$) guarantees that any subproblem $dp(mask \setminus \{u\}, v)$ is already solved before it is accessed.

### Worked Example (4 Points: Start 0, Stops 1, 2, 3)

Let distances between 4 points be:
```
From \ To    0    1    2    3
0          [ 0,  10,  15,  20 ]
1          [ 10,  0,  35,  25 ]
2          [ 15, 35,   0,  30 ]
3          [ 20, 25,  30,   0 ]
```

1. **Size 1 (Base Case, mask = 0001₂ = 1)**:
   - $dp(1, 0) = 0$

2. **Size 2 (mask with 2 bits set including bit 0)**:
   - $mask = 3$ ($0011_2$, stops $\{0, 1\}$): $dp(3, 1) = dp(1, 0) + distances[0][1] = 0 + 10 = 10$, parent = 0
   - $mask = 5$ ($0101_2$, stops $\{0, 2\}$): $dp(5, 2) = dp(1, 0) + distances[0][2] = 0 + 15 = 15$, parent = 0
   - $mask = 9$ ($1001_2$, stops $\{0, 3\}$): $dp(9, 3) = dp(1, 0) + distances[0][3] = 0 + 20 = 20$, parent = 0

3. **Size 3 (mask with 3 bits set)**:
   - For $mask = 7$ ($0111_2$, stops $\{0, 1, 2\}$):
     - End at 1: from 2 $\to dp(5, 2) + distances[2][1] = 15 + 35 = 50$
     - End at 2: from 1 $\to dp(3, 1) + distances[1][2] = 10 + 35 = 45$
   - Repeat for all 3-vertex subsets.

4. **Size 4 (fullMask = 15 = 1111₂)**:
   - Evaluate endings at stop 1, 2, and 3:
     - $dp(15, 1) = \min($ from 2: $dp(11, 2) + d[2][1]$, from 3: $dp(13, 3) + d[3][1] )$
     - $dp(15, 2) = \min($ from 1: $dp(7, 1) + d[1][2]$, from 3: $dp(13, 3) + d[3][2] )$
     - $dp(15, 3) = \min($ from 1: $dp(7, 1) + d[1][3]$, from 2: $dp(11, 2) + d[2][3] )$

5. **Closing Leg**:
   - **Open Route**: Choose $u \in \{1, 2, 3\}$ with minimum $dp(15, u)$.
   - **Round Trip**: Choose $u \in \{1, 2, 3\}$ with minimum $dp(15, u) + distances[u][0]$.

6. **Order Reconstruction**:
   Backtrack using `parent[mask, u]` pointers from the chosen ending vertex back to Point 0.

### Computational Complexity

- **Time Complexity**:
  Number of states: $2^N \times N$.
  Transitions per state: $N$.
  Total operations: $\mathcal{O}(N^2 \cdot 2^N)$.
- **Space Complexity**:
  $\mathcal{O}(N \cdot 2^N)$.

For $N = 13$ points (Start + 12 stops):
- Number of states = $8,192 \times 13 = 106,496$.
- In TypeScript, storing this in a flat `Float64Array` takes:
  $$106,496 \times 8 \text{ bytes} \approx 852 \text{ KB}$$
- Storing parent pointers in an `Int8Array` takes:
  $$106,496 \times 1 \text{ byte} \approx 106 \text{ KB}$$
- **Total memory**: Under $1\text{ MB}$. This fits completely into the CPU's L2/L3 hardware cache, which is why Held-Karp finishes in **under 15 milliseconds** in our engine.

---

## 4. Why Switch to Heuristic for > 12 Stops?

Notice how $N^2 \cdot 2^N$ scales:

| Points ($N$) | States ($N \cdot 2^N$) | Operations ($N^2 \cdot 2^N$) | Approximate Run Time |
| :--- | :--- | :--- | :--- |
| 10 | 10,240 | 102,400 | < 1 ms |
| 13 (Stopora Limit) | 106,496 | 1,384,448 | ~10 ms |
| 14 | 229,376 | 3,211,264 | ~35 ms |
| 16 | 1,048,576 | 16,777,216 | ~250 ms |
| 20 | 20,971,520 | 419,430,400 | ~10–30 seconds |

Because the memory and execution time double with every added stop, dynamic programming becomes infeasible past 13 points on web servers.

Stopora provides a **hybrid architecture**:
- **1 to 2 points**: Trivial order (`[0]` or `[0, 1]`).
- **3 to 13 points**: Exact Held-Karp DP (guaranteed 100% optimal).
- **14 to 51 points**: Nearest-Neighbour + 2-opt Heuristic (fast, near-optimal approximation).

Since the user interface enforces a 12-delivery-stop limit, **every real Stopora user gets the mathematically optimal route**. The heuristic exists to safeguard performance if the matrix size is ever increased in future phases.

---

## 5. Nearest-Neighbour + 2-Opt Heuristic

For inputs with 14 or more points, we use a two-phase heuristic:

### Phase 1: Nearest-Neighbour Construction
Beginning at Point 0, iteratively select the closest unvisited stop until all stops are visited.
- Fast ($\mathcal{O}(N^2)$).
- Provides a reasonable initial tour, but often creates suboptimal "crossing paths" towards the end of the run.

### Phase 2: 2-Opt Local Search (Edge Uncrossing)
2-opt systematically takes two non-adjacent segments of the route, breaks them, and reconnects them in reverse order to eliminate crossing paths.

#### Plain Text Diagram of 2-Opt:

```
BEFORE 2-OPT (Crossed Path):
Order: ... -> A -> C -> ... -> B -> D -> ...

       A -----------------------> C
                  \           /
                   \         /
                    \       /
                     \     /
                      \   /
                       \ /
                        X    (Paths cross in space!)
                       / \
                      /   \
                     /     \
                    /       \
                   /         \
                  /           \
       B <----------------------- D

Total Distance: d(A, C) + d(B, D) + internal segments


AFTER 2-OPT (Uncrossed Path):
Order: ... -> A -> B -> ... -> C -> D -> ...
(The subsegment between C and B has been reversed)

       A -----------------------> B
       |                          |
       |     Subsegment (C..B)    |
       |        is reversed       |
       v                          v
       C -----------------------> D

Total Distance: d(A, B) + d(C, D) + reversed internal segments
```

### Why we do NOT use the Symmetric 2-Opt Shortcut
In symmetric TSP textbooks, a 2-opt move is evaluated in $\mathcal{O}(1)$ time using the delta shortcut:
$$\Delta = d(A, B) + d(C, D) - d(A, C) - d(B, D)$$
If $\Delta < 0$, the move is accepted.

**In Lagos road networks, this shortcut produces invalid results!**
When reversing the subsegment from stop $i$ to stop $j$, the internal edges are also traversed in the opposite direction ($u \to v$ becomes $v \to u$). Because of one-way roads and road dividers, $d(v, u)$ may be significantly larger than $d(u, v)$.

**Stopora's Solution:**
Our 2-opt implementation evaluates each candidate reversal by recomputing the actual route cost via `routeCost(candidate, distances, returnToStart)`. 

### Key Rules Followed by the Heuristic
1. **Point 0 is Anchor**: Index 0 is never moved ($1 \le i < j \le N - 1$). The start point remains fixed.
2. **Strict Improvement**: A candidate is only accepted if `candidateCost < currentCost - 1e-9`. This guarantees the tour cost is monotonically decreasing and prevents infinite cycles.
3. **Termination**: The search halts as soon as no improving move exists (a local minimum is reached) or when 2,000 iterations are completed.
4. **Never Worse**: Because every accepted move strictly reduces cost, the heuristic is guaranteed to never be worse than the nearest-neighbour route it started with.
