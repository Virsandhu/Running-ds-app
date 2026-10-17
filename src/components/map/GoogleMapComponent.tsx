import React, { useEffect, useState, useMemo } from 'react';
import {
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { useZoneRush } from '../../context/ZoneRushContext';
import { getRunnableRoads, RunnableRoad } from '../../data/runnableRoads';
import { RunnableRoadsOverlay } from './RunnableRoadsOverlay';

interface GoogleMapComponentProps {
  className?: string;
  zoom?: number;
}

// Controller to smoothly pan/zoom camera when GPS updates
const MapCameraController: React.FC<{
  center: { lat: number; lng: number };
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(center);
  }, [map, center.lat, center.lng]);

  useEffect(() => {
    if (!map) return;
    map.setZoom(zoom);
  }, [map, zoom]);

  return null;
};

// Accuracy Circle Overlay
const AccuracyCircleOverlay: React.FC<{
  center: { lat: number; lng: number };
  radiusMeters: number;
  strokeColor?: string;
  fillColor?: string;
}> = ({ center, radiusMeters, strokeColor = '#2563EB', fillColor = '#3B82F6' }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib) return;

    const circle = new mapsLib.Circle({
      center,
      radius: Math.max(12, radiusMeters),
      strokeColor,
      strokeOpacity: 0.65,
      strokeWeight: 1.5,
      fillColor,
      fillOpacity: 0.12,
      map,
      clickable: false,
    });

    return () => {
      circle.setMap(null);
    };
  }, [map, mapsLib, center.lat, center.lng, radiusMeters, strokeColor, fillColor]);

  return null;
};

// Polygon Overlay helper
const PolygonOverlay: React.FC<{
  paths: { lat: number; lng: number }[];
  strokeColor: string;
  fillColor: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  fillOpacity?: number;
  onClick?: () => void;
}> = ({
  paths,
  strokeColor,
  fillColor,
  strokeWeight = 2.5,
  strokeOpacity = 0.85,
  fillOpacity = 0.22,
  onClick,
}) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib || paths.length === 0) return;

    const polygon = new mapsLib.Polygon({
      paths,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      fillColor,
      fillOpacity,
      map,
      clickable: Boolean(onClick),
    });

    let listener: { remove: () => void } | null = null;
    if (onClick) {
      listener = polygon.addListener('click', onClick);
    }

    return () => {
      if (listener) listener.remove();
      polygon.setMap(null);
    };
  }, [map, mapsLib, paths, strokeColor, fillColor, strokeWeight, strokeOpacity, fillOpacity, onClick]);

  return null;
};

// Polyline Overlay for running route
const PolylineOverlay: React.FC<{
  path: { lat: number; lng: number }[];
  strokeColor?: string;
  strokeWeight?: number;
}> = ({ path, strokeColor = '#FC5200', strokeWeight = 5 }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib || path.length < 2) return;

    const polyline = new mapsLib.Polyline({
      path,
      strokeColor,
      strokeOpacity: 0.95,
      strokeWeight,
      map,
    });

    return () => {
      polyline.setMap(null);
    };
  }, [map, mapsLib, path, strokeColor, strokeWeight]);

  return null;
};

// The Doon School Campus Landmarks
const DOON_SCHOOL_LANDMARKS = [
  {
    id: 'doon-main',
    name: 'Main Building',
    sub: 'Chandbagh Estate',
    lat: 30.3340,
    lng: 78.0305,
    icon: 'account_balance',
    color: 'bg-indigo-600',
  },
  {
    id: 'doon-rosebowl',
    name: 'Rose Bowl',
    sub: 'Open Air Amphitheatre',
    lat: 30.3346,
    lng: 78.0315,
    icon: 'theater_comedy',
    color: 'bg-rose-600',
  },
  {
    id: 'doon-skinners',
    name: "Skinner's Field",
    sub: 'Athletics & Track',
    lat: 30.3331,
    lng: 78.0312,
    icon: 'sprint',
    color: 'bg-emerald-600',
  },
  {
    id: 'doon-gate',
    name: 'Mall Road Gate',
    sub: 'Main Entrance',
    lat: 30.3352,
    lng: 78.0302,
    icon: 'door_front',
    color: 'bg-amber-600',
  },
];

