-- ====================================================================
-- ZONERUSH: SUPABASE DATABASE SETUP (safe to run more than once)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. RUNNER PROFILES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  city TEXT DEFAULT 'The Doon School, Dehradun',
  avatar_url TEXT DEFAULT '⚡',
  territory_color TEXT DEFAULT '#2563EB',
  territory_km2 NUMERIC(10, 4) DEFAULT 0.0000,
  local_rank INTEGER DEFAULT 10,
  zones_held INTEGER DEFAULT 0,
  weekly_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone"
  ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile"
  ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile"
  ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- --------------------------------------------------------------------
-- 2. RUN ACTIVITY LOGS
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
  polygon_paths JSONB,
  raw_gps_trail JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Runs are viewable by all runners"
  ON public.runs;
CREATE POLICY "Runs are viewable by all runners"
  ON public.runs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated runners can insert their own runs"
  ON public.runs;
CREATE POLICY "Authenticated runners can insert their own runs"
  ON public.runs FOR INSERT
  WITH CHECK (auth.uid() = runner_id);

-- --------------------------------------------------------------------
-- 3. CAMPUS TERRITORIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.territories (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_name TEXT NOT NULL,
  owner_handle TEXT NOT NULL,
  owner_color TEXT NOT NULL,
  area_km2 NUMERIC(10, 4) NOT NULL,
  paths JSONB NOT NULL,
  centroid JSONB NOT NULL,
  is_contested BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Territories are viewable by everyone"
  ON public.territories;
CREATE POLICY "Territories are viewable by everyone"
  ON public.territories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can claim or update territories"
  ON public.territories;
CREATE POLICY "Authenticated users can claim or update territories"
  ON public.territories FOR ALL
  USING (auth.role() = 'authenticated');

-- --------------------------------------------------------------------
-- 4. STARTING DOON SCHOOL SECTORS
-- --------------------------------------------------------------------
INSERT INTO public.territories
  (id, code, name, owner_name, owner_handle, owner_color,
   area_km2, paths, centroid)
VALUES
  (
    'sec-main-quad', 'DOON-01',
    'Chandbagh Main Quadrangle & Estate',
    'Alex Chen', '@AlexRunner', '#2563EB', 0.082,
    '[
      {"lat": 30.3375, "lng": 78.0282},
      {"lat": 30.3380, "lng": 78.0320},
      {"lat": 30.3355, "lng": 78.0322},
      {"lat": 30.3352, "lng": 78.0280}
    ]',
    '{"lat": 30.3364, "lng": 78.0302}'
  ),
  (
    'sec-skinners', 'DOON-02',
    'Skinner''s Field & Athletics Stadium',
    'Aarav Turf', '@AaravTurf', '#D97706', 0.095,
    '[
      {"lat": 30.3345, "lng": 78.0322},
      {"lat": 30.3345, "lng": 78.0366},
      {"lat": 30.3308, "lng": 78.0348},
      {"lat": 30.3308, "lng": 78.0322}
    ]',
    '{"lat": 30.3326, "lng": 78.0344}'
  ),
  (
    'sec-rose-bowl', 'DOON-03',
    'Rose Bowl Amphitheatre & Art School',
    'Meera Blaze', '@MeeraBlaze', '#9333EA', 0.048,
    '[
      {"lat": 30.3375, "lng": 78.0338},
      {"lat": 30.3368, "lng": 78.0355},
      {"lat": 30.3345, "lng": 78.0366},
      {"lat": 30.3355, "lng": 78.0322}
    ]',
    '{"lat": 30.3360, "lng": 78.0345}'
  ),
  (
    'sec-lower-fields', 'DOON-04',
    'Lower Fields & Pavilion Complex',
    'Kabir Swift', '@KabirSwift', '#059669', 0.062,
    '[
      {"lat": 30.3308, "lng": 78.0322},
      {"lat": 30.3308, "lng": 78.0348},
      {"lat": 30.3300, "lng": 78.0335},
      {"lat": 30.3296, "lng": 78.0318},
      {"lat": 30.3298, "lng": 78.0302},
      {"lat": 30.3304, "lng": 78.0286},
      {"lat": 30.3312, "lng": 78.0286}
    ]',
    '{"lat": 30.3304, "lng": 78.0314}'
  ),
  (
    'sec-jaipur-tata', 'DOON-05',
    'Jaipur & Tata House Grounds',
    'Rohan Apex', '@RohanApex', '#DC2626', 0.054,
    '[
      {"lat": 30.3375, "lng": 78.0264},
      {"lat": 30.3375, "lng": 78.0282},
      {"lat": 30.3338, "lng": 78.0280},
      {"lat": 30.3324, "lng": 78.0266},
      {"lat": 30.3364, "lng": 78.0264}
    ]',
    '{"lat": 30.3350, "lng": 78.0272}'
  )
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- 5. AUTO-CREATE A PROFILE WHEN SOMEONE SIGNS UP
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  clean_name TEXT;
  clean_handle TEXT;
  assigned_color TEXT;
  runner_colors TEXT[] := ARRAY[
    '#2563EB', '#D97706', '#059669', '#9333EA', '#DC2626',
    '#0891B2', '#EA580C', '#4F46E5', '#16A34A', '#E11D48'
  ];
  color_index INTEGER;
BEGIN
  clean_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Runner');
  clean_handle := COALESCE(
    NEW.raw_user_meta_data->>'username',
    '@' || regexp_replace(clean_name, '\s+', '', 'g')
  );

  -- Usernames are unique: add a suffix if the name is already taken
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = clean_handle) THEN
    clean_handle := clean_handle || '_'
      || substr(replace(NEW.id::text, '-', ''), 1, 5);
  END IF;

  color_index := 1 + (abs(hashtext(NEW.id::text))
    % array_length(runner_colors, 1));
  assigned_color := runner_colors[color_index];

  INSERT INTO public.profiles
    (id, email, full_name, username, city,
     avatar_url, territory_color, territory_km2)
  VALUES (
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------
-- 6. REALTIME (live map updates)
-- --------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['territories', 'runs', 'profiles'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t
      );
    END IF;
  END LOOP;
END $$;
