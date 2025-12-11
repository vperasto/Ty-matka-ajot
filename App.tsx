import React, { useState, useEffect, useRef } from 'react';
import { MapComponent } from './components/MapComponent';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { Waypoint, RouteSummary, Coordinates, Preset } from './types';
import { fetchRoute, searchAddress, reverseGeocode } from './services/mapService';
import { changelogData } from './data/changelog';

interface SearchResultItem {
  name: string;
  coords: Coordinates;
}

const App: React.FC = () => {
  // State
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [routeData, setRouteData] = useState<RouteSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Drag and Drop State
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Clear Confirmation State
  const [confirmClear, setConfirmClear] = useState(false);

  // Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  // Preset State - Lazy load from localStorage to ensure data is available immediately
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const saved = localStorage.getItem('lapua-logistics-presets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load presets", e);
      return [];
    }
  });

  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetAddress, setNewPresetAddress] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Auto-save presets to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('lapua-logistics-presets', JSON.stringify(presets));
  }, [presets]);

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim() || !newPresetAddress.trim()) return;

    const newPreset: Preset = {
      id: Date.now().toString(),
      label: newPresetName.trim(),
      address: newPresetAddress.trim()
    };

    setPresets(prev => [...prev, newPreset]);
    setNewPresetName('');
    setNewPresetAddress('');
    
    // Show temporary success message
    setSaveMessage('Tallennettu!');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const handleDeletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  };

  // Calculate Route Effect
  useEffect(() => {
    const getRoute = async () => {
      if (waypoints.length < 2) {
        setRouteData(null);
        return;
      }
      setLoadingRoute(true);
      
      const coords = waypoints.map(wp => wp.coords);
      const data = await fetchRoute(coords);
      
      setRouteData(data);
      setLoadingRoute(false);
    };

    // Debounce slightly to prevent thrashing
    const timer = setTimeout(() => {
      getRoute();
    }, 500);

    return () => clearTimeout(timer);
  }, [waypoints]);

  // Handlers
  const handleAddWaypoint = (wp: Waypoint) => {
    setWaypoints(prev => [...prev, wp]);
  };

  const handleRemoveWaypoint = (id: string) => {
    setWaypoints(prev => prev.filter(wp => wp.id !== id));
  };

  const handleClearRouteClick = () => {
    if (confirmClear) {
      // Confirmed action
      setWaypoints([]);
      setRouteData(null);
      setConfirmClear(false);
    } else {
      // Initiate confirmation
      setConfirmClear(true);
      // Reset confirmation state after 3 seconds if not clicked
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const handleMoveWaypoint = (index: number, direction: 'up' | 'down') => {
    const newWaypoints = [...waypoints];
    if (direction === 'up' && index > 0) {
      [newWaypoints[index], newWaypoints[index - 1]] = [newWaypoints[index - 1], newWaypoints[index]];
    } else if (direction === 'down' && index < newWaypoints.length - 1) {
      [newWaypoints[index], newWaypoints[index + 1]] = [newWaypoints[index + 1], newWaypoints[index]];
    }
    setWaypoints(newWaypoints);
  };

  // HTML5 Drag and Drop Handlers
  const onDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    setDraggedItemIndex(index);
    // Effect for the drag image
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    if (draggedItemIndex === null || draggedItemIndex === index) return;
  };

  const onDrop = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null) return;

    const items = [...waypoints];
    const itemToMove = items[draggedItemIndex];
    
    // Remove from old index
    items.splice(draggedItemIndex, 1);
    // Insert at new index
    items.splice(index, 0, itemToMove);

    setWaypoints(items);
    setDraggedItemIndex(null);
  };

  // Handler for dragging markers on the map
  const handleWaypointDrag = async (id: string, newCoords: Coordinates) => {
    // 1. Optimistic update of coordinates (fast)
    setWaypoints(prev => prev.map(wp => 
        wp.id === id ? { ...wp, coords: newCoords } : wp
    ));

    // 2. Fetch the new address for this location (async)
    try {
        const newName = await reverseGeocode(newCoords);
        setWaypoints(prev => prev.map(wp => 
            wp.id === id ? { ...wp, name: newName } : wp
        ));
    } catch (error) {
        console.error("Failed to update address after drag", error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    performSearchAndAdd(searchQuery);
  };

  // Helper to ensure house number is present if user typed it
  const enrichAddressName = (geocodedName: string, userQuery: string): string => {
    const queryNumberMatch = userQuery.match(/(?:^|\s)(\d+[a-zA-Z]?)(?:,|\s|$)/);
    if (!queryNumberMatch) return geocodedName; 
    const numberInQuery = queryNumberMatch[1];
    const numberRegex = new RegExp(`\\b${numberInQuery}\\b`);
    if (numberRegex.test(geocodedName)) {
        return geocodedName;
    }
    const parts = geocodedName.split(',');
    parts[0] = `${parts[0].trim()} ${numberInQuery}`;
    return parts.join(',');
  };

  const performSearchAndAdd = async (query: string) => {
    setIsSearching(true);
    let finalQuery = query;
    if (!query.includes(',')) {
        finalQuery = `${query}, Lapua`;
    }
    const results = await searchAddress(finalQuery);
    
    if (results.length > 0) {
        const bestMatch = results[0];
        const finalName = enrichAddressName(bestMatch.name, query);
        handleAddWaypoint({
            id: Date.now().toString(),
            name: finalName,
            coords: bestMatch.coords
        });
        setSearchResults([]);
        setSearchQuery('');
    } else {
        setSearchResults([]);
        alert(`Osoitetta ei löytynyt: ${query}`);
    }
    setIsSearching(false);
  };

  const copyToClipboard = () => {
    const routeNames = waypoints.map(wp => {
        const lapuaRegex = /,\s*Lapua$/i;
        if (lapuaRegex.test(wp.name)) {
            return wp.name.replace(lapuaRegex, '');
        }
        return wp.name;
    }).join(' -> ');

    navigator.clipboard.writeText(routeNames);
    alert("Reitti kopioitu leikepöydälle!");
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-[#f4f4f4] text-black">
      
      {/* Sidebar Control Panel */}
      <aside className="w-full md:w-96 flex flex-col border-r-2 border-black bg-white z-10 shadow-xl h-[40vh] md:h-full">
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Controls */}
          <div className="space-y-4">
            
            {/* Search */}
            <div>
              <h2 className="text-sm font-bold font-serif mb-2 uppercase">Lisää kohde</h2>
              <form onSubmit={handleSearch} className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Osoite (oletus: Lapua)..." 
                  className="flex-1 border-2 border-black px-2 py-1 font-mono text-sm bg-white text-black placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-black"
                />
                <Button type="submit" className="px-3" disabled={isSearching}>
                  HAE
                </Button>
              </form>

              {/* Dynamic Preset Buttons */}
              <div className="flex flex-col gap-2 mt-2">
                 <Button 
                   onClick={() => setIsSettingsOpen(true)}
                   className="w-full text-xs border-dashed bg-gray-50 text-gray-600 hover:text-black hover:border-solid"
                 >
                   ⚙ HALLITSE PIKAVALINTOJA
                 </Button>

                 {presets.length > 0 && (
                   <div className="grid grid-cols-2 gap-2 mt-1">
                      {presets.map(preset => (
                        <Button
                          key={preset.id}
                          onClick={() => performSearchAndAdd(preset.address)}
                          className="w-full text-xs"
                          variant="secondary"
                          disabled={isSearching}
                        >
                          [+ {preset.label.toUpperCase()}]
                        </Button>
                      ))}
                   </div>
                 )}
              </div>
              
              <p className="text-xs text-gray-500 font-serif italic mt-2">
                *Kirjoita osoite ja paina Enter. Voit myös klikata karttaa lisätäksesi pisteen.
              </p>
            </div>
          </div>

          {/* Waypoint List */}
          <div>
            <div className="flex justify-between items-end mb-2 border-b-2 border-black pb-1">
              <div className="flex items-center gap-2">
                 <h2 className="text-lg font-serif font-bold">Reitti</h2>
                 <span className="font-mono text-xs text-gray-500">({waypoints.length})</span>
              </div>
              {waypoints.length > 0 && (
                  <button 
                    type="button"
                    onClick={handleClearRouteClick}
                    className={`text-[10px] font-bold border px-1 font-mono transition-all ${
                        confirmClear 
                        ? "bg-red-600 text-white border-red-600 hover:bg-red-700" 
                        : "text-red-600 hover:bg-red-50 border-transparent hover:border-red-600"
                    }`}
                  >
                    {confirmClear ? "[VARMISTA!]" : "[TYHJENNÄ]"}
                  </button>
              )}
            </div>

            {/* Hint about dragging */}
            {waypoints.length > 0 && (
                <div className="mb-2 bg-blue-50 border border-blue-200 p-2 text-[10px] text-blue-800 font-mono">
                    VINKKI: Raahaa listaa muuttaaksesi järjestystä tai nastoja kartalla tarkentaaksesi sijaintia.
                </div>
            )}
            
            {waypoints.length === 0 ? (
              <div className="py-8 text-center text-gray-400 font-serif italic border-2 border-dashed border-gray-300">
                Ei kohteita.
              </div>
            ) : (
              <ul className="space-y-1">
                {waypoints.map((wp, index) => (
                  <li 
                    key={wp.id} 
                    draggable
                    onDragStart={(e) => onDragStart(e, index)}
                    onDragOver={(e) => onDragOver(e, index)}
                    onDrop={(e) => onDrop(e, index)}
                    className={`flex items-center gap-2 bg-white border border-black p-1.5 shadow-sm group cursor-move transition-opacity ${draggedItemIndex === index ? 'opacity-50 border-dashed' : ''}`}
                  >
                    <div className="flex flex-col items-center justify-center w-6 gap-0 text-gray-400">
                        {/* Visual drag handle */}
                        <span className="text-lg leading-none select-none">⁝⁝</span>
                    </div>

                    <div className="flex flex-col items-center justify-center w-6 gap-0">
                      <span className="font-mono text-xs font-bold border rounded-full w-5 h-5 flex items-center justify-center border-black my-0.5 bg-white">
                        {index + 1}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm truncate font-medium select-none">{wp.name}</p>
                    </div>
                    
                    {/* Keep arrows for accessibility/precision, but could hide them if desired */}
                    <div className="flex flex-col mr-1">
                        <button 
                            onClick={() => handleMoveWaypoint(index, 'up')}
                            disabled={index === 0}
                            className="text-[8px] font-mono leading-none hover:text-black text-gray-300"
                        >▲</button>
                        <button 
                            onClick={() => handleMoveWaypoint(index, 'down')}
                            disabled={index === waypoints.length - 1}
                            className="text-[8px] font-mono leading-none hover:text-black text-gray-300"
                        >▼</button>
                    </div>

                    <button 
                      onClick={() => handleRemoveWaypoint(wp.id)}
                      className="text-gray-400 hover:text-red-600 p-1 font-mono font-bold"
                    >
                      [X]
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer / Calculation Area */}
        <div className="p-4 bg-white border-t-2 border-black">
          <div className="flex justify-between items-end mb-4 font-mono">
            <div>
              <div className="text-xs uppercase text-gray-500 mb-1">
                 MATKA (AUTO)
              </div>
              <div className="text-2xl font-bold">
                {routeData ? `${Math.round(routeData.distance / 1000)} km` : '0 km'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase text-gray-500 mb-1">Aika-arvio</div>
              <div className="text-xl">
                 {routeData ? `${Math.round(routeData.duration / 60)} min` : '0 min'}
              </div>
            </div>
          </div>
          
          <Button 
            onClick={copyToClipboard} 
            disabled={!routeData || loadingRoute} 
            className="w-full"
            variant="primary"
          >
            {loadingRoute ? "LASKETAAN..." : "[KOPIOI REITTI]"}
          </Button>
        </div>
      </aside>

      {/* Map Area */}
      <main className="flex-1 relative h-[60vh] md:h-full bg-gray-200">
        <div className="absolute top-4 left-14 md:left-4 z-[400] bg-black text-white px-4 py-3 border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
           <h1 className="text-xl font-serif font-bold tracking-tight uppercase">Työmatka-ajot</h1>
           <div className="text-[10px] font-mono opacity-80 uppercase leading-none mt-1">Lapua • Suomi</div>
        </div>

        {/* Footer info: Moved to Left bottom to clear space for Zoom controls on Right bottom */}
        <div className="absolute bottom-1 left-1 md:bottom-4 md:left-4 z-[400] flex flex-col md:flex-row md:items-end gap-2 px-2 py-1 bg-white/80 md:bg-transparent">
           <div className="bg-white border-2 border-black px-2 py-1">
              <span className="font-serif text-[10px] text-gray-600 font-bold">
                &copy; Vesa Perasto 2025
              </span>
           </div>
           <button 
             onClick={() => setIsChangelogOpen(true)}
             className="bg-white border-2 border-black px-2 py-1 font-mono text-[10px] font-bold hover:bg-black hover:text-white transition-colors text-left"
           >
             [ MUUTOSLOKI ]
           </button>
        </div>

        <MapComponent 
          waypoints={waypoints} 
          route={routeData} 
          onMapClick={handleAddWaypoint} 
          onWaypointMove={handleWaypointDrag}
        />
      </main>

      {/* SETTINGS MODAL */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Pikavalinnat">
         <div className="space-y-6">
            <div className="bg-gray-100 p-3 border border-black">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold">Lisää uusi</h3>
                    {saveMessage && <span className="text-green-600 font-bold text-xs bg-white px-2 py-1 border border-black animate-pulse">{saveMessage}</span>}
                </div>
                <form onSubmit={handleAddPreset} className="space-y-2">
                    <div>
                        <label className="block text-xs font-bold mb-1">NIMI (Esim. Työ)</label>
                        <input 
                            className="w-full border border-black p-2 text-sm bg-white text-black placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-black"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            placeholder="Painikkeen nimi"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1">OSOITE</label>
                        <input 
                            className="w-full border border-black p-2 text-sm bg-white text-black placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-black"
                            value={newPresetAddress}
                            onChange={(e) => setNewPresetAddress(e.target.value)}
                            placeholder="Katuosoite..."
                        />
                    </div>
                    <Button type="submit" className="w-full mt-2" variant="secondary" disabled={!newPresetName || !newPresetAddress}>
                        TALLENNA
                    </Button>
                </form>
            </div>

            <div>
                <h3 className="font-bold mb-2 border-b border-black pb-1">Tallennetut</h3>
                {presets.length === 0 ? (
                    <p className="text-gray-500 italic">Ei tallennettuja pikavalintoja.</p>
                ) : (
                    <ul className="space-y-2">
                        {presets.map(preset => (
                            <li key={preset.id} className="flex justify-between items-center bg-white border border-black p-2">
                                <div>
                                    <div className="font-bold">{preset.label}</div>
                                    <div className="text-xs text-gray-600">{preset.address}</div>
                                </div>
                                <Button 
                                    variant="danger" 
                                    onClick={() => handleDeletePreset(preset.id)}
                                    className="px-2 py-1 text-xs"
                                >
                                    POISTA
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
         </div>
      </Modal>

      {/* CHANGELOG MODAL */}
      <Modal isOpen={isChangelogOpen} onClose={() => setIsChangelogOpen(false)} title="Muutosloki">
        <div className="space-y-6">
            {changelogData.map((entry, idx) => (
                <div key={idx} className="border-b border-gray-300 pb-4 last:border-0">
                    <div className="flex justify-between items-baseline mb-2">
                        <h3 className="font-bold text-lg">v{entry.version}</h3>
                        <span className="text-xs text-gray-500">{entry.date}</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {entry.changes.map((change, cIdx) => (
                            <li key={cIdx}>{change}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
      </Modal>

    </div>
  );
};

export default App;