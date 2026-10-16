# ZoneRush Technical Specifications: User Flows & Component Architecture

## 1. System Overview & Core Metaphor

**ZoneRush** is a high-octane GPS territory conquest and running tracker application inspired by Strava's athletic precision, competitive turf mechanics, and clean modern sports typography. 

Runners claim physical territory by running closed loops around city sectors. As they run, their GPS trace is tracked in real-time. When a loop is sealed (start and end points intersect within a proximity threshold), the enclosed geometric polygon is claimed as turf, displacing rivals, gaining XP, and surging up the local leaderboards.

---

## 2. User Flow Specifications

```
  ┌─────────────────────────────────────────────────────────┐
  │                    1. TERRITORY MAP                     │
  │  - Inspect held sectors (12.8 km², 9 Sectors)           │
  │  - Review Contested Zone #4 (38m remaining alert)       │
  │  - Perimeter Alert: 2 sectors vulnerable                │
  └──────────────────────────┬──────────────────────────────┘
                             │
                  [START ACTIVITY] Click
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────┐
  │                    2. ACTIVE RUN                        │
  │  - Real-time GPS Route Tracking (Distance, Pace, Time)  │
  │  - Loop Detector Ring (Progress % to closing boundary)  │
  │  - Vitals monitoring (BPM, SPM) & Target Syndicate      │
  │  - Slide-to-lock HUD controls & Pause/Resume            │
  └──────────────────────────┬──────────────────────────────┘
                             │
                [SEAL LOOP & FINISH] Click
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────┐
  │              3. ZONE BREACH INTEL (CONQUEST)            │
  │  - Fanfare & Confetti celebration                       │
  │  - Closed loop confirmation on map card                 │
  │  - Territory Yield (+1.42 km² → 14.22 km² total)        │
  │  - Rank Surge: #9 → #6 Local District (+3 Tiers)        │
  │  - Displaced Rivals (@ViperRun, @BlazeKicks)            │
  │  - Share Victory Card (Instagram Story format)          │
  └──────────────────────────┬──────────────────────────────┘
                             │
                [VIEW ON LIVE MAP / DONE] Click
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────┐
  │               4. LEADERBOARDS & RANKINGS                │
  │  - Apex Turf Season 4 Finale Countdown (50k XP pool)    │
  │  - Scope filters: Nearby, Friends, City Wide, Weekly    │
  │  - Podium Top 3: #1 Aarav, #2 Kabir, #3 Nitro           │
  │  - Contender List with User #6 @AlexRunner highlighted  │
  │  - "Challenge Higher Ranks" dynamic sprint sprint lock  │
  └─────────────────────────────────────────────────────────┘
```

