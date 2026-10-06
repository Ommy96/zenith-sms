CREATE OR REPLACE FUNCTION public.normalize_kenya_phone(input text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE digits text;
BEGIN
  IF input IS NULL OR trim(input) = '' THEN RETURN NULL; END IF;
  digits := regexp_replace(input, '[\s()\-]', '', 'g');
  IF digits ~ '^\+254[0-9]{9}$' THEN RETURN digits; END IF;
  IF digits ~ '^254[0-9]{9}$' THEN RETURN '+' || digits; END IF;
  IF digits ~ '^0[0-9]{9}$' THEN RETURN '+254' || substring(digits, 2); END IF;
  IF digits ~ '^\+[0-9]{10,15}$' THEN RETURN digits; END IF;
  RETURN input;
END; $$;

CREATE OR REPLACE FUNCTION public.trg_normalize_phones_guardians() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.phone_primary := normalize_kenya_phone(NEW.phone_primary);
  NEW.phone_secondary := normalize_kenya_phone(NEW.phone_secondary);
  NEW.whatsapp_number := normalize_kenya_phone(NEW.whatsapp_number);
  RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.trg_normalize_phones_staff() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.phone := normalize_kenya_phone(NEW.phone);
  NEW.alt_phone := normalize_kenya_phone(NEW.alt_phone);
  NEW.emergency_contact_phone := normalize_kenya_phone(NEW.emergency_contact_phone);
  RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.trg_normalize_phones_students() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.phone := normalize_kenya_phone(NEW.phone);
  NEW.guardian_phone := normalize_kenya_phone(NEW.guardian_phone);
  NEW.emergency_contact_phone := normalize_kenya_phone(NEW.emergency_contact_phone);
  NEW.doctor_phone := normalize_kenya_phone(NEW.doctor_phone);
  RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.trg_normalize_phones_admissions() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.guardian_phone := normalize_kenya_phone(NEW.guardian_phone);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS guardians_normalize_phones ON public.guardians;
CREATE TRIGGER guardians_normalize_phones BEFORE INSERT OR UPDATE OF phone_primary, phone_secondary, whatsapp_number
  ON public.guardians FOR EACH ROW EXECUTE FUNCTION public.trg_normalize_phones_guardians();
DROP TRIGGER IF EXISTS staff_normalize_phones ON public.staff;
CREATE TRIGGER staff_normalize_phones BEFORE INSERT OR UPDATE OF phone, alt_phone, emergency_contact_phone
  ON public.staff FOR EACH ROW EXECUTE FUNCTION public.trg_normalize_phones_staff();
DROP TRIGGER IF EXISTS students_normalize_phones ON public.students;
CREATE TRIGGER students_normalize_phones BEFORE INSERT OR UPDATE OF phone, guardian_phone, emergency_contact_phone, doctor_phone
  ON public.students FOR EACH ROW EXECUTE FUNCTION public.trg_normalize_phones_students();
DROP TRIGGER IF EXISTS admissions_normalize_phones ON public.admissions;
CREATE TRIGGER admissions_normalize_phones BEFORE INSERT OR UPDATE OF guardian_phone
  ON public.admissions FOR EACH ROW EXECUTE FUNCTION public.trg_normalize_phones_admissions();

REVOKE EXECUTE ON FUNCTION public.trg_normalize_phones_guardians(), public.trg_normalize_phones_staff(), public.trg_normalize_phones_students(), public.trg_normalize_phones_admissions() FROM PUBLIC, anon, authenticated;