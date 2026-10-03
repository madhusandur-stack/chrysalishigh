CREATE OR REPLACE FUNCTION public.can_see_homework(_user_id uuid, _hw_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(_user_id) OR public.has_role(_user_id, 'teacher')
    OR EXISTS (
      SELECT 1 FROM public.homework_items h
      JOIN public.students s ON s.class_id = h.class_id AND s.user_id = _user_id
      WHERE h.id = _hw_id
        AND h.status <> 'draft'
        AND (h.scheduled_for IS NULL OR h.scheduled_for <= current_date)
        AND (h.assign_all OR EXISTS (SELECT 1 FROM public.homework_targets t WHERE t.homework_id = h.id AND t.student_id = s.id))
    );
$$;

DROP POLICY IF EXISTS "hw read" ON public.homework_items;
DROP POLICY IF EXISTS "hw write" ON public.homework_items;
CREATE POLICY "hw read" ON public.homework_items FOR SELECT TO authenticated USING (public.can_see_homework(auth.uid(), id));
CREATE POLICY "hw write" ON public.homework_items FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "hwt read" ON public.homework_targets;
DROP POLICY IF EXISTS "hwt write" ON public.homework_targets;
CREATE POLICY "hwt read" ON public.homework_targets FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'teacher')
  OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
CREATE POLICY "hwt write" ON public.homework_targets FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'teacher'));