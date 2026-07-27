
CREATE TABLE public.group_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL,
  course_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  student_id uuid NOT NULL,
  reg_number text NOT NULL,
  full_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX group_chat_lookup_idx ON public.group_chat_messages (assignment_id, course_id, academic_year_id, created_at);

GRANT SELECT, INSERT ON public.group_chat_messages TO anon, authenticated;
GRANT ALL ON public.group_chat_messages TO service_role;
ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read chat" ON public.group_chat_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert chat" ON public.group_chat_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_messages;
ALTER TABLE public.group_chat_messages REPLICA IDENTITY FULL;

ALTER TABLE public.group_submissions ADD COLUMN IF NOT EXISTS participants jsonb NOT NULL DEFAULT '[]'::jsonb;
