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
import { formatMetres, formatSquareMetres } from '../../utils/units';

interface GoogleMapComponentProps {
  className?: string;
  zoom?: number;
}

// How long after a recenter tap the camera keeps following GPS fixes
const RECENTER_FOLLOW_MS = 10000;

// Turn-by-turn style camera used while a run is active
const NAV_ZOOM = 19;
const NAV_TILT = 45;
const NAV_ANIMATION_MS = 1200;

// Eases zoom and tilt from the current camera to the target (moveCamera alone jumps)
const animateCamera = (map: google.maps.Map, target: { zoom: number; tilt: number }) => {
  const startZoom = map.getZoom() ?? target.zoom;
  const startTilt = map.getTilt() ?? 0;
  const startedAt = performance.now();
  let frame = 0;
  const step = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / NAV_ANIMATION_MS);
    const eased = 1 - Math.pow(1 - progress, 3);
    map.moveCamera({
      zoom: startZoom + (target.zoom - startZoom) * eased,
      tilt: startTilt + (target.tilt - startTilt) * eased,
    });
    if (progress < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
};

// While following (active run) the camera zooms in, tilts and tracks the runner.
// Otherwise it pans only just after a recenter tap, so the map can be scrolled freely.
const MapCameraController: React.FC<{
  center: { lat: number; lng: number };
  zoom: number;
  follow: boolean;
  recenterRequestedAt: number;
}> = ({ center, zoom, follow, recenterRequestedAt }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (follow) {
      map.moveCamera({ center });
      return animateCamera(map, { zoom: NAV_ZOOM, tilt: NAV_TILT });
    }
    map.moveCamera({ tilt: 0 });
  }, [map, follow]);

  useEffect(() => {
    if (!map) return;
    if (follow || Date.now() - recenterRequestedAt < RECENTER_FOLLOW_MS) {
      map.panTo(center);
    }
  }, [map, center.lat, center.lng, follow, recenterRequestedAt]);

  useEffect(() => {
    if (!map || follow) return;
    map.setZoom(Math.min(20, Math.max(MIN_MAP_ZOOM, zoom)));
  }, [map, zoom, follow]);

  return null;
};

// Marker size relative to the map: full size at NAV_ZOOM, halving every 4 zoom levels out
const markerScaleForZoom = (zoom: number) => Math.min(1.1, Math.pow(2, (zoom - NAV_ZOOM) / 4));

// Scales marker content around its anchor point (bottom centre)
const ScaledMarkerContent: React.FC<{ scale: number; children: React.ReactNode }> = ({ scale, children }) => (
  <div style={{ transform: `scale(${scale})`, transformOrigin: 'bottom center' }}>{children}</div>
);

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
      fillOpacity: 0.14,
      map,
      clickable: false,
      zIndex: 9,
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
  zIndex?: number;
  onClick?: () => void;
}> = ({
  paths,
  strokeColor,
  fillColor,
  strokeWeight = 2.5,
  strokeOpacity = 0.85,
  fillOpacity = 0.22,
  zIndex = 5,
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
      zIndex,
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
  }, [map, mapsLib, paths, strokeColor, fillColor, strokeWeight, strokeOpacity, fillOpacity, zIndex, onClick]);

  return null;
};

// Polyline Overlay for running route (dark black, slightly thin trail or highlight corridor)
const PolylineOverlay: React.FC<{
  path: { lat: number; lng: number }[];
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  zIndex?: number;
}> = ({ path, strokeColor = '#000000', strokeWeight = 2.8, strokeOpacity = 0.95, zIndex = 6 }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib || path.length < 2) return;

    const polyline = new mapsLib.Polyline({
      path,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      zIndex,
      map,
    });

    return () => {
      polyline.setMap(null);
    };
  }, [map, mapsLib, path, strokeColor, strokeWeight, strokeOpacity, zIndex]);

  return null;
};

// Closing Line Overlay (joining start and end points: shortest distance / displacement)
const ClosingLineOverlay: React.FC<{
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  strokeColor?: string;
  strokeWeight?: number;
  zIndex?: number;
}> = ({ start, end, strokeColor = '#2563EB', strokeWeight = 2.5, zIndex = 8 }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib) return;

    const polyline = new mapsLib.Polyline({
      path: [start, end],
      strokeColor,
      strokeOpacity: 0.9,
      strokeWeight,
      zIndex,
      map,
    });

    return () => {
      polyline.setMap(null);
    };
  }, [map, mapsLib, start.lat, start.lng, end.lat, end.lng, strokeColor, strokeWeight, zIndex]);

  return null;
};

