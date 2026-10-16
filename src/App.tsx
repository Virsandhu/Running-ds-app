import React from 'react';
import { ZoneRushProvider, useZoneRush } from './context/ZoneRushContext';
import { TopHeader } from './components/layout/TopHeader';
import { BottomNavBar } from './components/layout/BottomNavBar';
import { TerritoryMapScreen } from './components/screens/TerritoryMapScreen';
import { ActiveRunScreen } from './components/screens/ActiveRunScreen';
import { LeaderboardsScreen } from './components/screens/LeaderboardsScreen';
import { ConquestScreen } from './components/screens/ConquestScreen';
import { FriendsSquadsScreen } from './components/screens/FriendsSquadsScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';

const AppContent: React.FC = () => {
  const { currentTab, setCurrentTab, showConquestScreen, closeConquestScreen } = useZoneRush();

  // If showing victory conquest intel screen
  if (showConquestScreen) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A]">
        <TopHeader
          title="ZONE BREACH INTEL"
          subtitle="Zone Control HUD"
          showBack={true}
          onBack={closeConquestScreen}
        />
        <main className="flex-1 flex flex-col">
          <ConquestScreen />
        </main>
      </div>
    );
  }

  // Active run tracking mode
  if (currentTab === 'activity') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A]">
        <TopHeader
          title="ACTIVE RUN"
          subtitle="Live Zone Tracking"
          showBack={true}
          onBack={() => setCurrentTab('map')}
        />
        <main className="flex-1 flex flex-col">
          <ActiveRunScreen />
        </main>
        <BottomNavBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A]">
      <TopHeader />
      <main className="flex-1 flex flex-col">
        {currentTab === 'map' && <TerritoryMapScreen />}
        {currentTab === 'ranks' && <LeaderboardsScreen />}
        {currentTab === 'friends' && <FriendsSquadsScreen />}
        {currentTab === 'profile' && <ProfileScreen />}
      </main>
      <BottomNavBar />
    </div>
  );
};

export default function App() {
  return (
    <ZoneRushProvider>
      <AppContent />
    </ZoneRushProvider>
  );
}
