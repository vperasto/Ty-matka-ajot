export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Waypoint {
  id: string;
  name: string;
  coords: Coordinates;
  isDraggable?: boolean;
}

export interface RouteSummary {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: [number, number][]; // Array of [lat, lng]
}

export interface Preset {
  id: string;
  label: string;
  address: string;
}

// Replaced enum with const object for better compatibility
export const LocationPreset = {
  LAPUA: 'LAPUA',
  SEINAJOKI: 'SEINAJOKI'
} as const;

export type LocationPreset = typeof LocationPreset[keyof typeof LocationPreset];