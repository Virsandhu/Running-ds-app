import React from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';
import { AppTab } from '../../types/zonerush';
import { audioService } from '../../services/audioService';

export const BottomNavBar: React.FC = () => {
  const { currentTab, setCurrentTab, isRunning } = useZoneRush();

  const handleTabClick = (tab: AppTab) => {
    audioService.playTick();
    setCurrentTab(tab);
  };

  const tabs: { id: AppTab; label: string; icon: string; badgeColor?: string }[] = [
    { id: 'map', label: 'Map', icon: 'explore' },
    { id: 'activity', label: 'Activity', icon: 'directions_run', badgeColor: isRunning ? 'bg-[#FC5200] animate-ping' : 'bg-[#FC5200]' },
    { id: 'ranks', label: 'Ranks', icon: 'leaderboard' },
    { id: 'friends', label: 'Friends', icon: 'group', badgeColor: 'bg-rose-500' },
    { id: 'profile', label: 'Profile', icon: 'shield_person' },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe pointer-events-none px-4 pb-3">
      <div className="pointer-events-auto mx-auto max-w-md h-16 rounded-2xl bg-white/95 backdrop-blur-xl px-2 flex items-center justify-between border border-slate-200/90 shadow-lg">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`group flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-150 active:scale-95 ${
                isActive ? 'text-[#FC5200]' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[22px] transition-transform group-hover:scale-110"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {tab.icon}
                </span>
                {tab.badgeColor && (
                  <span className={`absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full ${tab.badgeColor}`} />
                )}
              </div>
              <span className={`font-sans font-bold text-[10px] uppercase tracking-wider mt-0.5 ${isActive ? 'text-[#FC5200]' : 'text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