// The Doon School Campus Landmarks
const DOON_SCHOOL_LANDMARKS = [
  {
    id: 'doon-main',
    name: 'Main Building',
    sub: 'Chandbagh Quadrangle',
    lat: 30.3340,
    lng: 78.0310,
    icon: 'account_balance',
    color: 'bg-indigo-600',
  },
];

// Outside Campus Inverted Mask: dims (but still shows) the surroundings so the campus stands out
const OutsideCampusMask: React.FC<{
  campusBoundary: { lat: number; lng: number }[];
}> = ({ campusBoundary }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib || campusBoundary.length < 3) return;

    // Outer world ring with campusBoundary as inner cutout hole
    const worldOuter = [
      { lat: 85, lng: -180 },
      { lat: 85, lng: 180 },
      { lat: -85, lng: 180 },
      { lat: -85, lng: -180 },
    ];

    const mask = new mapsLib.Polygon({
      paths: [worldOuter, campusBoundary],
      strokeColor: '#050811',
      strokeOpacity: 1.0,
      strokeWeight: 0,
      fillColor: '#070B14',
      fillOpacity: 0.45,
      map,
      clickable: false,
      zIndex: 2,
    });

    return () => {
      mask.setMap(null);
    };
  }, [map, mapsLib, campusBoundary]);

  return null;
};

// Full Authentic 72-Acre Campus Perimeter Boundary for The Doon School (Chandbagh Estate, Dehradun)
// Accurately calibrated to include all gates, residential boarding houses, athletics stadium, and estate walls
export const DOON_SCHOOL_CAMPUS_TERRITORY = [
  // Northwest Corner (Mall Road West & Cantt boundary link)
  { lat: 30.3375, lng: 78.0264 },
  // North Perimeter along Mall Road Wall
  { lat: 30.3378, lng: 78.0282 },
  { lat: 30.3382, lng: 78.0304 }, // Mall Road North Wall
  { lat: 30.3380, lng: 78.0320 }, // Main Chandbagh Gate
  { lat: 30.3375, lng: 78.0338 }, // North-East Mall Road approach
  { lat: 30.3368, lng: 78.0355 }, // Northeast curve above Rose Bowl
  // East Perimeter (Rose Bowl woodland, Art School, riverbank ridge)
  { lat: 30.3358, lng: 78.0364 }, // Rose Bowl hillside & upper terrace
  { lat: 30.3345, lng: 78.0366 }, // Eastern boundary ridge
  { lat: 30.3332, lng: 78.0364 }, // Skinner's Field eastern boundary
  { lat: 30.3318, lng: 78.0360 }, // Skinner's Field south-east corner
  { lat: 30.3308, lng: 78.0348 }, // Southeast corner above riverbank
  // South Perimeter (Lower sports grounds, Pavilion, Pool, Chakrata Road entrance)
  { lat: 30.3300, lng: 78.0335 }, // Lower sports fields
  { lat: 30.3296, lng: 78.0318 }, // South central boundary
  { lat: 30.3298, lng: 78.0302 }, // Chakrata Road Gate
  { lat: 30.3304, lng: 78.0286 }, // Southwest sports ground corner
  // West Perimeter (Kashmir House, Oberoi House, Wellness center, Tata & Jaipur House)
  { lat: 30.3312, lng: 78.0274 }, // Southwest wall
  { lat: 30.3324, lng: 78.0266 }, // Kashmir House grounds
  { lat: 30.3338, lng: 78.0264 }, // West central wall (Oberoi House)
  { lat: 30.3352, lng: 78.0263 }, // Jaipur & Tata House wall
  { lat: 30.3364, lng: 78.0264 }, // Northwest wall approach
  { lat: 30.3375, lng: 78.0264 }, // Back to Northwest Corner
];

// Scrollable area: the campus plus a margin of the surrounding neighbourhood
export const DOON_SCHOOL_BOUNDS = {
  north: 30.3440,
  south: 30.3240,
  west: 78.0200,
  east: 78.0430,
};

