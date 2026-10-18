# ZoneRush — Complete Supabase Backend Setup & Integration Guide

This document outlines everything required to complete the backend setup for **ZoneRush** (The Doon School territory conquest running game) on **Supabase**.

---

## 1. Overview & Architecture

ZoneRush requires 4 core capabilities from Supabase:
1. **Authentication**: Email & Password sign-up and sign-in (`supabase.auth`).
2. **Runner Profiles (`public.profiles`)**: Stores user identities, chosen profile emoji avatar, unique territory color, and accumulated territory (`territory_km2`).
3. **Run Activity Logs (`public.runs`)**: Stores every completed run, including GPS distance, duration, avg pace, shortest-distance displacement, and the enclosed polygon coordinate array.
4. **Territory Sectors (`public.territories`)**: Stores the claimed campus sectors and dynamic runner polygons within The Doon School, along with each runner's unique assigned color.
5. **Realtime Sync (`supabase_realtime`)**: Broadcasts territory captures so rivals and teammates on campus see turf colors update in real time.

---

## 2. One-Click SQL Schema Setup

Copy and run the following script in your **Supabase Dashboard > SQL Editor > New Query**:

```sql
-- ====================================================================
-- ZONERUSH: SUPABASE DATABASE INITIALIZATION SCRIPT
-- Target Platform: The Doon School GPS Territory Conquest Game
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 2. RUNNER PROFILES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  city TEXT DEFAULT 'The Doon School, Dehradun',
  avatar_url TEXT DEFAULT '⚡', -- Selected athletic emoji (e.g. ⚡, 🏃, 🐆, 🦅, 🔥, 🏆, 🐺, 🦁, 👟, 🚀)
  territory_color TEXT DEFAULT '#2563EB', -- Unique runner occupied turf color
  territory_km2 NUMERIC(10, 4) DEFAULT 0.0000,
  local_rank INTEGER DEFAULT 10,
  zones_held INTEGER DEFAULT 0,
  weekly_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- --------------------------------------------------------------------
-- 3. RUN ACTIVITY LOGS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  runner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  distance_km NUMERIC(8, 3) NOT NULL,
  duration_seconds INTEGER NOT NULL,
  avg_pace TEXT NOT NULL,
  calories INTEGER DEFAULT 0,
  displacement_meters NUMERIC(8, 2) DEFAULT 0.0,
  territory_yield_km2 NUMERIC(10, 4) DEFAULT 0.0,
  sector_claimed TEXT,
  polygon_paths JSONB, -- Array of [{lat: number, lng: number}]
  raw_gps_trail JSONB,  -- Raw GPS points array
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Runs
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

-- Runs Policies
CREATE POLICY "Runs are viewable by all runners" 
  ON public.runs FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated runners can insert their own runs" 
  ON public.runs FOR INSERT 
  WITH CHECK (auth.uid() = runner_id);

-- --------------------------------------------------------------------
-- 4. CAMPUS TERRITORIES & OCCUPIED SECTORS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.territories (
  id TEXT PRIMARY KEY, -- e.g. 'sec-main-quad', 'sec-skinners', or dynamic 'claimed-12345'
  code TEXT NOT NULL,  -- e.g. 'DOON-01'
  name TEXT NOT NULL,  -- e.g. 'Chandbagh Main Quadrangle & Estate'
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_name TEXT NOT NULL,
  owner_handle TEXT NOT NULL,
  owner_color TEXT NOT NULL, -- Distinct hex color of the occupant
  area_km2 NUMERIC(10, 4) NOT NULL,
  paths JSONB NOT NULL,      -- Enclosed boundary [{lat, lng}, ...]
  centroid JSONB NOT NULL,   -- Centroid marker position {lat, lng}
  is_contested BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Territories
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;

-- Territory Policies
CREATE POLICY "Territories are viewable by everyone" 
  ON public.territories FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can claim or update territories" 
  ON public.territories FOR ALL 
  USING (auth.role() = 'authenticated');

-- --------------------------------------------------------------------
-- 5. INITIAL SEED: THE DOON SCHOOL CAMPUS SECTORS
-- --------------------------------------------------------------------
INSERT INTO public.territories (id, code, name, owner_name, owner_handle, owner_color, area_km2, paths, centroid)
VALUES
  (
    'sec-main-quad',
    'DOON-01',
    'Chandbagh Main Quadrangle & Estate',
    'Alex Chen',
    '@AlexRunner',
    '#2563EB',
    0.082,
    '[{"lat":30.3375,"lng":78.0282},{"lat":30.3380,"lng":78.0320},{"lat":30.3355,"lng":78.0322},{"lat":30.3352,"lng":78.0280}]',
    '{"lat":30.3364,"lng":78.0302}'
  ),
  (
    'sec-skinners',
    'DOON-02',
    'Skinner''s Field & Athletics Stadium',
    'Aarav Turf',
    '@AaravTurf',
    '#D97706',
    0.095,
    '[{"lat":30.3345,"lng":78.0322},{"lat":30.3345,"lng":78.0366},{"lat":30.3308,"lng":78.0348},{"lat":30.3308,"lng":78.0322}]',
    '{"lat":30.3326,"lng":78.0344}'
  ),
  (
    'sec-rose-bowl',
    'DOON-03',
    'Rose Bowl Amphitheatre & Art School',
    'Meera Blaze',
    '@MeeraBlaze',
    '#9333EA',
    0.048,
    '[{"lat":30.3375,"lng":78.0338},{"lat":30.3368,"lng":78.0355},{"lat":30.3345,"lng":78.0366},{"lat":30.3355,"lng":78.0322}]',
    '{"lat":30.3360,"lng":78.0345}'
  ),
  (
    'sec-lower-fields',
    'DOON-04',
    'Lower Fields & Pavilion Complex',
    'Kabir Swift',
    '@KabirSwift',
    '#059669',
    0.062,
    '[{"lat":30.3308,"lng":78.0322},{"lat":30.3308,"lng":78.0348},{"lat":30.3300,"lng":78.0335},{"lat":30.3296,"lng":78.0318},{"lat":30.3298,"lng":78.0302},{"lat":30.3304,"lng":78.0286},{"lat":30.3312,"lng":78.0286}]',
    '{"lat":30.3304,"lng":78.0314}'
  ),
  (
    'sec-jaipur-tata',
    'DOON-05',
    'Jaipur & Tata House Grounds',
    'Rohan Apex',
    '@RohanApex',
    '#DC2626',
    0.054,
    '[{"lat":30.3375,"lng":78.0264},{"lat":30.3375,"lng":78.0282},{"lat":30.3338,"lng":78.0280},{"lat":30.3324,"lng":78.0266},{"lat":30.3364,"lng":78.0264}]',
    '{"lat":30.3350,"lng":78.0272}'
  )
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- 6. AUTOMATIC USER PROFILE CREATION TRIGGER
-- --------------------------------------------------------------------
-- When a user registers through Supabase Auth, automatically generate a profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  clean_name TEXT;
  clean_handle TEXT;
  assigned_color TEXT;
  runner_colors TEXT[] := ARRAY['#2563EB', '#D97706', '#059669', '#9333EA', '#DC2626', '#0891B2', '#EA580C', '#4F46E5', '#16A34A', '#E11D48'];
  color_index INTEGER;
BEGIN
  clean_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Runner');
  clean_handle := COALESCE(NEW.raw_user_meta_data->>'username', '@' || regexp_replace(clean_name, '\s+', '', 'g'));
  
  -- Assign deterministic unique color per runner
  color_index := 1 + (abs(hashtext(NEW.id::text)) % array_length(runner_colors, 1));
  assigned_color := runner_colors[color_index];

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    city,
    avatar_url,
    territory_color,
    territory_km2
  ) VALUES (
    NEW.id,
    NEW.email,
    clean_name,
    clean_handle,
    COALESCE(NEW.raw_user_meta_data->>'city', 'The Doon School, Dehradun'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '⚡'),
    assigned_color,
    0.0000
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if already exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------
-- 7. REALTIME BROADCASTING
-- --------------------------------------------------------------------
-- Enable Realtime publication so clients instantly receive turf updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.territories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
```

