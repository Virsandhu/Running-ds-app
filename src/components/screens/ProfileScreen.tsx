import React from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';
import { supabaseService } from '../../services/supabaseService';
import { audioService } from '../../services/audioService';
import { TERRITORY_PALETTE } from '../../utils/userColors';
import { EMOJI_AVATAR_OPTIONS, DEFAULT_AVATAR_EMOJI } from '../../utils/emojiAvatars';
import { RunnerAvatar } from '../common/RunnerAvatar';
import { AreaLeaderboard } from '../profile/AreaLeaderboard';
import { FeedbackBox } from '../profile/FeedbackBox';

export const ProfileScreen: React.FC = () => {
  const {
    currentUser,
    handleSignOut,
    userTerritoryColor,
    setUserTerritoryColor,
    updateUserAvatar,
  } = useZoneRush();

  const onLogout = () => {
    audioService.playTick();
    handleSignOut();
  };

  return (
    <div className="flex-1 flex flex-col relative w-full pt-20 pb-32 bg-[#F8FAFC] max-w-md mx-auto select-none">
      <div className="flex flex-col w-full px-4 gap-4">
        {/* Profile Card with Real User Data */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative p-1 rounded-full ring-3 ring-[#FC5200]">
              <RunnerAvatar
                avatarUrl={currentUser?.avatarUrl}
                name={currentUser?.fullName || 'Runner'}
                sizeClassName="w-16 h-16"
                textSizeClassName="text-3xl"
              />
            </div>

            <div className="flex flex-col">
              <h2 className="font-sans text-lg font-extrabold text-slate-900">
                {currentUser?.fullName || 'Runner'}
              </h2>
              <span className="font-metric text-xs text-slate-500 font-semibold">
                {currentUser?.username || '@AlexRunner'}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[14px] text-amber-500">school</span>
                <span className="text-[11px] font-bold text-slate-700 font-sans">
                  The Doon School, Dehradun
                </span>
              </div>
            </div>
          </div>

          {/* Preferred Profile Emoji Icon (6 Athletic Options) */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl leading-none">
                  {currentUser?.avatarUrl && !currentUser.avatarUrl.startsWith('http')
                    ? currentUser.avatarUrl
                    : DEFAULT_AVATAR_EMOJI}
                </span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                  Profile Picture Emoji
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 font-sans">
                6 Athletic Icons
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              Choose your athletic avatar emoji icon to represent you across The Doon School territory and leaderboards.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {EMOJI_AVATAR_OPTIONS.map((opt) => {
                const isSelected = currentUser?.avatarUrl === opt.emoji;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => {
                      audioService.playTick();
                      updateUserAvatar(opt.emoji);
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-slate-900 shadow-sm scale-105 ring-2 ring-slate-900/10'
                        : 'bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                    }`}
                    title={`${opt.name} - ${opt.description}`}
                  >
                    <span className="text-2xl leading-none">{opt.emoji}</span>
                    <span className="text-[9px] font-bold text-slate-700 truncate max-w-full">
                      {opt.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Occupied Territory Color Customizer & Showcase */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full shadow-xs border-2 border-white ring-1 ring-slate-300"
                  style={{ backgroundColor: userTerritoryColor }}
                />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                  Your Occupied Territory Color
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold text-slate-500 uppercase px-2 py-0.5 rounded-full bg-white border border-slate-200">
                {userTerritoryColor}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              Every runner in The Doon School has a distinct occupied color. Your claimed campus zones and live tracking beacon glow in your chosen athletic color.
            </p>

            <div className="grid grid-cols-5 gap-2 pt-1">
              {TERRITORY_PALETTE.map((pal) => {
                const isSelected = userTerritoryColor.toLowerCase() === pal.hex.toLowerCase();
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => {
                      audioService.playTick();
                      setUserTerritoryColor(pal.hex);
                    }}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-slate-900 shadow-sm scale-105 ring-2 ring-slate-900/10'
                        : 'bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                    }`}
                    title={pal.name}
                  >
                    <span
                      className="w-6 h-6 rounded-full shadow-xs border border-black/10 flex items-center justify-center text-white"
                      style={{ backgroundColor: pal.hex }}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                      )}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-600 truncate max-w-full text-center">
                      {pal.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Backend Connection Status */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${supabaseService.isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
              <span className="text-xs font-bold text-slate-700 font-metric">
                {supabaseService.isConfigured ? 'Supabase Cloud Sync: Connected' : 'Runner Profile: Active'}
              </span>
            </div>
            <span className="text-[10px] font-metric text-slate-400 font-medium truncate max-w-[120px]">
              {currentUser?.email || 'sandhuvir23@gmail.com'}
            </span>
          </div>
        </div>

        <AreaLeaderboard />

        <FeedbackBox />

        {/* Sign Out CTA */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-metric text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer border border-slate-200"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