export const MIN_MAP_ZOOM = 15;

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
    runTelemetry,
    recenterRequestedAt,
    isRunning,
  } = useZoneRush();
  const [cameraZoom, setCameraZoom] = useState<number>(16);
  const markerScale = markerScaleForZoom(cameraZoom);

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
        defaultCenter={{ lat: 30.3340, lng: 78.0310 }}
        defaultZoom={16}
        minZoom={MIN_MAP_ZOOM}
        maxZoom={20}
        restriction={{
          latLngBounds: DOON_SCHOOL_BOUNDS,
          strictBounds: true,
        }}
        mapTypeId={mapTypeId}
        gestureHandling="greedy"
        onZoomChanged={(e) => setCameraZoom(e.detail.zoom)}
        disableDefaultUI={true}
        className="w-full h-full"
      >
        {/* Camera controller strictly locked over The Doon School */}
        <MapCameraController
          center={userLocation}
          zoom={zoomLevel || zoom}
          follow={currentTab === 'activity' && isRunning}
          recenterRequestedAt={recenterRequestedAt}
        />

        {/* Inverted Mask: dims the area outside The Doon School */}
        <OutsideCampusMask campusBoundary={DOON_SCHOOL_CAMPUS_TERRITORY} />

        {/* GPS Accuracy Radius Circle around Runner in User's Territory Color */}
        <AccuracyCircleOverlay
          center={userLocation}
          radiusMeters={gpsAccuracy ? Math.min(gpsAccuracy, 35) : 18}
          strokeColor={userTerritoryColor}
          fillColor={userTerritoryColor}
        />

        {/* RUNNABLE CLAIMABLE ROADS OVERLAY */}
        <RunnableRoadsOverlay
          roads={runnableRoads}
          selectedRoadId={selectedRoad?.id || null}
          onSelectRoad={(road) => setSelectedRoad(road)}
          showHighlight={showRoadsHighlight}
        />

        {/* The Entire Doon School Playable Running Area: faint translucent tint so greenery and buildings show through */}
        <PolygonOverlay
          paths={DOON_SCHOOL_CAMPUS_TERRITORY}
          strokeColor="#7DD3FC"
          fillColor="#BAE6FD"
          strokeWeight={1.5}
          strokeOpacity={0.6}
          fillOpacity={0.06}
          zIndex={3}
        />

        {/* CAMPUS OCCUPIED SECTORS: Each runner's area covered by their run is in a different shade */}
        {sectors.map((sec) => {
          const isUser = sec.ownerHandle.includes('(YOU)');
          const color = isUser ? userTerritoryColor : sec.ownerColor;
          return (
            <PolygonOverlay
              key={`sector-poly-${sec.id}`}
              paths={sec.paths || []}
              strokeColor={color}
              fillColor={color}
              strokeWeight={isUser ? 2.5 : 2.0}
              strokeOpacity={0.9}
              fillOpacity={isUser ? 0.32 : 0.25}
              zIndex={isUser ? 5 : 4}
              onClick={() => setSelectedSector(sec)}
            />
          );
        })}

        {/* Occupied Sector Owner Badges with User-Specific Colors */}
        {sectors.map((sec) => {
          if (!sec.centroid) return null;
          const isUser = sec.ownerHandle.includes('(YOU)');
          const color = isUser ? userTerritoryColor : sec.ownerColor;

          return (
            <AdvancedMarker
              key={`sector-tag-${sec.id}`}
              position={sec.centroid}
              onClick={() => setSelectedSector(sec)}
              zIndex={11}
            >
              <ScaledMarkerContent scale={markerScale}>
              <div className="flex flex-col items-center cursor-pointer select-none group">
                <div
                  className="px-2 py-0.5 rounded-full shadow-md text-white text-[9px] font-black uppercase tracking-tight flex items-center gap-1 border border-white/70 group-hover:scale-105 transition-transform backdrop-blur-xs"
                  style={{ backgroundColor: color }}
                  title={`${sec.name} • Occupied by ${sec.ownerHandle} (${formatSquareMetres(sec.areaKm2)} m²)`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full bg-white ${isUser ? 'animate-ping' : ''}`}
                  />
                  <span className="truncate max-w-[85px]">{sec.owner}</span>
                  <span className="text-[8px] font-metric opacity-90">({sec.code})</span>
                </div>
                <div
                  className="w-1.5 h-1.5 rotate-45 -mt-0.5 border-r border-b border-white/70"
                  style={{ backgroundColor: color }}
                />
              </div>
              </ScaledMarkerContent>
            </AdvancedMarker>
          );
        })}

        {/* The Doon School Campus Main Title Badge */}
        <AdvancedMarker position={{ lat: 30.3380, lng: 78.0318 }} zIndex={12}>
          <ScaledMarkerContent scale={markerScale}>
          <div
            onClick={() => {
              const s = sectors[0];
              if (s) {
                setSelectedSector(s);
              } else {
                setSelectedSector({
                  id: 'doon-open-arena',
                  code: 'DOON-OPEN',
                  name: 'The Doon School (Chandbagh Campus)',
                  owner: 'Unclaimed Playable Turf',
                  ownerHandle: '@CampusOpen',
                  ownerColor: '#0284C7',
                  fillColor: 'rgba(56, 189, 248, 0.18)',
                  areaKm2: 0.29,
                  points: '',
                  isContested: false,
                });
              }
            }}
            className="flex flex-col items-center cursor-pointer select-none group"
          >
            <div className="bg-slate-950/95 border-2 border-sky-400 text-white px-2.5 py-0.5 rounded-full shadow-xl flex items-center gap-1.5 group-hover:scale-105 transition-transform backdrop-blur-xs">
              <span className="material-symbols-outlined text-sky-400 text-[14px]">school</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-200">
                The Doon School (Playable Arena - 72 Acres)
              </span>
            </div>
            <div className="w-1.5 h-1.5 bg-slate-950 rotate-45 -mt-0.5 border-r-2 border-b-2 border-sky-400" />
          </div>
          </ScaledMarkerContent>
        </AdvancedMarker>

        {/* USER COVERED AREA: Highlighted & Shaded Very Lightly in Chosen Territory Color */}
        {/* 1. Translucent movement corridor shading along the covered path in chosen color */}
        {runTelemetry?.gpsTrail && runTelemetry.gpsTrail.length >= 2 && (
          <PolylineOverlay
            path={runTelemetry.gpsTrail}
            strokeColor={userTerritoryColor}
            strokeWeight={12}
            strokeOpacity={0.16}
            zIndex={6}
          />
        )}

        {/* 2. Real Live GPS Movement Trail: Dark black, slightly thin trail */}
        {runTelemetry?.gpsTrail && runTelemetry.gpsTrail.length >= 2 && (
          <PolylineOverlay
            path={runTelemetry.gpsTrail}
            strokeColor="#000000"
            strokeWeight={2.2}
            strokeOpacity={0.95}
            zIndex={7}
          />
        )}

        {/* 3. Real-time Closed Loop Covered Polygon Shaded Very Lightly in User's Chosen Color */}
        {runTelemetry?.gpsTrail && runTelemetry.gpsTrail.length >= 3 && (
          <PolygonOverlay
            paths={[...runTelemetry.gpsTrail, runTelemetry.gpsTrail[0]]}
            strokeColor={userTerritoryColor}
            fillColor={userTerritoryColor}
            strokeWeight={2.0}
            strokeOpacity={0.75}
            fillOpacity={0.10}
            zIndex={5}
          />
        )}

        {/* 4. Start Point Pin Marker */}
        {runTelemetry?.gpsTrail && runTelemetry.gpsTrail.length >= 1 && (
          <AdvancedMarker position={runTelemetry.gpsTrail[0]}>
            <ScaledMarkerContent scale={markerScale}>
            <div className="flex flex-col items-center">
              <div className="bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>START</span>
              </div>
              <div className="w-1.5 h-1.5 bg-emerald-600 rotate-45 -mt-0.5" />
            </div>
            </ScaledMarkerContent>
          </AdvancedMarker>
        )}

        {/* 5. Closing Line: Shortest distance between start and current/end point (Displacement) */}
        {runTelemetry?.gpsTrail && runTelemetry.gpsTrail.length >= 2 && (
          <ClosingLineOverlay
            start={runTelemetry.gpsTrail[0]}
            end={userLocation}
            strokeColor="#2563EB"
          />
        )}

        {/* The Doon School Campus Landmarks */}
        {DOON_SCHOOL_LANDMARKS.map((landmark) => (
          <AdvancedMarker
            key={landmark.id}
            position={{ lat: landmark.lat, lng: landmark.lng }}
          >
            <ScaledMarkerContent scale={markerScale}>
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
            </ScaledMarkerContent>
          </AdvancedMarker>
        ))}

        {/* Real User GPS Runner Advanced Marker Pulsing in User's Distinct Territory Color */}
        <AdvancedMarker position={userLocation}>
          <ScaledMarkerContent scale={markerScale}>
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
              {/* Heading pointer oriented to real movement bearing */}
              <div
                className="absolute -top-2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] transition-transform duration-300"
                style={{
                  borderBottomColor: userTerritoryColor,
                  transform: `translateY(-3px) rotate(${runTelemetry.currentBearing || 0}deg)`,
                  transformOrigin: 'bottom center',
                }}
              />
            </div>
          </div>
          </ScaledMarkerContent>
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
                <span className="text-xs font-black font-metric text-white">{formatMetres(selectedRoad.distanceKm)} m</span>
              </div>
              <div className="h-5 w-px bg-slate-800" />
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Turf Yield</span>
                <span className="text-xs font-black font-metric text-emerald-400">+{formatSquareMetres(selectedRoad.claimYieldKm2)} m²</span>
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
