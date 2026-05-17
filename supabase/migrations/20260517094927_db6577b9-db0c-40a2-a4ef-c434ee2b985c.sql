DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP FUNCTION IF EXISTS public.get_user_school_id(uuid) CASCADE;
ALTER TABLE public.schools RENAME TO tenants;