### Detailed Flow Descriptions:
1. **Territory Recon Flow**:
   - The user opens the app to the **Territory Map**.
   - Top HUD summarizes user territory size (12.8 km²), local rank (#7), sectors held (9), and weekly XP (4,850 XP).
   - A pulsing alert warns of an impending breach on **Zone #4** with a defense countdown.
   - Interactive SVG map displays user-owned athletic cobalt blue polygons, rival purple (@Shadow 15.1k) and coral (@ViperRun 8.4k) sectors, and neutral outlines.
   - Map controls allow recentering, layer toggling (satellite/tactical), and zoom.
   - Tapping "Start Activity" transitions seamlessly into the live running tracker.

2. **Active Run Tracking Flow**:
   - Live telemetry starts: active timer increments every second, distance accumulates, pace calculates dynamically, and simulated vitals reflect realistic athletic cadence (162 bpm, 176 spm).
   - As the runner progresses, the **Loop Detector** tracks progress towards closing a loop (0% → 100%), calculating the distance needed to seal the boundary.
   - Live visual route polyline is drawn on the vector map alongside an estimated territory yield (+1.42 km²).
   - "Slide to Lock" prevents accidental touch inputs during rigorous running.
   - Tapping "Seal Loop & Finish" triggers loop verification, audio-haptic feedback, and launches the Conquest celebration.

3. **Victory Conquest Flow**:
   - The **Zone Breach Intel** screen displays an celebratory particle burst (confetti) and victory fanfare.
   - Features a high-contrast Strava-style map card highlighting the closed polygon and rival zone breach.
   - Clear quantitative yield: +1.42 km² (+11.1% territorial dominance).
   - Rank surge callout: user advances from #9 to #6 local rank.
   - Direct rival impact list displays displaced competitors (@ViperRun -0.81 km², @BlazeKicks -0.61 km²).
   - Streak (+350 XP) and Conquest Loot (+1,280 XP) are added to user profile.
   - "Share Victory Card" opens a story-ready social card with 1-click sharing or image download.

4. **Leaderboard & Ranks Flow**:
   - Visualizes competitive hierarchy with an elevated 3D-feel podium for Aarav (#1), Kabir (#2), and Nitro (#3).
   - Segmented filter tabs dynamically sort rankings across **Nearby**, **Friends**, **City Wide**, and **Weekly Pace**.
   - The user's entry (@AlexRunner #6) is spotlighted in Strava signature orange with live surge indicator.
   - "Challenge Higher Ranks" button provides an immediate tactical objective to pass the runner ahead.

5. **Squads & Runner Profile Flow**:
   - Squad syndicates, co-op territory defense pacts, and Level 24 XP progress bar.
   - Complete runner dossier with equipment wear and historical conquest timeline.

---

## 3. Component Architecture

The app is organized into a modular, single-responsibility component hierarchy:

```
src/
├── types/
│   └── zonerush.ts            // Domain data models, coordinates, sectors, runners
├── data/
│   └── mockData.ts            // Authentic leaderboard data, rival sectors, initial stats
├── services/
│   └── audioService.ts        // Web Audio synthesized haptics, run start & victory fanfare
├── context/
│   └── ZoneRushContext.tsx    // Global state store for active runs, map state, and stats
├── components/
│   ├── layout/
│   │   ├── TopHeader.tsx      // ZoneRush brand mark, GPS lock, level, user avatar
│   │   └── BottomNavBar.tsx   // 5-destination bottom navigation tab bar with indicators
│   ├── map/
│   │   ├── VectorMapCanvas.tsx// SVG vector map base with street grid, waterways, polygons
│   │   ├── TacticalControls.tsx// Recenter, layers, zoom floating action buttons
│   │   └── SectorDetailModal.tsx// Modal sheet when inspecting a clicked sector
│   ├── screens/
│   │   ├── TerritoryMapScreen.tsx // Screen 1: Territory overview, HUD, alerts, Start CTA
│   │   ├── ActiveRunScreen.tsx    // Screen 2: Live tracking HUD, loop detector, slide-to-lock
│   │   ├── ConquestScreen.tsx     // Screen 4: Zone breach victory intel, yield, confetti, share
│   │   ├── LeaderboardsScreen.tsx // Screen 3: Apex Turf season, podium, contenders list
│   │   ├── FriendsSquadsScreen.tsx// Screen 5: Syndicates, rival feed, squad pacts
│   │   └── ProfileScreen.tsx      // Screen 6: Level 24 runner stats, medals, gear odometer
│   └── modals/
│       └── ShareVictoryModal.tsx  // Story-ready exportable victory graphic
├── App.tsx                    // Root controller, tab switching, and screen routing
└── index.css                  // Custom styles, fonts, and animation keyframes
```

### Key Architectural Decisions:
1. **State Isolation & Persistence**:
   - `ZoneRushContext` orchestrates active run state so that navigating between tabs during an active run does not cancel the workout (run status pill appears in header/tabs).
   - Simulated run simulation mode with variable pace speeds, plus support for actual browser Geolocation API (`navigator.geolocation.watchPosition`) when permitted.
2. **Design System & Tailwind Configuration**:
   - Color Palette:
     - Strava Athletic Orange: `#FC5200`, Dark `#E04800`, Light `#FFF3ED`
     - Athletic Cobalt Blue: `#2563EB`, Light `#EFF6FF`
     - Neutral surfaces: `#F8FAFC`, `#FFFFFF`, `#F1F5F9`, Borders `#E2E8F0`
     - Accent indicators: Emerald `#10B981`, Rose `#EF4444`, Amber `#F59E0B`
   - Typography:
     - Headings & Body: `Manrope`
     - Numeric Telemetry & Monospace Data: `Space Grotesk` with `tabular-nums`
3. **Accessibility & Responsive Shell**:
   - Fully optimized for mobile viewports (375px–430px) with responsive centering and optional desktop phone frame container for presentation on widescreen monitors.
   - High-contrast text compliance (WCAG AA), accessible touch targets ($\ge 44\text{px}$).
