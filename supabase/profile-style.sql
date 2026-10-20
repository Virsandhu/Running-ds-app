-- ====================================================================
-- ZONERUSH: NEW AVATAR EMOJIS + 5-COLOUR PALETTE (safe to run more than once)
-- Run AFTER supabase/setup.sql.
-- ====================================================================

-- New runners start as the Medal emoji
ALTER TABLE public.profiles ALTER COLUMN avatar_url SET DEFAULT '🏅';
ALTER TABLE public.profiles ALTER COLUMN territory_color SET DEFAULT '#2563EB';

-- Sign-up trigger: assign one of the five colours
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  clean_name TEXT;
  clean_handle TEXT;
  assigned_color TEXT;
  runner_colors TEXT[] := ARRAY[
    '#2563EB', '#DC2626', '#16A34A', '#EAB308', '#9333EA'
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
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '🏅'),
    assigned_color,
    0.0000
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Existing runners: retired emojis become the Medal emoji
UPDATE public.profiles
SET avatar_url = '🏅'
WHERE avatar_url IS NULL
   OR avatar_url NOT IN ('🏃‍♀️', '🦅', '🚴', '🏊', '🧗', '🏅');

-- Existing runners: retired colours move to one of the five
UPDATE public.profiles
SET territory_color = (ARRAY['#2563EB', '#DC2626', '#16A34A', '#EAB308', '#9333EA'])
  [1 + (abs(hashtext(id::text)) % 5)]
WHERE territory_color IS NULL
   OR upper(territory_color) NOT IN ('#2563EB', '#DC2626', '#16A34A', '#EAB308', '#9333EA');