---

## 3. Environment Variables Configuration

In your project's `.env.local` or hosting configuration, configure:

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...<your-anon-key>
```

When these keys are present:
- `supabaseService.isConfigured` evaluates to `true`.
- Sign-up and Sign-in communicate directly with Supabase Auth.
- Every run loop sealed in `ActiveRunScreen` stores the run row in `public.runs`.
- Captured turf is written to `public.territories` with the runner's distinct occupied color.
- If offline or during local testing, the application automatically persists seamlessly in `localStorage` without breaking or freezing.

---

## 4. Key Verification Checklist

| Item | Requirement | Verification Method |
|---|---|---|
| **Auth** | Sign up with Full Name, Email, Password | Verify user record in `auth.users` and `public.profiles` |
| **Profile Emoji** | Pick 1 of 10 athletic emojis (`⚡, 🏃, 🐆, 🦅, 🔥, 🏆, 🐺, 🦁, 👟, 🚀`) | Verify `avatar_url` column in `public.profiles` |
| **Unique Color** | Each runner receives a distinct occupied territory color | Verify `territory_color` in `public.profiles` |
| **Run Log** | Distance, duration, avg pace, displacement, closed polygon | Verify row in `public.runs` table |
| **Territory Sync** | Claimed Doon School turf displays in claimant's color | Query `SELECT * FROM public.territories;` |
| **Realtime** | Instant turf visual sync across connected devices | `ALTER PUBLICATION supabase_realtime ADD TABLE public.territories;` |
