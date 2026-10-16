import React from 'react';
import { useZoneRush } from '../../context/ZoneRushContext';

interface VectorMapCanvasProps {
  className?: string;
}

export const VectorMapCanvas: React.FC<VectorMapCanvasProps> = ({ className = '' }) => {
  const {
    tacticalMode,
    zoomLevel,
    sectors,
    setSelectedSector,
  } = useZoneRush();

  const handleSectorClick = (sectorId: string) => {
    const s = sectors.find((sec) => sec.id === sectorId);
    if (s) {
      setSelectedSector(s);
    }
  };

  return (
    <div className={`relative w-full overflow-hidden bg-[#F4F1EA] select-none ${className}`}>
      {/* Optional Satellite view backdrop when tacticalMode is false */}
      {!tacticalMode && (
        <div
          className="absolute inset-0 bg-cover bg-center filter saturate-105 brightness-95 transition-opacity duration-300"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAddvTgqXei8JntCl_2y35E-9-4y6TLE1kJXcoiMr2QrBLVw6VSGgyz4Lp1l-f_KlKCscsqzRjOCaeRtThzQDloJu27vEFuB7kUAGwE_nA2xGWdsWAZoEzGL4JS2KxgobIt0KZHzg9Qn1vUJS63BKrG72rX0YYhlY2gia2TbpsZ97vfGrEQeiP-sL8eReNtXcI3fUdn2SnEh1TuDjsaHvfTx8aJmskZdGnL2P8S29v_fRD1V5agWZE')`,
            filter: 'invert(0.92) hue-rotate(180deg) contrast(1.15) brightness(1.05)',
          }}
        />
      )}

      {/* SVG Map Container with scale transform for zoom */}
      <div
        className="w-full h-full transition-transform duration-300 ease-out origin-center"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <svg
          className="w-full h-full object-cover"
          viewBox="0 0 400 540"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient cx="50%" cy="50%" id="gpsPulse" r="50%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
              <stop offset="70%" stopColor="#2563EB" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
            </radialGradient>

            {/* Athletic Blue User Territory Fill */}
            <linearGradient id="userTerritoryGrad" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.16" />
            </linearGradient>

            {/* Coral/Salmon Rival Territory Fill */}
            <linearGradient id="rivalTerritoryGrad" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#FB7185" stopOpacity="0.12" />
            </linearGradient>

            {/* Purple Rival Territory Fill */}
            <linearGradient id="shadowTerritoryGrad" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.10" />
            </linearGradient>

            {/* Subtle Urban Grid Pattern */}
            <pattern height="28" id="cleanUrbanGrid" patternUnits="userSpaceOnUse" width="28">
              <path d="M 28 0 L 0 0 0 28" fill="none" opacity="0.35" stroke="#E5E2D9" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Map Base Land */}
          <rect fill={tacticalMode ? '#F4F1EA' : 'transparent'} height="100%" width="100%" />
          {tacticalMode && <rect fill="url(#cleanUrbanGrid)" height="100%" width="100%" />}

          {/* Parks & Green Spaces */}
          <path d="M 15 20 C 60 15, 95 35, 110 80 C 120 120, 70 145, 30 135 Z" fill="#DCEFE0" opacity="0.85" />
          <path d="M 270 320 C 330 300, 390 325, 410 380 C 400 450, 310 440, 260 395 Z" fill="#DCEFE0" opacity="0.85" />
          <path d="M 310 40 C 370 20, 420 50, 400 110 C 350 120, 310 90, 310 40 Z" fill="#E2F2E5" opacity="0.75" />

          {/* Waterway / River (Strava outdoor blue) */}
          <path d="M-20,380 C80,360 140,430 220,410 C300,390 350,470 440,450 L440,560 L-20,560 Z" fill="#D4E6F1" opacity="0.95" />
          <path d="M-20,380 C80,360 140,430 220,410 C300,390 350,470 440,450" fill="none" opacity="0.7" stroke="#A9CCE3" strokeWidth="2.5" />

          {/* Secondary Roads & Urban Street Grid */}
          <g stroke="#E2DED4" strokeWidth="3">
            <line x1="30" x2="30" y1="0" y2="540" />
            <line x1="110" x2="110" y1="0" y2="540" />
            <line x1="190" x2="190" y1="0" y2="540" />
            <line x1="280" x2="280" y1="0" y2="540" />
            <line x1="360" x2="360" y1="0" y2="540" />
            <line x1="0" x2="400" y1="70" y2="70" />
            <line x1="0" x2="400" y1="160" y2="160" />
            <line x1="0" x2="400" y1="240" y2="240" />
            <line x1="0" x2="400" y1="330" y2="330" />
            <line x1="0" x2="400" y1="430" y2="430" />
          </g>
          <g stroke="#FFFFFF" strokeWidth="2">
            <line x1="30" x2="30" y1="0" y2="540" />
            <line x1="110" x2="110" y1="0" y2="540" />
            <line x1="190" x2="190" y1="0" y2="540" />
            <line x1="280" x2="280" y1="0" y2="540" />
            <line x1="360" x2="360" y1="0" y2="540" />
            <line x1="0" x2="400" y1="70" y2="70" />
            <line x1="0" x2="400" y1="160" y2="160" />
            <line x1="0" x2="400" y1="240" y2="240" />
            <line x1="0" x2="400" y1="330" y2="330" />
            <line x1="0" x2="400" y1="430" y2="430" />
          </g>

          {/* Major Arterial Highway (Warm White with Orange Dashed Spine) */}
          <path d="M -10,120 L 420,290" fill="none" stroke="#D7D2C5" strokeLinecap="round" strokeWidth="7" />
          <path d="M -10,120 L 420,290" fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="5" />
          <path d="M -10,120 L 420,290" fill="none" opacity="0.6" stroke="#FC5200" strokeDasharray="8,10" strokeWidth="1.2" />

          {/* Avenue 2 */}
          <path d="M 270,0 L 90,540" fill="none" stroke="#D7D2C5" strokeLinecap="round" strokeWidth="6" />
          <path d="M 270,0 L 90,540" fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="4" />

          {/* Neutral Unclaimed Sectors (Dashed Gray Outlines) */}
          <polygon
            points="20,180 90,170 100,230 15,225"
            fill="#FFFFFF"
            fillOpacity="0.4"
            stroke="#9CA3AF"
            strokeDasharray="3,3"
            strokeWidth="1.2"
            className="cursor-pointer hover:fill-blue-50 transition-colors"
            onClick={() => handleSectorClick('sec-neutral-1')}
          />
          <polygon
            points="290,60 380,50 395,140 300,150"
            fill="#FFFFFF"
            fillOpacity="0.4"
            stroke="#9CA3AF"
            strokeDasharray="3,3"
            strokeWidth="1.2"
            className="cursor-pointer hover:fill-blue-50 transition-colors"
            onClick={() => handleSectorClick('sec-neutral-2')}
          />

          {/* Rival Territory 1: @ShadowStride (Soft Purple) 15.1 km² */}
          <polygon
            points="210,70 340,90 320,220 220,190"
            fill="url(#shadowTerritoryGrad)"
            stroke="#8B5CF6"
            strokeWidth="1.8"
            className="cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleSectorClick('sec-12')}
          />
          <g
            transform="translate(235, 132)"
            className="cursor-pointer"
            onClick={() => handleSectorClick('sec-12')}
          >
            <rect fill="#FFFFFF" height="22" rx="11" stroke="#E5E7EB" strokeWidth="1" width="90" x="0" y="0" />
            <circle cx="10" cy="11" fill="#8B5CF6" r="3.5" />
            <text fill="#4B5563" fontFamily="'Space Grotesk', sans-serif" fontSize="9" fontWeight="700" textAnchor="middle" x="52" y="15">
              @Shadow 15.1k
            </text>
          </g>

          {/* Rival Territory 2: @ViperRun (Athletic Coral/Salmon) 8.4 km² */}
          <polygon
            points="35,260 170,270 150,390 20,360"
            fill="url(#rivalTerritoryGrad)"
            stroke="#F43F5E"
            strokeWidth="2"
            className="cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleSectorClick('sec-04')}
          />
          <g
            transform="translate(42, 310)"
            className="cursor-pointer"
            onClick={() => handleSectorClick('sec-04')}
          >
            <rect fill="#FFFFFF" height="22" rx="11" stroke="#FECDD3" strokeWidth="1" width="92" x="0" y="0" />
            <circle cx="11" cy="11" fill="#F43F5E" r="3.5" />
            <text fill="#BE123C" fontFamily="'Space Grotesk', sans-serif" fontSize="9" fontWeight="700" textAnchor="middle" x="54" y="15">
              @ViperRun 8.4k
            </text>
          </g>

          {/* USER CLAIMED TERRITORY: Crisp Athletic Cobalt Blue 12.8 km² */}
          <polygon
            points="120,170 270,180 280,310 180,370 110,320"
            fill="url(#userTerritoryGrad)"
            stroke="#2563EB"
            strokeLinejoin="round"
            strokeWidth="2.5"
            className="cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => handleSectorClick('sec-09')}
          />

          {/* Zone Sector Label Pins */}
          <rect fill="#FFFFFF" fillOpacity="0.9" height="16" rx="4" width="108" x="136" y="186" />
          <text fill="#1E40AF" fontFamily="'Space Grotesk', sans-serif" fontSize="8" fontWeight="700" letterSpacing="0.5" x="142" y="198">
            SECTOR #09 (TECH HUB)
          </text>
          <text fill="#6B7280" fontFamily="'Manrope', sans-serif" fontSize="8" fontWeight="700" letterSpacing="0.5" x="48" y="88">
            GRAND AVE
          </text>
          <text fill="#6B7280" fontFamily="'Manrope', sans-serif" fontSize="8" fontWeight="700" letterSpacing="0.5" x="298" y="358">
            PARK BLVD
          </text>

          {/* Contested Hotspot Beacon: Zone #4 */}
          <g
            className="cursor-pointer group"
            transform="translate(165, 335)"
            onClick={() => handleSectorClick('sec-04')}
          >
            <circle cx="0" cy="0" fill="#EF4444" opacity="0.25" r="14">
              <animate attributeName="r" dur="1.8s" repeatCount="indefinite" values="8;18;8" />
              <animate attributeName="opacity" dur="1.8s" repeatCount="indefinite" values="0.4;0.05;0.4" />
            </circle>
            <circle cx="0" cy="0" fill="#EF4444" r="7" className="group-hover:scale-125 transition-transform" />
            <text fill="#ffffff" fontFamily="'Space Grotesk', sans-serif" fontSize="8" fontWeight="700" textAnchor="middle" x="0" y="3">
              !
            </text>
          </g>

          {/* USER LIVE GPS POSITION (Crisp Strava-Style Cobalt Beacon) */}
          <g transform="translate(195, 255)">
            <circle cx="0" cy="0" fill="url(#gpsPulse)" r="24">
              <animate attributeName="r" dur="2.4s" repeatCount="indefinite" values="8;26;8" />
              <animate attributeName="opacity" dur="2.4s" repeatCount="indefinite" values="0.7;0.1;0.7" />
            </circle>
            {/* Outer white disc with subtle drop shadow */}
            <circle cx="0" cy="0" fill="#FFFFFF" r="10" stroke="#DBEAFE" strokeWidth="1.5" />
            <circle cx="0" cy="0" fill="#2563EB" r="7" />
            {/* Heading arrow pointer */}
            <polygon fill="#2563EB" points="0,-14 4,-8 -4,-8" />
            <circle cx="0" cy="0" fill="#FFFFFF" r="2.5" />
          </g>
        </svg>
      </div>

      {/* Map Compass Watermark Badge */}
      <div className="absolute left-3 bottom-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm pointer-events-none">
        <span className="font-metric text-[10px] text-slate-500 font-bold tracking-wider">
          GRID 40.71°N 74.00°W
        </span>
      </div>
    </div>
  );
};
