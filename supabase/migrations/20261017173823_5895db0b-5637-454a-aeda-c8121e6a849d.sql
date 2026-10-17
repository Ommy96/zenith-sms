DROP INDEX public.uq_message_templates_tenant_key_lang;
DROP INDEX public.uq_message_templates_system_key_lang;
CREATE UNIQUE INDEX uq_message_templates_tenant_key_lang ON public.message_templates(tenant_id,key,language,channel) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX uq_message_templates_system_key_lang ON public.message_templates(key,language,channel) WHERE tenant_id IS NULL;