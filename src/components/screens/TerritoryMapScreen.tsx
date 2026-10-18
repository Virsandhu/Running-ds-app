import React from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';
import { GoogleMapComponent } from '../map/GoogleMapComponent';
import { TacticalControls } from '../map/TacticalControls';
import { SectorDetailModal } from '../map/SectorDetailModal';

export const TerritoryMapScreen: React.FC = () => {
  const {
    startActivity,
    selectedSector,
    setSelectedSector,
    sectors,
    gpsStatus,
    userLocation,
    requestCurrentLocation,
    setIsGpsModalOpen,
    setIsPermissionsModalOpen,
    snapToDoonSchool,
  } = useZoneRush();

  const isDoonSchool =
    Math.abs(userLocation.lat - 30.334) < 0.04 &&
    Math.abs(userLocation.lng - 78.0308) < 0.04;

  return (
    <div className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface max-w-md mx-auto">
      {/* Interactive Google Map Viewport */}
      <div className="relative w-full h-[510px] overflow-hidden rounded-b-2xl border-b border-slate-200 bg-[#F4F1EA] shadow-sm">
        <GoogleMapComponent className="w-full h-full" />

        {/* TOP HUD OVERLAY: Crisp White Card */}
        <div className="absolute top-3 inset-x-3 z-20 flex flex-col gap-2 pointer-events-auto">
          {/* GPS Status Alert Banner when not locked */}
          {gpsStatus !== 'locked' && (
            <button
              type="button"
              onClick={() => {
                requestCurrentLocation();
                setIsPermissionsModalOpen(true);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-md flex items-center justify-between text-left cursor-pointer active:scale-[0.99] transition-transform animate-pulse"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">
                  {gpsStatus === 'denied' ? 'location_off' : 'location_searching'}
                </span>
                <div className="flex flex-col">
                  <span className="text-[12px] font-extrabold uppercase tracking-tight">
                    {gpsStatus === 'denied' ? 'Phone GPS Permission Needed' : 'Acquiring GPS Signal...'}
                  </span>
                  <span className="text-[10px] text-orange-100 font-medium">
                    Tap here to enable location &amp; track your real runs
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white text-rose-700 text-[10px] font-extrabold font-metric uppercase shadow-xs">
                Enable GPS
              </span>
            </button>
          )}

          <div className="w-full rounded-xl p-3.5 bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            {/* Main Acreage: The Doon School Campus */}
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">
                The Doon School Territory
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-metric text-[32px] text-[#FC5200] font-extrabold leading-none tracking-tight">
                  72
                </span>
                <span className="font-metric text-[16px] text-[#FC5200] font-bold">
                  Acres
                </span>
                <span className="text-[11px] text-slate-400 font-semibold ml-1">
                  (0.29 km²)
                </span>
              </div>
            </div>

            {/* Precision Campus Location Chip */}
            <div className="flex flex-col items-end gap-1">
              {isDoonSchool ? (
                <button
                  type="button"
                  onClick={() => setIsGpsModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white shadow-xs hover:bg-black transition-colors cursor-pointer text-right"
                  title="Campus Precision Locked • Tap for GPS Settings"
                >
                  <span className="material-symbols-outlined text-[16px] text-amber-400">
                    school
                  </span>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-black uppercase text-amber-300 leading-tight">
                      The Doon School
                    </span>
                    <span className="text-[9px] font-medium text-slate-300 leading-tight">
                      Dehradun • High Precision
                    </span>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={snapToDoonSchool}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-extrabold hover:bg-amber-100 transition-colors cursor-pointer"
                  title="Snap directly to The Doon School, Dehradun"
                >
                  <span className="material-symbols-outlined text-[15px] text-amber-600">
                    near_me
                  </span>
                  <span>Snap to Doon School</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Floating Tactical Map Tools (Right Edge) */}
        <TacticalControls className="absolute right-3 top-44" />
      </div>

      {/* BOTTOM HUD ACTION TRAY */}
      <div className="w-full px-4 pt-3 pb-2 flex flex-col gap-2.5">
        {/* The Doon School Campus Status Card */}
        <div className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <span className="material-symbols-outlined text-[18px]">sports_score</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] text-slate-900 font-bold leading-snug">
                The Doon School Playable Area
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Light Blue Zone • Run to claim territory in your shade
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (sectors[0]) {
                setSelectedSector(sectors[0]);
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
            className="px-3 py-1 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-metric text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer"
          >
            Territory Info
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
