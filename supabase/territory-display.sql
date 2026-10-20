-- ====================================================================
-- ZONERUSH: ONE MERGED TERRITORY PER RUNNER + SUM SCORING
-- Run AFTER supabase/anti-cheat.sql. Safe to run more than once.
--
--   * Map: each runner's runs are merged into a single shape, so a
--     repeat run over their own ground adds no extra shade
--   * Leaderboard: territory_km2 = SUM of every run's area, so repeat
--     runs still raise the score
--   * Removes the 19 Oct straight-line test run
-- ====================================================================

SET search_path = public, extensions;

-- --------------------------------------------------------------------
-- 1. REMOVE THE 19 OCT STRAIGHT-LINE RUN
-- --------------------------------------------------------------------
DELETE FROM public.runs
WHERE id = 'dbb773a7-21b3-4afa-9d5d-9955031d84e2';

-- --------------------------------------------------------------------
-- 2. SCORE = SUM OF ALL RUN AREAS
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_runner_totals(runner UUID)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
SET search_path = public, extensions
AS $$
  UPDATE public.profiles p
  SET
    territory_km2 = COALESCE((
      SELECT SUM(territory_yield_km2)
      FROM public.runs WHERE runner_id = runner
    ), 0),
    zones_held = (SELECT COUNT(*) FROM public.runs WHERE runner_id = runner),
    updated_at = NOW()
  WHERE p.id = runner;
$$;

REVOKE EXECUTE ON FUNCTION public.refresh_runner_totals(UUID)
  FROM PUBLIC, anon, authenticated;

UPDATE public.profiles p
SET
  territory_km2 = COALESCE((
    SELECT SUM(territory_yield_km2) FROM public.runs WHERE runner_id = p.id
  ), 0),
  zones_held = (SELECT COUNT(*) FROM public.runs WHERE runner_id = p.id);

-- --------------------------------------------------------------------
-- 3. MERGED TERRITORY SHAPE PER RUNNER (read by the map)
-- --------------------------------------------------------------------
-- Shells counter-clockwise, holes clockwise, so the map fills each
-- area exactly once and keeps any holes open.
DROP VIEW IF EXISTS public.runner_territories;
CREATE VIEW public.runner_territories
WITH (security_invoker = true) AS
SELECT
  u.runner_id,
  p.full_name,
  p.username,
  p.territory_color,
  u.run_count,
  ST_Area(u.shape::geography) / 1e6 AS covered_km2,
  ST_AsGeoJSON(ST_ForcePolygonCCW(u.shape), 7)::jsonb AS shape,
  ST_AsGeoJSON(ST_PointOnSurface(u.shape), 7)::jsonb AS label_point
FROM (
  SELECT runner_id, COUNT(*) AS run_count, ST_Union(geom) AS shape
  FROM public.runs
  WHERE geom IS NOT NULL
  GROUP BY runner_id
) u
JOIN public.profiles p ON p.id = u.runner_id;

GRANT SELECT ON public.runner_territories TO anon, authenticated;
