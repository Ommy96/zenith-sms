
CREATE TABLE public.ai_comment_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  school_id uuid NOT NULL,
  year_month text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year_month)
);

ALTER TABLE public.ai_comment_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usage"
ON public.ai_comment_usage FOR SELECT TO authenticated
USING (user_id = auth.uid() OR (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(), 'school_admin')));

CREATE POLICY "Users insert own usage"
ON public.ai_comment_usage FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND school_id = public.get_user_school_id(auth.uid()));

CREATE POLICY "Users update own usage"
ON public.ai_comment_usage FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE TRIGGER trg_ai_comment_usage_updated
BEFORE UPDATE ON public.ai_comment_usage
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
