import React, { useState, useRef, useEffect } from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';
import { GoogleMapComponent } from '../map/GoogleMapComponent';
import { audioService } from '../../services/audioService';

export const ActiveRunScreen: React.FC = () => {
  const {
    runTelemetry,
    togglePauseRun,
    sealLoopAndFinish,
    setLockState,
    setCurrentTab,
    isSimulatorActive,
    setIsSimulatorActive,
    simulationSpeed,
    setSimulationSpeed,
    stepSimulation,
    gpsStatus,
    gpsAccuracy,
    setIsGpsModalOpen,
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
      {/* Real Google Map Tracking Canvas */}
      <div className="relative w-full h-[395px] overflow-hidden bg-slate-100">
        <GoogleMapComponent className="w-full h-full" zoom={17} />

        {/* Top Floating Status Pill Strip */}
        <div className="absolute top-3 inset-x-3.5 flex flex-col gap-2 pointer-events-auto z-10">
          {/* GPS and Status Strip */}
          <div
            onClick={() => setIsGpsModalOpen(true)}
            className="flex items-center justify-between px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-slate-200 cursor-pointer active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  gpsStatus === 'locked'
                    ? 'bg-emerald-500 animate-pulse'
                    : gpsStatus === 'searching'
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-[11px] font-bold font-metric tracking-wider uppercase text-slate-800">
                {gpsStatus === 'locked'
                  ? isSimulatorActive
                    ? 'SIMULATED GPS'
                    : `GPS LOCKED (±${gpsAccuracy || 5}m)`
                  : gpsStatus === 'searching'
                  ? 'LOCATING GPS...'
                  : 'GPS BLOCKED • TAP TO FIX'}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-[11px] font-medium text-slate-500">
                {isSimulatorActive ? 'Demo Speed' : 'Live Hardware'}
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
                {isSimulatorActive ? 'SIMULATION' : 'LIVE RUN'}
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
                  LOOP CLOSURE
                </span>
                <span className="text-[11px] font-semibold text-blue-600 leading-tight">
                  {runTelemetry.displacementMeters}m displacement to start
                </span>
              </div>
            </div>
            <button
              onClick={() => audioService.playBeacon()}
              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 font-metric text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">turn_slight_left</span>
              <span>BEACON</span>
            </button>
          </div>
        </div>

        {/* On-Map Floating Territory Indicator Tag */}
        <div className="absolute top-[148px] left-3.5 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-blue-200 z-10">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span className="text-[11px] font-metric font-bold text-blue-700 uppercase tracking-wider">
            EST. TERRITORY: +{runTelemetry.estimatedTerritoryYield.toFixed(3)} KM²
          </span>
        </div>

        {/* Floating Map Controls */}
        <div className="absolute right-3.5 bottom-6 flex flex-col gap-2 pointer-events-auto z-10">
          <button
            onClick={() => setCurrentTab('map')}
            className="w-10 h-10 rounded-full bg-white text-slate-700 border border-slate-200 flex items-center justify-center shadow-md active:scale-95 transition-transform hover:bg-slate-50 cursor-pointer"
            title="Inspect Territory"
          >
            <span className="material-symbols-outlined text-[19px]">layers</span>
          </button>
          <button
            onClick={() => audioService.playTick()}
            className="w-10 h-10 rounded-full bg-white text-[#FC5200] border border-slate-200 flex items-center justify-center shadow-md active:scale-95 transition-transform hover:bg-slate-50 cursor-pointer"
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
            <div className="flex items-center gap-1 mt-1 text-slate-700">
              <span
                className={`material-symbols-outlined text-[15px] ${
                  runTelemetry.currentDirection ? 'text-emerald-600 animate-pulse' : 'text-slate-400'
                }`}
              >
                {runTelemetry.currentDirection ? 'directions_run' : 'front_hand'}
              </span>
              <span className="text-[11px] font-semibold">
                {runTelemetry.currentDirection
                  ? `Moving ${runTelemetry.currentDirection} (${runTelemetry.currentBearing || 0}°)`
                  : 'Stationary / Stopped'}
              </span>
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
              <span
                className={`text-[10px] font-metric font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                  runTelemetry.isPaused
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'bg-rose-50 text-rose-600 border border-rose-200'
                }`}
              >
                {runTelemetry.isPaused ? 'PAUSED' : 'REC'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-slate-500">
              <span className="material-symbols-outlined text-[14px]">timer</span>
              <span className="text-[11px] font-medium">Active Timer</span>
            </div>
          </div>
        </div>

        {/* Secondary Metrics: Pace, Zone Claim, Movement Heading (No Vitals) */}
        <div className="grid grid-cols-3 gap-2">
          {/* Pace */}
          <div className="flex flex-col bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-metric uppercase font-bold text-slate-500 tracking-wider">
              PACE
            </span>
            <span className="font-metric text-[22px] font-bold text-slate-900 mt-0.5">
              {runTelemetry.paceSeconds > 0
                ? `${Math.floor(runTelemetry.paceSeconds / 60)}:${(
                    runTelemetry.paceSeconds % 60
                  )
                    .toString()
                    .padStart(2, '0')}`
                : '--:--'}
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
              +{runTelemetry.estimatedTerritoryYield.toFixed(3)}
            </span>
            <span className="text-[11px] text-blue-600 font-semibold">km² preview</span>
          </div>

          {/* Heading & Direction (Replaces Vitals) */}
          <div className="flex flex-col bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-metric uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-[#FC5200]">
                navigation
              </span>
              HEADING
            </span>
            <span className="font-metric text-[22px] font-bold text-slate-900 mt-0.5 truncate">
              {runTelemetry.currentDirection ? runTelemetry.currentDirection : 'STOPPED'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {typeof runTelemetry.currentBearing === 'number'
                ? `${runTelemetry.currentBearing}° bearing`
                : 'Awaiting move'}
            </span>
          </div>
        </div>

        {/* Loop Closure & Displacement Bar */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">
              polyline
            </span>
            <span className="text-[12px] text-slate-600">
              Start-to-End Gap:{' '}
              <strong className="text-slate-900 font-bold">
                {runTelemetry.displacementMeters}m displacement
              </strong>
            </span>
          </div>
          <span className="text-[10px] font-metric font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full tracking-wider uppercase">
            {runTelemetry.displacementMeters < 35 && runTelemetry.distanceKm > 0.1
              ? 'READY TO SEAL'
              : 'TRAIL ACTIVE'}
          </span>
        </div>

        {/* Laptop Testing Simulation Bar */}
        <div className="p-2.5 rounded-xl bg-orange-50/80 border border-orange-200/90 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsSimulatorActive((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg font-metric text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                isSimulatorActive
                  ? 'bg-[#FC5200] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {isSimulatorActive ? '🏃 Sim: ON' : 'GPS Mode'}
            </button>
            <span className="text-[11px] font-sans text-slate-600 font-medium truncate">
              {isSimulatorActive ? 'Auto-moving on map' : 'Using device hardware'}
            </span>
          </div>

          {isSimulatorActive && (
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5">
                {[1, 2, 5].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setSimulationSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-metric font-bold cursor-pointer ${
                      simulationSpeed === spd
                        ? 'bg-[#FC5200] text-white'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={stepSimulation}
                className="px-2 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-metric text-[10px] font-bold uppercase shadow-xs active:scale-95 transition-all cursor-pointer"
                title="Advance 200m towards closing loop"
              >
                +200m
              </button>
            </div>
          )}
        </div>

        {/* Floating Athletic Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          {/* Strava Secondary Circular Pause Button */}
          <button
            aria-label={runTelemetry.isPaused ? 'Resume tracking' : 'Pause tracking'}
            onClick={togglePauseRun}
            disabled={isLocked}
            className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer ${
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
