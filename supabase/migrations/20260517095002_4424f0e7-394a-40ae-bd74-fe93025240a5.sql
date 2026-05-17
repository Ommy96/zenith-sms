CREATE TYPE public.school_type AS ENUM ('primary','junior_secondary','senior_secondary','combined','tertiary','tvet','international');
CREATE TYPE public.curriculum_type AS ENUM ('cbc','8-4-4','igcse','ib','cambridge','mixed');
CREATE TYPE public.subscription_plan AS ENUM ('free','starter','standard','pro','enterprise');
CREATE TYPE public.subscription_status AS ENUM ('trial','active','past_due','cancelled');

ALTER TABLE public.tenants ADD COLUMN slug text;
ALTER TABLE public.tenants ADD COLUMN country_code text NOT NULL DEFAULT 'KE';
ALTER TABLE public.tenants ADD COLUMN currency_code text NOT NULL DEFAULT 'KES';
ALTER TABLE public.tenants ADD COLUMN timezone text NOT NULL DEFAULT 'Africa/Nairobi';
ALTER TABLE public.tenants ADD COLUMN locale text NOT NULL DEFAULT 'en-KE';
ALTER TABLE public.tenants ADD COLUMN school_type public.school_type;
ALTER TABLE public.tenants ADD COLUMN curriculum public.curriculum_type;
ALTER TABLE public.tenants ADD COLUMN registration_number text;
ALTER TABLE public.tenants ADD COLUMN nemis_code text;
ALTER TABLE public.tenants ADD COLUMN subscription_plan public.subscription_plan NOT NULL DEFAULT 'free';
ALTER TABLE public.tenants ADD COLUMN subscription_status public.subscription_status NOT NULL DEFAULT 'trial';
ALTER TABLE public.tenants ADD COLUMN trial_ends_at timestamptz;
CREATE UNIQUE INDEX tenants_slug_unique ON public.tenants(slug);