ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS drive_file_id text;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS drive_url text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS drive_file_id text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS drive_url text;
ALTER TABLE public.group_submissions ADD COLUMN IF NOT EXISTS drive_file_id text;
ALTER TABLE public.group_submissions ADD COLUMN IF NOT EXISTS drive_url text;