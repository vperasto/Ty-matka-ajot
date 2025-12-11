import { Coordinates } from "./types";

export const LAPUA_COORDS: Coordinates = {
  lat: 62.9693,
  lng: 23.0068, // Corrected from 13.0068 (Sweden) to 23.0068 (Finland)
};

export const SEINAJOKI_COORDS: Coordinates = {
  lat: 62.7877,
  lng: 22.8549,
};

export const DEFAULT_ZOOM = 13; // Zoomed in a bit closer to Lapua by default
export const MAX_ZOOM = 18;

// Stylized Map Tile Layer (OSM standard, filters applied in CSS)
export const TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_LAYER_ATTRIB = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';