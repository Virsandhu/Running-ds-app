import React, { useEffect, useMemo, useState } from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';
import { supabaseService, rankByArea, AreaLeaderboardEntry } from '../../services/supabaseService';
import { INITIAL_LEADERBOARD } from '../../data/mockData';
import { getUniqueUserColor } from '../../utils/userColors';
import { RunnerAvatar } from '../common/RunnerAvatar';
import { formatSquareMetres } from '../../utils/units';

const TOP_COUNT = 5;
const MAX_SEARCH_RESULTS = 8;

const MEDAL_STYLES: Record<number, string> = {
  1: 'bg-amber-100 text-amber-700 border-amber-300',
  2: 'bg-slate-100 text-slate-600 border-slate-300',
  3: 'bg-orange-100 text-orange-700 border-orange-300',
};

const LeaderboardRow: React.FC<{ entry: AreaLeaderboardEntry; isYou: boolean }> = ({ entry, isYou }) => (
  <div
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
      isYou ? 'bg-orange-50/80 border-[#FC5200]/40' : 'bg-white border-slate-200/80'
    }`}
  >
    <span
      className={`w-7 h-7 shrink-0 rounded-full border flex items-center justify-center font-metric text-xs font-extrabold ${
        MEDAL_STYLES[entry.rank] || 'bg-white text-slate-500 border-slate-200'
      }`}
    >
      {entry.rank}
    </span>
    <RunnerAvatar avatarUrl={entry.avatarUrl} name={entry.fullName} sizeClassName="w-9 h-9" textSizeClassName="text-lg" />
    <div className="flex flex-col min-w-0 flex-1">
      <span className="text-sm font-bold text-slate-900 truncate">
        {entry.fullName}
        {isYou && <span className="ml-1.5 text-[10px] font-metric font-extrabold text-[#FC5200] uppercase">You</span>}
      </span>
      <span className="text-[11px] font-metric text-slate-500 truncate">{entry.username}</span>
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.territoryColor }} />
      <span className="font-metric text-sm font-extrabold text-slate-900">{formatSquareMetres(entry.territoryKm2)}</span>
      <span className="text-[10px] font-metric font-bold text-slate-500">m²</span>
    </div>
  </div>
);

export const AreaLeaderboard: React.FC = () => {
  const { currentUser, userTerritoryColor } = useZoneRush();
  const [remoteRunners, setRemoteRunners] = useState<AreaLeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    supabaseService.fetchAreaLeaderboard().then((entries) => {
      if (!cancelled) {
        setRemoteRunners(entries);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.territoryKm2]);

  // Scores come from the server; only the runner's own emoji/color are applied locally
  const rankedRunners = useMemo(() => {
    const base =
      remoteRunners ??
      INITIAL_LEADERBOARD.map((r) => ({
        id: r.username,
        fullName: r.displayName,
        username: r.username,
        avatarUrl: r.avatarUrl,
        territoryColor: getUniqueUserColor(r.username).hex,
        territoryKm2: r.territoryKm2,
      }));
    const others = base.filter((r) => r.id !== currentUser?.id);
    const serverMe = remoteRunners?.find((r) => r.id === currentUser?.id);
    const me = currentUser
      ? [{
          id: currentUser.id,
          fullName: currentUser.fullName,
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl,
          territoryColor: userTerritoryColor,
          territoryKm2: serverMe ? serverMe.territoryKm2 : currentUser.territoryKm2,
        }]
      : [];
    return rankByArea([...others, ...me]);
  }, [remoteRunners, currentUser, userTerritoryColor]);

  const topRunners = rankedRunners.slice(0, TOP_COUNT);
  const myEntry = rankedRunners.find((r) => r.id === currentUser?.id);
  const isMeInTop = topRunners.some((r) => r.id === currentUser?.id);

  const trimmedQuery = query.trim().toLowerCase();
  const searchResults = trimmedQuery
    ? rankedRunners
        .filter(
          (r) =>
            r.fullName.toLowerCase().includes(trimmedQuery) ||
            r.username.toLowerCase().includes(trimmedQuery)
        )
        .slice(0, MAX_SEARCH_RESULTS)
    : [];

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
            trophy
          </span>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
            Territory Leaderboard
          </span>
        </div>
        <span className="text-[11px] font-bold text-slate-500 font-sans">
          {rankedRunners.length} runners
        </span>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed font-sans -mt-1">
        Ranked by total area claimed across all runs.
      </p>

      {/* Find a runner by name */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
          search
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a runner's rank by name"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#FC5200] focus:ring-1 focus:ring-[#FC5200] transition-all bg-slate-50/50"
        />
      </div>

      {trimmedQuery ? (
        <div className="flex flex-col gap-2">
          {searchResults.length > 0 ? (
            searchResults.map((entry) => (
              <LeaderboardRow key={entry.id} entry={entry} isYou={entry.id === currentUser?.id} />
            ))
          ) : (
            <span className="text-xs text-slate-500 text-center py-3">No runner found matching “{query.trim()}”.</span>
          )}
        </div>
      ) : loading ? (
        <span className="text-xs text-slate-500 text-center py-3">Loading leaderboard…</span>
      ) : (
        <div className="flex flex-col gap-2">
          {topRunners.map((entry) => (
            <LeaderboardRow key={entry.id} entry={entry} isYou={entry.id === currentUser?.id} />
          ))}
          {myEntry && !isMeInTop && (
            <>
              <span className="text-center text-slate-300 font-bold leading-none">⋯</span>
              <LeaderboardRow entry={myEntry} isYou />
            </>
          )}
        </div>
      )}
    </div>
  );
};
