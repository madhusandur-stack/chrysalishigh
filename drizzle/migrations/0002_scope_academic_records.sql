ALTER TABLE public.cce_scholastic ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.cce_coscholastic ADD COLUMN IF NOT EXISTS published_at timestamptz;
COMMENT ON COLUMN public.cce_scholastic.published_at IS 'When set, the marks row is visible to the student.';
COMMENT ON COLUMN public.cce_coscholastic.published_at IS 'When set, the grades row is visible to the student.';

DROP POLICY IF EXISTS "cs read" ON public.cce_scholastic;
DROP POLICY IF EXISTS "cs write" ON public.cce_scholastic;
DROP POLICY IF EXISTS "cc read" ON public.cce_coscholastic;
DROP POLICY IF EXISTS "cc write" ON public.cce_coscholastic;
DROP POLICY IF EXISTS "rc read" ON public.report_cards;
DROP POLICY IF EXISTS "rc write" ON public.report_cards;
DROP POLICY IF EXISTS "pupa read" ON public.pupa_reports;
DROP POLICY IF EXISTS "pupa write" ON public.pupa_reports;

CREATE POLICY "cs staff all" ON public.cce_scholastic FOR ALL TO authenticated
USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'teacher'))
WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "cs student own published" ON public.cce_scholastic FOR SELECT TO authenticated
USING (published_at IS NOT NULL AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));

CREATE POLICY "cc staff all" ON public.cce_coscholastic FOR ALL TO authenticated
USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'teacher'))
WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "cc student own published" ON public.cce_coscholastic FOR SELECT TO authenticated
USING (published_at IS NOT NULL AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));

CREATE POLICY "rc staff all" ON public.report_cards FOR ALL TO authenticated
USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'teacher'))
WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "rc student own published" ON public.report_cards FOR SELECT TO authenticated
USING (published_on IS NOT NULL AND published_on <= current_date AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));

CREATE POLICY "pupa staff all" ON public.pupa_reports FOR ALL TO authenticated
USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'teacher'))
WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "pupa student own final" ON public.pupa_reports FOR SELECT TO authenticated
USING (status = 'final' AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));