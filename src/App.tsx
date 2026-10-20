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

  // Floats below the header so it never pushes the page down; dismissible
  const renderMapsKeyNotice = () => {
    if (!quotaExceeded) return null;
    return (
      <div className="fixed top-[calc(4rem+env(safe-area-inset-top,0px))] inset-x-0 z-40 px-3 pt-2 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3 py-2 text-[11px] shadow-sm flex items-start gap-2">
          <span className="material-symbols-outlined text-[16px] text-amber-600">warning</span>
          <span className="flex-1">
            Google Maps couldn&apos;t verify its API key, so the map is limited. App owner: check the
            Maps API key and billing in Google Cloud.
          </span>
          <button
            type="button"
            onClick={() => setQuotaExceeded(false)}
            aria-label="Dismiss"
            className="text-amber-700 hover:text-amber-900 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
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
          <TopHeader />
          <main className="flex-1 flex flex-col">
            {currentTab === 'map' && <TerritoryMapScreen />}
            {currentTab === 'profile' && <ProfileScreen />}
          </main>
          <BottomNavBar />
        </div>
      )}

      {isAuthenticated && renderMapsKeyNotice()}

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
