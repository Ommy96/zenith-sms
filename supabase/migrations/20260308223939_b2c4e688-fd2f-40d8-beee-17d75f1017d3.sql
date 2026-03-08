
-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'school_admin', 'teacher', 'parent', 'student');

-- 2. Schools (tenants)
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  motto TEXT,
  country TEXT,
  language_of_instruction TEXT,
  regulatory_body TEXT,
  academic_year_start TEXT,
  academic_year_end TEXT,
  grading_system JSONB DEFAULT '{}',
  academic_calendar JSONB DEFAULT '{}',
  payment_config JSONB DEFAULT '{}',
  subjects JSONB DEFAULT '{}',
  school_levels JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. User roles table (separate from profiles per security guidelines)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 4. Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Students
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  admission_number TEXT,
  admission_date DATE DEFAULT CURRENT_DATE,
  grade TEXT,
  status TEXT DEFAULT 'active',
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_email TEXT,
  guardian_relationship TEXT,
  address TEXT,
  health_info JSONB DEFAULT '{}',
  documents JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Staff
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT,
  role TEXT DEFAULT 'teacher',
  hire_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Classes
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  grade_level TEXT,
  teacher_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  capacity INT DEFAULT 40,
  academic_year TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Fees / Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT,
  amount NUMERIC(12,2) NOT NULL,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  term TEXT,
  academic_year TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present',
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Exams
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'mid-term',
  term TEXT,
  academic_year TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Exam results
CREATE TABLE public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  score NUMERIC(5,2),
  grade TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  audience TEXT DEFAULT 'all',
  priority TEXT DEFAULT 'medium',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Activity log
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ SECURITY ============

-- Security definer function for role checks (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user's school_id safely
CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE id = _user_id
$$;

-- ============ RLS ============

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- User roles: viewable by owner, manageable by super_admin
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Super admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- Schools: visible to members, manageable by school_admin+
CREATE POLICY "Members can view their school" ON public.schools FOR SELECT TO authenticated
  USING (id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "School admins can update school" ON public.schools FOR UPDATE TO authenticated
  USING (id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(), 'school_admin'));
CREATE POLICY "Authenticated can create schools" ON public.schools FOR INSERT TO authenticated WITH CHECK (true);

-- Tenant-scoped tables: school members can read, school_admin/teacher can write
CREATE POLICY "School members can view students" ON public.students FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "School admins can manage students" ON public.students FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'teacher')));

CREATE POLICY "School members can view staff" ON public.staff FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "School admins can manage staff" ON public.staff FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(), 'school_admin'));

CREATE POLICY "School members can view classes" ON public.classes FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "School admins can manage classes" ON public.classes FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(), 'school_admin'));

CREATE POLICY "School members can view invoices" ON public.invoices FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "School admins can manage invoices" ON public.invoices FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(), 'school_admin'));

CREATE POLICY "School members can view attendance" ON public.attendance FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Teachers can manage attendance" ON public.attendance FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'school_admin')));

CREATE POLICY "School members can view exams" ON public.exams FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "School admins can manage exams" ON public.exams FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(), 'school_admin'));

CREATE POLICY "School members can view exam results" ON public.exam_results FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Teachers can manage exam results" ON public.exam_results FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'school_admin')));

CREATE POLICY "School members can view announcements" ON public.announcements FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "School admins can manage announcements" ON public.announcements FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) AND (public.has_role(auth.uid(), 'school_admin') OR public.has_role(auth.uid(), 'teacher')));

CREATE POLICY "School members can view activity logs" ON public.activity_logs FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Authenticated can insert activity logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============ TRIGGER: Auto-create profile on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  -- Default role: school_admin for first signup
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'school_admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
