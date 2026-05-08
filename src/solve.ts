// Core logic for Carpool Challenge
import {
  ApiInput,
  Coord,
  GroupStats,
  LocationGrid,
  RideRequest,
} from "./types";

// ---------------------------------------------------------------------------
// Grid helpers
// ---------------------------------------------------------------------------

/**
 * Find where a user is in a location grid. Returns {x, y}.
 *
 * Throws if the id isn't in the grid. The spec promises every non--1 id is
 * a real user so this shouldn't happen, but if it does I'd rather crash
 * than silently average in a fake (0, 0) coordinate.
 */
export function findUserPosition(grid: LocationGrid, id: number): Coord {
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      if (row[x] === id) return { x, y };
    }
  }
  throw new Error(`User id ${id} not found in grid`);
}

// ---------------------------------------------------------------------------
// Group building
// ---------------------------------------------------------------------------

interface RawGroup {
  driverId: number;
  riderIds: number[];
}

/**
 * Walk the request list and build one group per driver. Skip rejected
 * requests. Using a Set for the riders so duplicates don't get counted
 * twice in the average.
 */
export function buildGroups(requests: RideRequest[]): RawGroup[] {
  const driverToRiders = new Map<number, Set<number>>();

  for (const req of requests) {
    if (!req.accepted) continue;

    // get-or-create the rider set for this driver
    const riders = driverToRiders.get(req.driver) ?? new Set<number>();
    riders.add(req.rider);
    driverToRiders.set(req.driver, riders);
  }

  return Array.from(driverToRiders, ([driverId, riderSet]) => ({
    driverId,
    riderIds: Array.from(riderSet),
  }));
}

// ---------------------------------------------------------------------------
// Coordinate math
// ---------------------------------------------------------------------------

/**
 * Average the positions of a list of users in a grid, with the result
 * floored
 */
export function averageCoord(ids: number[], grid: LocationGrid): Coord {
  if (ids.length === 0) {
    throw new Error("Cannot average an empty list of ids");
  }

  let sumX = 0;
  let sumY = 0;
  for (const id of ids) {
    const pos = findUserPosition(grid, id);
    sumX += pos.x;
    sumY += pos.y;
  }

  return {
    x: Math.floor(sumX / ids.length),
    y: Math.floor(sumY / ids.length),
  };
}

//Manhattan distance: |x1 - x2| + |y1 - y2|
export function manhattan(a: Coord, b: Coord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// ---------------------------------------------------------------------------
// Put Together: the main solve() function
// ---------------------------------------------------------------------------

/**
 * Build the full GroupStats for one group - averages over driver + all riders
 * in both grids
 */
export function computeGroupStats(
  group: RawGroup,
  pickup: LocationGrid,
  dropoff: LocationGrid,
): GroupStats {
  // The driver counts as part of the group for the averages
  const allIds = [group.driverId, ...group.riderIds];
  return {
    driverId: group.driverId,
    riderIds: group.riderIds,
    averagePickup: averageCoord(allIds, pickup),
    averageDropoff: averageCoord(allIds, dropoff),
  };
}

/**
 * Build groups -> compute stats -> sort by Manhattan istance ascending.
 */
export function solve(input: ApiInput): GroupStats[] {
  const groups = buildGroups(input.requests);
  const stats = groups.map((g) =>
    computeGroupStats(g, input.pickupLocations, input.dropoffLocations),
  );

  // Cache the distance per group
  return stats
    .map((s) => ({ stats: s, dist: manhattan(s.averagePickup, s.averageDropoff) }))
    .sort((a, b) => a.dist - b.dist)
    .map((wrapped) => wrapped.stats);
}