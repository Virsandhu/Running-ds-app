import React from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';

export const ProfileScreen: React.FC = () => {
  const { userProfile } = useZoneRush();

  const trophies = [
    { name: 'Apex Conqueror', icon: 'military_tech', color: 'text-amber-500', desc: 'Breached a Tier-1 Syndicate HQ' },
    { name: '14-Day Streak', icon: 'local_fire_department', color: 'text-[#FC5200]', desc: '2 consecutive weeks of turf loops' },
    { name: 'Night Raid Master', icon: 'dark_mode', color: 'text-purple-500', desc: 'Overtook a sector after 10 PM' },
    { name: 'Loop Perfectionist', icon: 'donut_large', color: 'text-blue-500', desc: 'Closed a >5 km loop within 20m tolerance' },
  ];

  return (
    <div className="flex-1 flex flex-col relative w-full pt-20 pb-32 bg-[#F8FAFC] max-w-md mx-auto select-none">
      <div className="flex flex-col w-full px-4 gap-4">
        {/* Profile Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative p-1 rounded-full ring-3 ring-[#FC5200]">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.displayName}
                className="w-16 h-16 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#FC5200] text-white font-metric text-[10px] font-bold shadow-sm">
                LVL {userProfile.level}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h2 className="font-sans text-lg font-extrabold text-slate-900">
                  {userProfile.displayName}
                </h2>
                <span className="material-symbols-outlined text-[18px] text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </div>
              <span className="font-metric text-xs text-slate-500 font-semibold">
                {userProfile.username} • Apex Striders Syndicate
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-bold text-emerald-600 font-metric">
                  Rank #{userProfile.localRank} Local
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] text-[#FC5200] font-bold font-metric">
                  {userProfile.zonesHeld} Sectors Controlled
                </span>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-metric font-bold text-slate-700">Level 24 Progression</span>
              <span className="font-metric text-slate-500 font-semibold">
                {userProfile.weeklyXp.toLocaleString()} / 6,000 XP
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FC5200] to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (userProfile.weeklyXp / 6000) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-sans">
              1,150 XP needed to unlock Level 25 Elite Perimeter Cloak
            </span>
          </div>

          {/* Metric Quad */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
              <span className="font-metric text-[10px] uppercase font-bold text-slate-400">
                Total Dominance
              </span>
              <span className="font-metric text-2xl font-extrabold text-[#FC5200] mt-0.5">
                {userProfile.territoryKm2} <span className="text-xs">km²</span>
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
              <span className="font-metric text-[10px] uppercase font-bold text-slate-400">
                Weekly Turf EXP
              </span>
              <span className="font-metric text-2xl font-extrabold text-slate-900 mt-0.5">
                {userProfile.weeklyXp.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Trophies Case */}
        <div className="relative rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                emoji_events
              </span>
              <h3 className="font-metric text-sm font-bold text-slate-900 uppercase tracking-tight">
                Conquest Badges
              </h3>
            </div>
            <span className="font-metric text-xs text-slate-400">4 / 12 Unlocked</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {trophies.map((t) => (
              <div
                key={t.name}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`material-symbols-outlined text-[20px] ${t.color}`}>
                    {t.icon}
                  </span>
                  <span className="font-sans text-xs font-bold text-slate-900 truncate">
                    {t.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-sans leading-tight">
                  {t.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shoe & Gear Odometer */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-slate-700">
                roller_skating
              </span>
              <span className="font-metric text-sm font-bold text-slate-900 uppercase">
                Active Footwear
              </span>
            </div>
            <span className="font-metric text-xs font-bold text-[#FC5200]">Nike Vaporfly 3</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-slate-800 rounded-full" style={{ width: '49.6%' }} />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 font-metric font-medium">
            <span>248 km tracked</span>
            <span>500 km retirement target</span>
          </div>
        </div>
      </div>
    </div>
  );
};
