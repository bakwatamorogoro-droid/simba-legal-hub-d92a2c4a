ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_url text;
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read site_settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_students_reg_lower ON public.students (lower(reg_number));
CREATE INDEX IF NOT EXISTS idx_students_phone ON public.students (phone);
CREATE INDEX IF NOT EXISTS idx_students_course_year ON public.students (course_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_year ON public.assignments (course_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.submissions (assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.submissions (student_id);
CREATE INDEX IF NOT EXISTS idx_group_subs_assignment ON public.group_submissions (assignment_id);
CREATE INDEX IF NOT EXISTS idx_chat_group ON public.group_chat_messages (assignment_id, course_id, academic_year_id, created_at);
CREATE INDEX IF NOT EXISTS idx_group_members_student ON public.group_members (student_id);