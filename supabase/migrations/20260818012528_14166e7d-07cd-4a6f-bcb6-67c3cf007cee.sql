CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('campus_admin','system_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_see_notice(_user_id uuid, _scope text, _class_ids uuid[], _student_ids uuid[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _scope = 'school'
    OR public.is_admin(_user_id)
    OR public.has_role(_user_id, 'teacher')
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.user_id = _user_id
        AND ((_scope = 'class' AND s.class_id = ANY(_class_ids))
          OR (_scope = 'students' AND s.id = ANY(_student_ids)))
    );
$$;

DROP POLICY IF EXISTS "ni read" ON public.notice_items;
DROP POLICY IF EXISTS "ni write" ON public.notice_items;

CREATE POLICY "notice_items readable by audience" ON public.notice_items
FOR SELECT TO authenticated
USING (public.can_see_notice(auth.uid(), scope, class_ids, student_ids));

CREATE POLICY "notice_items managed by admins" ON public.notice_items
FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "students write" ON public.students;
CREATE POLICY "students managed by admins" ON public.students
FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));