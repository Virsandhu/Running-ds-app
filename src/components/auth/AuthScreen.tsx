import React, { useState } from 'react';
import { supabaseService, UserRunnerProfile } from '../../services/supabaseService';
import { audioService } from '../../services/audioService';
import { useZoneRush } from '../../context/ZoneRushContext';

interface AuthScreenProps {
  onAuthSuccess: (profile: UserRunnerProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const { setIsPermissionsModalOpen, gpsStatus, requestCurrentLocation } = useZoneRush();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('New York District');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!email || !password || !fullName || !username) {
          setErrorMsg('Please fill in all required runner credentials.');
          setLoading(false);
          return;
        }

        const res = await supabaseService.signUp(email, password, {
          fullName,
          username,
          city,
        });

        if (res.error) {
          setErrorMsg(res.error);
          setLoading(false);
          return;
        }

        if (res.profile) {
          audioService.playStart();
          onAuthSuccess(res.profile);
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

  const handleQuickDemoAccess = async () => {
    setLoading(true);
    audioService.playStart();
    const demoProfile: UserRunnerProfile = {
      id: 'demo_user_24',
      email: 'alex.runner@zonerush.app',
      fullName: 'Alex Chen',
      username: '@AlexRunner',
      city: 'New York District',
      level: 24,
      territoryKm2: 12.8,
      localRank: 7,
      zonesHeld: 9,
      weeklyXp: 4850,
      streakDays: 14,
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB4cnAh_eB0Xn3DbaM_wKpiKUbCpMQmRhwJc-4PG7YAtBY6OAUd4YHaLymaSlw-YUskAYQKoKh54TctIgWzPpcMErGMPHjFD3yCoR2LjJgFRPMYiMuWyw9_-ngJ3j0uFnBL2j9hJ4xNPkNOSqEQMUW73Set63WGQw-0oqd1WGOptvUZxpqA5cBdKFc5ktxObEh7TG6UjnrpXDV4-krPANwBocfxOvOEzegnzKoOwN0elCoaZB5XLck',
    };
    supabaseService.saveLocalSession(demoProfile);
    setTimeout(() => {
      onAuthSuccess(demoProfile);
      setLoading(false);
    }, 400);
  };

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
              Real-world territory conquest through athletic running loops
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

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {isSignUp && (
            <>
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

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 font-metric mb-1">
                  Turf Callout Handle
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="AlexRunner"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#FC5200] focus:ring-1 focus:ring-[#FC5200] transition-all bg-slate-50/50"
                  />
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">
                    @
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 font-metric mb-1">
                  Home District / City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. New York, Berlin, Tokyo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#FC5200] focus:ring-1 focus:ring-[#FC5200] transition-all bg-slate-50/50"
                />
              </div>
            </>
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
                <span>{isSignUp ? 'Sign Up & Claim Turf' : 'Sign In to Turf'}</span>
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
