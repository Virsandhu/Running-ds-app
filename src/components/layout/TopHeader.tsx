import React from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';

interface TopHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
}) => {
  const {
    currentUser,
    currentTab,
    setCurrentTab,
    gpsStatus,
    gpsAccuracy,
    requestCurrentLocation,
    setIsGpsModalOpen,
    setIsPermissionsModalOpen,
  } = useZoneRush();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setCurrentTab('map');
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between">
        {/* Left Section */}
        {showBack ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all text-slate-700"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FC5200] flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-[20px]">directions_run</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-[17px] font-extrabold tracking-tight text-slate-900 leading-tight uppercase font-sans">
                  {title || 'ACTIVE RUN'}
                </h1>
                <span className="text-[10px] text-[#FC5200] font-bold uppercase tracking-wider font-metric">
                  {subtitle || 'Live Zone Tracking'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FC5200] to-[#FF7A00] flex items-center justify-center text-white shadow-sm shadow-[#FC5200]/25">
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[17px] tracking-tight text-slate-900 uppercase font-sans">
                  ZoneRush
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (gpsStatus !== 'locked') {
                      requestCurrentLocation();
                      setIsPermissionsModalOpen(true);
                    } else {
                      setIsGpsModalOpen(true);
                    }
                  }}
                  aria-label="GPS Status and Settings"
                  title="Click to view GPS status and permission settings"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all active:scale-95 cursor-pointer shadow-2xs ${
                    gpsStatus === 'locked'
                      ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300 text-emerald-800'
                      : gpsStatus === 'searching'
                      ? 'bg-amber-50 hover:bg-amber-100/80 border-amber-300 text-amber-800'
                      : gpsStatus === 'denied'
                      ? 'bg-rose-600 hover:bg-rose-700 border-rose-700 text-white animate-bounce'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      gpsStatus === 'locked'
                        ? 'bg-emerald-600 animate-pulse'
                        : gpsStatus === 'searching'
                        ? 'bg-amber-500 animate-ping'
                        : gpsStatus === 'denied'
                        ? 'bg-white'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span className="font-metric text-[10px] font-extrabold tracking-wider uppercase">
                    {gpsStatus === 'locked'
                      ? gpsAccuracy
                        ? `GPS LOCK (±${gpsAccuracy}m)`
                        : 'GPS LOCKED'
                      : gpsStatus === 'searching'
                      ? 'LOCATING...'
                      : gpsStatus === 'denied'
                      ? 'ENABLE GPS ⚙️'
                      : 'GPS SETUP'}
                  </span>
                  <span className="material-symbols-outlined text-[13px] opacity-70">
                    tune
                  </span>
                </button>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-sans">
                {subtitle || (currentTab === 'profile' ? 'Runner Dossier' : 'Territory Map')}
              </span>
            </div>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentTab('profile')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <span className="font-metric text-[11px] text-slate-900 font-bold">
              LVL {currentUser?.level ?? 1}
            </span>
          </button>
          <button
            onClick={() => setCurrentTab('profile')}
            className="relative flex items-center justify-center p-0.5 rounded-full ring-2 ring-[#FC5200]/30 hover:ring-[#FC5200] transition-all active:scale-95 cursor-pointer"
            aria-label="View Profile"
          >
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
              src={currentUser?.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4cnAh_eB0Xn3DbaM_wKpiKUbCpMQmRhwJc-4PG7YAtBY6OAUd4YHaLymaSlw-YUskAYQKoKh54TctIgWzPpcMErGMPHjFD3yCoR2LjJgFRPMYiMuWyw9_-ngJ3j0uFnBL2j9hJ4xNPkNOSqEQMUW73Set63WGQw-0oqd1WGOptvUZxpqA5cBdKFc5ktxObEh7TG6UjnrpXDV4-krPANwBocfxOvOEzegnzKoOwN0elCoaZB5XLck'}
              referrerPolicy="no-referrer"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
