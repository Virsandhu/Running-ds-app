import React, { useEffect, useState, useMemo } from 'react';
import { Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useZoneRush } from '../../context/ZoneRushContext';
import { DOON_SCHOOL_BOUNDS, DOON_SCHOOL_CAMPUS_TERRITORY } from '../map/GoogleMapComponent';

interface ConfettiPiece {
  id: number;
  left: number;
  size: number;
  height: number;
  color: string;
  delay: number;
  duration: number;
}

// Inverted mask to restrict conquest map strictly to The Doon School
const ConquestMask: React.FC = () => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib) return;

    const worldOuter = [
      { lat: 85, lng: -180 },
      { lat: 85, lng: 180 },
      { lat: -85, lng: 180 },
      { lat: -85, lng: -180 },
    ];

    const mask = new mapsLib.Polygon({
      paths: [worldOuter, DOON_SCHOOL_CAMPUS_TERRITORY],
      strokeColor: '#050811',
      strokeOpacity: 1.0,
      strokeWeight: 0,
      fillColor: '#070B14',
      fillOpacity: 1.0,
      map,
      clickable: false,
      zIndex: 2,
    });

    return () => {
      mask.setMap(null);
    };
  }, [map, mapsLib]);

  return null;
};

// Polyline helper for conquest map
const ConquestPolyline: React.FC<{
  path: { lat: number; lng: number }[];
  strokeColor: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  zIndex?: number;
}> = ({ path, strokeColor, strokeWeight = 3, strokeOpacity = 0.95, zIndex = 6 }) => {
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

// Polygon helper for conquest map
const ConquestPolygon: React.FC<{
  paths: { lat: number; lng: number }[];
  strokeColor: string;
  fillColor: string;
  fillOpacity?: number;
  strokeWeight?: number;
  strokeOpacity?: number;
  zIndex?: number;
}> = ({
  paths,
  strokeColor,
  fillColor,
  fillOpacity = 0.35,
  strokeWeight = 2,
  strokeOpacity = 0.85,
  zIndex = 5,
}) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib || paths.length < 3) return;

    const polygon = new mapsLib.Polygon({
      paths,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      fillColor,
      fillOpacity,
      zIndex,
      map,
    });

    return () => {
      polygon.setMap(null);
    };
  }, [map, mapsLib, paths, strokeColor, fillColor, fillOpacity, strokeWeight, strokeOpacity, zIndex]);

  return null;
};

// Camera bounds controller for conquest map
const ConquestMapCameraController: React.FC<{
  paths: { lat: number; lng: number }[];
}> = ({ paths }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || paths.length === 0) return;
    if (typeof window !== 'undefined' && window.google?.maps?.LatLngBounds) {
      const bounds = new window.google.maps.LatLngBounds();
      paths.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, 45);
    } else {
      map.panTo(paths[0]);
    }
  }, [map, paths]);

  return null;
};

