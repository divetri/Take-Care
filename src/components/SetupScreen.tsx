import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Coordinates, ThemeType, AlarmTriggerType, TrackingMilestone } from '../types';
import { MapPin, Map as MapIcon, Info, Train, ChevronUp, ChevronDown, Footprints, Navigation } from 'lucide-react';
import { ALL_STATIONS, findShortestPath, TRANSITS } from '../krl';
import { getThemeConfig } from '../themeConfig';

function MapUpdater({ pathCoords, forceCenterPos, triggerRecenter }: { pathCoords: Coordinates[], forceCenterPos: Coordinates | null, triggerRecenter: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (triggerRecenter > 0 && forceCenterPos) {
      map.flyTo([forceCenterPos.lat, forceCenterPos.lng], 15);
      return;
    }
  }, [triggerRecenter, forceCenterPos, map]);

  useEffect(() => {
    if (pathCoords.length > 1 && triggerRecenter === 0) {
      const bounds = L.latLngBounds(pathCoords.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (pathCoords.length === 1 && triggerRecenter === 0) {
      map.flyTo([pathCoords[0].lat, pathCoords[0].lng], 14);
    }
  }, [pathCoords, map]);
  return null;
}

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
const blueBigIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
const yellowSmallIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [15, 25],
  iconAnchor: [7, 25],
});

