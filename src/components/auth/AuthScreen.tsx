import React, { useState } from 'react';
import { supabaseService, UserRunnerProfile } from '../../services/supabaseService';
import { audioService } from '../../services/audioService';
import { useZoneRush } from '../../context/ZoneRushContext';
import { EMOJI_AVATAR_OPTIONS } from '../../utils/emojiAvatars';

interface AuthScreenProps {
  onAuthSuccess: (profile: UserRunnerProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const { setIsPermissionsModalOpen, gpsStatus, requestCurrentLocation } = useZoneRush();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Post-Signup Emoji Avatar Selection Step
  const [showEmojiStep, setShowEmojiStep] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<UserRunnerProfile | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('⚡');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!email || !password || !fullName) {
          setErrorMsg('Please enter your full name, email, and password.');
          setLoading(false);
          return;
        }

        const autoUsername = '@' + (fullName.trim().replace(/[^a-zA-Z0-9]/g, '') || 'Runner');
        const defaultCity = 'The Doon School, Dehradun';

        const res = await supabaseService.signUp(email, password, {
          fullName,
          username: autoUsername,
          city: defaultCity,
        });

        if (res.error) {
          setErrorMsg(res.error);
          setLoading(false);
          return;
        }

        if (res.profile) {
          audioService.playTick();
          setPendingProfile(res.profile);
          setShowEmojiStep(true);
        }
      } else {
        if (!email || !password) {
          setErrorMsg('Please enter your email and password.');
          setLoading(false);
          return;
        }

        const res = await supabaseService.signIn(email, password);
        if (res.error) {
          setErrorMsg(res.error);
          setLoading(false);
          return;
        }

        if (res.profile) {
          audioService.playStart();
          onAuthSuccess(res.profile);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEmoji = () => {
    if (!pendingProfile) return;
    audioService.playStart();
    const updatedProfile: UserRunnerProfile = {
      ...pendingProfile,
      avatarUrl: selectedEmoji,
    };
    supabaseService.saveLocalSession(updatedProfile);
    onAuthSuccess(updatedProfile);
  };

  const handleQuickDemoAccess = async () => {
    setLoading(true);
    audioService.playStart();
    const demoProfile: UserRunnerProfile = {
      id: 'demo_user_24',
      email: 'alex.runner@zonerush.app',
      fullName: 'Alex Chen',
      username: '@AlexRunner',
      city: 'The Doon School, Dehradun',
      level: 1,
      territoryKm2: 0.08,
      localRank: 6,
      zonesHeld: 1,
      weeklyXp: 1250,
      streakDays: 14,
      avatarUrl: '⚡',
    };
    supabaseService.saveLocalSession(demoProfile);
    setTimeout(() => {
      onAuthSuccess(demoProfile);
      setLoading(false);
    }, 400);
  };

  // STEP 2: Post-Signup Emoji Avatar Selection Modal / Screen
  if (showEmojiStep) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-8 select-none">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/90 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-16 h-16 rounded-full bg-orange-50 border-2 border-[#FC5200] flex items-center justify-center text-4xl shadow-sm">
              {selectedEmoji}
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-metric text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                Signup Complete
              </span>
              <h2 className="font-sans text-xl font-extrabold text-slate-900 mt-1">
                Choose Your Profile Emoji
              </h2>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Select your preferred athletic emoji icon to represent your territory on the map:
              </p>
            </div>
          </div>

          {/* 10 Emoji Selection Grid */}
          <div className="grid grid-cols-5 gap-2.5 pt-1">
            {EMOJI_AVATAR_OPTIONS.map((opt) => {
              const isSelected = selectedEmoji === opt.emoji;
              return (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => {
                    audioService.playTick();
                    setSelectedEmoji(opt.emoji);
                  }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-50/80 border-[#FC5200] shadow-sm scale-105 ring-2 ring-[#FC5200]/20'
                      : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
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

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handleConfirmEmoji}
              className="w-full h-12 rounded-full bg-[#FC5200] hover:bg-[#E04800] text-white font-sans text-sm uppercase tracking-wide font-extrabold flex items-center justify-center gap-2 shadow-md shadow-[#FC5200]/25 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Confirm &amp; Enter Doon School Arena</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 1: Main Login / Signup Form
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-8 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/90 flex flex-col gap-6 animate-in fade-in duration-300">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FC5200] to-[#FF7A00] flex items-center justify-center text-white shadow-md shadow-[#FC5200]/30">
            <span className="material-symbols-outlined text-[32px]">bolt</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="font-sans text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
                ZoneRush
              </h1>
              <button
                type="button"
                onClick={() => {
                  requestCurrentLocation();
                  setIsPermissionsModalOpen(true);
                }}
                title="System Permissions & GPS Setup"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer shadow-2xs active:scale-95"
              >
                <span className={`w-2 h-2 rounded-full ${gpsStatus === 'locked' ? 'bg-emerald-600 animate-pulse' : 'bg-[#FC5200] animate-ping'}`} />
                <span className="font-metric text-[10px] font-extrabold text-slate-800 tracking-wider uppercase">
                  {gpsStatus === 'locked' ? 'GPS READY' : 'PERMISSIONS SETUP'}
                </span>
                <span className="material-symbols-outlined text-[13px] text-slate-500">security</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              The Doon School territory conquest running game
            </p>
          </div>
        </div>

        {/* Tab Switcher: Sign Up vs Sign In */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg font-metric uppercase tracking-wider transition-all cursor-pointer ${
              isSignUp
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg font-metric uppercase tracking-wider transition-all cursor-pointer ${
              !isSignUp
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Auth Form (No Turf callout handle, No Home District/City) */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {isSignUp && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 font-metric mb-1">
                Runner Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#FC5200] focus:ring-1 focus:ring-[#FC5200] transition-all bg-slate-50/50"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 font-metric mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="runner@zonerush.app"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#FC5200] focus:ring-1 focus:ring-[#FC5200] transition-all bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 font-metric mb-1">
              Secret Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#FC5200] focus:ring-1 focus:ring-[#FC5200] transition-all bg-slate-50/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 rounded-full bg-[#FC5200] hover:bg-[#E04800] text-white font-sans text-sm uppercase tracking-wide font-extrabold flex items-center justify-center gap-2 shadow-md shadow-[#FC5200]/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="material-symbols-outlined text-[20px] animate-spin">
                progress_activity
              </span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">
                  {isSignUp ? 'person_add' : 'login'}
                </span>
                <span>{isSignUp ? 'Sign Up & Pick Emoji' : 'Sign In to Turf'}</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Option */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-sans">
            Want to test immediately?
          </span>
          <button
            type="button"
            onClick={handleQuickDemoAccess}
            className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-metric text-xs font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
          >
            Launch with Demo Runner Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
