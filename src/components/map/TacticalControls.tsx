import React from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';

interface TacticalControlsProps {
  className?: string;
}

export const TacticalControls: React.FC<TacticalControlsProps> = ({ className = '' }) => {
  const { tacticalMode, setTacticalMode, zoomLevel, setZoomLevel, recenterMap } = useZoneRush();

  return (
    <div className={`flex flex-col gap-2 z-20 ${className}`}>
      {/* Target/Recenter */}
      <button
        type="button"
        aria-label="Re-center GPS"
        onClick={recenterMap}
        className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#FC5200] flex items-center justify-center shadow-sm active:scale-90 hover:bg-slate-50 transition-all"
        title="Recenter GPS Position"
      >
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          my_location
        </span>
      </button>

      {/* Map Layers Toggle */}
      <button
        type="button"
        aria-label="Toggle Tactical Layers"
        onClick={() => setTacticalMode((prev) => !prev)}
        className={`w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm active:scale-90 hover:bg-slate-50 transition-all ${
          tacticalMode ? 'text-slate-700' : 'text-[#FC5200]'
        }`}
        title={tacticalMode ? 'Switch to Satellite View' : 'Switch to Tactical Vector View'}
      >
        <span className="material-symbols-outlined text-[20px]">layers</span>
      </button>

      {/* Zoom In */}
      <button
        type="button"
        aria-label="Zoom In"
        onClick={() => setZoomLevel((z) => Math.min(1.8, +(z + 0.2).toFixed(1)))}
        className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-sm active:scale-90 hover:bg-slate-50 transition-all"
        title="Zoom In"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
      </button>

      {/* Zoom Out */}
      <button
        type="button"
        aria-label="Zoom Out"
        onClick={() => setZoomLevel((z) => Math.max(0.8, +(z - 0.2).toFixed(1)))}
        className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-sm active:scale-90 hover:bg-slate-50 transition-all"
        title="Zoom Out"
      >
        <span className="material-symbols-outlined text-[20px]">remove</span>
      </button>
    </div>
  );
};
