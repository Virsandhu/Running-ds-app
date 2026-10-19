-- ====================================================================
-- ZONERUSH: SERVER-SIDE SCORING & ANTI-CHEAT (safe to run more than once)
-- Run AFTER supabase/setup.sql.
--
-- The app can no longer decide scores. The database:
--   * recomputes each run's distance and area from its raw GPS trail
--   * rejects impossible runs (too fast, overlapping in time, malformed)
--   * sets each runner's territory_km2 to the UNION of all their run
--     areas, so re-running the same loop does not inflate the score
--   * blocks clients from writing scores, ranks or XP directly
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
SET search_path = public, extensions;

-- --------------------------------------------------------------------
-- 1. GEOMETRY HELPERS (GPS trail JSON -> PostGIS)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trail_line(trail JSONB)
RETURNS geometry
LANGUAGE sql IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT ST_MakeLine(
    ST_SetSRID(
      ST_MakePoint((p->>'lng')::float8, (p->>'lat')::float8), 4326
    ) ORDER BY ord
  )
  FROM jsonb_array_elements(trail) WITH ORDINALITY AS t(p, ord);
$$;

-- Closed loop (end joined back to start) as a valid polygon, or NULL
CREATE OR REPLACE FUNCTION public.trail_polygon(trail JSONB)
RETURNS geometry
LANGUAGE plpgsql IMMUTABLE
SET search_path = public, extensions
AS $$
DECLARE
  line geometry := public.trail_line(trail);
  poly geometry;
BEGIN
  IF line IS NULL OR ST_NPoints(line) < 3 THEN
    RETURN NULL;
  END IF;
  poly := ST_CollectionExtract(
    ST_MakeValid(ST_MakePolygon(ST_AddPoint(line, ST_StartPoint(line)))),
    3
  );
  IF poly IS NULL OR ST_IsEmpty(poly) THEN
    RETURN NULL;
  END IF;
  RETURN poly;
END;
$$;

-- --------------------------------------------------------------------
-- 2. RUNS: SERVER-COMPUTED FIELDS
-- --------------------------------------------------------------------
ALTER TABLE public.runs
  ADD COLUMN IF NOT EXISTS geom geometry(Geometry, 4326);

-- Backfill runs saved before this script, using their real GPS trails
UPDATE public.runs r
SET
  geom = public.trail_polygon(r.raw_gps_trail),
  distance_km = COALESCE(
    ST_Length(public.trail_line(r.raw_gps_trail)::geography) / 1000, 0
  ),
  territory_yield_km2 = COALESCE(
    ST_Area(public.trail_polygon(r.raw_gps_trail)::geography) / 1e6, 0
  )
WHERE r.raw_gps_trail IS NOT NULL
  AND jsonb_typeof(r.raw_gps_trail) = 'array';

-- --------------------------------------------------------------------
-- 3. VALIDATE + RECOMPUTE EVERY NEW RUN
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_run()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  max_speed_kmh CONSTANT NUMERIC := 25;  -- faster than any sustained run
  point_count INTEGER;
  line geometry;
  dist_km NUMERIC;
  pace_secs INTEGER;
  last_run_at TIMESTAMPTZ;
