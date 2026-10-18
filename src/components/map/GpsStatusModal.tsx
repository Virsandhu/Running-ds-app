import React, { useState } from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';
import { audioService } from '../../services/audioService';

interface PresetLocation {
  name: string;
  city: string;
  lat: number;
  lng: number;
}

const PRESET_LOCATIONS: PresetLocation[] = [
  { name: 'The Doon School (Chandbagh Quad)', city: 'The Doon School, Dehradun', lat: 30.3340, lng: 78.0308 },
  { name: "Skinner's Athletics Field & Track", city: 'The Doon School, Dehradun', lat: 30.3326, lng: 78.0344 },
  { name: 'Rose Bowl Amphitheatre & Art School', city: 'The Doon School, Dehradun', lat: 30.3360, lng: 78.0345 },
  { name: 'Chandbagh Main Gate (Mall Road)', city: 'The Doon School, Dehradun', lat: 30.3380, lng: 78.0320 },
  { name: 'Lower Fields & Sports Pavilion', city: 'The Doon School, Dehradun', lat: 30.3304, lng: 78.0314 },
  { name: 'Jaipur & Tata Boarding House Grounds', city: 'The Doon School, Dehradun', lat: 30.3350, lng: 78.0272 },
];

export const GpsStatusModal: React.FC = () => {
  const {
    isGpsModalOpen,
    setIsGpsModalOpen,
    gpsStatus,
    gpsAccuracy,
    gpsErrorMessage,
    requestCurrentLocation,
    fetchNetworkLocation,
    userLocation,
    setCustomLocation,
    snapToDoonSchool,
    isSimulatorActive,
    setIsSimulatorActive,
    setIsPermissionsModalOpen,
  } = useZoneRush();

  const [activeTab, setActiveTab] = useState<'status' | 'iphone' | 'android' | 'presets'>('status');
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');

  if (!isGpsModalOpen) return null;

  const handleRetryLocation = () => {
    audioService.playTick();
    requestCurrentLocation();
  };

  const handleFetchNetwork = () => {
    audioService.playTick();
    fetchNetworkLocation();
  };

  const handleApplyPreset = (preset: PresetLocation) => {
    audioService.playTick();
    setCustomLocation(preset.lat, preset.lng, preset.name);
  };

  const handleApplyCustomCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      audioService.playTick();
      setCustomLocation(lat, lng, 'Custom Coordinates');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gps-modal-title"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs ${
                gpsStatus === 'locked'
                  ? 'bg-emerald-600 shadow-emerald-500/20'
                  : gpsStatus === 'searching'
                  ? 'bg-amber-500 shadow-amber-500/20'
                  : gpsStatus === 'denied'
                  ? 'bg-rose-500 shadow-rose-500/20'
                  : 'bg-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {gpsStatus === 'locked'
                  ? 'gps_fixed'
                  : gpsStatus === 'denied'
                  ? 'location_disabled'
                  : 'my_location'}
              </span>
            </div>
            <div>
              <h2 id="gps-modal-title" className="text-[16px] font-extrabold text-slate-900 uppercase font-sans tracking-tight">
                GPS Location Controls
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Live Turf Tracking &amp; Geolocation Fix
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsGpsModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* 1-Tap Instant Doon School Precision Lock Banner */}
        <div className="px-4 pt-3 pb-0 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              snapToDoonSchool();
              setIsGpsModalOpen(false);
            }}
            className="w-full py-3 px-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-amber-400/50 text-white flex items-center justify-between shadow-md active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <span className="material-symbols-outlined text-[18px]">school</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[12px] font-black uppercase text-amber-300 tracking-wide">
                  Lock: The Doon School, Dehradun
                </span>
                <span className="text-[10px] text-slate-300">
                  Chandbagh Estate • 30.3340° N, 78.0308° E
                </span>
              </div>
            </div>
            <span className="px-2 py-1 rounded-full bg-amber-400 text-slate-950 font-metric text-[9px] font-black uppercase tracking-wider shrink-0">
              1-TAP FIX
            </span>
          </button>

          {/* Quick Launch System Permissions Clearance Button */}
          <button
            type="button"
            onClick={() => {
              setIsGpsModalOpen(false);
              setIsPermissionsModalOpen(true);
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white font-bold text-xs flex items-center justify-between shadow-xs transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#FC5200]">security</span>
              <span>Open Permissions & System Clearance</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono uppercase">
              ALL PERMISSIONS
            </span>
          </button>
        </div>

        {/* Status Callout Banner */}
        <div className="p-4 border-b border-slate-100">
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
              gpsStatus === 'locked'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : gpsStatus === 'searching'
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : gpsStatus === 'denied'
                ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="mt-0.5">
              <span
                className={`relative flex h-3 w-3 ${
                  gpsStatus === 'locked' ? '' : 'animate-ping'
                }`}
              >
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    gpsStatus === 'locked'
                      ? 'bg-emerald-500 ring-2 ring-emerald-300'
                      : gpsStatus === 'searching'
                      ? 'bg-amber-500'
                      : gpsStatus === 'denied'
                      ? 'bg-rose-500'
                      : 'bg-slate-400'
                  }`}
                />
              </span>
            </div>
            <div className="flex-1 text-xs">
              <div className="font-bold uppercase tracking-wider text-[11px] font-metric flex items-center justify-between">
                <span>
                  {gpsStatus === 'locked'
                    ? 'GPS Signal Locked (Real Location)'
                    : gpsStatus === 'searching'
                    ? 'Acquiring GPS Signal...'
                    : gpsStatus === 'denied'
                    ? 'Location Permission Denied'
                    : 'GPS Unavailable / Standby'}
                </span>
                {gpsAccuracy && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    ±{gpsAccuracy}m Accuracy
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                {gpsStatus === 'locked'
                  ? `Your physical coordinates: ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}. Running loops will claim territory around this exact real-world zone.`
                  : gpsStatus === 'searching'
                  ? 'Requesting high-accuracy fix from mobile GPS sensors and cell towers. Please stay in view of the open sky for best results.'
                  : gpsStatus === 'denied'
                  ? gpsErrorMessage ||
                    'Your browser blocked location access. See the tabs below for quick 2-step instructions on iPhone or Android to re-enable it.'
                  : gpsErrorMessage ||
                    'Location service could not acquire a satellite fix. Tap "Retry GPS" or pick a test city.'}
              </p>
            </div>
          </div>

          {/* Primary Action Button: Large Clickable Enable/Retry Button & Network Fallback */}
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleRetryLocation}
              className={`flex-1 h-12 rounded-xl text-white font-extrabold uppercase tracking-wide text-[13px] flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer ${
                gpsStatus === 'locked'
                  ? 'bg-slate-800 hover:bg-slate-900'
                  : 'bg-[#FC5200] hover:bg-[#E04800] shadow-[#FC5200]/25'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">
                {gpsStatus === 'searching' ? 'autorenew' : 'my_location'}
              </span>
              <span>
                {gpsStatus === 'searching'
                  ? 'Locating Device...'
                  : gpsStatus === 'denied'
                  ? 'Allow / Retry GPS Access'
                  : 'Acquire Live GPS Location'}
              </span>
            </button>

            {gpsStatus !== 'locked' && (
              <button
                type="button"
                onClick={handleFetchNetwork}
                title="Detect approx city location via Network IP"
                className="h-12 px-3.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-[12px] uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[17px] text-blue-600">wifi_tethering</span>
                <span>Auto-Detect via Network</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-2">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2.5 text-center text-[12px] font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'status'
                ? 'border-[#FC5200] text-[#FC5200]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Diagnostics
          </button>
          <button
            onClick={() => setActiveTab('iphone')}
            className={`flex-1 py-2.5 text-center text-[12px] font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'iphone'
                ? 'border-[#FC5200] text-[#FC5200]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            iPhone Fix
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2.5 text-center text-[12px] font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'android'
                ? 'border-[#FC5200] text-[#FC5200]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Android Fix
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2.5 text-center text-[12px] font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'presets'
                ? 'border-[#FC5200] text-[#FC5200]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Test Cities
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-slate-700 text-xs">
          {activeTab === 'status' && (
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Current Coordinates &amp; Sensor Telemetry
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-800 font-metric mt-1">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-sans">Latitude</span>
                    <span className="font-bold text-[13px]">{userLocation.lat.toFixed(6)}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-sans">Longitude</span>
                    <span className="font-bold text-[13px]">{userLocation.lng.toFixed(6)}</span>
                  </div>
                </div>
              </div>

              {/* Real vs Simulator Mode Switch */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-[13px]">
                    Indoor / Laptop Simulator Mode
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isSimulatorActive
                      ? 'Simulates outdoor runner movements around current coordinates'
                      : 'Using real phone GPS sensors directly'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    audioService.playTick();
                    setIsSimulatorActive((prev) => !prev);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isSimulatorActive ? 'bg-[#FC5200]' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle Simulator Mode"
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                      isSimulatorActive ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                <span className="font-bold text-amber-800 block">💡 Pro Tip for Real Outdoor Runs:</span>
                When running outside with your phone, make sure your phone screen stays on and your browser has location permission allowed. The map will follow your exact path in real-time.
              </div>
            </div>
          )}

          {activeTab === 'iphone' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 text-[13px]">
                  How to Enable Location on iPhone (Safari)
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-[12px] text-slate-600">
                  <li>
                    In Safari, look at the address bar at the bottom/top and tap the{' '}
                    <strong className="text-slate-800 font-semibold">aA</strong> icon.
                  </li>
                  <li>
                    Tap <strong className="text-slate-800 font-semibold">Website Settings</strong>.
                  </li>
                  <li>
                    Under <strong className="text-slate-800 font-semibold">Location</strong>, select{' '}
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded">
                      Allow
                    </span>
                    .
                  </li>
                  <li>
                    If still blocked, check iOS <strong>Settings</strong> &gt; <strong>Privacy &amp; Security</strong> &gt;{' '}
                    <strong>Location Services</strong> &gt; Safari Websites &gt; <strong>While Using the App</strong>.
                  </li>
                </ol>
              </div>
              <button
                onClick={handleRetryLocation}
                className="w-full py-2.5 rounded-xl bg-[#FC5200] hover:bg-[#E04800] text-white font-bold text-[12px] uppercase tracking-wide cursor-pointer shadow-xs"
              >
                Done! Retry Location Fix
              </button>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 text-[13px]">
                  How to Enable Location on Android (Chrome)
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-[12px] text-slate-600">
                  <li>
                    In Chrome, tap the <strong className="text-slate-800 font-semibold">Tune / Padlock 🔒</strong> icon to the left of the URL bar.
                  </li>
                  <li>
                    Tap <strong className="text-slate-800 font-semibold">Permissions</strong>.
                  </li>
                  <li>
                    Toggle <strong className="text-slate-800 font-semibold">Location</strong> to{' '}
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded">
                      ON (Allowed)
                    </span>
                    .
                  </li>
                  <li>
                    Ensure phone GPS is toggled ON in your Android top drop-down quick settings.
                  </li>
                </ol>
              </div>
              <button
                onClick={handleRetryLocation}
                className="w-full py-2.5 rounded-xl bg-[#FC5200] hover:bg-[#E04800] text-white font-bold text-[12px] uppercase tracking-wide cursor-pointer shadow-xs"
              >
                Done! Retry Location Fix
              </button>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500">
                Want to test running in famous turf battlegrounds around the world? Tap any city below to teleport your map center:
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {PRESET_LOCATIONS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-[#FC5200] hover:bg-orange-50/50 flex items-center justify-between transition-all text-left cursor-pointer active:scale-98"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block text-[12px]">
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-slate-500">{preset.city}</span>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-[16px]">
                      near_me
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom manual coordinates */}
              <form onSubmit={handleApplyCustomCoords} className="pt-2 border-t border-slate-100 flex gap-1.5">
                <input
                  type="number"
                  step="any"
                  placeholder="Lat (e.g. 40.71)"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-metric"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Lng (e.g. -74.00)"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-metric"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 cursor-pointer"
                >
                  Set
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => setIsGpsModalOpen(false)}
            className="w-full py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[12px] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
