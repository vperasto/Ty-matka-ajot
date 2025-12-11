import { Coordinates } from "./types";

// --- API KEYS ---
// HAE ILMAINEN AVAIN TÄÄLTÄ: https://openrouteservice.org/dev/#/signup
// Liitä avain lainausmerkkien väliin (esim. "5b3ce359...")
// Jos tämä on tyhjä, sovellus käyttää epävakaata julkista OSRM-palvelinta.
export const OPENROUTESERVICE_API_KEY: string = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImY0ODJmOGM4NDMwZTQyMjViODI0MTc4ZjdhMzY5YTMyIiwiaCI6Im11cm11cjY0In0="; 

export const LAPUA_COORDS: Coordinates = {
  lat: 62.9693,
  lng: 23.0068, 
};

export const SEINAJOKI_COORDS: Coordinates = {
  lat: 62.7877,
  lng: 22.8549,
};

export const DEFAULT_ZOOM = 13; 
export const MAX_ZOOM = 18;

// Stylized Map Tile Layer (OSM standard, filters applied in CSS)
export const TILE_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_LAYER_ATTRIB = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';