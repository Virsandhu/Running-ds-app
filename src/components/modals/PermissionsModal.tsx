import React, { useState, useEffect } from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';
import { audioService } from '../../services/audioService';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({ isOpen, onClose }) => {
  const {
    userLocation,
    gpsStatus,
    gpsAccuracy,
    gpsErrorMessage,
    requestCurrentLocation,
    fetchNetworkLocation,
    setIsSimulatorActive,
    setCustomLocation,
    snapToDoonSchool,
  } = useZoneRush();

  const [motionGranted, setMotionGranted] = useState<boolean>(false);
  const [audioGranted, setAudioGranted] = useState<boolean>(false);
  const [wakeLockGranted, setWakeLockGranted] = useState<boolean>(false);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'iphone' | 'android'>('iphone');
  const [isNetworkLocating, setIsNetworkLocating] = useState<boolean>(false);

  // Auto-detect browser/platform default tab
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setActiveGuideTab(isIOS ? 'iphone' : 'android');
    }
  }, []);

  if (!isOpen) return null;

  // DIRECT SYNCHRONOUS LOCATION CALL:
  // Mobile Safari (iOS) and Mobile Chrome REQUIRE navigator.geolocation.getCurrentPosition
  // to be called synchronously inside the user's touch/click event handler.
  const handleRequestLocation = () => {
    setIsRequesting(true);
    audioService.playTick();

    // 1. SYNCHRONOUS CALL: Trigger native browser prompt immediately!
    requestCurrentLocation();

    // 2. Also fire background unlocks non-blockingly without waiting
    audioService.unlockAudio().then((ok) => setAudioGranted(ok)).catch(() => setAudioGranted(true));

    if ('wakeLock' in navigator) {
      (navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } })
        .wakeLock.request('screen')
        .then(() => setWakeLockGranted(true))
        .catch(() => setWakeLockGranted(true));
    } else {
      setWakeLockGranted(true);
    }

    // iOS Safari Motion permission if available
    try {
      if (
        typeof DeviceMotionEvent !== 'undefined' &&
        typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
      ) {
        (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> })
          .requestPermission()
          .then((res) => setMotionGranted(res === 'granted'))
          .catch(() => setMotionGranted(true));
      } else {
        setMotionGranted(true);
      }
    } catch {
      setMotionGranted(true);
    }

    setTimeout(() => {
      setIsRequesting(false);
    }, 2500);
  };

  const handleFetchNetwork = async () => {
    setIsNetworkLocating(true);
    audioService.playTick();
    const success = await fetchNetworkLocation();
    setIsNetworkLocating(false);
    if (success) {
      localStorage.setItem('zonerush_permissions_prompted', 'true');
    }
  };

  const handleDismiss = () => {
    audioService.playTick();
    localStorage.setItem('zonerush_permissions_prompted', 'true');
    onClose();
  };

  const handleUseSimulator = () => {
    audioService.playTick();
    setIsSimulatorActive(true);
    localStorage.setItem('zonerush_permissions_prompted', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="permissions-title"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FC5200] flex items-center justify-center text-white shadow-lg shadow-[#FC5200]/30 animate-pulse">
              <span className="material-symbols-outlined text-[26px]">location_on</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase">
                  Mobile Setup
                </span>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                  Safari &amp; Chrome
                </span>
              </div>
              <h2 id="permissions-title" className="text-lg font-black tracking-tight text-white uppercase font-sans mt-0.5">
                Enable Phone Location
              </h2>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Close permissions dialog"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            ZoneRush uses your phone&apos;s real-time GPS coordinates to map territory boundaries, count pace, and capture turf loops.
          </p>

          {/* Quick Lock to The Doon School, Dehradun */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border border-amber-400/50 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <span className="material-symbols-outlined text-[18px]">school</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[12px] font-black uppercase text-amber-300">
                  Sitting inside The Doon School?
                </span>
                <span className="text-[10px] text-slate-300">
                  Chandbagh Campus • 30.3340° N, 78.0308° E
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                snapToDoonSchool();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-metric text-[10px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer active:scale-95"
            >
              Lock Campus
            </button>
          </div>

          {/* Primary GPS Hardware Card */}
          <div
            className={`p-4 rounded-2xl border-2 transition-all ${
              gpsStatus === 'locked'
                ? 'bg-emerald-50/90 border-emerald-400 shadow-sm'
                : gpsStatus === 'denied'
                ? 'bg-rose-50/90 border-rose-300 shadow-sm'
                : 'bg-orange-50/70 border-[#FC5200]/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    gpsStatus === 'locked'
                      ? 'bg-emerald-600 text-white'
                      : gpsStatus === 'denied'
                      ? 'bg-rose-600 text-white'
                      : 'bg-[#FC5200] text-white animate-pulse'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {gpsStatus === 'locked' ? 'gps_fixed' : gpsStatus === 'denied' ? 'location_off' : 'my_location'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 uppercase font-sans">
                      Device GPS &amp; Location
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full uppercase">
                      Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-snug">
                    {gpsStatus === 'locked'
                      ? 'GPS active! Real-time coordinates verified.'
                      : gpsStatus === 'denied'
                      ? 'Browser blocked location. See unblock instructions below.'
                      : 'Tap button below to trigger the phone permission prompt.'}
                  </p>

                  {/* Active coordinates badge if locked */}
                  {gpsStatus === 'locked' && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono font-bold text-emerald-900 bg-white/80 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      <span>LAT: {userLocation.lat.toFixed(5)}</span>
                      <span>LNG: {userLocation.lng.toFixed(5)}</span>
                      {gpsAccuracy && <span>(±{gpsAccuracy}m)</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="shrink-0">
                {gpsStatus === 'locked' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full uppercase">
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    LOCKED
                  </span>
                ) : gpsStatus === 'denied' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-1 rounded-full uppercase">
                    <span className="material-symbols-outlined text-[15px]">block</span>
                    BLOCKED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full uppercase animate-pulse">
                    <span className="material-symbols-outlined text-[15px]">sync</span>
                    PENDING
                  </span>
                )}
              </div>
            </div>

            {/* If GPS is not locked, show direct prompt trigger button right inside this card */}
            {gpsStatus !== 'locked' && (
              <div className="mt-3.5 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleRequestLocation}
                  disabled={isRequesting}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#FC5200] hover:bg-[#E04800] active:scale-[0.98] text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-[#FC5200]/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isRequesting ? 'sync' : 'touch_app'}
                  </span>
                  <span>{isRequesting ? 'Opening Browser Dialog...' : 'Tap to Allow Location'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleFetchNetwork}
                  disabled={isNetworkLocating}
                  title="Detect approx city location via Network IP"
                  className="py-3 px-3.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px] text-blue-600">
                    {isNetworkLocating ? 'sync' : 'wifi_tethering'}
                  </span>
                  <span>{isNetworkLocating ? 'Detecting...' : 'Auto-Detect via Network'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Browser Unblock Guide if Denied / Blocked */}
          {gpsStatus === 'denied' && (
            <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-900">
                <span className="material-symbols-outlined text-[20px] text-rose-600">settings_alert</span>
                <span className="text-xs font-black uppercase tracking-wider">
                  How to Unblock in Your Browser
                </span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Safari or Chrome blocked location permission for this site. You can unblock it in 5 seconds:
              </p>

              {/* OS Tabs */}
              <div className="flex rounded-xl bg-rose-200/60 p-1 text-xs font-extrabold text-rose-950">
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('iphone')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeGuideTab === 'iphone' ? 'bg-white shadow-xs text-rose-950 font-black' : 'text-rose-800'
                  }`}
                >
                  iPhone (Safari)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('android')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeGuideTab === 'android' ? 'bg-white shadow-xs text-rose-950 font-black' : 'text-rose-800'
                  }`}
                >
                  Android / Chrome
                </button>
              </div>

              {activeGuideTab === 'iphone' ? (
                <ol className="text-xs text-slate-800 space-y-2 list-decimal pl-5 font-medium">
                  <li>
                    In Safari, tap the <strong>“aA”</strong> (or Settings) button on the <em>left</em> side of the address bar.
                  </li>
                  <li>
                    Tap <strong>“Website Settings”</strong> (or Page Settings).
                  </li>
                  <li>
                    Under <strong>Location</strong>, change from <em>“Deny”</em> to <strong>“Allow”</strong> (or “Ask”).
                  </li>
                  <li>
                    Tap the orange <strong>“Tap to Allow Location”</strong> button above to lock in.
                  </li>
                </ol>
              ) : (
                <ol className="text-xs text-slate-800 space-y-2 list-decimal pl-5 font-medium">
                  <li>
                    Tap the <strong>Lock / Settings icon (🔒)</strong> on the left side of the Chrome search bar.
                  </li>
                  <li>
                    Tap <strong>“Permissions”</strong> &gt; <strong>“Location”</strong>.
                  </li>
                  <li>
                    Switch the toggle from Blocked to <strong>“Allowed”</strong>.
                  </li>
                  <li>
                    Tap the orange <strong>“Tap to Allow Location”</strong> button above.
                  </li>
                </ol>
              )}

              {/* One-tap fallback button */}
              <div className="pt-2 border-t border-rose-200/80">
                <button
                  type="button"
                  onClick={handleFetchNetwork}
                  disabled={isNetworkLocating}
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-rose-100/50 border border-rose-300 text-rose-900 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[17px] text-[#FC5200]">
                    near_me
                  </span>
                  <span>{isNetworkLocating ? 'Detecting...' : 'Bypass & Use Network Location (1-Tap)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Secondary Features Status */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-blue-600">volume_up</span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-800">Tactical Audio</span>
                <span className="text-[10px] text-emerald-600 font-semibold">{audioGranted ? 'Ready' : 'Enabled'}</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-purple-600">screen_lock_portrait</span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-800">Screen Keep-Awake</span>
                <span className="text-[10px] text-emerald-600 font-semibold">{wakeLockGranted ? 'Active' : 'Ready'}</span>
              </div>
            </div>
          </div>

          {/* Indoor / Laptop testing accordion */}
          <div className="pt-1">
            <details className="text-xs text-slate-500 cursor-pointer">
              <summary className="font-semibold text-slate-700 hover:text-slate-900 select-none flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">sports_score</span>
                  Indoor Simulator / Presets
                </span>
                <span className="text-[10px] text-slate-400">Click to expand</span>
              </summary>
              <div className="mt-2 p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <p className="text-[11px] text-slate-600">
                  Testing indoors or on a desktop without satellite view? Activate the runner simulator to test live zone conquest:
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleUseSimulator}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">directions_run</span>
                    Start Simulator
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomLocation(40.7829, -73.9654, 'Central Park');
                      onClose();
                    }}
                    className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    NYC Turf
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          {gpsStatus === 'locked' ? (
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              Clearance Complete — Go to App
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRequestLocation}
              disabled={isRequesting}
              className="flex-1 py-3.5 px-4 bg-gradient-to-r from-[#FC5200] to-[#FF7A00] hover:from-[#E04800] hover:to-[#E56D00] active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#FC5200]/30 transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-75 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] animate-pulse">
                {isRequesting ? 'sync' : 'near_me'}
              </span>
              {isRequesting ? 'Requesting Location...' : 'Allow GPS & Location Access'}
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="py-3 px-4 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-2xl transition-colors sm:w-auto text-center cursor-pointer"
          >
            {gpsStatus === 'locked' ? 'Close' : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  );
};
