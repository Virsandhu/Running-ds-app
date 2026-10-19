import React from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';
import { MIN_MAP_ZOOM } from './GoogleMapComponent';

interface TacticalControlsProps {
  className?: string;
}

export const TacticalControls: React.FC<TacticalControlsProps> = ({ className = '' }) => {
  const { tacticalMode, setTacticalMode, setZoomLevel, recenterMap, snapToDoonSchool } = useZoneRush();

  return (
    <div className={`flex flex-col gap-2 z-20 ${className}`}>
      {/* Target/Recenter */}
      <button
        type="button"
        aria-label="Re-center GPS"
        onClick={recenterMap}
        className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#FC5200] flex items-center justify-center shadow-sm active:scale-90 hover:bg-slate-50 transition-all cursor-pointer"
        title="Recenter High Precision GPS (Zoom 18)"
      >
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          my_location
        </span>
      </button>

      {/* Snap to The Doon School Campus */}
      <button
        type="button"
        aria-label="Snap to The Doon School, Dehradun"
        onClick={snapToDoonSchool}
        className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 flex items-center justify-center shadow-md active:scale-90 hover:bg-black transition-all cursor-pointer"
        title="Lock to The Doon School, Dehradun (Campus Precision)"
      >
        <span className="material-symbols-outlined text-[20px]">school</span>
      </button>

      {/* Map Layers Toggle (Satellite / Hybrid vs Tactical Roadmap) */}
      <button
        type="button"
        aria-label="Toggle Tactical Layers"
        onClick={() => setTacticalMode((prev) => !prev)}
        className={`w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm active:scale-90 hover:bg-slate-50 transition-all cursor-pointer ${
          tacticalMode ? 'text-slate-700' : 'text-[#FC5200]'
        }`}
        title={tacticalMode ? 'Switch to Satellite Imagery (Hybrid)' : 'Switch to Street Vector Map'}
      >
        <span className="material-symbols-outlined text-[20px]">layers</span>
      </button>

      {/* Zoom In (Street / Campus Level up to 21) */}
      <button
        type="button"
        aria-label="Zoom In"
        onClick={() => setZoomLevel((z) => Math.min(20, (z || 16) + 1))}
        className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-sm active:scale-90 hover:bg-slate-50 transition-all cursor-pointer"
        title="Zoom In (Building / Track Level)"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
      </button>

      {/* Zoom Out */}
      <button
        type="button"
        aria-label="Zoom Out"
        onClick={() => setZoomLevel((z) => Math.max(MIN_MAP_ZOOM, (z || 16) - 1))}
        className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-sm active:scale-90 hover:bg-slate-50 transition-all cursor-pointer"
        title="Zoom Out (City / Region Level)"
      >
        <span className="material-symbols-outlined text-[20px]">remove</span>
      </button>
    </div>
  );
};
