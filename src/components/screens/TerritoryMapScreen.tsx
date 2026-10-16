import React from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';
import { VectorMapCanvas } from '../map/VectorMapCanvas';
import { TacticalControls } from '../map/TacticalControls';
import { SectorDetailModal } from '../map/SectorDetailModal';

export const TerritoryMapScreen: React.FC = () => {
  const {
    userProfile,
    startActivity,
    selectedSector,
    setSelectedSector,
    sectors,
  } = useZoneRush();

  const handleInspectContested = () => {
    const contested = sectors.find((s) => s.isContested);
    if (contested) {
      setSelectedSector(contested);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface max-w-md mx-auto">
      {/* Interactive Canvas & Map Viewport */}
      <div className="relative w-full h-[510px] overflow-hidden rounded-b-2xl border-b border-slate-200 bg-[#F4F1EA] shadow-sm">
        <VectorMapCanvas className="w-full h-full" />

        {/* TOP HUD OVERLAY: Crisp White Card */}
        <div className="absolute top-3 inset-x-3 z-20 flex flex-col gap-2 pointer-events-auto">
          <div className="w-full rounded-xl p-3.5 bg-white border border-slate-200 shadow-sm flex flex-col gap-2.5">
            {/* Main Acreage & Rank Row */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                  Your Territory
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-metric text-[32px] text-[#FC5200] font-extrabold leading-none tracking-tight">
                    {userProfile.territoryKm2}
                  </span>
                  <span className="font-metric text-[18px] text-[#FC5200] font-bold">
                    km²
                  </span>
                </div>
              </div>

              {/* Rank Pill */}
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                  <span
                    className="material-symbols-outlined text-[16px] text-[#FC5200]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    workspace_premium
                  </span>
                  <span className="font-metric text-[11px] text-slate-800 font-bold">
                    #{userProfile.localRank} LOCAL RANK
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-emerald-600">
                  <span className="material-symbols-outlined text-[15px]">trending_up</span>
                  <span className="font-metric text-[11px] font-bold">
                    {userProfile.rankDelta}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub Telemetry Split Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Zones Held:
                </span>
                <span className="font-metric text-[13px] text-slate-800 font-bold">
                  {userProfile.zonesHeld} Sectors
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#FC5200]">
                  bolt
                </span>
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Weekly EXP:
                </span>
                <span className="font-metric text-[13px] text-[#FC5200] font-bold">
                  {userProfile.weeklyXp.toLocaleString()} XP
                </span>
              </div>
            </div>
          </div>

          {/* Nearby Contested Hotspot Warning Banner */}
          <button
            type="button"
            onClick={handleInspectContested}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-rose-200 shadow-sm flex items-center justify-between text-left cursor-pointer active:scale-[0.99] transition-transform hover:border-rose-300"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="text-[12px] font-bold text-rose-600 flex items-center gap-1">
                Zone #4 Contested
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-500">
                Defense Window:
              </span>
              <span className="font-metric text-[11px] text-rose-600 font-bold">
                38m remaining
              </span>
              <span className="material-symbols-outlined text-[16px] text-slate-400">
                chevron_right
              </span>
            </div>
          </button>
        </div>

        {/* Floating Tactical Map Tools (Right Edge) */}
        <TacticalControls className="absolute right-3 top-44" />
      </div>

      {/* BOTTOM HUD ACTION TRAY */}
      <div className="w-full px-4 pt-3 pb-2 flex flex-col gap-2.5">
        {/* Quick Territory Status Digest Strip */}
        <div className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <span className="material-symbols-outlined text-[18px]">gpp_maybe</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] text-slate-900 font-bold leading-snug">
                Perimeter Alert
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                2 sectors vulnerable to rival breach
              </span>
            </div>
          </div>
          <button
            onClick={handleInspectContested}
            className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-metric text-[11px] font-bold uppercase tracking-wider active:scale-95 transition-all"
          >
            Inspect
          </button>
        </div>

        {/* Primary Kinetic Action Button: Strava Athletic Orange START RUN CTA */}
        <button
          onClick={startActivity}
          className="w-full h-14 rounded-full bg-[#FC5200] hover:bg-[#E04800] text-white flex items-center justify-center gap-2 shadow-md shadow-[#FC5200]/30 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">directions_run</span>
          <span className="font-sans text-[17px] uppercase tracking-wide font-extrabold">
            Start Activity
          </span>
          <span className="material-symbols-outlined text-[19px]">bolt</span>
        </button>
      </div>

      {/* Sector detail modal if open */}
      {selectedSector && (
        <SectorDetailModal
          sector={selectedSector}
          onClose={() => setSelectedSector(null)}
        />
      )}
    </div>
  );
};
