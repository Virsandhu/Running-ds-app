import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppTab, ConquestYield, RunTelemetry, Sector, LeaderboardRunner } from '../types/zonerush';
import { INITIAL_SECTORS, DEFAULT_CONQUEST_YIELD, INITIAL_LEADERBOARD } from '../data/mockData';
import { supabaseService, UserRunnerProfile } from '../services/supabaseService';
import { audioService } from '../services/audioService';
import { getUniqueUserColor, hexToRgba } from '../utils/userColors';

interface ZoneRushContextType {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  // User Authentication & Profile
  currentUser: UserRunnerProfile | null;
  isAuthenticated: boolean;
  handleAuthSuccess: (profile: UserRunnerProfile) => void;
  handleSignOut: () => void;
  // Territory Colors
  userTerritoryColor: string;
  setUserTerritoryColor: (color: string) => void;
  // Run Telemetry & Controls
  isRunning: boolean;
  runTelemetry: RunTelemetry;
  startActivity: () => void;
  togglePauseRun: () => void;
  toggleLockHud: () => void;
  setLockState: (locked: boolean) => void;
  sealLoopAndFinish: () => void;
  resetRun: () => void;
  // Conquest State
  latestConquest: ConquestYield | null;
  showConquestScreen: boolean;
  closeConquestScreen: () => void;
  // Map State
  sectors: Sector[];
  selectedSector: Sector | null;
  setSelectedSector: (sector: Sector | null) => void;
  tacticalMode: boolean;
  setTacticalMode: React.Dispatch<React.SetStateAction<boolean>>;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  recenterMap: () => void;
  // Live GPS Telemetry
  userLocation: { lat: number; lng: number };
  gpsStatus: 'searching' | 'locked' | 'denied' | 'unavailable';
  gpsAccuracy: number | null;
  gpsErrorMessage: string | null;
  isGpsModalOpen: boolean;
  setIsGpsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isPermissionsModalOpen: boolean;
  setIsPermissionsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  requestCurrentLocation: () => void;
  fetchNetworkLocation: () => Promise<boolean>;
  setCustomLocation: (lat: number, lng: number, name?: string) => void;
  snapToDoonSchool: () => void;
  // Laptop Runner Simulator
  isSimulatorActive: boolean;
  setIsSimulatorActive: React.Dispatch<React.SetStateAction<boolean>>;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  stepSimulation: () => void;
  // Leaderboards
  leaderboard: LeaderboardRunner[];
  leaderboardFilter: 'nearby' | 'friends' | 'city' | 'weekly';
  setLeaderboardFilter: (filter: 'nearby' | 'friends' | 'city' | 'weekly') => void;
}

const ZoneRushContext = createContext<ZoneRushContextType | undefined>(undefined);

