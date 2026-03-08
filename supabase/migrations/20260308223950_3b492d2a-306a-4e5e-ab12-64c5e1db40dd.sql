
-- Fix: schools insert - only allow authenticated users
DROP POLICY "Authenticated can create schools" ON public.schools;
CREATE POLICY "Authenticated can create schools" ON public.schools FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix: activity logs insert - ensure user_id matches
DROP POLICY "Authenticated can insert activity logs" ON public.activity_logs;
CREATE POLICY "Users can insert own activity logs" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