const dotIcon = L.divIcon({
  html: `<div style="background-color: white; border-radius: 50%; width: 10px; height: 10px; border: 2px solid #3b82f6;"></div>`,
  className: '',
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

const userWalkingIcon = L.divIcon({
  html: `<div style="background-color: white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 2px solid #ef4444;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"/><path d="m9 20 3-6 3 6"/><path d="m6 8 6 2 6-2"/><path d="M12 10v4"/></svg></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Find the SetupScreenProps...
interface SetupScreenProps {
  onStartTracking: (
    destination: Coordinates,
    radius: number,
    isSim: boolean,
    trigger: AlarmTriggerType,
    origDestName: string,
    simCoords?: Coordinates[],
    targetStationName?: string,
    routeMilestones?: TrackingMilestone[]
  ) => void;
  currentPos: Coordinates | null;
  onOpenSettings: () => void;
  theme: ThemeType;
  userName: string;
  initialStation: string;
  setInitialStation: React.Dispatch<React.SetStateAction<string>>;
  destinationStation: string;
  setDestinationStation: React.Dispatch<React.SetStateAction<string>>;
  trigger: AlarmTriggerType;
  setTrigger: React.Dispatch<React.SetStateAction<AlarmTriggerType>>;
}

// And adding settings button
export function SetupScreen({ 
  onStartTracking, 
  currentPos, 
  onOpenSettings, 
  theme, 
  userName,
  initialStation,
  setInitialStation,
  destinationStation,
  setDestinationStation,
  trigger,
  setTrigger
}: SetupScreenProps) {
  const config = getThemeConfig(theme);

  const userManuallySelectedRef = useRef(false);
  const [isRouteExpanded, setIsRouteExpanded] = useState(false);
  const [triggerRecenter, setTriggerRecenter] = useState(0);
  
  const [routePath, setRoutePath] = useState<string[]>([]);
  const [routeCoords, setRouteCoords] = useState<Record<string, Coordinates>>({});
  const [isFetchingCoords, setIsFetchingCoords] = useState(false);

  const initialCenter = currentPos || { lat: -6.2088, lng: 106.8456 }; // Default Jakarta
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Auto-detect nearest station when currentPos is available and user hasn't selected one yet
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  const [isDetectingNearest, setIsDetectingNearest] = useState(false);

  useEffect(() => {
    if (currentPos && !initialStation && !hasAutoSelected && !isDetectingNearest) {
      const detectNearest = async () => {
        setIsDetectingNearest(true);
        try {
          const query = `[out:json];(node["railway"="station"]["network"~"KRL|Commuter"](around:20000,${currentPos.lat},${currentPos.lng});node["railway"="station"](around:20000,${currentPos.lat},${currentPos.lng}););out center;`;
          
          const endpoints = [
            'https://overpass-api.de/api/interpreter',
            'https://lz4.overpass-api.de/api/interpreter',
            'https://z.overpass-api.de/api/interpreter'
          ];
          
          let data = null;
          for (const endpoint of endpoints) {
            try {
              const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`);
              if (res.ok) {
                data = await res.json();
                break;
              }
            } catch (err) {}
          }

          if (data && data.elements && data.elements.length > 0) {
            let closestStation = '';
            let minDistance = Infinity;

            for (const el of data.elements) {
              const name = (el.tags?.name || "").toLowerCase();
              const altName = (el.tags?.["name:en"] || "").toLowerCase();
              
              // Find matching station in ALL_STATIONS
              const match = ALL_STATIONS.find(s => name.includes(s.toLowerCase()) || altName.includes(s.toLowerCase()));
              if (match) {
                const lat = el.lat || el.center?.lat;
                const lon = el.lon || el.center?.lon;
                
                // approximate distance (pythagorean is fine for short distances)
                const dLat = (lat - currentPos.lat);
                const dLon = (lon - currentPos.lng);
                const distSq = dLat*dLat + dLon*dLon;
                
                if (distSq < minDistance) {
                  minDistance = distSq;
                  closestStation = match;
                }
              }
            }
            if (closestStation && !initialStation && !userManuallySelectedRef.current) {
              setInitialStation(closestStation);
            }
          }
        } catch (err) {
          console.error("Detect nearest error", err);
        } finally {
          if (!userManuallySelectedRef.current) {
            setIsDetectingNearest(false);
            setHasAutoSelected(true);
          }
        }
      };
      detectNearest();
    }
  }, [currentPos, initialStation, hasAutoSelected, isDetectingNearest]);

  const handleDepartureChange = (value: string) => {
    userManuallySelectedRef.current = true;
    setInitialStation(value);
    setIsDetectingNearest(false);
    setHasAutoSelected(true);
  };

  const handleRecenter = () => {
    if (currentPos) {
      setTriggerRecenter(prev => prev + 1);
    }
  };

  // Compute Route
  useEffect(() => {
    if (initialStation && destinationStation && initialStation !== destinationStation) {
      const path = findShortestPath(initialStation, destinationStation);
      setRoutePath(path);
      
      // Fetch coordinates for the path
      fetchPathCoordinates(path);
    } else {
      setRoutePath([]);
    }
  }, [initialStation, destinationStation]);

  const fetchPathCoordinates = async (path: string[]) => {
    setIsFetchingCoords(true);
    // Find missing coords
    const missing = path.filter(st => !routeCoords[st]);
    if (missing.length === 0) {
      setIsFetchingCoords(false);
      return;
    }

    try {
      const safeNames = missing.map(m => m.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
      const bbox = '(-6.9, 106.3, -6.0, 107.3)';
      const query = `[out:json];(node["railway"="station"]["network"~"KRL|Commuter"]${bbox}[~"^(name|name:en)$"~"^(${safeNames})$",i];node["railway"="station"]${bbox}[~"^(name|name:en)$"~"^(${safeNames})$",i];);out center;`;
      
      const endpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://lz4.overpass-api.de/api/interpreter',
        'https://z.overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter'
      ];
      
      let data = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`);
          if (res.ok) {
            data = await res.json();
            break;
          } else {
            lastError = new Error(`Overpass API error: ${res.statusText}`);
          }
        } catch (err) {
           lastError = err;
        }
      }

      if (!data) {
        throw lastError || new Error("Failed to fetch coordinates from all Overpass endpoints");
      }
      
      const newCoords = { ...routeCoords };
      for (const st of missing) {
        // match from results
        const match = data.elements.find((el: any) => {
          const name = (el.tags?.name || "").toLowerCase();
          const altName = (el.tags?.["name:en"] || "").toLowerCase();
          return name.includes(st.toLowerCase()) || altName.includes(st.toLowerCase());
        });
        if (match) {
           newCoords[st] = { lat: match.lat || match.center?.lat, lng: match.lon || match.center?.lon };
        }
      }
      setRouteCoords(newCoords);
    } catch(err) {
      console.error("Coords error", err);
    } finally {
      setIsFetchingCoords(false);
    }
  };

  const pathLineCoords: Coordinates[] = useMemo(() => {
    return routePath.map(st => routeCoords[st]).filter(Boolean);
  }, [routePath, routeCoords]);

  const transitInfo = useMemo(() => {
    if (routePath.length <= 1) return [];
    const info = [];
    for (let i = 1; i < routePath.length - 1; i++) {
        if (TRANSITS.includes(routePath[i])) {
            // Very simple heuristic to detect line change
            info.push(`Transit at ${routePath[i]}`);
        }
    }
    // Only return unique transits
    return Array.from(new Set(info));
  }, [routePath]);

  // Fallback trigger if route is too short
  useEffect(() => {
    if (routePath.length > 0) {
      if (trigger === '2_stations' && routePath.length <= 3) {
        setTrigger('arrive');
      } else if (trigger === '1_station' && routePath.length <= 2) {
        setTrigger('arrive');
      }
    }
  }, [routePath, trigger]);

  const handleStart = () => {
    setErrorMsg(null);
    if (destinationStation && routeCoords[destinationStation]) {
      let targetIndex = routePath.length - 1;
      if (trigger === '1_station') targetIndex = Math.max(0, routePath.length - 2);
      if (trigger === '2_stations') targetIndex = Math.max(0, routePath.length - 3);
      
      const targetStationName = routePath[targetIndex];
      const targetCoord = routeCoords[targetStationName];
      
      if (!targetCoord) {
         setErrorMsg(`Coordinates for target station '${targetStationName}' are not loaded or not found in GPS database. Cannot start tracking.`);
         return;
      }

      // Calculate milestones in chronological order
      const milestones: TrackingMilestone[] = [];
      const transits = routePath.slice(1, -1).filter(st => TRANSITS.includes(st));
      for (const st of transits) {
        if (st !== targetStationName) {
          const coord = routeCoords[st];
          if (coord) {
            milestones.push({
              stationName: st,
              coordinates: coord,
              isTransit: true,
              triggerType: 'arrive',
              originalDestName: st,
            });
          }
        }
      }

      milestones.push({
        stationName: targetStationName,
        coordinates: targetCoord,
        isTransit: false,
        triggerType: trigger,
        originalDestName: destinationStation,
      });

      onStartTracking(targetCoord, 100, false, trigger, destinationStation, undefined, targetStationName, milestones);
    } else {
      setErrorMsg("Destination coordinates not loaded yet. Please wait or try another.");
    }
  };

  const handleSimulate = () => {
    setErrorMsg(null);
    if (destinationStation && pathLineCoords.length > 1) {
      let targetIndex = routePath.length - 1;
      if (trigger === '1_station') targetIndex = Math.max(0, routePath.length - 2);
      if (trigger === '2_stations') targetIndex = Math.max(0, routePath.length - 3);

      const targetStationName = routePath[targetIndex];
      const targetCoord = routeCoords[targetStationName];

      if (!targetCoord) {
         setErrorMsg(`Coordinates for target station '${targetStationName}' are not loaded or not found in GPS database. Cannot simulate.`);
         return;
      }

      // Calculate milestones in chronological order
      const milestones: TrackingMilestone[] = [];
      const transits = routePath.slice(1, -1).filter(st => TRANSITS.includes(st));
      for (const st of transits) {
        if (st !== targetStationName) {
          const coord = routeCoords[st];
          if (coord) {
            milestones.push({
              stationName: st,
              coordinates: coord,
              isTransit: true,
              triggerType: 'arrive',
              originalDestName: st,
            });
          }
        }
      }

      milestones.push({
        stationName: targetStationName,
        coordinates: targetCoord,
        isTransit: false,
        triggerType: trigger,
        originalDestName: destinationStation,
      });

      onStartTracking(targetCoord, 100, true, trigger, destinationStation, pathLineCoords, targetStationName, milestones);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900`}>
      {/* Title Bar */}
      <div className={`relative z-10 flex items-center justify-between px-6 py-4 shadow-sm ${config.bgSurface} border-b ${config.border}`}>
        <h1 className={`text-xl font-extrabold tracking-widest uppercase ${config.textMain}`}>Take Care</h1>
        <button 
          onClick={onOpenSettings}
          className={`p-2 rounded-full transition-colors active:scale-95 hover:opacity-70 ${config.textMain}`}
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>

      <div className="flex-[0.8] relative z-0">
        <MapContainer
          center={[initialCenter.lat, initialCenter.lng]}
          zoom={12}
          style={{ height: '100%', width: '100%', backgroundColor: '#e5e7eb' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OSM'
          />
          <MapUpdater pathCoords={pathLineCoords} forceCenterPos={currentPos} triggerRecenter={triggerRecenter} />
          
          {pathLineCoords.length > 0 && (
             <Polyline positions={pathLineCoords.map(c => [c.lat, c.lng])} color="#3b82f6" weight={4} opacity={0.8} />
          )}

          {routePath.map((st, i) => {
            const coord = routeCoords[st];
            if (!coord) return null;
            const isStart = i === 0;
            const isEnd = i === routePath.length - 1;
            const isTransit = TRANSITS.includes(st) && !isStart && !isEnd;
            
            if (isStart) return <Marker key={st} position={[coord.lat, coord.lng]} icon={greenIcon} />;
            if (isEnd) return <Marker key={st} position={[coord.lat, coord.lng]} icon={blueBigIcon} />;
            if (isTransit) return <Marker key={st} position={[coord.lat, coord.lng]} icon={yellowSmallIcon} />;
            
            return <Marker key={st} position={[coord.lat, coord.lng]} icon={dotIcon} interactive={false} />;
          })}

          {currentPos && (
            <Marker position={[currentPos.lat, currentPos.lng]} icon={userWalkingIcon} zIndexOffset={1000} />
          )}
        </MapContainer>
        
        {/* Recenter Button */}

        {currentPos && (
          <button 
            onClick={handleRecenter}
            className="absolute bottom-4 right-4 z-[1000] bg-gray-900 border border-gray-700 p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
            title="Recenter to my location"
          >
            <Navigation className="w-5 h-5 text-blue-400" />
          </button>
        )}

        {isFetchingCoords && (
           <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/90 py-2 px-4 rounded-full text-xs shadow-lg text-blue-400 border border-gray-800 backdrop-blur-sm z-10 flex items-center gap-2">
             <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
             Mapping route...
           </div>
        )}
      </div>

      <div className={`border-t p-5 sm:p-8 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-10 flex-1 overflow-y-auto w-full backdrop-blur-md transition-colors ${config.bgSurface} ${config.textMain} ${config.border}`}>
        
        <div className="space-y-5 mb-8 relative">
          <div className="flex gap-4 items-center relative">
             <MapPin className="text-green-500 w-6 h-6 shrink-0" />
             <div className="w-full relative">
               <select 
                 className={`w-full ${config.bgMain} ${config.border} rounded-2xl px-5 py-4 ${config.textMain} focus:outline-none focus:ring-2 focus:ring-green-500 transition-all appearance-none`}
                 value={initialStation}
                 onChange={e => handleDepartureChange(e.target.value)}
               >
                 <option value="">{isDetectingNearest ? "Detecting nearest station..." : "Select Departure Station"}</option>
                 {ALL_STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-gray-500">
                 {isDetectingNearest ? (
                   <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                 ) : (
                   <ChevronDown className="w-5 h-5" />
                 )}
               </div>
             </div>
          </div>
          
          <div className="w-0.5 h-8 bg-gray-500/30 absolute left-3 top-10 -z-10"></div>

          <div className="flex gap-4 items-center">
             <MapPin className="text-blue-500 w-6 h-6 shrink-0" />
             <div className="w-full relative">
               <select 
                 className={`w-full ${config.bgMain} ${config.border} rounded-2xl px-5 py-4 ${config.textMain} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none`}
                 value={destinationStation}
                 onChange={e => setDestinationStation(e.target.value)}
               >
                 <option value="">Select Destination Station</option>
                 {ALL_STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-gray-500">
                 <ChevronDown className="w-5 h-5" />
               </div>
             </div>
          </div>
        </div>

        {routePath.length > 0 && (
          <div className={`${config.bgMain} rounded-2xl mb-8 border ${config.border} overflow-hidden shadow-sm`}>
            <button 
              onClick={() => setIsRouteExpanded(!isRouteExpanded)}
              className={`w-full text-left p-5 flex items-center justify-between transition-colors`}
            >
              <div>
                <h3 className={`text-sm font-semibold flex items-center gap-2 ${config.textMain}`}>
                  <Train className="w-4 h-4 text-blue-400" /> Route Info ({routePath.length} stations)
                </h3>
                {transitInfo.length > 0 ? (
                   <p className="text-xs text-yellow-500 mt-1">{transitInfo.length} Transit(s)</p>
                ) : (
                   <p className="text-xs text-green-500 mt-1">Direct train</p>
                )}
              </div>
              {isRouteExpanded ? <ChevronUp className={`w-5 h-5 ${config.textMuted}`} /> : <ChevronDown className={`w-5 h-5 ${config.textMuted}`} />}
            </button>

            {isRouteExpanded && (
              <div className={`px-5 pb-5 border-t ${config.border} pt-4 max-h-64 overflow-y-auto`}>
                <div className="relative border-l-2 border-gray-500 ml-2 space-y-5">
                  {routePath.map((station, i) => {
                    const isStart = i === 0;
                    const isEnd = i === routePath.length - 1;
                    const isTransit = TRANSITS.includes(station) && !isStart && !isEnd;
                    
                    let dotClass = "bg-gray-600 border-gray-800";
                    if (isStart) dotClass = "bg-green-500 border-green-900";
                    else if (isEnd) dotClass = "bg-blue-500 border-blue-900";
                    else if (isTransit) dotClass = "bg-yellow-500 border-yellow-900";

                    return (
                      <div key={station} className="relative pl-6">
                        <div className={`absolute top-1 -left-[9px] w-4 h-4 rounded-full border-[3px] ${dotClass}`}></div>
                        <div className={`text-sm font-medium ${config.textMain}`}>{station}</div>
                        {isTransit && <div className="text-xs text-yellow-500 mt-0.5">Transit</div>}
                        {isStart && <div className="text-xs text-green-500 mt-0.5">Departure</div>}
                        {isEnd && <div className="text-xs text-blue-500 mt-0.5">Destination</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <h2 className={`text-sm font-medium ${config.textMuted} mb-5 uppercase tracking-wider`}>Wake me up when I am...</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {[
            { value: 'arrive', label: 'Arriving (100m)' },
            { value: '1_station', label: '1 Station Before' },
            { value: '2_stations', label: '2 Stations Before' }
          ].map((option) => {
            const isDisabled = 
              (routePath.length > 0 && option.value === '1_station' && routePath.length <= 2) ||
              (routePath.length > 0 && option.value === '2_stations' && routePath.length <= 3);

            return (
              <button
                key={option.value}
                onClick={() => setTrigger(option.value as AlarmTriggerType)}
                disabled={isDisabled}
                className={`py-5 px-5 rounded-2xl text-sm font-medium transition-all flex flex-col items-center justify-center gap-2 ${
                  trigger === option.value 
                  ? `${config.accentBg} ${config.accentText} border-b-[3px] border-blue-500 shadow-md scale-[1.02]` 
                  : `${config.bgMain} border ${config.border} ${config.textMuted} hover:opacity-80`
                } disabled:opacity-30 disabled:pointer-events-none disabled:grayscale`}
              >
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-5 pb-5">
          {errorMsg && (
            <div className="text-red-500 text-sm font-medium p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              {errorMsg}
            </div>
          )}
          
          <button
            disabled={!initialStation || !destinationStation || routePath.length === 0 || isFetchingCoords}
            onClick={handleStart}
            className={`w-full ${config.buttonPrimaryBg} ${config.buttonPrimaryText} py-5 rounded-2xl font-bold text-lg ${config.buttonPrimaryHover} disabled:opacity-30 transition-all active:scale-[0.98] shadow-lg`}
          >
            {isFetchingCoords ? 'Loading Route...' : 'Start Alarm'}
          </button>
          
          {userName.trim().toLowerCase() === 'divetri' && (
            <button
              disabled={!initialStation || !destinationStation || pathLineCoords.length === 0 || isFetchingCoords}
              onClick={handleSimulate}
              className={`w-full ${config.accentBg} ${config.accentText} border ${config.border} py-5 rounded-2xl font-bold text-lg hover:opacity-80 disabled:opacity-30 transition-all active:scale-[0.98] shadow-md`}
            >
              {isFetchingCoords ? 'Loading Route...' : 'Simulate Ride (Dev)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