BEGIN
  -- Identity and time always come from the server
  NEW.runner_id := auth.uid();
  NEW.created_at := NOW();
  IF NEW.runner_id IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  IF NEW.raw_gps_trail IS NULL
     OR jsonb_typeof(NEW.raw_gps_trail) <> 'array' THEN
    RAISE EXCEPTION 'Run has no GPS trail';
  END IF;
  point_count := jsonb_array_length(NEW.raw_gps_trail);
  IF point_count < 2 OR point_count > 20000 THEN
    RAISE EXCEPTION 'GPS trail has an invalid number of points';
  END IF;

  IF NEW.duration_seconds IS NULL
     OR NEW.duration_seconds < 30
     OR NEW.duration_seconds > 6 * 3600 THEN
    RAISE EXCEPTION 'Run duration must be between 30 seconds and 6 hours';
  END IF;

  -- A new run cannot overlap the previous one in real time
  SELECT MAX(created_at) INTO last_run_at
  FROM public.runs WHERE runner_id = NEW.runner_id;
  IF last_run_at IS NOT NULL
     AND last_run_at > NOW() - make_interval(secs => NEW.duration_seconds) THEN
    RAISE EXCEPTION 'Run overlaps in time with your previous run';
  END IF;

  -- Distance and area come only from the GPS trail
  line := public.trail_line(NEW.raw_gps_trail);
  dist_km := COALESCE(ST_Length(line::geography) / 1000, 0);
  IF dist_km / (NEW.duration_seconds / 3600.0) > max_speed_kmh THEN
    RAISE EXCEPTION 'Run is faster than humanly possible (% km/h)',
      round(dist_km / (NEW.duration_seconds / 3600.0), 1);
  END IF;

  NEW.geom := public.trail_polygon(NEW.raw_gps_trail);
  NEW.distance_km := dist_km;
  NEW.territory_yield_km2 := COALESCE(ST_Area(NEW.geom::geography) / 1e6, 0);
  NEW.displacement_meters := COALESCE(
    ST_Distance(
      ST_StartPoint(line)::geography, ST_EndPoint(line)::geography
    ), 0
  );
  IF dist_km > 0 THEN
    pace_secs := round(NEW.duration_seconds / dist_km);
    NEW.avg_pace := (pace_secs / 60) || ':' || lpad((pace_secs % 60)::text, 2, '0');
  ELSE
    NEW.avg_pace := '0:00';
  END IF;
  NEW.polygon_paths := NULL;  -- client copy is untrusted; geom is canonical
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_run_before_insert ON public.runs;
CREATE TRIGGER validate_run_before_insert
  BEFORE INSERT ON public.runs
  FOR EACH ROW EXECUTE FUNCTION public.validate_run();

-- --------------------------------------------------------------------
-- 4. PROFILE TOTALS = UNION OF ALL RUN AREAS
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_runner_totals(runner UUID)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
SET search_path = public, extensions
AS $$
  UPDATE public.profiles p
  SET
    territory_km2 = COALESCE((
      SELECT ST_Area(ST_Union(geom)::geography) / 1e6
      FROM public.runs WHERE runner_id = runner AND geom IS NOT NULL
    ), 0),
    zones_held = (SELECT COUNT(*) FROM public.runs WHERE runner_id = runner),
    updated_at = NOW()
  WHERE p.id = runner;
$$;

CREATE OR REPLACE FUNCTION public.on_run_inserted()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM public.refresh_runner_totals(NEW.runner_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_totals_after_run ON public.runs;
CREATE TRIGGER refresh_totals_after_run
  AFTER INSERT ON public.runs
  FOR EACH ROW EXECUTE FUNCTION public.on_run_inserted();

-- Helpers are internal: clients must not call them directly
REVOKE EXECUTE ON FUNCTION public.refresh_runner_totals(UUID)
  FROM PUBLIC, anon, authenticated;

-- Recalculate everyone's score from their (backfilled) runs
UPDATE public.profiles p
SET
  territory_km2 = COALESCE((
    SELECT ST_Area(ST_Union(geom)::geography) / 1e6
    FROM public.runs WHERE runner_id = p.id AND geom IS NOT NULL
  ), 0),
  zones_held = (SELECT COUNT(*) FROM public.runs WHERE runner_id = p.id);

-- --------------------------------------------------------------------
-- 5. LOCK DOWN WHAT CLIENTS MAY WRITE
-- --------------------------------------------------------------------
-- Profiles: created only by the sign-up trigger; runners may change
-- just their emoji and color. Scores, rank and XP are server-only.
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (avatar_url, territory_color, updated_at)
  ON public.profiles TO authenticated;

-- Runs: insert only (validated above); never edited or deleted
REVOKE UPDATE, DELETE ON public.runs FROM anon, authenticated;

-- Territories: not written by the app; nobody may claim or wipe them
DROP POLICY IF EXISTS "Authenticated users can claim or update territories"
  ON public.territories;
REVOKE INSERT, UPDATE, DELETE ON public.territories FROM anon, authenticated;
