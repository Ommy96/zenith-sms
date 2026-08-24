ALTER TABLE public.student_guardians
  ADD CONSTRAINT student_guardians_guardian_id_fkey
  FOREIGN KEY (guardian_id) REFERENCES public.guardians(id) ON DELETE CASCADE;

ALTER TABLE public.student_guardians
  ADD CONSTRAINT student_guardians_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;