export const ConquestScreen: React.FC = () => {
  const { latestConquest, closeConquestScreen, userTerritoryColor, userLocation } = useZoneRush();
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [sharedNotice, setSharedNotice] = useState<string | null>(null);

  useEffect(() => {
    // Generate celebration confetti
    const colors = ['#FC5200', '#2563EB', '#F59E0B', '#10B981', '#0F172A'];
    const pieces: ConfettiPiece[] = Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: Math.random() * 95,
      size: Math.random() * 6 + 4,
      height: (Math.random() * 6 + 4) * (Math.random() > 0.5 ? 1.5 : 1),
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 800,
      duration: Math.random() * 1500 + 1200,
    }));
    setConfetti(pieces);
  }, []);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'Territory Conquest Sealed - ZoneRush',
          text: `I just captured territory (+${latestConquest?.capturedKm2 || 0.05} km²) on ZoneRush! Sealed loop displacement: ${latestConquest?.displacementMeters || 0}m.`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      setSharedNotice('Victory card link copied to clipboard!');
      setTimeout(() => setSharedNotice(null), 3000);
    }
  };

  const mapCenter = useMemo(() => {
    if (latestConquest?.polygonPaths && latestConquest.polygonPaths.length > 0) {
      return latestConquest.polygonPaths[0];
    }
    return userLocation;
  }, [latestConquest, userLocation]);

  if (!latestConquest) return null;

  return (
    <div className="flex-1 flex flex-col relative w-full pt-16 pb-12 bg-[#F8FAFC] max-w-md mx-auto select-none overflow-hidden">
      {/* Dynamic Confetti Burst */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-30 overflow-hidden"
      >
        {confetti.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-xs animate-bounce opacity-80"
            style={{
              left: `${p.left}%`,
              top: `${Math.random() * 60 + 10}%`,
              width: `${p.size}px`,
              height: `${p.height}px`,
              backgroundColor: p.color,
              animationDuration: `${p.duration}ms`,
              animationDelay: `${p.delay}ms`,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col w-full px-4 space-y-3.5">
        {/* Celebration Header Card */}
        <div className="relative w-full rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm overflow-hidden mt-2">
          <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-orange-100/60 blur-xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-blue-100/50 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-metric text-[10px] uppercase font-bold tracking-wider">
                Loop Sealed &amp; Territory Captured
              </span>
            </div>

            <div className="space-y-0.5">
              <h2 className="font-sans text-[26px] uppercase tracking-tight text-slate-900 font-extrabold">
                Conquest Confirmed!
              </h2>
              <div className="flex items-center justify-center gap-1.5 text-[#FC5200]">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span className="font-metric text-[12px] uppercase tracking-wider font-bold text-slate-800">
                  {latestConquest.sectorName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Live Google Map Card showing EXACT captured location */}
        <div className="relative w-full h-64 rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
          <Map
            id="conquest-result-map"
            mapId="CONQUEST_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            defaultCenter={mapCenter}
            defaultZoom={17}
            restriction={{
              latLngBounds: DOON_SCHOOL_BOUNDS,
              strictBounds: true,
            }}
            mapTypeId="hybrid"
            gestureHandling="greedy"
            disableDefaultUI={true}
            className="w-full h-full"
          >
            {/* Camera auto-fit to captured polygon coordinates */}
            <ConquestMapCameraController
              paths={
                latestConquest.polygonPaths.length > 0
                  ? latestConquest.polygonPaths
                  : [userLocation]
              }
            />

            {/* Mask strictly hiding anything outside The Doon School */}
            <ConquestMask />

            {/* The Entire Doon School Playable Running Area: Shaded under a very light shade of light blue */}
            <ConquestPolygon
              paths={DOON_SCHOOL_CAMPUS_TERRITORY}
              strokeColor="#0284C7"
              fillColor="#38BDF8"
              fillOpacity={0.16}
              strokeWeight={2.2}
              strokeOpacity={0.85}
              zIndex={3}
            />

            {/* Translucent movement corridor shading in user's chosen territory color */}
            {latestConquest.rawGpsTrail && latestConquest.rawGpsTrail.length >= 2 && (
              <ConquestPolyline
                path={latestConquest.rawGpsTrail}
                strokeColor={userTerritoryColor}
                strokeWeight={12}
                strokeOpacity={0.16}
                zIndex={6}
              />
            )}

            {/* Dark black, slightly thin trail of user's movement */}
            {latestConquest.rawGpsTrail && latestConquest.rawGpsTrail.length >= 2 && (
              <ConquestPolyline
                path={latestConquest.rawGpsTrail}
                strokeColor="#000000"
                strokeWeight={2.2}
                strokeOpacity={0.95}
                zIndex={7}
              />
            )}

            {/* Displacement Line joining start and end points of the run (shortest distance) */}
            {latestConquest.rawGpsTrail && latestConquest.rawGpsTrail.length >= 2 && (
              <ConquestPolyline
                path={[
                  latestConquest.rawGpsTrail[0],
                  latestConquest.rawGpsTrail[latestConquest.rawGpsTrail.length - 1],
                ]}
                strokeColor="#2563EB"
                strokeWeight={2.2}
                strokeOpacity={0.9}
                zIndex={8}
              />
            )}

            {/* Enclosed Captured Territory Polygon shaded very lightly in User's chosen color */}
            {latestConquest.polygonPaths && latestConquest.polygonPaths.length >= 3 && (
              <ConquestPolygon
                paths={latestConquest.polygonPaths}
                strokeColor={userTerritoryColor}
                fillColor={userTerritoryColor}
                fillOpacity={0.10}
                strokeWeight={2.0}
                strokeOpacity={0.75}
                zIndex={5}
              />
            )}

            {/* Start point marker */}
            {latestConquest.rawGpsTrail && latestConquest.rawGpsTrail.length > 0 && (
              <AdvancedMarker position={latestConquest.rawGpsTrail[0]}>
                <div className="flex flex-col items-center">
                  <div className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md border border-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>START</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-emerald-600 rotate-45 -mt-0.5" />
                </div>
              </AdvancedMarker>
            )}

            {/* Finish point marker */}
            {latestConquest.rawGpsTrail && latestConquest.rawGpsTrail.length > 1 && (
              <AdvancedMarker
                position={latestConquest.rawGpsTrail[latestConquest.rawGpsTrail.length - 1]}
              >
                <div className="flex flex-col items-center">
                  <div className="bg-[#FC5200] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md border border-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>FINISH</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-[#FC5200] rotate-45 -mt-0.5" />
                </div>
              </AdvancedMarker>
            )}
          </Map>

          {/* Floating Map Legend Tag */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-slate-200/80 pointer-events-none">
            <span className="material-symbols-outlined text-[15px] text-emerald-600">
              verified
            </span>
            <span className="font-metric text-[10px] font-bold text-slate-800 uppercase tracking-wider">
              Real GPS Territory Synced
            </span>
          </div>

          {/* Floating Displacement Tag */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm border border-slate-200/80 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="font-metric text-[10px] font-semibold text-slate-700">
              Shortest Gap Sealed: {latestConquest.displacementMeters}m
            </span>
          </div>
        </div>

        {/* Primary Performance Yield & Stats */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm flex flex-col space-y-3.5">
          {/* Big Yield Hero: Area Calculated */}
          <div className="flex flex-col items-center text-center space-y-1 pt-1">
            <span className="text-[11px] font-metric uppercase tracking-wider text-slate-500 font-bold">
              Area Occupied &amp; Claimed
            </span>
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="font-metric text-[40px] font-extrabold text-[#FC5200] tracking-tight">
                +{latestConquest.capturedKm2}
              </span>
              <span className="font-metric text-[22px] text-slate-700 uppercase font-bold">
                km²
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[12px] font-sans">
              <span className="font-semibold text-slate-800">
                {latestConquest.capturedM2.toLocaleString()} m²
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold text-slate-800">
                {latestConquest.acresCaptured} Acres
              </span>
            </div>
          </div>

          {/* Loop Closure & Displacement Card */}
          <div className="rounded-xl bg-blue-50/70 border border-blue-200/80 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">timeline</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-metric text-[13px] text-[#2563EB] font-extrabold tracking-tight uppercase">
                    Loop Joined at Shortest Distance
                  </span>
                </div>
                <span className="text-[11px] text-slate-600 font-sans">
                  Start and end points sealed via displacement: <strong>{latestConquest.displacementMeters} meters</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Clean Athletic 2x2 Telemetry Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex flex-col">
              <span className="font-metric text-[10px] uppercase text-slate-500 font-semibold">
                Distance
              </span>
              <span className="font-metric text-[26px] text-slate-900 font-bold leading-tight mt-0.5">
                {latestConquest.distanceKm.toFixed(2)}
              </span>
              <span className="font-metric text-[10px] text-slate-400 uppercase font-medium">
                Kilometers Ran
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex flex-col">
              <span className="font-metric text-[10px] uppercase text-slate-500 font-semibold">
                Duration
              </span>
              <span className="font-metric text-[26px] text-slate-900 font-bold leading-tight mt-0.5">
                {formatDuration(latestConquest.durationSeconds)}
              </span>
              <span className="font-metric text-[10px] text-slate-400 uppercase font-medium">
                Minutes : Seconds
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex flex-col">
              <span className="font-metric text-[10px] uppercase text-slate-500 font-semibold">
                Avg Pace
              </span>
              <span className="font-metric text-[26px] text-slate-900 font-bold leading-tight mt-0.5">
                {latestConquest.avgPaceString}
              </span>
              <span className="font-metric text-[10px] text-slate-400 uppercase font-medium">
                Min / Km
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex flex-col">
              <span className="font-metric text-[10px] uppercase text-slate-500 font-semibold">
                Calories Burned
              </span>
              <span className="font-metric text-[26px] text-slate-900 font-bold leading-tight mt-0.5">
                {latestConquest.caloriesBurned}
              </span>
              <span className="font-metric text-[10px] text-slate-400 uppercase font-medium">
                Active Kcal
              </span>
            </div>
          </div>
        </div>

        {/* Floating Notification */}
        {sharedNotice && (
          <div className="p-3 bg-emerald-600 text-white rounded-xl text-center text-xs font-bold shadow-lg animate-in fade-in duration-200">
            {sharedNotice}
          </div>
        )}

        {/* Primary CTAs */}
        <div className="flex flex-col space-y-2.5 pt-1 pb-4">
          <button
            onClick={handleShare}
            className="w-full h-14 rounded-full bg-[#FC5200] hover:bg-[#E04800] text-white font-sans text-[15px] uppercase tracking-wider font-bold shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">ios_share</span>
            <span>Share Victory Card</span>
          </button>

          <button
            onClick={closeConquestScreen}
            className="w-full h-12 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-sans text-[14px] uppercase tracking-wide font-semibold shadow-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-500">
              map
            </span>
            <span>View on Live Map / Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
