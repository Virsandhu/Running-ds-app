import React, { useState } from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';
import { audioService } from '../../services/audioService';
import { getUniqueUserColor } from '../../utils/userColors';

export const LeaderboardsScreen: React.FC = () => {
  const {
    leaderboard,
    leaderboardFilter,
    setLeaderboardFilter,
    startActivity,
    userTerritoryColor,
  } = useZoneRush();

  const [challengeStatus, setChallengeStatus] = useState<string | null>(null);

  const handleFilterClick = (filter: 'nearby' | 'friends' | 'city' | 'weekly') => {
    audioService.playTick();
    setLeaderboardFilter(filter);
  };

  const handleChallenge = () => {
    audioService.playTick();
    setChallengeStatus('targeting');
    setTimeout(() => {
      setChallengeStatus('locked');
      audioService.playStart();
      setTimeout(() => {
        setChallengeStatus(null);
        startActivity();
      }, 1200);
    }, 800);
  };

  // Podium runners
  const top1 = leaderboard.find((r) => r.rank === 1);
  const top2 = leaderboard.find((r) => r.rank === 2);
  const top3 = leaderboard.find((r) => r.rank === 3);

  // Remaining contenders
  const contenders = leaderboard.filter((r) => r.rank > 3);

  return (
    <div className="flex-1 flex flex-col relative w-full pt-20 pb-32 bg-[#F8FAFC] max-w-md mx-auto select-none">
      <div className="flex flex-col w-full px-4 gap-4">
        {/* Season 4 Alert Banner (Strava Challenge Style) */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 min-w-0 z-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-[#FC5200] shrink-0 border border-orange-100">
              <span className="material-symbols-outlined text-[20px]">timer</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-metric text-sm font-bold text-slate-900 tracking-tight">
                  APEX TURF
                </span>
                <span className="font-metric text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  S4 FINALE
                </span>
              </div>
              <span className="text-xs text-slate-500 truncate mt-0.5 font-sans">
                3 Days Left • Top 10 Earn Elite Badges
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0 z-10 pl-2">
            <span className="font-metric text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              POOL
            </span>
            <span className="font-metric text-base font-bold text-[#FC5200]">
              50k XP
            </span>
          </div>
        </div>

        {/* Segmented Scope Filters (Athletic Segment Pills) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(
            [
              { id: 'nearby', label: 'Nearby' },
              { id: 'friends', label: 'Friends' },
              { id: 'city', label: 'City Wide' },
              { id: 'weekly', label: 'Weekly Pace' },
            ] as const
          ).map((tab) => {
            const isActive = leaderboardFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleFilterClick(tab.id)}
                className={`px-4 py-2 rounded-full font-metric text-xs uppercase tracking-wider font-bold transition-transform active:scale-95 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#FC5200] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Podium / Top 3 Showcase (Elevated Clean White Cards) */}
        <div className="relative w-full rounded-2xl bg-white border border-slate-200/90 p-4 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5">
              <span
                className="material-symbols-outlined text-[#FC5200] text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                workspace_premium
              </span>
              <span className="font-metric text-[11px] uppercase text-slate-700 tracking-wider font-bold">
                Territory Dominators
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-full font-sans">
              Updated 4m ago
            </span>
          </div>

          {/* 3 Podium Slots (#2 Kabir, #1 Aarav, #3 Nitro) */}
          <div className="grid grid-cols-3 gap-2 items-end pt-2">
            {/* Rank 2: Kabir (Silver) */}
            {top2 && (
              <div className="flex flex-col items-center bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 shadow-sm">
                <div className="relative mb-1">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-slate-300">
                    <img
                      className="w-full h-full object-cover"
                      src={top2.avatarUrl}
                      alt={top2.displayName}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-200 border border-white text-slate-700 flex items-center justify-center font-metric text-[10px] font-bold shadow-sm">
                    2
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-700 mt-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: getUniqueUserColor(top2.username).hex }}
                  />
                  <span className="font-metric text-[11px] font-bold truncate max-w-[64px]">
                    {top2.displayName}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-metric text-lg font-extrabold text-slate-900 tracking-tight">
                    {top2.territoryKm2}
                  </span>
                  <span className="font-metric text-[9px] uppercase font-semibold text-slate-400">
                    km²
                  </span>
                </div>
                <div className="mt-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 font-metric text-[9px] font-medium flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: getUniqueUserColor(top2.username).hex }}
                  />
                  <span>Turf Color</span>
                </div>
              </div>
            )}

            {/* Rank 1: Aarav (Gold) */}
            {top1 && (
              <div className="flex flex-col items-center bg-amber-50/60 border-2 border-amber-300/80 rounded-xl p-2.5 relative -translate-y-2 shadow-md">
                <div className="absolute -top-3 flex items-center justify-center text-amber-500">
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    crown
                  </span>
                </div>
                <div className="relative mb-1 mt-1">
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-3 ring-amber-400">
                    <img
                      className="w-full h-full object-cover rounded-full"
                      src={top1.avatarUrl}
                      alt={top1.displayName}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-white text-slate-900 flex items-center justify-center font-metric text-xs font-bold shadow-sm">
                    1
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-900 mt-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: getUniqueUserColor(top1.username).hex }}
                  />
                  <span className="font-metric text-xs font-bold truncate max-w-[72px]">
                    {top1.displayName}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-metric text-2xl font-extrabold text-[#FC5200] tracking-tight">
                    {top1.territoryKm2}
                  </span>
                  <span className="font-metric text-[10px] uppercase font-bold text-amber-700">
                    km²
                  </span>
                </div>
                <div className="mt-1 px-2 py-0.5 rounded-full bg-white border border-amber-200 text-amber-900 font-metric text-[9px] font-bold shadow-2xs flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: getUniqueUserColor(top1.username).hex }}
                  />
                  <span>Turf Color</span>
                </div>
              </div>
            )}

            {/* Rank 3: Nitro (Bronze) */}
            {top3 && (
              <div className="flex flex-col items-center bg-orange-50/30 border border-amber-200/60 rounded-xl p-2.5 shadow-sm">
                <div className="relative mb-1">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-amber-600/40">
                    <img
                      className="w-full h-full object-cover"
                      src={top3.avatarUrl}
                      alt={top3.displayName}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700/80 border border-white text-white flex items-center justify-center font-metric text-[10px] font-bold shadow-sm">
                    3
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-900 mt-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: getUniqueUserColor(top3.username).hex }}
                  />
                  <span className="font-metric text-[11px] font-bold truncate max-w-[64px]">
                    {top3.displayName}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-metric text-lg font-extrabold text-slate-900 tracking-tight">
                    {top3.territoryKm2}
                  </span>
                  <span className="font-metric text-[9px] uppercase font-semibold text-slate-400">
                    km²
                  </span>
                </div>
                <div className="mt-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 font-metric text-[9px] font-medium flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: getUniqueUserColor(top3.username).hex }}
                  />
                  <span>Turf Color</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Realtime Ranks Header */}
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="font-metric text-base font-bold text-slate-900 tracking-tight">
            Zone Contenders
          </span>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-metric text-[11px] uppercase tracking-wider font-semibold">
              Live Turf Delta
            </span>
          </div>
        </div>

        {/* Leaderboard List Rows */}
        <div className="flex flex-col gap-2 w-full">
          {contenders.map((runner) => {
            if (runner.isUser) {
              return (
                <div
                  key={runner.username}
                  className="relative flex items-center justify-between p-3 rounded-xl bg-[#FFF7ED] border-2 border-[#FC5200] shadow-sm transition-transform active:scale-[0.99] overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FC5200]"></div>
                  <div className="flex items-center gap-2.5 min-w-0 pl-1">
                    <div className="w-6 text-center font-metric text-base font-extrabold text-[#FC5200]">
                      #{runner.rank}
                    </div>
                    <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#FC5200] to-amber-400 shrink-0">
                      <img
                        className="w-full h-full object-cover rounded-full bg-white"
                        src={runner.avatarUrl}
                        alt={runner.username}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FC5200] text-white flex items-center justify-center font-metric text-[9px] font-bold shadow-xs">
                        ★
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-metric text-sm font-extrabold text-slate-900 truncate">
                          {runner.username}
                        </span>
                        <span className="font-metric text-[9px] px-1.5 py-0.5 rounded-full bg-[#FC5200] text-white font-bold tracking-wide">
                          YOU
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                        <span className="font-metric text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-1 py-0.2 rounded">
                          ▲ +{runner.deltaRank || 3} today
                        </span>
                        <span>•</span>
                        <span className="text-xs text-slate-600 font-medium font-sans">
                          {runner.xp.toLocaleString()} XP
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <div className="px-2.5 py-1 rounded-lg bg-[#FC5200] text-white font-metric text-sm font-bold shadow-xs">
                      {runner.territoryKm2} km²
                    </div>
                    <span className="font-metric text-[10px] text-[#FC5200] font-bold uppercase tracking-wide mt-1">
                      {runner.sectorNote || '+1.9 km² surge'}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={runner.username}
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 text-center font-metric text-sm font-bold text-slate-400">
                    #{runner.rank}
                  </div>
                  <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
                    <img
                      className="w-full h-full object-cover"
                      src={runner.avatarUrl}
                      alt={runner.username}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-metric text-sm font-bold text-slate-900 truncate">
                        {runner.username}
                      </span>
                      {runner.deltaRank && runner.deltaRank > 0 ? (
                        <span className="font-metric text-[10px] text-emerald-600 font-bold flex items-center bg-emerald-50 px-1 py-0.2 rounded">
                          ▲ +{runner.deltaRank}
                        </span>
                      ) : runner.deltaRank && runner.deltaRank < 0 ? (
                        <span className="font-metric text-[10px] text-rose-600 font-bold flex items-center bg-rose-50 px-1 py-0.2 rounded">
                          ▼ {runner.deltaRank}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-slate-500 font-sans">
                      {runner.xp.toLocaleString()} XP • {runner.turfLoops} Turf Loops
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 pl-2">
                  <div className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-900 font-metric text-xs font-bold">
                    {runner.territoryKm2} km²
                  </div>
                  {runner.sectorNote && (
                    <span className="text-[10px] text-slate-400 mt-0.5 font-sans">
                      {runner.sectorNote}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA: Primary Strava Athletic Orange Button */}
        <div className="pt-2">
          <button
            onClick={handleChallenge}
            disabled={challengeStatus !== null}
            className="w-full h-14 rounded-full bg-[#FC5200] hover:bg-[#E04800] text-white font-metric text-sm uppercase tracking-wider font-extrabold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            type="button"
          >
            {challengeStatus === 'targeting' ? (
              <>
                <span className="material-symbols-outlined text-[22px] animate-spin">
                  refresh
                </span>
                <span>TARGETING SPRINT ROUTE...</span>
              </>
            ) : challengeStatus === 'locked' ? (
              <>
                <span className="material-symbols-outlined text-[22px]">flag</span>
                <span>SPRINT LOCK INITIATED</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[22px]">swords</span>
                <span>Challenge Higher Ranks</span>
              </>
            )}
          </button>
          <p className="text-xs text-slate-500 text-center mt-2.5 font-sans">
            Log a &gt;4.2 km loop before midnight to overtake{' '}
            <strong className="text-slate-800">@ViperRun</strong> (#5)
          </p>
        </div>
      </div>
    </div>
  );
};