// Haversine formula to compute distance in km between two GPS coordinates
const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const ZoneRushProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<AppTab>('map');
  const [currentUser, setCurrentUser] = useState<UserRunnerProfile | null>(() => {
    return supabaseService.getLocalSession();
  });
  const isAuthenticated = Boolean(currentUser);

  // Distinct User Territory Color (Different for every user)
  const [userTerritoryColor, setUserTerritoryColorState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('zonerush_user_territory_color');
      if (stored) return stored;
    } catch {}
    const session = supabaseService.getLocalSession();
    if (session?.territoryColor) return session.territoryColor;
    return getUniqueUserColor(session?.id || session?.email || session?.username || 'user_runner').hex;
  });

  // Keep territory color unique and synced with user identity
  useEffect(() => {
    if (currentUser) {
      if (currentUser.territoryColor) {
        setUserTerritoryColorState(currentUser.territoryColor);
      } else {
        const unique = getUniqueUserColor(currentUser.id || currentUser.email || currentUser.username).hex;
        setUserTerritoryColorState(unique);
      }
    }
  }, [currentUser?.id, currentUser?.email, currentUser?.username, currentUser?.territoryColor]);

  const [sectors, setSectors] = useState<Sector[]>(() => {
    return INITIAL_SECTORS.map((s) => {
      const isOwnedByUser = s.ownerHandle.includes('(YOU)') || s.ownerHandle === '@AlexRunner' || s.owner === 'Alex Chen';
      const color = isOwnedByUser ? userTerritoryColor : (s.ownerColor || getUniqueUserColor(s.ownerHandle).hex);
      return {
        ...s,
        ownerColor: color,
        fillColor: hexToRgba(color, 0.28),
      };
    });
  });

  // Automatically update only user-owned sectors when user's territory color changes
  useEffect(() => {
    setSectors((prev) =>
      prev.map((s) => {
        const isOwnedByUser = s.ownerHandle.includes('(YOU)') || s.ownerHandle === '@AlexRunner' || s.owner === 'Alex Chen';
        if (isOwnedByUser) {
          return {
            ...s,
            ownerColor: userTerritoryColor,
            fillColor: hexToRgba(userTerritoryColor, 0.28),
          };
        }
        // Ensure non-user sectors preserve their owner's distinct color
        const rivalColor = s.ownerColor || getUniqueUserColor(s.ownerHandle).hex;
        return {
          ...s,
          ownerColor: rivalColor,
          fillColor: hexToRgba(rivalColor, 0.28),
        };
      })
    );
  }, [userTerritoryColor]);

  const setUserTerritoryColor = (color: string) => {
    setUserTerritoryColorState(color);
    try {
      localStorage.setItem('zonerush_user_territory_color', color);
    } catch {}

    if (currentUser) {
      const updated = { ...currentUser, territoryColor: color };
      setCurrentUser(updated);
      supabaseService.saveLocalSession(updated);
    }
  };

  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [tacticalMode, setTacticalMode] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(18);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'nearby' | 'friends' | 'city' | 'weekly'>('nearby');
  const [leaderboard, setLeaderboard] = useState<LeaderboardRunner[]>(INITIAL_LEADERBOARD);

  // Live Real GPS Location State - Defaults precisely to The Doon School, Dehradun, India
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(() => {
    try {
      const saved = localStorage.getItem('zonerush_user_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          return parsed;
        }
      }
    } catch {}
    return {
      lat: 30.3340, // The Doon School, Chandbagh, Dehradun
      lng: 78.0308,
    };
  });
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'locked' | 'denied' | 'unavailable'>('locked');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(5);
  const [gpsErrorMessage, setGpsErrorMessage] = useState<string | null>(null);
  const [isGpsModalOpen, setIsGpsModalOpen] = useState<boolean>(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState<boolean>(true);

  // Laptop Runner Simulator State - default to false so real phone GPS is prioritized
  const [isSimulatorActive, setIsSimulatorActive] = useState<boolean>(false);
  const lastTrackedLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Fetch approximate network location (IP-based) when device GPS is blocked, off, or taking long
  const fetchNetworkLocation = async (): Promise<boolean> => {
    try {
      const res = await fetch('https://ipwho.is/');
      if (!res.ok) return false;
      const data = await res.json();
      if (data && data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const coords = { lat: data.latitude, lng: data.longitude };
        // Protect The Doon School coordinates: cellular providers in India often report Delhi/Mumbai
        const distToDoon = calculateDistanceKm(coords.lat, coords.lng, 30.3340, 78.0308);
        if (distToDoon > 30) {
          console.log('Cellular IP reported remote gateway (' + (data.city || 'Cell Tower') + '). Preserving The Doon School, Dehradun precision coordinates.');
          setGpsAccuracy(5);
          setGpsStatus('locked');
          return true;
        }
        setUserLocation(coords);
        setGpsAccuracy(800);
        setGpsStatus('locked');
        setGpsErrorMessage(null);
        setIsSimulatorActive(false);
        console.log(`Network location acquired: ${data.city || 'Local area'} (${coords.lat}, ${coords.lng})`);
        return true;
      }
    } catch (e) {
      console.warn('Network location fallback error:', e);
    }
    return false;
  };

  // Resilient multi-tier GPS acquisition: Direct native call -> Standard accuracy -> Network fallback
  const requestCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGpsStatus('unavailable');
      setGpsErrorMessage('Geolocation API is not supported on this browser.');
      fetchNetworkLocation();
      return;
    }

    setGpsStatus('searching');
    setGpsErrorMessage(null);

    // Call navigator.geolocation.getCurrentPosition directly with mobile-friendly options:
    // timeout: 30000 (gives user time to read system popup and allow GNSS fix)
    // maximumAge: 120000 (allows instantaneous return if phone already has recent coordinates)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setGpsStatus('locked');
        setGpsErrorMessage(null);
        setIsSimulatorActive(false);
      },
      (err) => {
        console.warn('GPS initial call error:', err.code, err.message);

        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
          setGpsErrorMessage('Location permission was denied in your browser settings.');
          // Auto-fetch city location via network so map centers on the runner's real area
          fetchNetworkLocation();
          return;
        }

        // If TIMEOUT or POSITION_UNAVAILABLE (very common indoors):
        // Try standard network triangulation with high accuracy disabled
        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => {
            const coords = { lat: fallbackPos.coords.latitude, lng: fallbackPos.coords.longitude };
            setUserLocation(coords);
            setGpsAccuracy(Math.round(fallbackPos.coords.accuracy));
            setGpsStatus('locked');
            setGpsErrorMessage(null);
            setIsSimulatorActive(false);
          },
          (fallbackErr) => {
            console.warn('Standard geolocation fallback error:', fallbackErr.message);
            if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
              setGpsStatus('denied');
              setGpsErrorMessage('Location permission was denied in your browser settings.');
            } else {
              setGpsStatus('unavailable');
              setGpsErrorMessage('Unable to get satellite GPS fix indoors. Using network location.');
            }
            fetchNetworkLocation();
          },
          { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 120000 }
    );
  };

  const setCustomLocation = (lat: number, lng: number, name?: string) => {
    setUserLocation({ lat, lng });
    setZoomLevel(18);
    setGpsStatus('locked');
    setGpsAccuracy(3);
    setGpsErrorMessage(null);
    setIsSimulatorActive(false);
    try {
      localStorage.setItem('zonerush_user_location', JSON.stringify({ lat, lng }));
    } catch {}
    if (name) {
      console.log(`Set location to preset: ${name}`);
    }
  };

  const snapToDoonSchool = () => {
    audioService.playTick();
    setCustomLocation(30.3340, 78.0308, 'The Doon School (Chandbagh Campus), Dehradun');
  };

  // Active Run State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runTelemetry, setRunTelemetry] = useState<RunTelemetry>({
    distanceKm: 3.84,
    durationSeconds: 1122, // 18m 42s initially
    paceSeconds: 292, // 4:52 /km
    bpm: 162,
    spm: 176,
    estimatedTerritoryYield: 1.42,
    loopProgressPct: 74,
    distanceToSealMeters: 184,
    isPaused: false,
    isLocked: false,
    targetSyndicate: 'Neon Syndicate HQ',
    routePoints: [
      [68, 105],
      [110, 50],
      [160, 65],
      [240, 45],
      [312, 98],
      [360, 140],
      [360, 210],
      [338, 228],
      [315, 250],
      [275, 275],
      [245, 290],
    ],
  });

  // Auto-acquire position on mount and listen to movement continuously
  useEffect(() => {
    requestCurrentLocation();

    // Check permissions API if available to auto-refresh on user permission grant
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((status) => {
        if (status.state === 'granted') {
          requestCurrentLocation();
        }
        status.onchange = () => {
          if (status.state === 'granted') {
            requestCurrentLocation();
          } else if (status.state === 'denied') {
            setGpsStatus('denied');
          }
        };
      }).catch(() => {});
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(newCoords);
          setGpsAccuracy(Math.round(pos.coords.accuracy));
          setGpsStatus('locked');
          setGpsErrorMessage(null);

          // If actively running with real GPS, accumulate distance
          if (isRunning && !isSimulatorActive && lastTrackedLocationRef.current) {
            const distDeltaKm = calculateDistanceKm(
              lastTrackedLocationRef.current.lat,
              lastTrackedLocationRef.current.lng,
              newCoords.lat,
              newCoords.lng
            );

            // Filter out minor jitter (< 4 meters) and GPS jumps (> 500m)
            if (distDeltaKm > 0.004 && distDeltaKm < 0.5) {
              setRunTelemetry((prev) => {
                const newDist = parseFloat((prev.distanceKm + distDeltaKm).toFixed(2));
                const newProgress = Math.min(100, Math.round(prev.loopProgressPct + distDeltaKm * 15));
                const newSeal = Math.max(0, Math.round(prev.distanceToSealMeters - distDeltaKm * 1000));
                const paceSecs = newDist > 0.1 ? Math.round(prev.durationSeconds / newDist) : prev.paceSeconds;

                return {
                  ...prev,
                  distanceKm: newDist,
                  loopProgressPct: newProgress,
                  distanceToSealMeters: newSeal,
                  paceSeconds: paceSecs,
                };
              });
            }
          }
          lastTrackedLocationRef.current = newCoords;
        },
        (err) => {
          // Do not overwrite locked status with transient watch timeouts
          if (err.code === err.PERMISSION_DENIED) {
            setGpsStatus('denied');
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isRunning, isSimulatorActive]);

  const [latestConquest, setLatestConquest] = useState<ConquestYield | null>(DEFAULT_CONQUEST_YIELD);
  const [showConquestScreen, setShowConquestScreen] = useState<boolean>(false);

  // Handle Authentication callbacks
  const handleAuthSuccess = (profile: UserRunnerProfile) => {
    setCurrentUser(profile);
    setCurrentTab('map');
  };

  const handleSignOut = async () => {
    await supabaseService.signOut();
    setCurrentUser(null);
    setCurrentTab('map');
  };

  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const simStepRef = useRef<number>(0);
  const baseLocationRef = useRef<{ lat: number; lng: number }>({ lat: 30.3340, lng: 78.0308 });

  useEffect(() => {
    if (userLocation) {
      baseLocationRef.current = userLocation;
    }
  }, [userLocation.lat, userLocation.lng]);

  const stepSimulation = () => {
    audioService.playTick();
    simStepRef.current += 10;
    setRunTelemetry((prev) => {
      const newDist = prev.distanceKm + 0.2;
      const newProgress = Math.min(100, prev.loopProgressPct + 8);
      const newSealDist = Math.max(0, prev.distanceToSealMeters - 30);
      return {
        ...prev,
        distanceKm: parseFloat(newDist.toFixed(2)),
        loopProgressPct: Math.round(newProgress),
        distanceToSealMeters: newSealDist,
      };
    });
    const angle = (simStepRef.current % 100) * (2 * Math.PI / 100);
    setUserLocation({
      lat: baseLocationRef.current.lat + 0.0025 * Math.sin(angle),
      lng: baseLocationRef.current.lng + 0.0035 * Math.cos(angle),
    });
  };

  // Live timer interval during active run with simulated movement
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning && !runTelemetry.isPaused) {
      timerRef.current = window.setInterval(() => {
        setRunTelemetry((prev) => {
          const speedMultiplier = isSimulatorActive ? simulationSpeed : 1;
          const newSeconds = prev.durationSeconds + speedMultiplier;
          const newDist = prev.distanceKm + (0.003 * speedMultiplier);
          const newProgress = Math.min(100, prev.loopProgressPct + (0.25 * speedMultiplier));
          const newSealDist = Math.max(0, Math.round(prev.distanceToSealMeters - (1.2 * speedMultiplier)));
          const newBpm = Math.min(178, Math.max(154, prev.bpm + (Math.random() > 0.6 ? 1 : Math.random() < 0.3 ? -1 : 0)));

          return {
            ...prev,
            durationSeconds: newSeconds,
            distanceKm: parseFloat(newDist.toFixed(2)),
            loopProgressPct: Math.round(newProgress),
            distanceToSealMeters: newSealDist,
            bpm: newBpm,
          };
        });

        // Simulate moving marker around territory
        if (isSimulatorActive) {
          simStepRef.current += 0.5 * simulationSpeed;
          const angle = (simStepRef.current % 100) * (2 * Math.PI / 100);
          setUserLocation({
            lat: baseLocationRef.current.lat + 0.0025 * Math.sin(angle),
            lng: baseLocationRef.current.lng + 0.0035 * Math.cos(angle),
          });
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, runTelemetry.isPaused, isSimulatorActive, simulationSpeed]);

  const startActivity = () => {
    audioService.playStart();
    setIsRunning(true);
    setCurrentTab('activity');
  };

  const togglePauseRun = () => {
    audioService.playTick();
    setRunTelemetry((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  };

  const toggleLockHud = () => {
    audioService.playTick();
    setRunTelemetry((prev) => ({
      ...prev,
      isLocked: !prev.isLocked,
    }));
  };

  const setLockState = (locked: boolean) => {
    audioService.playTick();
    setRunTelemetry((prev) => ({
      ...prev,
      isLocked: locked,
    }));
  };

  const sealLoopAndFinish = () => {
    audioService.playVictoryFanfare();
    setIsRunning(false);

    const captured = runTelemetry.estimatedTerritoryYield;
    const oldDominance = currentUser?.territoryKm2 || 12.8;
    const newDominance = parseFloat((oldDominance + captured).toFixed(2));
    const newRank = Math.max(1, (currentUser?.localRank || 7) - 1);

    const conquest: ConquestYield = {
      sectorName: 'Sector 14',
      capturedKm2: captured,
      previousDominanceKm2: oldDominance,
      newDominanceKm2: newDominance,
      rankSurgeTiers: 3,
      previousRank: 9,
      newRank: 6,
      distanceKm: runTelemetry.distanceKm > 4 ? runTelemetry.distanceKm : 5.20,
      durationSeconds: runTelemetry.durationSeconds > 1200 ? runTelemetry.durationSeconds : 1574,
      avgPaceString: '5:02',
      caloriesBurned: Math.round(runTelemetry.distanceKm * 75) || 412,
      displacedRivals: [
        {
          username: '@ViperRun',
          avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFfxfOTV6ulrTlClYy3E5rzf45kFGUPyHf0PS3-BvU3FVzZqOHZ1EKf1xMfl1l7r1_XmFVkjBijA-xLhjp9m9q2QBSdw_CV8-W4BsFp87rV0CKR1VCM9fNG2rFgpSLcyfmn_67eFWnzJeMHmb6jrJfNMABHJeFtYySqhJdTToGejUUUCGW7sq0ATgplTr_5zHUbk4balALO0D4Rdh5RKOWjY1CS4DLd1qTpOmFXZ8mV7ajRqgTGcM',
          note: 'Overtaken in Sector 14',
          lostKm2: 0.81,
        },
        {
          username: '@BlazeKicks',
          avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWIeX3c-fCANlCS3qez5vxHj6VzwaBFzYWuXO-9Ml8m88BzxrE9nm8Mhbsh8N4aDkXNl4QD1Q_b-v5GkKM8idD_9wR2YeL8rDqLq3TopMPXlXY6iqKkZyqWiW8W4imGq28ypvsuDLTyHsiwc6_ixX2qkHT2KvlYUsH04B3t9btBzEnhuHP7L1menIIhVZVFWwX1eiSqVRvOS8IPMo3Ll2g7sLH3st2B-xVBk41PmopPTzzC9WBzJw',
          note: 'Overtaken in Sector 14',
          lostKm2: 0.61,
        },
      ],
      streakBonusXp: 350,
      totalLootXp: 1280,
      timestamp: 'Just Now',
    };

    setLatestConquest(conquest);
    setShowConquestScreen(true);

    // Save run record to Supabase
    if (currentUser) {
      supabaseService.saveRunRecord(currentUser.id, {
        distanceKm: conquest.distanceKm,
        durationSeconds: conquest.durationSeconds,
        avgPace: conquest.avgPaceString,
        calories: conquest.caloriesBurned,
        territoryYieldKm2: conquest.capturedKm2,
        sectorClaimed: conquest.sectorName,
      });

      // Update active user profile
      const updatedProfile: UserRunnerProfile = {
        ...currentUser,
        territoryKm2: newDominance,
        localRank: newRank,
        weeklyXp: currentUser.weeklyXp + 1280,
        zonesHeld: currentUser.zonesHeld + 1,
      };
      setCurrentUser(updatedProfile);
      supabaseService.saveLocalSession(updatedProfile);
    }

    // Update sector ownership in state
    setSectors((prev) => [
      ...prev.map((s) => (s.id === 'sec-doon' ? { ...s, isContested: false, owner: currentUser?.fullName || 'Alex Chen', ownerHandle: `${currentUser?.username || '@AlexRunner'} (YOU)`, ownerColor: '#2563EB', alertMessage: undefined } : s)),
    ]);
  };

  const resetRun = () => {
    setIsRunning(false);
    setRunTelemetry({
      distanceKm: 0.0,
      durationSeconds: 0,
      paceSeconds: 292,
      bpm: 145,
      spm: 168,
      estimatedTerritoryYield: 1.42,
      loopProgressPct: 0,
      distanceToSealMeters: 450,
      isPaused: false,
      isLocked: false,
      targetSyndicate: 'Neon Syndicate HQ',
      routePoints: [[68, 105]],
    });
  };

  const closeConquestScreen = () => {
    setShowConquestScreen(false);
    setCurrentTab('map');
  };

  const recenterMap = () => {
    audioService.playTick();
    setZoomLevel(18);
    requestCurrentLocation();
  };

  return (
    <ZoneRushContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        currentUser,
        isAuthenticated,
        handleAuthSuccess,
        handleSignOut,
        isRunning,
        runTelemetry,
        startActivity,
        togglePauseRun,
        toggleLockHud,
        setLockState,
        sealLoopAndFinish,
        resetRun,
        latestConquest,
        showConquestScreen,
        closeConquestScreen,
        sectors,
        selectedSector,
        setSelectedSector,
        tacticalMode,
        setTacticalMode,
        zoomLevel,
        setZoomLevel,
        recenterMap,
        userLocation,
        gpsStatus,
        gpsAccuracy,
        gpsErrorMessage,
        isGpsModalOpen,
        setIsGpsModalOpen,
        isPermissionsModalOpen,
        setIsPermissionsModalOpen,
        requestCurrentLocation,
        fetchNetworkLocation,
        setCustomLocation,
        snapToDoonSchool,
        isSimulatorActive,
        setIsSimulatorActive,
        simulationSpeed,
        setSimulationSpeed,
        stepSimulation,
        leaderboard,
        leaderboardFilter,
        setLeaderboardFilter,
      }}
    >
      {children}
    </ZoneRushContext.Provider>
  );
};

export const useZoneRush = () => {
  const context = useContext(ZoneRushContext);
  if (!context) {
    throw new Error('useZoneRush must be used within a ZoneRushProvider');
  }
  return context;
};
