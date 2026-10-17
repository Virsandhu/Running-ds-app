import React, { useEffect, useState } from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';

interface ConfettiPiece {
  id: number;
  left: number;
  size: number;
  height: number;
  color: string;
  delay: number;
  duration: number;
}

export const ConquestScreen: React.FC = () => {
  const { latestConquest, closeConquestScreen } = useZoneRush();
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [sharedNotice, setSharedNotice] = useState<string | null>(null);

  useEffect(() => {
    // Generate celebration confetti
    const colors = ['#FC5200', '#0050cc', '#F59E0B', '#10B981', '#64748B'];
    const pieces: ConfettiPiece[] = Array.from({ length: 32 }, (_, i) => ({
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

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'The Doon School Territory Conquest',
          text: `I just secured territory (+${latestConquest?.capturedKm2 || 0.29} km²) inside The Doon School (Chandbagh) on ZoneRush!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      setSharedNotice('Victory link & story card copied to clipboard!');
      setTimeout(() => setSharedNotice(null), 3000);
    }
  };

  if (!latestConquest) return null;

  return (
    <div className="flex-1 flex flex-col relative w-full pt-16 pb-12 bg-surface max-w-md mx-auto select-none overflow-hidden">
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
          <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-amber-100/50 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-metric text-[10px] uppercase font-bold tracking-wider">
                Tactical Conquest Finalized
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="font-sans text-[26px] uppercase tracking-tight text-slate-900 font-extrabold">
                Territory Claimed!
              </h2>
              <div className="flex items-center justify-center gap-1.5 text-[#FC5200]">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span className="font-metric text-[12px] uppercase tracking-wider font-bold">
                  {latestConquest.sectorName} Captured &amp; Secured
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-500 text-[12px] pt-0.5 font-sans">
              <span className="material-symbols-outlined text-[15px] text-[#FC5200]">
                vibration
              </span>
              <span>Haptic pulse confirmed</span>
              <span className="text-slate-300">•</span>
              <span className="material-symbols-outlined text-[15px] text-[#FC5200]">
                volume_up
              </span>
              <span>Conquest fanfare active</span>
            </div>
          </div>
        </div>

        {/* Strava-style Light GPS Map Card */}
        <div className="relative w-full rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
          <div
            className="w-full h-56 bg-cover bg-center relative"
            style={{
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDnWidllapWL1efCQOiTh2Tysqac_RzU_mUaqwG1v2M7bWzaQ_uYr4XbvIMF6S5QDdR8WeHNCYvPi1ZQ961SFBSmS4SDpLG1eU6Ol5ZcDf4G6YgOJF2VerR4wWTTG2326ZMX_kgn2YPJEsL60iSh94hlfENFDL7QJPfyJNZifQEJe3Rh6yb7jK3N9lsBhWG7xqmESeC7ua6EBFvILXam_3nYjCZ_TK-hP2x-Do6j5dFQSHuhB0ks5A')`,
            }}
          >
            <div className="absolute inset-0 bg-white/45 backdrop-contrast-125" />
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              fill="none"
              viewBox="0 0 360 224"
            >
              {/* Rival dashed line */}
              <path
                d="M 55 148 L 100 68 L 235 50 L 310 115 L 260 182 L 125 174 Z"
                fill="rgba(239, 68, 68, 0.08)"
                stroke="#EF4444"
                strokeDasharray="4 4"
                strokeWidth="2"
              />
              <text
                className="font-metric text-[9px] uppercase tracking-wider font-bold"
                fill="#DC2626"
                x="205"
                y="72"
              >
                Rival Zone Breached
              </text>

              {/* Blue territory captured enclosed polygon */}
              <path
                d="M 50 138 L 110 44 L 270 34 L 325 126 L 240 192 L 95 184 Z"
                fill="rgba(2, 102, 255, 0.22)"
                stroke="none"
              />

              {/* Strava orange completed route loop stroke */}
              <path
                d="M 50 138 L 110 44 L 270 34 L 325 126 L 240 192 L 95 184 Z"
                stroke="#FC5200"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3.5"
                filter="drop-shadow(0px 1px 3px rgba(252, 82, 0, 0.4))"
              />

              {/* GPS start/pin node */}
              <circle cx="50" cy="138" fill="#ffffff" r="6" stroke="#FC5200" strokeWidth="2.5" />
              <circle
                className="animate-ping"
                cx="50"
                cy="138"
                opacity="0.6"
                r="10"
                stroke="#FC5200"
                strokeWidth="1.5"
              />
            </svg>

            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-slate-200/80">
              <span className="material-symbols-outlined text-[15px] text-[#FC5200]">
                polyline
              </span>
              <span className="font-metric text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                Closed Loop Confirmed
              </span>
            </div>

            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm border border-slate-200/80">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="font-metric text-[10px] font-medium text-slate-600 uppercase">
                Blue: Captured (+{latestConquest.capturedKm2} km²)
              </span>
            </div>
          </div>
        </div>

        {/* Primary Performance Yield & Stats */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm flex flex-col space-y-4">
          {/* Big Yield Hero */}
          <div className="flex flex-col items-center text-center space-y-1 pt-1">
            <span className="font-metric text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Primary Conquest Yield
            </span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-metric text-[40px] font-extrabold text-[#FC5200] tracking-tight">
                +{latestConquest.capturedKm2}
              </span>
              <span className="font-metric text-[22px] text-slate-700 uppercase font-bold">
                km²
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[12px] font-sans">
              <span className="text-slate-500">Dominance:</span>
              <span className="font-semibold text-slate-800">
                {latestConquest.previousDominanceKm2} km²
              </span>
              <span className="text-[#FC5200] font-bold">→</span>
              <span className="font-semibold text-slate-900">
                {latestConquest.newDominanceKm2} km²
              </span>
              <span className="text-emerald-600 font-bold">(+11.1%)</span>
            </div>
          </div>

          {/* The Doon School Campus Turf Claim Row */}
          <div className="rounded-xl bg-blue-50/70 border border-blue-200/80 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">school</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-metric text-[14px] text-[#2563EB] font-extrabold tracking-tight uppercase">
                    Campus Territory Secured
                  </span>
                </div>
                <span className="text-[12px] text-slate-600 truncate font-sans">
                  The Doon School • Chandbagh Estate, Dehradun
                </span>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-[#2563EB] text-white font-metric text-[10px] uppercase font-bold tracking-wider shrink-0 shadow-sm">
              72 Acres
            </div>
          </div>

          {/* Clean Strava Style 2x2 Telemetry Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex flex-col">
              <span className="font-metric text-[10px] uppercase text-slate-500 font-semibold">
                Distance
              </span>
              <span className="font-metric text-[26px] text-slate-900 font-bold leading-tight mt-0.5">
                {latestConquest.distanceKm.toFixed(2)}
              </span>
              <span className="font-metric text-[10px] text-slate-400 uppercase font-medium">
                Kilometers
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex flex-col">
              <span className="font-metric text-[10px] uppercase text-slate-500 font-semibold">
                Duration
              </span>
              <span className="font-metric text-[26px] text-slate-900 font-bold leading-tight mt-0.5">
                26:14
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
                Burn
              </span>
              <span className="font-metric text-[26px] text-slate-900 font-bold leading-tight mt-0.5">
                {latestConquest.caloriesBurned}
              </span>
              <span className="font-metric text-[10px] text-slate-400 uppercase font-medium">
                Total Kcal
              </span>
            </div>
          </div>

          {/* Social / Rival Impact Card */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex flex-col space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-rose-500">
                  person_remove
                </span>
                <span className="font-metric text-[11px] uppercase text-slate-600 font-bold">
                  Rival Impact
                </span>
              </div>
              <span className="font-metric text-[10px] text-rose-600 uppercase tracking-wider font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                {latestConquest.displacedRivals.length} Displaced
              </span>
            </div>

            {latestConquest.displacedRivals.map((rival) => (
              <div
                key={rival.username}
                className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200/60 shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                    src={rival.avatarUrl}
                    alt={rival.username}
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex flex-col">
                    <span className="font-sans text-[13px] text-slate-800 font-bold">
                      {rival.username}
                    </span>
                    <span className="text-[11px] text-slate-500 font-sans">
                      {rival.note}
                    </span>
                  </div>
                </div>
                <span className="font-metric text-[11px] text-rose-600 uppercase font-bold">
                  -{rival.lostKm2} km²
                </span>
              </div>
            ))}
          </div>

          {/* Streak & Bonus Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-amber-600">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_fire_department
                </span>
                <span className="font-metric text-[10px] uppercase font-bold">
                  14-Day Streak
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-[12px] text-slate-500 font-sans">Bonus XP</span>
                <span className="font-metric text-[18px] text-amber-600 font-bold">
                  +{latestConquest.streakBonusXp}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[#FC5200]">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  bolt
                </span>
                <span className="font-metric text-[10px] uppercase font-bold">
                  Conquest Loot
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-[12px] text-slate-500 font-sans">Total XP</span>
                <span className="font-metric text-[18px] text-[#FC5200] font-bold">
                  +{latestConquest.totalLootXp.toLocaleString()}
                </span>
              </div>
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
            <div className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full bg-white/20 text-white">
              <span className="font-metric text-[9px] uppercase font-extrabold tracking-wider">
                Story Ready
              </span>
            </div>
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
