
-- 1. Plan quotas
CREATE TABLE public.ai_plan_quotas (
  plan text PRIMARY KEY,
  monthly_request_limit int,
  monthly_cost_cap_usd numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_plan_quotas TO anon, authenticated;
GRANT ALL ON public.ai_plan_quotas TO service_role;
ALTER TABLE public.ai_plan_quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plan quotas readable by all" ON public.ai_plan_quotas FOR SELECT USING (true);

INSERT INTO public.ai_plan_quotas (plan, monthly_request_limit, monthly_cost_cap_usd) VALUES
  ('free', 50, 1.00),
  ('standard', 500, 10.00),
  ('pro', 5000, 75.00),
  ('enterprise', NULL, NULL)
ON CONFLICT (plan) DO NOTHING;

-- 2. Usage logs
CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid,
  feature text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  prompt_tokens int NOT NULL DEFAULT 0,
  completion_tokens int NOT NULL DEFAULT 0,
  total_tokens int GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  cost_usd numeric(10,6) NOT NULL DEFAULT 0,
  latency_ms int,
  cache_hit boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  request_meta jsonb,
  response_meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_usage_tenant_month ON public.ai_usage_logs (tenant_id, created_at DESC);
CREATE INDEX idx_ai_usage_feature ON public.ai_usage_logs (tenant_id, feature, created_at DESC);
GRANT SELECT ON public.ai_usage_logs TO authenticated;
GRANT ALL ON public.ai_usage_logs TO service_role;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read tenant AI usage" ON public.ai_usage_logs
  FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));

-- 3. Cache
CREATE TABLE public.ai_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feature text NOT NULL,
  cache_key text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  response_text text,
  response_json jsonb,
  prompt_tokens int NOT NULL DEFAULT 0,
  completion_tokens int NOT NULL DEFAULT 0,
  hit_count int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, feature, cache_key)
);
CREATE INDEX idx_ai_cache_lookup ON public.ai_cache (tenant_id, feature, cache_key, expires_at);
GRANT SELECT ON public.ai_cache TO authenticated;
GRANT ALL ON public.ai_cache TO service_role;
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read tenant AI cache" ON public.ai_cache
  FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));

-- 4. Prompt template library
CREATE TABLE public.ai_prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  feature text NOT NULL,
  description text,
  default_model text,
  active_version int NOT NULL DEFAULT 1,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_prompt_templates TO authenticated;
GRANT ALL ON public.ai_prompt_templates TO service_role;
ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read tenant or global templates" ON public.ai_prompt_templates
  FOR SELECT TO authenticated USING (tenant_id IS NULL OR public.is_tenant_member(tenant_id));
CREATE POLICY "Admins manage tenant templates" ON public.ai_prompt_templates
  FOR ALL TO authenticated
  USING (tenant_id IS NOT NULL AND public.has_perm(tenant_id, 'ai.admin'))
  WITH CHECK (tenant_id IS NOT NULL AND public.has_perm(tenant_id, 'ai.admin'));

CREATE TABLE public.ai_prompt_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.ai_prompt_templates(id) ON DELETE CASCADE,
  version int NOT NULL,
  system_prompt text,
  user_prompt text NOT NULL,
  model text,
  temperature numeric(3,2),
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_prompt_template_versions TO authenticated;
GRANT ALL ON public.ai_prompt_template_versions TO service_role;
ALTER TABLE public.ai_prompt_template_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read template versions" ON public.ai_prompt_template_versions
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.ai_prompt_templates t
    WHERE t.id = template_id AND (t.tenant_id IS NULL OR public.is_tenant_member(t.tenant_id))
  ));
CREATE POLICY "Admins manage template versions" ON public.ai_prompt_template_versions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ai_prompt_templates t
    WHERE t.id = template_id AND t.tenant_id IS NOT NULL AND public.has_perm(t.tenant_id, 'ai.admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ai_prompt_templates t
    WHERE t.id = template_id AND t.tenant_id IS NOT NULL AND public.has_perm(t.tenant_id, 'ai.admin')
  ));

-- 5. Permissions
INSERT INTO public.permissions (key, description) VALUES
  ('ai.use', 'Use AI-powered features'),
  ('ai.admin', 'Manage AI templates, quotas, and view usage')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name IN ('school_admin') AND p.key IN ('ai.use','ai.admin')
ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.name IN ('teacher','bursar','head_teacher','deputy_head','class_teacher') AND p.key = 'ai.use'
ON CONFLICT DO NOTHING;

-- 6. Helpers
CREATE OR REPLACE FUNCTION public.ai_current_month_usage(_tenant uuid)
RETURNS TABLE(request_count int, total_cost_usd numeric, total_tokens bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'success' AND NOT cache_hit)::int,
    COALESCE(SUM(cost_usd),0)::numeric,
    COALESCE(SUM(total_tokens),0)::bigint
  FROM public.ai_usage_logs
  WHERE tenant_id = _tenant
    AND created_at >= date_trunc('month', now());
$$;

