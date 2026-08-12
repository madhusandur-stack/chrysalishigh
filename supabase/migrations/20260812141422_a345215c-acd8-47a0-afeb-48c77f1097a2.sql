
CREATE TABLE public.notice_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id uuid NOT NULL REFERENCES public.notice_items(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notice_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notice_reads TO authenticated;
GRANT ALL ON public.notice_reads TO service_role;
ALTER TABLE public.notice_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nr read" ON public.notice_reads FOR SELECT TO authenticated USING (true);
CREATE POLICY "nr write" ON public.notice_reads FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.timetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_year text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  draft_slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  published_slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid,
  updated_by_name text,
  published_at timestamptz,
  published_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, academic_year)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetables TO authenticated;
GRANT ALL ON public.timetables TO service_role;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tt read" ON public.timetables FOR SELECT TO authenticated USING (true);
CREATE POLICY "tt write" ON public.timetables FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_tt_u BEFORE UPDATE ON public.timetables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.timetables (class_id, academic_year, status, draft_slots, published_slots, updated_by_name, published_by_name, published_at)
SELECT c.id, '2026-27', 'published',
'[
 {"id":"s1","day":"Mon","period_no":1,"start_time":"08:00","end_time":"08:45","subject":"Mathematics","teacher":"Ananya Rao","room":"R-101"},
 {"id":"s2","day":"Mon","period_no":2,"start_time":"08:50","end_time":"09:35","subject":"English","teacher":"Meera Iyer","room":"R-101"},
 {"id":"s3","day":"Mon","period_no":3,"start_time":"09:45","end_time":"10:30","subject":"Science","teacher":"Rahul Menon","room":"Lab-1"},
 {"id":"s4","day":"Tue","period_no":1,"start_time":"08:00","end_time":"08:45","subject":"Social Studies","teacher":"Kavya Nair","room":"R-101"},
 {"id":"s5","day":"Tue","period_no":2,"start_time":"08:50","end_time":"09:35","subject":"Mathematics","teacher":"Ananya Rao","room":"R-101"},
 {"id":"s6","day":"Wed","period_no":1,"start_time":"08:00","end_time":"08:45","subject":"Computer Science","teacher":"Rahul Menon","room":"Lab-2"},
 {"id":"s7","day":"Thu","period_no":1,"start_time":"08:00","end_time":"08:45","subject":"Hindi","teacher":"Meera Iyer","room":"R-101"},
 {"id":"s8","day":"Fri","period_no":1,"start_time":"08:00","end_time":"08:45","subject":"Science","teacher":"Rahul Menon","room":"Lab-1"}
]'::jsonb,
'[
 {"id":"s1","day":"Mon","period_no":1,"start_time":"08:00","end_time":"08:45","subject":"Mathematics","teacher":"Ananya Rao","room":"R-101"},
 {"id":"s2","day":"Mon","period_no":2,"start_time":"08:50","end_time":"09:35","subject":"English","teacher":"Meera Iyer","room":"R-101"},
 {"id":"s3","day":"Mon","period_no":3,"start_time":"09:45","end_time":"10:30","subject":"Science","teacher":"Rahul Menon","room":"Lab-1"},
 {"id":"s4","day":"Tue","period_no":1,"start_time":"08:00","end_time":"08:45","subject":"Social Studies","teacher":"Kavya Nair","room":"R-101"},
 {"id":"s5","day":"Tue","period_no":2,"start_time":"08:50","end_time":"09:35","subject":"Mathematics","teacher":"Ananya Rao","room":"R-101"},
 {"id":"s6","day":"Wed","period_no":1,"start_time":"08:00","end_time":"08:45","subject":"Computer Science","teacher":"Rahul Menon","room":"Lab-2"},
 {"id":"s7","day":"Thu","period_no":1,"start_time":"08:00","end_time":"08:45","subject":"Hindi","teacher":"Meera Iyer","room":"R-101"},
 {"id":"s8","day":"Fri","period_no":1,"start_time":"08:00","end_time":"08:45","subject":"Science","teacher":"Rahul Menon","room":"Lab-1"}
]'::jsonb,
'School Office', 'School Office', now()
FROM public.classes c
WHERE c.id = '11111111-1111-4111-8111-111111111111';
