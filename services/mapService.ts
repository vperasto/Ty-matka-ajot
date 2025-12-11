import { Coordinates, RouteSummary } from "../types";

interface NominatimResult {
    display_name: string;
    lat: string;
    lon: string;
    address?: {
        road?: string;
        pedestrian?: string;
        highway?: string;
        street?: string;
        house_number?: string;
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
    };
}

// Helper to format address consistently
const formatAddressName = (item: NominatimResult): string => {
    if (item.address) {
        const road = item.address.road || item.address.pedestrian || item.address.highway || item.address.street || "";
        const number = item.address.house_number || "";
        const city = item.address.city || item.address.town || item.address.village || item.address.municipality || "";
        
        if (road) {
            let name = road;
            if (number) name += ` ${number}`;
            if (city) name += `, ${city}`;
            return name.trim();
        }
    }
    return item.display_name.split(',')[0]; 
};

export const searchAddress = async (query: string): Promise<{ name: string; coords: Coordinates }[]> => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=fi&limit=5&addressdetails=1`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Geocoding failed");
    
    const data = await response.json() as NominatimResult[];
    
    return data.map((item) => ({
      name: formatAddressName(item),
      coords: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
    }));
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
};

export const reverseGeocode = async (coords: Coordinates): Promise<string> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&addressdetails=1`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Reverse geocoding failed");
    
    const data = await response.json() as NominatimResult;
    return formatAddressName(data);
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return "Tuntematon sijainti";
  }
};

// --- ROUTING ENGINE (ORS ONLY) ---

export const fetchRoute = async (waypoints: Coordinates[]): Promise<RouteSummary | null> => {
  if (waypoints.length < 2) return null;

  const coords = waypoints.map(wp => [wp.lng, wp.lat]);

  const url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImY0ODJmOGM4NDMwZTQyMjViODI0MTc4ZjdhMzY5YTMyIiwiaCI6Im11cm11cjY0In0="
      },
      body: JSON.stringify({
        coordinates: coords,
        instructions: false
      })
    });

    if (!response.ok) {
      console.warn("ORS failed with status:", response.status);
      return null;
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.warn("ORS returned no routes");
      return null;
    }

    const feature = data.features[0];

    const distance = feature.properties.summary.distance;
    const duration = feature.properties.summary.duration;

    const geometry = feature.geometry.coordinates.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (coord: number[]) => [coord[1], coord[0]] as [number, number]
    );

    const route: RouteSummary = {
      distance,
      duration,
      geometry
    };

    return route;
  } catch (err) {
    console.warn("ORS network error:", err);
    return null;
  }
};