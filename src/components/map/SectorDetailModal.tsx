import React from 'react';
import { Sector } from '../../types/zonerush';
import { useZoneRush } from '../../context/ZoneRushContext';
import { formatSquareMetres } from '../../utils/units';

interface SectorDetailModalProps {
  sector: Sector;
  onClose: () => void;
}

export const SectorDetailModal: React.FC<SectorDetailModalProps> = ({ sector, onClose }) => {
  const { startActivity } = useZoneRush();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full shadow-xs"
              style={{ backgroundColor: sector.ownerColor }}
            />
            <span className="font-metric text-xs uppercase font-extrabold text-slate-700 tracking-wider">
              {sector.code}
            </span>
            <span
              className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white uppercase tracking-tight shadow-xs"
              style={{ backgroundColor: sector.ownerColor }}
            >
              {sector.ownerHandle.includes('(YOU)') ? 'YOUR TURF' : 'RIVAL TURF'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div>
          <h3 className="font-sans text-lg font-extrabold text-slate-900 leading-snug">
            {sector.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: sector.ownerColor }}
            />
            <p className="text-xs text-slate-600 font-medium">
              Occupied by <strong className="text-slate-900 font-bold">{sector.owner}</strong>{' '}
              <span className="text-slate-500 font-mono text-[11px]">({sector.ownerHandle})</span>
            </p>
          </div>
        </div>

        {/* Territory Stats Grid */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex flex-col">
            <span className="font-metric text-[10px] uppercase font-bold text-slate-400">
              Sector Area
            </span>
            <span className="font-metric text-xl font-extrabold text-slate-900">
              {formatSquareMetres(sector.areaKm2)}{' '}
              <span className="text-xs font-bold text-slate-500">m²</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-metric text-[10px] uppercase font-bold text-slate-400">
              Turf Color Code
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                style={{ backgroundColor: sector.ownerColor }}
              />
              <span className="font-mono text-xs font-bold text-slate-700">
                {sector.ownerColor.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Campus Location Note */}
        <div className="px-3 py-2 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-600 text-[16px]">school</span>
          <span className="text-[11px] text-amber-900 font-medium leading-tight">
            The Doon School (Chandbagh Estate, Dehradun)
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              onClose();
              startActivity();
            }}
            className="flex-1 py-3 rounded-full bg-[#FC5200] hover:bg-[#E04800] text-white font-sans text-xs font-extrabold uppercase tracking-wider shadow-md shadow-[#FC5200]/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">directions_run</span>
            <span>{sector.ownerHandle.includes('(YOU)') ? 'Expand Turf' : 'Claim Zone'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
