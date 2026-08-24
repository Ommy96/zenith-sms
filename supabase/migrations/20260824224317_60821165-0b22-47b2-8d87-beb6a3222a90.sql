BEGIN;

ALTER TABLE public.student_guardians
  ADD CONSTRAINT student_guardians_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

COMMIT;