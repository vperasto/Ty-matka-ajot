import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Coordinates, Waypoint, RouteSummary } from '../types';
import { reverseGeocode } from '../services/mapService';
import { TILE_LAYER_URL, TILE_LAYER_ATTRIB, LAPUA_COORDS, DEFAULT_ZOOM } from '../constants';

// Use CDN URLs for markers
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
  waypoints: Waypoint[];
  route: RouteSummary | null;
  onMapClick: (wp: Waypoint) => void;
  onWaypointMove?: (id: string, newCoords: Coordinates) => void;
}

// Component to handle map clicks
const MapClickHandler: React.FC<{ onAddWaypoint: (wp: Waypoint) => void }> = ({ onAddWaypoint }) => {
  const [isAdding, setIsAdding] = useState(false);

  useMapEvents({
    click: async (e) => {
      if (isAdding) return; 
      setIsAdding(true);
      const coords: Coordinates = { lat: e.latlng.lat, lng: e.latlng.lng };
      const name = await reverseGeocode(coords);
      
      onAddWaypoint({
        id: Date.now().toString(),
        name,
        coords
      });
      setIsAdding(false);
    },
  });
  return null;
};

// Component to adjust view bounds
const RouteFitter: React.FC<{ route: RouteSummary | null, waypoints: Waypoint[] }> = ({ route, waypoints }) => {
  const map = useMap();

  useEffect(() => {
    if (route && route.geometry.length > 0) {
      const bounds = L.latLngBounds(route.geometry);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (waypoints.length > 0) {
        const last = waypoints[waypoints.length - 1];
        map.panTo([last.coords.lat, last.coords.lng]);
    }
  }, [route, waypoints.length, map]); 

  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({ waypoints, route, onMapClick, onWaypointMove }) => {
  
  const polylineOptions = {
    color: 'black',
    weight: 4,
    opacity: 0.8
  };

  return (
    <div className="h-full w-full border-2 border-black grayscale-map relative z-0">
      <MapContainer 
        center={[LAPUA_COORDS.lat, LAPUA_COORDS.lng]} 
        zoom={DEFAULT_ZOOM} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution={TILE_LAYER_ATTRIB}
          url={TILE_LAYER_URL}
        />
        
        <ZoomControl position="bottomright" />

        {/* Markers */}
        {waypoints.map((wp, index) => (
          <Marker 
            key={wp.id} 
            position={[wp.coords.lat, wp.coords.lng]}
            draggable={true}
            eventHandlers={{
                dragend: (e) => {
                    if (onWaypointMove) {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        onWaypointMove(wp.id, { lat: position.lat, lng: position.lng });
                    }
                }
            }}
          >
            <Popup className="font-serif">
              <div className="text-center">
                <span className="font-bold block border-b-2 border-black mb-2 pb-1 text-sm">
                  ETAPPI {index + 1}
                </span>
                <span className="text-sm">{wp.name}</span>
                <div className="text-[10px] text-gray-500 mt-2 font-mono uppercase border-t border-dashed border-gray-400 pt-1">
                  Raahaa siirtääksesi
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route Line */}
        {route && (
          <Polyline 
            positions={route.geometry} 
            pathOptions={polylineOptions} 
          />
        )}

        <MapClickHandler onAddWaypoint={onMapClick} />
        <RouteFitter route={route} waypoints={waypoints} />
      </MapContainer>
      
      {/* Provider Info Badge - Now hardcoded to ORS as it is the only one */}
      <div className={`absolute top-4 right-14 md:right-4 z-[400] border-2 border-black px-2 py-1 font-mono text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white`}>
        DATA: ORS
      </div>
    </div>
  );
};