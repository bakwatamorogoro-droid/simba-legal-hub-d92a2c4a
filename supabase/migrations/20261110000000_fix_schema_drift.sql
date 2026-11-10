-- Reconcile repo migrations with the schema the application code expects.
-- These objects exist in the Lovable-managed database but were never captured
-- in the migration files, which breaks registration, media and submission flows.

-- 1. Student auth + photo (used by student.functions.ts / media.functions.ts)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS photo_url text;

-- 2. Drive mirror columns for submissions and assignments
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS drive_file_id text,
  ADD COLUMN IF NOT EXISTS drive_url text;

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS drive_file_id text,
  ADD COLUMN IF NOT EXISTS drive_url text;

ALTER TABLE public.group_submissions
  ADD COLUMN IF NOT EXISTS drive_file_id text,
  ADD COLUMN IF NOT EXISTS drive_url text;

-- 3. Site settings key/value store for logo, hero and founder images
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read site_settings" ON public.site_settings;
CREATE POLICY "public read site_settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

-- 4. Storage bucket for assignment files, questions and site media
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-files', 'assignment-files', true)
ON CONFLICT (id) DO NOTHING;
