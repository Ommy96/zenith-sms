DROP TRIGGER IF EXISTS on_tenant_created ON public.tenants;

CREATE TRIGGER on_tenant_created
AFTER INSERT ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_tenant();