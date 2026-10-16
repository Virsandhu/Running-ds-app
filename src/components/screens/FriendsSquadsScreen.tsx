import React, { useState } from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';
import { audioService } from '../../services/audioService';

export const FriendsSquadsScreen: React.FC = () => {
  const { startActivity } = useZoneRush();
  const [rallySent, setRallySent] = useState(false);

  const handleRally = () => {
    audioService.playStart();
    setRallySent(true);
    setTimeout(() => setRallySent(false), 3000);
  };

  const feedItems = [
    {
      id: 1,
      user: '@MayaNitro',
      name: 'Nitro',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6a8zZInA1-7z4vfql_VSTBddMNhrM3_McC71bmffOA96G3GBJ9huzebrg5NZtOZfClIxJ1azfPJV_kgXKbYfgZLqGEU0zRkRVYgn2mrb1mtUJRhFA7vSO0RLB8HMHhK5FlwLrqDsYOjrx81rechgERAtYXOv5F4dcABEuEUYPpxFx8t_Qkq-nRzNEu0T6m_GZK2rHfl-fY-Tzghs0iSyu0PNGVmEEiuqr9-KbpGV18ymERHDgKeQ',
      action: 'sealed loop in Harbor District',
      delta: '+2.1 km²',
      time: '12m ago',
      type: 'conquest',
    },
    {
      id: 2,
      user: '@KabirFast',
      name: 'Kabir',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbjiDf4K2PxEPbdxcdNvQuhx5FSDZtUJrvSo86EF-IcVD4lx5teFkme7KLBTOfnCSOmj6X2R5gplJ5_N3cDi0yUK2z9TpNUcP1V5jkfLZw5vrqzKShx5cadPI1jMs94Ow5k7TUJYJm6Vx84Z4AxkvyFnqGoSKxlmb37xidw03emXYQtZIRij6Gu_flmUWjmIr0UppQYuok5TRHFushVcGJibhShe_L_qRqqhHfVK9zu8MHm4ZfHzU',
      action: 'intercepted @ViperRun attack on Sector 04',
      delta: 'Defended',
      time: '34m ago',
      type: 'defense',
    },
    {
      id: 3,
      user: '@GhostSprint',
      name: 'GhostSprint',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6TvbaVpfjJPeqUjW5g4WFE42kdTy6xo6gmt_u86IudAqkzCYETzAbtUfBgwtEcQL0SuSWIm7l6atcSwaZICh5NksWrvJ4FsmgPUVcwQ69XZ4oqp_UN71LjcmPKoO9gzaJXI2HPRFU-sAqVI5E8ivyW4-kJjutXZR45l0CUL0na_n9hQCAu9o93PCqHJwP07_wDXcn4i-d3P1vgUDL4-vBXv82KPs0IWmEsyMIsgc80bbLI_Gt4Lc',
      action: 'logged a 10.4 km morning patrol loop',
      delta: '+1,450 XP',
      time: '2h ago',
      type: 'run',
    },
  ];

  return (
    <div className="flex-1 flex flex-col relative w-full pt-20 pb-32 bg-[#F8FAFC] max-w-md mx-auto select-none">
      <div className="flex flex-col w-full px-4 gap-4">
        {/* Syndicate Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#FC5200] to-amber-500 flex items-center justify-center text-white shadow-sm font-extrabold text-xl">
                AS
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-sans text-base font-extrabold text-slate-900">
                    Apex Striders
                  </h2>
                  <span className="font-metric text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    SQUAD #2
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-sans">
                  12 Active Runners • 89.4 km² Collective Turf
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 text-center">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="font-metric text-[10px] uppercase font-bold text-slate-400">
                Squad Turf
              </span>
              <span className="font-metric text-lg font-bold text-slate-900 block mt-0.5">
                89.4 <span className="text-xs">km²</span>
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="font-metric text-[10px] uppercase font-bold text-slate-400">
                Sectors Held
              </span>
              <span className="font-metric text-lg font-bold text-[#FC5200] block mt-0.5">
                28
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="font-metric text-[10px] uppercase font-bold text-slate-400">
                Weekly Rank
              </span>
              <span className="font-metric text-lg font-bold text-emerald-600 block mt-0.5">
                #2 City
              </span>
            </div>
          </div>
        </div>

        {/* Rally Squad Action */}
        <div className="flex gap-2">
          <button
            onClick={handleRally}
            className="flex-1 py-3 px-4 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 font-metric text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px] text-[#FC5200]">
              campaign
            </span>
            <span>{rallySent ? 'RALLY BEACON BROADCASTED!' : 'Rally Syndicate'}</span>
          </button>
          <button
            onClick={startActivity}
            className="flex-1 py-3 px-4 rounded-xl bg-[#FC5200] hover:bg-[#E04800] text-white font-metric text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              group_work
            </span>
            <span>Join Co-Op Run</span>
          </button>
        </div>

        {/* Live Team & Rival Activity Feed */}
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="font-metric text-base font-bold text-slate-900 tracking-tight">
            Live Turf Wire
          </span>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-metric text-[11px] uppercase tracking-wider font-semibold">
              Broadcast Live
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {feedItems.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans text-sm font-bold text-slate-900 truncate">
                      {item.user}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      • {item.time}
                    </span>
                  </div>
                  <span className="text-xs text-slate-600 truncate font-sans">
                    {item.action}
                  </span>
                </div>
              </div>

              <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 font-metric text-xs font-bold shrink-0">
                {item.delta}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
