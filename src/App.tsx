import React, { useState, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { ZoneRushProvider, useZoneRush } from './context/ZoneRushContext';
import { TopHeader } from './components/layout/TopHeader';
import { BottomNavBar } from './components/layout/BottomNavBar';
import { TerritoryMapScreen } from './components/screens/TerritoryMapScreen';
import { ActiveRunScreen } from './components/screens/ActiveRunScreen';
import { ConquestScreen } from './components/screens/ConquestScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { AuthScreen } from './components/auth/AuthScreen';
import { GpsStatusModal } from './components/map/GpsStatusModal';
import { PermissionsModal } from './components/modals/PermissionsModal';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAUuhTc-5Klh_FDOV-vqWhFGW0sQ5--9pk';

const AppContent: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    showConquestScreen,
    closeConquestScreen,
    isAuthenticated,
    isRestoringSession,
    handleAuthSuccess,
    isPermissionsModalOpen,
    setIsPermissionsModalOpen,
  } = useZoneRush();

  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  const renderQuotaNotice = () => {
    if (!quotaExceeded) return null;
    return (
      <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
        <span>
          Google Maps Platform quota reached. If you are the app owner, visit{' '}
          <a
            href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold text-amber-950 hover:text-amber-800"
          >
            maps developer site
          </a>{' '}
          for instructions to update your account.
        </span>
      </div>
    );
  };

  return (
    <>
      {/* Auth Gate: User must sign up / sign in first */}
      {isRestoringSession ? (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <span className="material-symbols-outlined text-[32px] text-[#FC5200] animate-spin">
            progress_activity
          </span>
        </div>
      ) : !isAuthenticated ? (
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      ) : showConquestScreen ? (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A]">
          {renderQuotaNotice()}
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
      ) : currentTab === 'activity' ? (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A]">
          {renderQuotaNotice()}
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
      ) : (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A]">
          {renderQuotaNotice()}
          <TopHeader />
          <main className="flex-1 flex flex-col">
            {currentTab === 'map' && <TerritoryMapScreen />}
            {currentTab === 'profile' && <ProfileScreen />}
          </main>
          <BottomNavBar />
        </div>
      )}

      {/* Permissions Clearance Modal - appears as soon as app opens */}
      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
      />

      {/* Detailed GPS Settings Modal */}
      <GpsStatusModal />
    </>
  );
};

export default function App() {
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <ZoneRushProvider>
        <AppContent />
      </ZoneRushProvider>
    </APIProvider>
  );
}
