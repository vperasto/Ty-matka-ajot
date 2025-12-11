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

// Haversine formula to calculate distance between two points in meters
const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d * 1000;
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
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
  
  // Define providers with fallback options.
  const providers = [
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${coordsString}?overview=full&geometries=geojson`,
    `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`,
    `https://osrm.router.lohro.de/route/v1/driving/${coordsString}?overview=full&geometries=geojson`
  ];

  // 1. Try online providers
  for (const url of providers) {
    try {
      const response = await fetch(url, { method: 'GET', mode: 'cors' });
      
      if (!response.ok) {
        console.warn(`Routing provider failed: ${url} with status ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
         console.warn(`Routing provider returned no routes: ${url}`);
         continue;
      }

      const route = data.routes[0];
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const geometry = route.geometry.coordinates.map((coord: any[]) => [coord[1], coord[0]] as [number, number]);

      return {
        distance: route.distance, // meters
        duration: route.duration, // seconds
        geometry: geometry,
        isFallback: false
      };
    } catch (error) {
      console.warn(`Routing network error for ${url}:`, error);
    }
    
    await delay(200);
  }

  // 2. FALLBACK: Straight line calculation if all servers fail
  console.warn("All routing providers failed. Switching to geometric fallback.");
  
  let totalDistance = 0;
  const geometry: [number, number][] = [];
  
  // Create a simple path connecting all waypoints
  geometry.push([waypoints[0].lat, waypoints[0].lng]);
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i+1];
    
    totalDistance += getDistanceFromLatLonInMeters(start.lat, start.lng, end.lat, end.lng);
    geometry.push([end.lat, end.lng]);
  }

  // Estimate duration: Average speed 60km/h = ~16.67 m/s
  // This is a rough guess for the fallback
  const estimatedDuration = totalDistance / 16.67; 

  return {
    distance: totalDistance,
    duration: estimatedDuration,
    geometry: geometry,
    isFallback: true
  };
};