CREATE OR REPLACE FUNCTION public.ai_check_quota(_tenant uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plan text; v_limit int; v_cap numeric;
  v_used int; v_cost numeric;
  v_hard_stop boolean := false;
  v_pct numeric := 0;
  v_state text := 'ok';
BEGIN
  SELECT subscription_plan INTO v_plan FROM public.tenants WHERE id = _tenant;
  v_plan := COALESCE(v_plan,'free');
  SELECT monthly_request_limit, monthly_cost_cap_usd INTO v_limit, v_cap
    FROM public.ai_plan_quotas WHERE plan = v_plan;
  SELECT request_count, total_cost_usd INTO v_used, v_cost
    FROM public.ai_current_month_usage(_tenant);

  SELECT (value->>'value')::boolean INTO v_hard_stop
    FROM public.tenant_settings WHERE tenant_id = _tenant AND key = 'ai.hard_stop' LIMIT 1;
  v_hard_stop := COALESCE(v_hard_stop, false);

  IF v_limit IS NOT NULL AND v_limit > 0 THEN
    v_pct := GREATEST(v_pct, ROUND(100.0 * v_used / v_limit, 1));
  END IF;
  IF v_cap IS NOT NULL AND v_cap > 0 THEN
    v_pct := GREATEST(v_pct, ROUND(100.0 * v_cost / v_cap, 1));
  END IF;

  IF v_hard_stop
     OR (v_limit IS NOT NULL AND v_used >= v_limit)
     OR (v_cap   IS NOT NULL AND v_cost >= v_cap) THEN
    v_state := 'hard_stop';
  ELSIF v_pct >= 80 THEN
    v_state := 'soft_alert';
  END IF;

  RETURN jsonb_build_object(
    'plan', v_plan, 'state', v_state, 'pct_used', v_pct,
    'request_count', v_used, 'cost_usd', v_cost,
    'request_limit', v_limit, 'cost_cap_usd', v_cap,
    'hard_stop_override', v_hard_stop
  );
END $$;

GRANT EXECUTE ON FUNCTION public.ai_current_month_usage(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ai_check_quota(uuid) TO authenticated, service_role;

-- 7. Seed system templates
INSERT INTO public.ai_prompt_templates (tenant_id, slug, name, feature, description, default_model, variables, is_system) VALUES
  (NULL, 'report_comment.v1', 'Report card comment', 'report_comment',
   'Generates a personalised end-of-term comment for a student in a specific subject.',
   'claude-sonnet-4-5',
   '["student_name","grade_level","subject","grade_or_level","whats_going_well","needs_work","tone","length","language","cbc_competencies"]'::jsonb, true),
  (NULL, 'doc_letter.v1', 'School document drafter', 'doc_gen',
   'Drafts school letters: transfer, recommendation, bonafide, indemnity, show-cause, fee-extension.',
   'claude-sonnet-4-5',
   '["school_name","student_name","admission_number","purpose","key_points","tone","date"]'::jsonb, true),
  (NULL, 'copilot.system.v1', 'Admin copilot system prompt', 'copilot',
   'System prompt for the natural-language admin assistant.',
   'claude-sonnet-4-5',
   '["school_name","user_role","tenant_id"]'::jsonb, true)
ON CONFLICT (tenant_id, slug) DO NOTHING;

INSERT INTO public.ai_prompt_template_versions (template_id, version, system_prompt, user_prompt, model, temperature, notes)
SELECT id, 1,
  'You are a thoughtful, experienced teacher writing personalised end-of-term comments. Be specific: reference what the student actually did. Avoid generic phrases like "good effort" or "well done". Match the requested tone and length precisely. Write in the requested language.',
  E'Student: {{student_name}} ({{grade_level}})\nSubject: {{subject}} — current grade/level: {{grade_or_level}}\nWhat is going well: {{whats_going_well}}\nWhat needs work: {{needs_work}}\nTone: {{tone}}\nLength: {{length}}\nLanguage: {{language}}\nCBC core competencies to consider (if relevant): {{cbc_competencies}}\n\nWrite the comment as a single paragraph about the student in the third person. Do not include a heading or signature.',
  'claude-sonnet-4-5', 0.7, 'Initial version'
FROM public.ai_prompt_templates WHERE slug = 'report_comment.v1' AND tenant_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.ai_prompt_template_versions (template_id, version, system_prompt, user_prompt, model, temperature, notes)
SELECT id, 1,
  'You draft formal school documents in clean, ready-to-print prose. Use the school name as the issuing authority. Be precise, neutral, and appropriate for an official letter.',
  E'School: {{school_name}}\nDate: {{date}}\nStudent: {{student_name}} (Adm. No. {{admission_number}})\nPurpose: {{purpose}}\nKey points to include: {{key_points}}\nTone: {{tone}}\n\nDraft the body of the letter only (no letterhead, no signature block — the system adds those).',
  'claude-sonnet-4-5', 0.5, 'Initial version'
FROM public.ai_prompt_templates WHERE slug = 'doc_letter.v1' AND tenant_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.ai_prompt_template_versions (template_id, version, system_prompt, user_prompt, model, temperature, notes)
SELECT id, 1,
  E'You are SomaSphere Copilot, an assistant for {{school_name}} school administrators (current user role: {{user_role}}).\nYou answer questions about the school by calling read-only data tools. Never invent data. If you do not have a tool to answer, say so plainly.\nAll data is scoped to tenant_id {{tenant_id}}; never query across tenants.\nWhen returning tabular results, summarise in one sentence then defer to the rendered table.\nWhen asked to draft a message, return the draft text directly so it can be loaded into the messaging composer.',
  '{{user_question}}',
  'claude-sonnet-4-5', 0.3, 'Initial version'
FROM public.ai_prompt_templates WHERE slug = 'copilot.system.v1' AND tenant_id IS NULL
ON CONFLICT DO NOTHING;
