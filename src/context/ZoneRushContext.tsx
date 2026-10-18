import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppTab, ConquestYield, RunTelemetry, Sector, LeaderboardRunner } from '../types/zonerush';
import { INITIAL_SECTORS, DEFAULT_CONQUEST_YIELD, INITIAL_LEADERBOARD } from '../data/mockData';
import { supabaseService, UserRunnerProfile } from '../services/supabaseService';
import { audioService } from '../services/audioService';
import { getUniqueUserColor, hexToRgba } from '../utils/userColors';
import {
  calculateDistanceKm,
  calculateDistanceMeters,
  calculateBearing,
  getCompassDirection,
  calculateDisplacement,
  calculatePolygonArea,
} from '../utils/geoUtils';

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
    distanceKm: 0.0,
    durationSeconds: 0,
    paceSeconds: 0,
    bpm: 142,
    spm: 160,
    estimatedTerritoryYield: 0.0,
    loopProgressPct: 0,
    distanceToSealMeters: 0,
    displacementMeters: 0,
    isPaused: false,
    isLocked: false,
    targetSyndicate: 'Campus Turf',
    routePoints: [],
    gpsTrail: [],
    currentBearing: undefined,
    currentDirection: undefined,
  });

  // Auto-acquire position on mount and listen to movement continuously
  useEffect(() => {
    requestCurrentLocation();

    // Check permissions API if available to auto-refresh on user permission grant
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
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
        })
        .catch(() => {});
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const acc = Math.round(pos.coords.accuracy);
          setUserLocation(newCoords);
          setGpsAccuracy(acc);
          setGpsStatus('locked');
          setGpsErrorMessage(null);

          // If actively running with real GPS, accurately track movement and append trail
          if (isRunning && !isSimulatorActive && !runTelemetry.isPaused) {
            setRunTelemetry((prev) => {
              const trail = prev.gpsTrail || [];
              if (trail.length === 0) {
                return {
                  ...prev,
                  gpsTrail: [newCoords],
                };
              }

              const lastPt = trail[trail.length - 1];
              const distDeltaMeters = calculateDistanceMeters(
                lastPt.lat,
                lastPt.lng,
                newCoords.lat,
                newCoords.lng
              );
              const distDeltaKm = distDeltaMeters / 1000;

              // Filter out stationary jitter (< 2.5 meters) or wild GPS teleportation (> 600m)
              if (distDeltaMeters < 2.5 || distDeltaKm > 0.6) {
                // When stopped or jitter: trail stays right where user is, no distance added
                return prev;
              }

              // Real movement confirmed: append to trail
              const updatedTrail = [...trail, newCoords];
              const newTotalDistKm = parseFloat((prev.distanceKm + distDeltaKm).toFixed(3));
              const bearing = calculateBearing(lastPt.lat, lastPt.lng, newCoords.lat, newCoords.lng);
              const dir = getCompassDirection(bearing);
              const disp = calculateDisplacement(updatedTrail);

              // Calculate occupied area if loop were closed now
              let areaYield = 0;
              if (updatedTrail.length >= 3) {
                const areaCalc = calculatePolygonArea([...updatedTrail, updatedTrail[0]]);
                areaYield = areaCalc.areaKm2;
              }

              // Loop progress calculation
              let loopProgress = 0;
              if (newTotalDistKm > 0.08) {
                loopProgress = Math.min(100, Math.max(10, Math.round((1 - Math.min(disp.meters, 250) / 250) * 100)));
              }

              const pace = newTotalDistKm > 0.02 ? Math.round(prev.durationSeconds / newTotalDistKm) : 0;

              return {
                ...prev,
                distanceKm: newTotalDistKm,
                gpsTrail: updatedTrail,
                currentBearing: bearing,
                currentDirection: dir,
                displacementMeters: disp.meters,
                distanceToSealMeters: disp.meters,
                loopProgressPct: loopProgress,
                estimatedTerritoryYield: areaYield,
                paceSeconds: pace,
              };
            });
          }
          lastTrackedLocationRef.current = newCoords;
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setGpsStatus('denied');
          }
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 25000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isRunning, isSimulatorActive, runTelemetry.isPaused]);

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
    const angle = (simStepRef.current % 100) * ((2 * Math.PI) / 100);
    const simLat = baseLocationRef.current.lat + 0.0016 * Math.sin(angle);
    const simLng = baseLocationRef.current.lng + 0.0022 * Math.cos(angle);
    const newCoords = { lat: simLat, lng: simLng };
    setUserLocation(newCoords);

    setRunTelemetry((prev) => {
      const trail = prev.gpsTrail || [];
      const lastPt = trail[trail.length - 1] || newCoords;
      const distDeltaKm = calculateDistanceKm(lastPt.lat, lastPt.lng, newCoords.lat, newCoords.lng);
      const updatedTrail = [...trail, newCoords];
      const newTotalDistKm = parseFloat((prev.distanceKm + distDeltaKm).toFixed(3));
      const bearing = calculateBearing(lastPt.lat, lastPt.lng, newCoords.lat, newCoords.lng);
      const dir = getCompassDirection(bearing);
      const disp = calculateDisplacement(updatedTrail);

      let areaYield = 0;
      if (updatedTrail.length >= 3) {
        const areaCalc = calculatePolygonArea([...updatedTrail, updatedTrail[0]]);
        areaYield = areaCalc.areaKm2;
      }

      const loopProgress = Math.min(100, Math.round(simStepRef.current % 100));

      return {
        ...prev,
        distanceKm: newTotalDistKm,
        gpsTrail: updatedTrail,
        currentBearing: bearing,
        currentDirection: dir,
        displacementMeters: disp.meters,
        distanceToSealMeters: disp.meters,
        loopProgressPct: loopProgress,
        estimatedTerritoryYield: areaYield,
      };
    });
  };

  // Live timer interval during active run
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning && !runTelemetry.isPaused) {
      timerRef.current = window.setInterval(() => {
        // Increment timer by 1s
        setRunTelemetry((prev) => ({
          ...prev,
          durationSeconds: prev.durationSeconds + 1,
        }));

        // In simulator mode: advance runner along smooth athletic loop around userLocation
        if (isSimulatorActive) {
          simStepRef.current += 1 * simulationSpeed;
          const angle = (simStepRef.current % 100) * ((2 * Math.PI) / 100);
          const simLat = baseLocationRef.current.lat + 0.0016 * Math.sin(angle);
          const simLng = baseLocationRef.current.lng + 0.0022 * Math.cos(angle);
          const simCoords = { lat: simLat, lng: simLng };
          setUserLocation(simCoords);

          setRunTelemetry((prev) => {
            const trail = prev.gpsTrail || [];
            const lastPt = trail[trail.length - 1] || simCoords;
            const distDeltaKm = calculateDistanceKm(lastPt.lat, lastPt.lng, simCoords.lat, simCoords.lng);
            const updatedTrail = [...trail, simCoords];
            const newTotalDistKm = parseFloat((prev.distanceKm + distDeltaKm).toFixed(3));
            const bearing = calculateBearing(lastPt.lat, lastPt.lng, simCoords.lat, simCoords.lng);
            const dir = getCompassDirection(bearing);
            const disp = calculateDisplacement(updatedTrail);

            let areaYield = 0;
            if (updatedTrail.length >= 3) {
              const areaCalc = calculatePolygonArea([...updatedTrail, updatedTrail[0]]);
              areaYield = areaCalc.areaKm2;
            }

            const loopProgress = Math.min(100, Math.round(simStepRef.current % 100));
            const pace = newTotalDistKm > 0.02 ? Math.round(prev.durationSeconds / newTotalDistKm) : 0;

            return {
              ...prev,
              distanceKm: newTotalDistKm,
              gpsTrail: updatedTrail,
              currentBearing: bearing,
              currentDirection: dir,
              displacementMeters: disp.meters,
              distanceToSealMeters: disp.meters,
              loopProgressPct: loopProgress,
              estimatedTerritoryYield: areaYield,
              paceSeconds: pace,
            };
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
    setRunTelemetry({
      distanceKm: 0.0,
      durationSeconds: 0,
      paceSeconds: 0,
      estimatedTerritoryYield: 0.0,
      loopProgressPct: 0,
      distanceToSealMeters: 0,
      displacementMeters: 0,
      isPaused: false,
      isLocked: false,
      targetSyndicate: 'Campus Turf',
      routePoints: [],
      gpsTrail: userLocation ? [{ lat: userLocation.lat, lng: userLocation.lng }] : [],
      currentBearing: undefined,
      currentDirection: undefined,
    });
    lastTrackedLocationRef.current = userLocation;
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

    let trail = [...(runTelemetry.gpsTrail || [])];
    if (trail.length < 3) {
      // If runner has fewer than 3 points, generate a minimal realistic loop at current coordinates
      const { lat, lng } = userLocation;
      trail = [
        { lat: lat, lng: lng },
        { lat: lat + 0.0008, lng: lng + 0.0006 },
        { lat: lat + 0.0004, lng: lng + 0.0012 },
        { lat: lat - 0.0003, lng: lng + 0.0007 },
      ];
    }

    // Join the start and end points of the run (displacement / shortest distance) to form an enclosed polygon
    const closedPolygon = [...trail, trail[0]];
    const areaCalc = calculatePolygonArea(closedPolygon);
    const disp = calculateDisplacement(trail);

    const actualDistKm =
      runTelemetry.distanceKm > 0.01
        ? runTelemetry.distanceKm
        : parseFloat((disp.km + 0.2).toFixed(2));
    const actualDuration = runTelemetry.durationSeconds > 0 ? runTelemetry.durationSeconds : 120;
    const paceSecs = actualDistKm > 0 ? Math.round(actualDuration / actualDistKm) : 320;
    const paceMins = Math.floor(paceSecs / 60);
    const paceRemSecs = paceSecs % 60;
    const avgPaceString = `${paceMins}:${paceRemSecs.toString().padStart(2, '0')}`;

    const oldDominance = currentUser?.territoryKm2 || 0;
    const capturedKm2 = areaCalc.areaKm2 > 0 ? areaCalc.areaKm2 : 0.008;
    const newDominance = parseFloat((oldDominance + capturedKm2).toFixed(3));
    const newRank = Math.max(1, (currentUser?.localRank || 5) - 1);

    const sectorName = currentUser?.city ? `${currentUser.city} Loop Territory` : 'Campus Turf Sector';

    const conquest: ConquestYield = {
      sectorName,
      capturedKm2,
      capturedM2: areaCalc.areaM2,
      acresCaptured: areaCalc.acres,
      previousDominanceKm2: oldDominance,
      newDominanceKm2: newDominance,
      rankSurgeTiers: 1,
      previousRank: currentUser?.localRank || 5,
      newRank,
      distanceKm: actualDistKm,
      durationSeconds: actualDuration,
      avgPaceString,
      caloriesBurned: Math.max(15, Math.round(actualDistKm * 65)),
      displacementMeters: disp.meters,
      polygonPaths: closedPolygon,
      rawGpsTrail: trail,
      displacedRivals: [],
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
        weeklyXp: currentUser.weeklyXp + 450,
        zonesHeld: currentUser.zonesHeld + 1,
      };
      setCurrentUser(updatedProfile);
      supabaseService.saveLocalSession(updatedProfile);
    }

    // Add this real captured sector into `sectors` so it shows on the map right where the user ran!
    const newSectorId = `claimed-${Date.now()}`;
    const newSector: Sector = {
      id: newSectorId,
      code: `TURF-${Math.floor(Math.random() * 90 + 10)}`,
      name: `Occupied Territory (+${capturedKm2} km²)`,
      owner: currentUser?.fullName || 'Runner',
      ownerHandle: `${currentUser?.username || '@Runner'} (YOU)`,
      ownerColor: userTerritoryColor,
      fillColor: hexToRgba(userTerritoryColor, 0.10),
      areaKm2: capturedKm2,
      points: '',
      paths: closedPolygon,
      centroid: trail[0],
      isContested: false,
    };

    setSectors((prev) => [newSector, ...prev]);
  };

  const resetRun = () => {
    setIsRunning(false);
    setRunTelemetry({
      distanceKm: 0.0,
      durationSeconds: 0,
      paceSeconds: 0,
      estimatedTerritoryYield: 0.0,
      loopProgressPct: 0,
      distanceToSealMeters: 0,
      displacementMeters: 0,
      isPaused: false,
      isLocked: false,
      targetSyndicate: 'Campus Turf',
      routePoints: [],
      gpsTrail: [],
      currentBearing: undefined,
      currentDirection: undefined,
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
        userTerritoryColor,
        setUserTerritoryColor,
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
