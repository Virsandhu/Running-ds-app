import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppTab, ConquestYield, RunTelemetry, Sector, LeaderboardRunner } from '../types/zonerush';
import { USER_PROFILE, INITIAL_SECTORS, INITIAL_LEADERBOARD, DEFAULT_CONQUEST_YIELD } from '../data/mockData';
import { audioService } from '../services/audioService';

interface ZoneRushContextType {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  // User Profile
  userProfile: typeof USER_PROFILE;
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
  // Leaderboards
  leaderboard: LeaderboardRunner[];
  leaderboardFilter: 'nearby' | 'friends' | 'city' | 'weekly';
  setLeaderboardFilter: (filter: 'nearby' | 'friends' | 'city' | 'weekly') => void;
}

const ZoneRushContext = createContext<ZoneRushContextType | undefined>(undefined);

export const ZoneRushProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<AppTab>('map');
  const [userProfile, setUserProfile] = useState(USER_PROFILE);
  const [sectors, setSectors] = useState<Sector[]>(INITIAL_SECTORS);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [tacticalMode, setTacticalMode] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'nearby' | 'friends' | 'city' | 'weekly'>('nearby');
  const [leaderboard, setLeaderboard] = useState<LeaderboardRunner[]>(INITIAL_LEADERBOARD);

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

  const [latestConquest, setLatestConquest] = useState<ConquestYield | null>(DEFAULT_CONQUEST_YIELD);
  const [showConquestScreen, setShowConquestScreen] = useState<boolean>(false);

  // Live timer interval during active run
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning && !runTelemetry.isPaused) {
      timerRef.current = window.setInterval(() => {
        setRunTelemetry((prev) => {
          const newSeconds = prev.durationSeconds + 1;
          const newDist = prev.distanceKm + 0.003; // increment ~3m per second
          // progress loop detector towards 100%
          const newProgress = Math.min(96, prev.loopProgressPct + 0.15);
          const newSealDist = Math.max(18, Math.round(prev.distanceToSealMeters - 0.7));
          // small organic pulse in heart rate
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
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, runTelemetry.isPaused]);

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

    // Calculate updated dominance & rewards
    const captured = runTelemetry.estimatedTerritoryYield;
    const oldDominance = userProfile.territoryKm2;
    const newDominance = parseFloat((oldDominance + captured).toFixed(2));
    const newRank = Math.max(1, userProfile.localRank - 1);

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

    // Update user profile in state
    setUserProfile((prev) => ({
      ...prev,
      territoryKm2: newDominance,
      localRank: newRank,
      weeklyXp: prev.weeklyXp + 1280,
      zonesHeld: prev.zonesHeld + 1,
      rankDelta: '+3 Today',
    }));

    // Update sector ownership in state: Sector 14 captured!
    setSectors((prev) => [
      ...prev.map((s) => (s.id === 'sec-04' ? { ...s, isContested: false, owner: 'AlexRunner', ownerHandle: '@AlexRunner (YOU)', ownerColor: '#2563EB', alertMessage: undefined } : s)),
    ]);

    // Update leaderboard with surge
    setLeaderboard((prev) =>
      prev.map((r) =>
        r.isUser
          ? {
              ...r,
              territoryKm2: newDominance,
              xp: r.xp + 1280,
              turfLoops: r.turfLoops + 1,
              deltaRank: 3,
            }
          : r
      )
    );
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
    setZoomLevel(1);
  };

  return (
    <ZoneRushContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        userProfile,
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
