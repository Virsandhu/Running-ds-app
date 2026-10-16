import React, { useState, useRef, useEffect } from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';
import { audioService } from '../../services/audioService';

export const ActiveRunScreen: React.FC = () => {
  const {
    runTelemetry,
    togglePauseRun,
    sealLoopAndFinish,
    setLockState,
    setCurrentTab,
  } = useZoneRush();

  // Format seconds into MM:SS
  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Slide to Lock Drag State
  const [slideDelta, setSlideDelta] = useState(0);
  const [isLocked, setIsLocked] = useState(runTelemetry.isLocked);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const maxSlide = 210;

  const handleStartDrag = (clientX: number) => {
    isDraggingRef.current = true;
    startXRef.current = clientX;
  };

  const handleMoveDrag = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const currentX = clientX;
    const delta = Math.max(0, Math.min(currentX - startXRef.current, maxSlide));
    setSlideDelta(delta);

    if (delta >= maxSlide - 10) {
      isDraggingRef.current = false;
      const newLocked = !isLocked;
      setIsLocked(newLocked);
      setLockState(newLocked);
      setSlideDelta(0);
      audioService.playTick();
    }
  };

  const handleEndDrag = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setSlideDelta(0);
  };

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => handleMoveDrag(e.touches[0].clientX);
    const onTouchEnd = () => handleEndDrag();
    const onMouseMove = (e: MouseEvent) => handleMoveDrag(e.clientX);
    const onMouseUp = () => handleEndDrag();

    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isLocked]);

  return (
    <div className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface max-w-md mx-auto select-none">
      {/* Daytime Outdoor Map Tracking Canvas */}
      <div className="relative w-full h-[395px] overflow-hidden bg-slate-100">
        {/* Bright Outdoor Vector Map Base */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center filter saturate-105 brightness-100 contrast-95"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAddvTgqXei8JntCl_2y35E-9-4y6TLE1kJXcoiMr2QrBLVw6VSGgyz4Lp1l-f_KlKCscsqzRjOCaeRtThzQDloJu27vEFuB7kUAGwE_nA2xGWdsWAZoEzGL4JS2KxgobIt0KZHzg9Qn1vUJS63BKrG72rX0YYhlY2gia2TbpsZ97vfGrEQeiP-sL8eReNtXcI3fUdn2SnEh1TuDjsaHvfTx8aJmskZdGnL2P8S29v_fRD1V5agWZE')`,
            filter: 'invert(0.92) hue-rotate(180deg) contrast(1.15) brightness(1.05)',
          }}
        />

        {/* Crisp Vignette Overlay for Depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-transparent to-slate-200/40 pointer-events-none" />

        {/* Vector Territory & Strava Route Overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          fill="none"
          viewBox="0 0 390 395"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Territory Polygon Preview (Athletic Blue translucent + clean border) */}
          <polygon
            fill="#2563eb"
            fillOpacity="0.14"
            points="68,105 170,62 312,98 338,228 245,290 142,260 76,215"
            stroke="#2563eb"
            strokeDasharray="4 3"
            strokeWidth="1.8"
          />

          {/* Dashed Return Closure Path */}
          <path
            d="M 245 290 Q 150 330 68 105"
            stroke="#2563eb"
            strokeDasharray="6 6"
            strokeOpacity="0.6"
            strokeWidth="2.5"
          />

          {/* Active Strava High-Contrast Route Polyline */}
          <path
            d="M 68 105 C 110 50, 240 45, 312 98 C 360 140, 360 210, 338 228 C 315 250, 275 275, 245 290"
            stroke="#FC5200"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5.5"
          />

          {/* Kilometer Markers along route */}
          <g transform="translate(160, 65)">
            <circle fill="#ffffff" r="4.5" stroke="#FC5200" strokeWidth="2" />
          </g>
          <g transform="translate(312, 98)">
            <circle fill="#ffffff" r="4.5" stroke="#FC5200" strokeWidth="2" />
          </g>
          <g transform="translate(338, 228)">
            <circle fill="#ffffff" r="4.5" stroke="#FC5200" strokeWidth="2" />
          </g>

          {/* Origin Pin (Start point) */}
          <g transform="translate(68, 105)">
            <circle fill="#1e293b" r="8" />
            <circle fill="#ffffff" r="3.5" />
          </g>

          {/* Strava Live Runner Apex Beacon */}
          <g transform="translate(245, 290)">
            <circle className="animate-ping" fill="#FC5200" fillOpacity="0.25" r="18" />
            <circle fill="#FC5200" r="10" stroke="#ffffff" strokeWidth="3" />
            <polygon fill="#ffffff" points="0,-6 4,4 -4,4" />
          </g>
        </svg>

        {/* Top Floating Status Pill Strip */}
        <div className="absolute top-3 inset-x-3.5 flex flex-col gap-2 pointer-events-auto">
          {/* GPS and Status Strip */}
          <div className="flex items-center justify-between px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-bold font-metric tracking-wider uppercase text-slate-800">
                GPS LOCKED
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-[11px] font-medium text-slate-500">
                0.02s Latency
              </span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
              <span
                className="material-symbols-outlined text-[13px] text-[#FC5200]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                sensors
              </span>
              <span className="text-[10px] text-slate-700 font-bold tracking-wider font-metric uppercase">
                LIVE TRACK
              </span>
            </div>
          </div>

          {/* Loop Detector Bar */}
          <div className="flex items-center justify-between px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="relative w-6 h-6 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4.5"
                  />
                  <path
                    className="text-[#FC5200] transition-all duration-500"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${runTelemetry.loopProgressPct}, 100`}
                    strokeLinecap="round"
                    strokeWidth="4.5"
                  />
                </svg>
                <span className="absolute text-[8px] font-metric text-slate-800 font-bold">
                  {runTelemetry.loopProgressPct}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-wide uppercase text-slate-800 font-metric">
                  LOOP DETECTOR
                </span>
                <span className="text-[11px] font-semibold text-blue-600 leading-tight">
                  {runTelemetry.distanceToSealMeters}m to seal boundary
                </span>
              </div>
            </div>
            <button
              onClick={() => audioService.playBeacon()}
              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 font-metric text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">turn_slight_left</span>
              <span>BEACON</span>
            </button>
          </div>
        </div>

        {/* On-Map Floating Territory Indicator Tag */}
        <div className="absolute top-[148px] left-3.5 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-blue-200">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="text-[11px] font-metric font-bold text-blue-700 uppercase tracking-wider">
            EST. TERRITORY: +{runTelemetry.estimatedTerritoryYield} KM²
          </span>
        </div>

        {/* Floating Map Controls */}
        <div className="absolute right-3.5 bottom-6 flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={() => setCurrentTab('map')}
            className="w-10 h-10 rounded-full bg-white text-slate-700 border border-slate-200 flex items-center justify-center shadow-md active:scale-95 transition-transform hover:bg-slate-50"
            title="Inspect Territory"
          >
            <span className="material-symbols-outlined text-[19px]">layers</span>
          </button>
          <button
            onClick={() => audioService.playTick()}
            className="w-10 h-10 rounded-full bg-white text-[#FC5200] border border-slate-200 flex items-center justify-center shadow-md active:scale-95 transition-transform hover:bg-slate-50"
            title="Recenter Tracking"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              my_location
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Floating Stats Sheet */}
      <div className="w-full bg-slate-50 px-4 pt-3.5 pb-6 rounded-t-3xl -mt-5 relative shadow-[0_-8px_25px_rgba(15,23,42,0.08)] border-t border-slate-200 flex flex-col gap-3.5 z-10">
        {/* Pull Bar Indicator */}
        <div className="w-11 h-1.5 rounded-full bg-slate-300 mx-auto" />

        {/* Primary Distance & Duration High-Contrast Metric Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Distance Tile */}
          <div className="flex flex-col bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
            <span className="text-[11px] font-metric uppercase font-bold tracking-wider text-slate-500">
              DISTANCE
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-metric text-[34px] leading-tight font-extrabold text-slate-900 tracking-tight">
                {runTelemetry.distanceKm.toFixed(2)}
              </span>
              <span className="font-metric text-[14px] text-slate-600 font-bold uppercase">
                KM
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-emerald-600">
              <span className="material-symbols-outlined text-[15px]">trending_up</span>
              <span className="text-[11px] font-semibold">+0.62 km split</span>
            </div>
          </div>

          {/* Duration Tile */}
          <div className="flex flex-col bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
            <span className="text-[11px] font-metric uppercase font-bold tracking-wider text-slate-500">
              DURATION
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-metric text-[34px] leading-tight font-extrabold text-slate-900 tracking-tight">
                {formatDuration(runTelemetry.durationSeconds)}
              </span>
              <span className={`text-[10px] font-metric font-extrabold uppercase px-1.5 py-0.5 rounded-md ${runTelemetry.isPaused ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                {runTelemetry.isPaused ? 'PAUSED' : 'REC'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-slate-500">
              <span className="material-symbols-outlined text-[14px]">timer</span>
              <span className="text-[11px] font-medium">Active Timer</span>
            </div>
          </div>
        </div>

        {/* Secondary Metrics: Pace, Zone Claim, Heart Rate */}
        <div className="grid grid-cols-3 gap-2">
          {/* Pace */}
          <div className="flex flex-col bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-metric uppercase font-bold text-slate-500 tracking-wider">
              PACE
            </span>
            <span className="font-metric text-[22px] font-bold text-slate-900 mt-0.5">
              4:52
            </span>
            <span className="text-[11px] text-slate-500 font-medium">/km avg</span>
          </div>

          {/* Zone Claim */}
          <div className="flex flex-col bg-blue-50/70 p-3 rounded-xl border border-blue-200/90 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-metric uppercase font-bold text-blue-700 tracking-wider">
                ZONE CLAIM
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            </div>
            <span className="font-metric text-[22px] font-bold text-blue-700 mt-0.5">
              +{runTelemetry.estimatedTerritoryYield}
            </span>
            <span className="text-[11px] text-blue-600 font-semibold">km² preview</span>
          </div>

          {/* Vitals (HR) */}
          <div className="flex flex-col bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-metric uppercase font-bold text-rose-600 tracking-wider flex items-center gap-0.5">
              <span
                className="material-symbols-outlined text-[12px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
              VITALS
            </span>
            <span className="font-metric text-[22px] font-bold text-slate-900 mt-0.5">
              {runTelemetry.bpm}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              bpm • {runTelemetry.spm}spm
            </span>
          </div>
        </div>

        {/* Territorial Syndicate Status Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">
              verified_user
            </span>
            <span className="text-[12px] text-slate-600">
              Target Syndicate:{' '}
              <strong className="text-slate-900 font-bold">
                {runTelemetry.targetSyndicate}
              </strong>
            </span>
          </div>
          <span className="text-[10px] font-metric font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full tracking-wider uppercase">
            CONTESTING
          </span>
        </div>

        {/* Floating Athletic Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          {/* Strava Secondary Circular Pause Button */}
          <button
            aria-label={runTelemetry.isPaused ? 'Resume tracking' : 'Pause tracking'}
            onClick={togglePauseRun}
            disabled={isLocked}
            className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all ${
              runTelemetry.isPaused
                ? 'bg-[#FC5200] text-white border-2 border-[#FC5200]'
                : 'bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50'
            } ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {runTelemetry.isPaused ? 'play_arrow' : 'pause'}
            </span>
          </button>

          {/* Strava Athletic Orange Primary Kinetic Button */}
          <button
            onClick={sealLoopAndFinish}
            disabled={isLocked}
            className={`flex-1 h-14 rounded-full bg-[#FC5200] hover:bg-[#E04800] text-white flex items-center justify-center gap-2 px-5 shadow-md active:scale-98 transition-all font-metric text-[15px] font-bold uppercase tracking-wider cursor-pointer ${
              isLocked ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              sports_score
            </span>
            <span>SEAL LOOP &amp; FINISH</span>
          </button>
        </div>

        {/* Modern Light Slide to Lock Controls */}
        <div className="w-full relative mt-0.5">
          <div
            className={`h-11 w-full rounded-full border flex items-center justify-center px-2 relative overflow-hidden select-none transition-colors ${
              isLocked
                ? 'bg-orange-50 border-orange-200'
                : 'bg-slate-200/80 border-slate-300/80'
            }`}
          >
            {/* Slide Track Glow */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-orange-100 transition-all rounded-full"
              style={{ width: `${slideDelta + 44}px` }}
            />

            {/* Draggable Slider Thumb */}
            <div
              onMouseDown={(e) => handleStartDrag(e.clientX)}
              onTouchStart={(e) => handleStartDrag(e.touches[0].clientX)}
              className={`absolute left-1.5 w-8 h-8 rounded-full border flex items-center justify-center shadow-xs cursor-grab active:cursor-grabbing active:scale-105 transition-transform ${
                isLocked
                  ? 'bg-[#FC5200] text-white border-[#FC5200]'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
              style={{ transform: `translateX(${slideDelta}px)` }}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isLocked ? 'lock' : 'lock_open'}
              </span>
            </div>

            <span className="text-[10px] font-metric font-bold text-slate-500 uppercase tracking-widest pointer-events-none pl-6">
              {isLocked ? 'CONTROLS LOCKED • SLIDE TO UNLOCK' : 'SLIDE TO LOCK HUD CONTROLS'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
