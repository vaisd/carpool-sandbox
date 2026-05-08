/** Type definitions for the Carpool API's input and output JSON shapes. */
export type Role = 0 | 1; 

export interface User {
  id: number;
  name: string;
  role: Role;
}

export interface RideRequest {
  rider: number;
  driver: number;
  accepted: boolean;
}

// 2D grid where each cell is either a user id or -1 if "empty".
// Indexed as grid[y][x] where y is row, x column.
export type LocationGrid = number[][];

export interface ApiInput {
  users: User[];
  pickupLocations: LocationGrid;
  dropoffLocations: LocationGrid;
  requests: RideRequest[];
}

export interface Coord {
  x: number;
  y: number;
}

// The output shape used in POST
export interface GroupStats {
  driverId: number;
  riderIds: number[];
  averagePickup: Coord;
  averageDropoff: Coord;
}