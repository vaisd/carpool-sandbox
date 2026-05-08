# Caterpillar Challenge — Solution

My solution to the Sandbox Caterpillar take-home challenge written in Typescript. 
It pulls down carpool data, rebuilds the groups, computes the averages and then POSTs result back. 

## Running it

Need Node 18 or later

```bash
npm install
npm test                          # runs against the sample data from the spec
npm start -- "<unique-url>"         # GET, solve, POST
```

## Project layout

```
src/
  types.ts         Type definitions for input, output, and intermediate shapes
  solve.ts         Pure functions: grid lookup, group building, averaging,
                   Manhattan distance, sorting
  solve.test.ts    Lightweight test runner 
  index.ts         I/O entry point: GET → solve → POST
```

## Design decisions I made

**Math.floor vs Math.round.** The spec says decimals get "rounded down" 
which is `Math.floor` and not `Math.round`. Using the wrong one would lead to 
silently disagree on certain inputs.

**Grid coordinates.** The spec defines x/y with origin at top-left, so a 
2D array indexed as `grid[y][x]` (row first, then column).

**Using a Set inside buildGroups.** The spec promises each rider only 
shows up once, but I used `Map<driverId, Set<riderId>>` instead of 
`Map<driverId, riderId[]>` anyway. If a duplicate ever did sneak in, an 
array would double-count the rider in the average. The Set just doesn't.

**Throw for missing ids** `findUserPosition` throws if it can't find an id,
instead of returning `null` or `(0, 0)` instead of returning null or (0, 0). Spec says every non--1 id is a real user, so if it's missing, the input's broken and I'd rather crash than quietly average in a fake position.

## Testing

`npm test` runs against the exact sample data from the spec and checks:

- Grid lookups return proper `(x, y)`
- Manhattan distance is computed correctly
- `buildGroups` excludes rejected requests and groups by driver correctly
- `averageCoord` floors `5.25` to `5` 
- Full `solve` output matches the expected output
- The result is sorted ascending by Manhattan distance between the average
  pickup and average dropoff.

All 11 assertions pass.