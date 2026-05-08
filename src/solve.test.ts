// Tests for solve.ts. Kept it dependency-free
// just a tiny assertEqual helper and the sample data

import { ApiInput, GroupStats } from "./types";
import {
  averageCoord,
  buildGroups,
  findUserPosition,
  manhattan,
  solve,
} from "./solve";

let passed = 0;
let failed = 0;

// Compare using JSON.stringify so deep equality just works for nested objects
// and arrays. Good enough since both sides are built the same way
function assertEqual<T>(actual: T, expected: T, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}`);
    console.log(`        expected: ${e}`);
    console.log(`        actual:   ${a}`);
  }
}

// ---------------------------------------------------------------------------
// Sample data copied from challenge spec
// ---------------------------------------------------------------------------

const sample: ApiInput = {
  users: [
    { name: "Sloane", id: 1, role: 1 },
    { name: "Ikora", id: 2, role: 0 },
    { name: "Zavala", id: 3, role: 0 },
    { name: "Cayde", id: 4, role: 0 },
    { name: "Saint", id: 5, role: 1 },
    { name: "Osiris", id: 6, role: 1 },
    { name: "Eris", id: 7, role: 0 },
    { name: "Elsie", id: 8, role: 0 },
    { name: "Ana", id: 9, role: 0 },
    { name: "Drifter", id: 10, role: 0 },
  ],
  pickupLocations: [
    [-1, -1, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, 9, -1, -1, -1, -1, -1],
    [-1, -1, -1, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, 6, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, 2, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 5, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, 4, -1, -1, -1, -1, -1, -1, -1, 10, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, 7, -1, -1, -1, 3, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  ],
  dropoffLocations: [
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 3, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, 8, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 6, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 5, -1, -1, -1],
    [-1, -1, -1, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, 9, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
  ],
  requests: [
    { rider: 2, driver: 1, accepted: true },
    { rider: 8, driver: 1, accepted: true },
    { rider: 9, driver: 1, accepted: true },
    { rider: 3, driver: 5, accepted: true },
    { rider: 4, driver: 5, accepted: true },
    { rider: 7, driver: 6, accepted: true },
    { rider: 10, driver: 6, accepted: true },
    { rider: 4, driver: 1, accepted: false },
    { rider: 4, driver: 6, accepted: false },
    { rider: 7, driver: 1, accepted: false },
  ],
};

// Expected output from the spec, already in the order solve() should produce
// (ascending by Manhattan distance)
const expected: GroupStats[] = [
  {
    driverId: 5,
    riderIds: [3, 4],
    averagePickup: { x: 9, y: 9 },
    averageDropoff: { x: 9, y: 7 },
  },
  {
    driverId: 6,
    riderIds: [7, 10],
    averagePickup: { x: 10, y: 8 },
    averageDropoff: { x: 6, y: 7 },
  },
  {
    driverId: 1,
    riderIds: [2, 8, 9],
    averagePickup: { x: 5, y: 2 },
    averageDropoff: { x: 8, y: 7 },
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

console.log("findUserPosition");
assertEqual(
  findUserPosition(sample.pickupLocations, 1),
  { x: 2, y: 0 },
  "user 1 in pickup grid",
);
assertEqual(
  findUserPosition(sample.pickupLocations, 7),
  { x: 8, y: 13 },
  "user 7 in pickup grid",
);

console.log("manhattan");
assertEqual(manhattan({ x: 0, y: 0 }, { x: 3, y: 4 }), 7, "(0,0) to (3,4)");
assertEqual(manhattan({ x: 5, y: 5 }, { x: 5, y: 5 }), 0, "same point");

console.log("buildGroups");
// Sort the result before comparing - buildGroups doesn't promise any order
const groups = buildGroups(sample.requests);
const groupsSorted = groups
  .map((g) => ({ driverId: g.driverId, riderIds: [...g.riderIds].sort((a, b) => a - b) }))
  .sort((a, b) => a.driverId - b.driverId);
assertEqual(
  groupsSorted,
  [
    { driverId: 1, riderIds: [2, 8, 9] },
    { driverId: 5, riderIds: [3, 4] },
    { driverId: 6, riderIds: [7, 10] },
  ],
  "rejected requests excluded, drivers grouped correctly",
);

console.log("averageCoord");
// Driver 1's group on pickup grid: ids 1,2,8,9 at (2,0), (7,5), (3,2), (9,1)
// sums: x=21, y=8, average is 5.25, 2.0, floored to 5, 2
assertEqual(
  averageCoord([1, 2, 8, 9], sample.pickupLocations),
  { x: 5, y: 2 },
  "driver 1 group pickup average (floors 5.25 to 5)",
);

console.log("solve (full sample)");
const result = solve(sample);

assertEqual(
  result.length,
  expected.length,
  "produces correct number of groups",
);

// Spec says rider ids can be in any order, so sort them before comparing
function normalize(g: GroupStats): GroupStats {
  return { ...g, riderIds: [...g.riderIds].sort((a, b) => a - b) };
}
for (let i = 0; i < expected.length; i++) {
  assertEqual(
    normalize(result[i]),
    normalize(expected[i]),
    `group at sorted index ${i} matches expected`,
  );
}

// sanity-checks the sort - distances should be non-decreasing
const dists = result.map((g) => manhattan(g.averagePickup, g.averageDropoff));
const isSortedAsc = dists.every((d, i) => i === 0 || dists[i - 1] <= d);
assertEqual(isSortedAsc, true, `groups sorted ascending by Manhattan distance (${dists.join(", ")})`);

// ---------------------------------------------------------------------------
// Summary of passed and failed tests
// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);