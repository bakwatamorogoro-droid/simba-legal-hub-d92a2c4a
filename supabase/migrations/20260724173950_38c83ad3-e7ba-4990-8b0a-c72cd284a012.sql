
-- 1) Assignments type
DO $$ BEGIN
  CREATE TYPE public.assignment_kind AS ENUM ('individual','group');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS kind public.assignment_kind NOT NULL DEFAULT 'individual';

-- 2) Submissions lock + AI
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_score numeric,
  ADD COLUMN IF NOT EXISTS ai_reason text;

-- 3) Groups
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  leader_student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated, anon;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read groups" ON public.groups FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','declined')),
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated, anon;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read group_members" ON public.group_members FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.group_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  submitted_by_student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  file_path text NOT NULL,
  file_name text NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  marks numeric,
  remarks text,
  ai_score numeric,
  ai_reason text,
  marked_at timestamptz,
  UNIQUE (group_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_submissions TO authenticated, anon;
GRANT ALL ON public.group_submissions TO service_role;
ALTER TABLE public.group_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read group_submissions" ON public.group_submissions FOR SELECT TO anon, authenticated USING (true);

-- updated_at trigger for groups
DROP TRIGGER IF EXISTS trg_groups_updated ON public.groups;
CREATE TRIGGER trg_groups_updated BEFORE UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.groups, public.group_members, public.group_submissions;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;
