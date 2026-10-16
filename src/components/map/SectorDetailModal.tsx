import React from 'react';
import { Sector } from '../../types/zonerush';
import { useZoneRush } from '../../context/ZoneRushContext';

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
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: sector.ownerColor }}
            />
            <span className="font-metric text-xs uppercase font-bold text-slate-500 tracking-wider">
              {sector.code}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div>
          <h3 className="font-sans text-lg font-extrabold text-slate-900">
            {sector.name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Controlled by <strong className="text-slate-800">{sector.ownerHandle}</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex flex-col">
            <span className="font-metric text-[10px] uppercase font-bold text-slate-400">
              Sector Area
            </span>
            <span className="font-metric text-xl font-extrabold text-slate-900">
              {sector.areaKm2} <span className="text-xs font-bold text-slate-500">km²</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-metric text-[10px] uppercase font-bold text-slate-400">
              Status
            </span>
            <span
              className={`font-metric text-sm font-bold ${
                sector.isContested ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {sector.isContested ? 'Under Rival Siege' : 'Secured Perimeter'}
            </span>
          </div>
        </div>

        {sector.isContested && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5">
            <span className="material-symbols-outlined text-rose-600 text-[20px] animate-pulse">
              warning
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-rose-700">Contest Defense Window</span>
              <span className="text-[11px] text-rose-600">
                {sector.defenseWindowMinutes} minutes to reclaim before rival takeover!
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs font-bold uppercase tracking-wider"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              onClose();
              startActivity();
            }}
            className="flex-1 py-3 rounded-full bg-[#FC5200] hover:bg-[#E04800] text-white font-sans text-xs font-extrabold uppercase tracking-wider shadow-md shadow-[#FC5200]/25 flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">directions_run</span>
            <span>{sector.isContested ? 'Intercept & Defend' : 'Start Turf Run'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
