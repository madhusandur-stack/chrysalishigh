DROP POLICY IF EXISTS "att read" ON public.attendance_days;
DROP POLICY IF EXISTS "att write" ON public.attendance_days;
CREATE POLICY "attendance_days read own or staff" ON public.attendance_days FOR SELECT TO authenticated
USING (
  public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'teacher')
  OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance_days.student_id AND s.user_id = auth.uid())
);
CREATE POLICY "attendance_days staff write" ON public.attendance_days FOR ALL TO authenticated
USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'teacher'))
WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'teacher'));