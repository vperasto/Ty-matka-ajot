import { Coordinates, RouteSummary } from "../types";

// Helper to wait to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

// Helper to format address consistently as "Street Number, City"
const formatAddressName = (item: NominatimResult): string => {
    if (item.address) {
        const road = item.address.road || item.address.pedestrian || item.address.highway || item.address.street || "";
        const number = item.address.house_number || "";
        const city = item.address.city || item.address.town || item.address.village || item.address.municipality || "";
        
        // If we have a road, construct the address manually to ensure number is included
        if (road) {
            let name = road;
            if (number) name += ` ${number}`;
            if (city) name += `, ${city}`;
            return name.trim();
        }
    }
    
    // Fallback: use the first part of the display name if structured data is partial or missing
    return item.display_name.split(',')[0]; 
};

export const searchAddress = async (query: string): Promise<{ name: string; coords: Coordinates }[]> => {
  try {
    // Adding addressdetails=1 is critical to get the house_number separately
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

export const fetchRoute = async (waypoints: Coordinates[]): Promise<RouteSummary | null> => {
  if (waypoints.length < 2) return null;

  const coordsString = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
  
  // Using the reliable German OSM server.
  // CRITICAL FIX: continue_straight=false allowed the routing engine to make a U-turn at a waypoint.
  // This is essential for A -> B -> A type routes so it doesn't loop around a block.
  const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coordsString}?overview=full&geometries=geojson&continue_straight=false`;

  try {
    const response = await fetch(url, { method: 'GET', mode: 'cors' });
    
    if (!response.ok) {
      console.warn(`Routing provider failed: ${url} with status ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
        console.warn(`Routing provider returned no routes: ${url}`);
        return null;
    }

    const route = data.routes[0];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geometry = route.geometry.coordinates.map((coord: any[]) => [coord[1], coord[0]] as [number, number]);

    return {
      distance: route.distance, // meters
      duration: route.duration, // seconds
      geometry: geometry
    };
  } catch (error) {
    console.warn(`Routing network error for ${url}:`, error);
    return null;
  }
};