// Precise 72-Acre Campus Boundary for The Doon School (Chandbagh Estate, Dehradun)
const DOON_SCHOOL_CAMPUS_TERRITORY = [
  { lat: 30.3356, lng: 78.0280 }, // Northwest Gate / Cantt link
  { lat: 30.3354, lng: 78.0302 }, // Main Mall Road Entrance
  { lat: 30.3351, lng: 78.0336 }, // Northeast corner (Mall Road East)
  { lat: 30.3345, lng: 78.0345 }, // East boundary upper
  { lat: 30.3330, lng: 78.0342 }, // East boundary lower near river trail
  { lat: 30.3318, lng: 78.0335 }, // Southeast corner
  { lat: 30.3320, lng: 78.0305 }, // South boundary (Pavilion & Gym)
  { lat: 30.3322, lng: 78.0285 }, // Southwest corner near Chakrata link
  { lat: 30.3338, lng: 78.0282 }, // West boundary
  { lat: 30.3356, lng: 78.0280 }, // Closing loop back to Northwest
];

export const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  className = '',
  zoom = 18,
}) => {
  const {
    tacticalMode,
    setSelectedSector,
    sectors,
    currentTab,
    userLocation,
    zoomLevel,
    gpsAccuracy,
    startActivity,
    userTerritoryColor,
  } = useZoneRush();

  const [mapTypeId, setMapTypeId] = useState<string>('hybrid');
  const [selectedRoad, setSelectedRoad] = useState<RunnableRoad | null>(null);
  const [showRoadsHighlight, setShowRoadsHighlight] = useState<boolean>(true);

  useEffect(() => {
    // In tacticalMode: use roadmap; otherwise use hybrid satellite imagery for maximum real-world detail
    setMapTypeId(tacticalMode ? 'hybrid' : 'roadmap');
  }, [tacticalMode]);

  // Retrieve runnable roads around The Doon School campus
  const runnableRoads = useMemo(() => {
    return getRunnableRoads(userLocation.lat, userLocation.lng);
  }, [userLocation.lat, userLocation.lng]);

  // Dynamic run route curving towards user's real location
  const dynamicRunRoute = useMemo(() => {
    const { lat, lng } = userLocation;
    return [
      { lat: lat - 0.002, lng: lng - 0.0025 },
      { lat: lat - 0.0015, lng: lng - 0.003 },
      { lat: lat + 0.0003, lng: lng - 0.0025 },
      { lat: lat + 0.0012, lng: lng - 0.001 },
      { lat: lat + 0.0008, lng: lng + 0.0006 },
      { lat, lng },
    ];
  }, [userLocation]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <Map
        id="zonerush-map"
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        defaultCenter={userLocation}
        defaultZoom={zoom}
        mapTypeId={mapTypeId}
        gestureHandling="greedy"
        disableDefaultUI={true}
        className="w-full h-full"
      >
        {/* Camera controller to center on real user location with high precision zoom */}
        <MapCameraController center={userLocation} zoom={zoomLevel || zoom} />

        {/* GPS Accuracy Radius Circle around Runner in User's Territory Color */}
        <AccuracyCircleOverlay
          center={userLocation}
          radiusMeters={gpsAccuracy ? Math.min(gpsAccuracy, 45) : 20}
          strokeColor={userTerritoryColor}
          fillColor={userTerritoryColor}
        />

        {/* RUNNABLE CLAIMABLE ROADS OVERLAY: Highlighted with slight greyish styling */}
        <RunnableRoadsOverlay
          roads={runnableRoads}
          selectedRoadId={selectedRoad?.id || null}
          onSelectRoad={(road) => setSelectedRoad(road)}
          showHighlight={showRoadsHighlight}
        />

        {/* Outer 72-Acre Campus Perimeter Boundary (Gold Accent Enclosure) */}
        <PolygonOverlay
          paths={DOON_SCHOOL_CAMPUS_TERRITORY}
          strokeColor="#D97706"
          fillColor="#000000"
          strokeWeight={2}
          strokeOpacity={0.85}
          fillOpacity={0.03}
        />

        {/* CAMPUS OCCUPIED SECTORS: Distinct Color For Every User */}
        {sectors.map((sec) => (
          <PolygonOverlay
            key={`sector-poly-${sec.id}`}
            paths={sec.paths || []}
            strokeColor={sec.ownerColor}
            fillColor={sec.ownerColor}
            strokeWeight={2.5}
            strokeOpacity={0.9}
            fillOpacity={0.28}
            onClick={() => setSelectedSector(sec)}
          />
        ))}

        {/* Occupied Sector Owner Badges with User-Specific Colors */}
        {sectors.map((sec) => {
          if (!sec.centroid) return null;
          const isUser = sec.ownerHandle.includes('(YOU)');

          return (
            <AdvancedMarker
              key={`sector-tag-${sec.id}`}
              position={sec.centroid}
              onClick={() => setSelectedSector(sec)}
            >
              <div className="flex flex-col items-center cursor-pointer select-none group">
                <div
                  className="px-2 py-0.5 rounded-full shadow-md text-white text-[9px] font-black uppercase tracking-tight flex items-center gap-1 border border-white/70 group-hover:scale-105 transition-transform backdrop-blur-xs"
                  style={{ backgroundColor: sec.ownerColor }}
                  title={`${sec.name} • Occupied by ${sec.ownerHandle} (${sec.areaKm2} km²)`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full bg-white ${isUser ? 'animate-ping' : ''}`}
                  />
                  <span className="truncate max-w-[85px]">{sec.owner}</span>
                  <span className="text-[8px] font-metric opacity-90">({sec.code})</span>
                </div>
                <div
                  className="w-1.5 h-1.5 rotate-45 -mt-0.5 border-r border-b border-white/70"
                  style={{ backgroundColor: sec.ownerColor }}
                />
              </div>
            </AdvancedMarker>
          );
        })}

        {/* The Doon School Campus Main Title Badge */}
        <AdvancedMarker position={{ lat: 30.3354, lng: 78.0302 }}>
          <div
            onClick={() => {
              const s = sectors[0];
              if (s) setSelectedSector(s);
            }}
            className="flex flex-col items-center cursor-pointer select-none group"
          >
            <div className="bg-slate-950/95 border-2 border-amber-400 text-white px-2.5 py-0.5 rounded-full shadow-xl flex items-center gap-1.5 group-hover:scale-105 transition-transform backdrop-blur-xs">
              <span className="material-symbols-outlined text-amber-400 text-[14px]">school</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                The Doon School (72 Acres)
              </span>
            </div>
            <div className="w-1.5 h-1.5 bg-slate-950 rotate-45 -mt-0.5 border-r-2 border-b-2 border-amber-400" />
          </div>
        </AdvancedMarker>

        {/* Active Run Route Polyline (When on activity tab) */}
        {currentTab === 'activity' && (
          <PolylineOverlay path={dynamicRunRoute} strokeColor="#FC5200" strokeWeight={5} />
        )}

        {/* Interactive Road Label Badges on Key Runnable Roads */}
        {showRoadsHighlight &&
          runnableRoads.slice(0, 7).map((road) => {
            const midIdx = Math.floor(road.path.length / 2);
            const midPoint = road.path[midIdx] || road.path[0];
            const isSelected = selectedRoad?.id === road.id;

            return (
              <AdvancedMarker
                key={`road-label-${road.id}`}
                position={midPoint}
                onClick={() => setSelectedRoad(road)}
              >
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full shadow-xs border text-[9px] font-bold tracking-tight transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#FC5200] text-white border-white scale-105 shadow-md'
                      : 'bg-slate-900/80 text-slate-200 border-slate-600/70 hover:bg-slate-900 hover:text-white backdrop-blur-xs'
                  }`}
                  title={`${road.name} • ${road.distanceKm} km (Click to view claim yield)`}
                >
                  <span className="material-symbols-outlined text-[10px] text-slate-300">
                    {road.type === 'track' ? 'sprint' : 'alt_route'}
                  </span>
                  <span className="whitespace-nowrap">{road.name}</span>
                </div>
              </AdvancedMarker>
            );
          })}

        {/* The Doon School Campus Landmarks */}
        {DOON_SCHOOL_LANDMARKS.map((landmark) => (
          <AdvancedMarker
            key={landmark.id}
            position={{ lat: landmark.lat, lng: landmark.lng }}
          >
            <div className="flex flex-col items-center pointer-events-none select-none">
              <div className="bg-slate-900/90 text-white px-2 py-0.5 rounded-md shadow-md border border-slate-700/80 flex items-center gap-1 backdrop-blur-xs">
                <span className={`w-3.5 h-3.5 rounded-full ${landmark.color} flex items-center justify-center text-[9px] text-white`}>
                  <span className="material-symbols-outlined text-[10px]">{landmark.icon}</span>
                </span>
                <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">
                  {landmark.name}
                </span>
              </div>
              <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-0.5" />
            </div>
          </AdvancedMarker>
        ))}

        {/* Real User GPS Runner Advanced Marker Pulsing in User's Distinct Territory Color */}
        <AdvancedMarker position={userLocation}>
          <div className="relative flex flex-col items-center">
            {/* Runner ID Chip */}
            <div
              className="mb-1 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border"
              style={{ backgroundColor: '#020617', borderColor: userTerritoryColor }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-ping"
                style={{ backgroundColor: userTerritoryColor }}
              />
              <span>YOU</span>
            </div>

            {/* Pulsing Beacon in User's Unique Territory Color */}
            <div className="relative flex items-center justify-center">
              <span
                className="animate-ping absolute inline-flex h-9 w-9 rounded-full opacity-60"
                style={{ backgroundColor: userTerritoryColor }}
              />
              <div
                className="relative w-7 h-7 rounded-full bg-white shadow-md border-2 flex items-center justify-center"
                style={{ borderColor: userTerritoryColor }}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: userTerritoryColor }}
                />
              </div>
              {/* Heading pointer */}
              <div
                className="absolute -top-2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px]"
                style={{
                  borderBottomColor: userTerritoryColor,
                  transform: 'translateY(-2px)',
                }}
              />
            </div>
          </div>
        </AdvancedMarker>
      </Map>

      {/* On-Map Floating Legend / Toggle Chip for Runnable Roads */}
      <div className="absolute top-20 left-3 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={() => setShowRoadsHighlight((prev) => !prev)}
          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-sm border transition-all cursor-pointer ${
            showRoadsHighlight
              ? 'bg-white/95 text-slate-800 border-slate-200 backdrop-blur-xs hover:bg-white'
              : 'bg-slate-100 text-slate-400 border-slate-200'
          }`}
          title="Toggle runnable roads highlight"
        >
          <span
            className={`w-3 h-1 rounded-full ${showRoadsHighlight ? 'bg-slate-500' : 'bg-slate-300'}`}
          />
          <span>Claimable Roads Highlighted</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-extrabold border border-slate-200">
            {runnableRoads.length}
          </span>
        </button>
      </div>

      {/* Interactive Selected Road Intel Card */}
      {selectedRoad && (
        <div className="absolute bottom-3 inset-x-3 z-30 bg-slate-950/95 text-white border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-md flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">
                  {selectedRoad.type === 'track' ? 'sprint' : 'route'}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[12px] font-black uppercase text-white tracking-wide">
                    {selectedRoad.name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[9px] font-bold border border-slate-700 uppercase">
                    CLAIMABLE ROAD
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                  {selectedRoad.description}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedRoad(null)}
              className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
              aria-label="Close road details"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Distance</span>
                <span className="text-xs font-black font-metric text-white">{selectedRoad.distanceKm} km</span>
              </div>
              <div className="h-5 w-px bg-slate-800" />
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Turf Yield</span>
                <span className="text-xs font-black font-metric text-emerald-400">+{selectedRoad.claimYieldKm2} km²</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedRoad(null);
                startActivity();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#FC5200] hover:bg-[#E04800] text-white text-[11px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
            >
              <span>Run Road</span>
              <span className="material-symbols-outlined text-[14px]">bolt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
