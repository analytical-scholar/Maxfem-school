-- ==============================================================================
-- MAXFEM INTERNATIONAL SCHOOL — PHASE 2 COMPLETE DATABASE DEPLOYMENT SCRIPT
-- Apply this complete script directly in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/odvwyzwxlvbylpznbjkv/sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM ENUM TYPES
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.account_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.gender_type AS ENUM ('MALE', 'FEMALE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.admission_status AS ENUM ('APPLIED', 'ADMITTED', 'REJECTED', 'PROMOTED', 'GRADUATED', 'WITHDRAWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.employment_status AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'ON_LEAVE', 'TERMINATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.term_name AS ENUM ('First Term', 'Second Term', 'Third Term');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.enrollment_status AS ENUM ('ACTIVE', 'COMPLETED', 'WITHDRAWN', 'REPEATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role public.user_role NOT NULL DEFAULT 'STUDENT',
    status public.account_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    admission_number TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    other_name TEXT,
    date_of_birth DATE,
    gender public.gender_type,
    admission_status public.admission_status NOT NULL DEFAULT 'ADMITTED',
    status public.account_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_students_profile_id ON public.students(profile_id);
CREATE INDEX IF NOT EXISTS idx_students_admission_no ON public.students(admission_number);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);

-- 5. TEACHERS TABLE
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    staff_id TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    employment_status public.employment_status NOT NULL DEFAULT 'FULL_TIME',
    status public.account_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_teachers_profile_id ON public.teachers(profile_id);
CREATE INDEX IF NOT EXISTS idx_teachers_staff_id ON public.teachers(staff_id);
CREATE INDEX IF NOT EXISTS idx_teachers_department ON public.teachers(department);

-- 6. ACADEMIC SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.academic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_academic_session_dates CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_academic_sessions_current ON public.academic_sessions(is_current);

-- 7. TERMS TABLE
CREATE TABLE IF NOT EXISTS public.terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
    name public.term_name NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_session_term UNIQUE (academic_session_id, name),
    CONSTRAINT chk_term_dates CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_terms_session ON public.terms(academic_session_id);
CREATE INDEX IF NOT EXISTS idx_terms_current ON public.terms(is_current);

-- 8. CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    arm TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_classes_grade ON public.classes(grade_level);

-- 9. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_subjects_code ON public.subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_dept ON public.subjects(department);

-- 10. STUDENT ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS public.student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status public.enrollment_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_session_term UNIQUE (student_id, academic_session_id, term_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON public.student_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_session_term ON public.student_enrollments(academic_session_id, term_id);

-- 11. TEACHER ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    is_class_teacher BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_teacher_assignment UNIQUE (teacher_id, subject_id, class_id, academic_session_id, term_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON public.teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_subj ON public.teacher_assignments(class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_session_term ON public.teacher_assignments(academic_session_id, term_id);

-- 12. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 13. AUTO-UPDATE UPDATED_AT TIMESTAMP FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_students_updated_at ON public.students;
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_teachers_updated_at ON public.teachers;
CREATE TRIGGER trg_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_academic_sessions_updated_at ON public.academic_sessions;
CREATE TRIGGER trg_academic_sessions_updated_at BEFORE UPDATE ON public.academic_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_terms_updated_at ON public.terms;
CREATE TRIGGER trg_terms_updated_at BEFORE UPDATE ON public.terms FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_classes_updated_at ON public.classes;
CREATE TRIGGER trg_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_subjects_updated_at ON public.subjects;
CREATE TRIGGER trg_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_student_enrollments_updated_at ON public.student_enrollments;
CREATE TRIGGER trg_student_enrollments_updated_at BEFORE UPDATE ON public.student_enrollments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_teacher_assignments_updated_at ON public.teacher_assignments;
CREATE TRIGGER trg_teacher_assignments_updated_at BEFORE UPDATE ON public.teacher_assignments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 14. SECURITY DEFINER HELPER FUNCTIONS FOR RLS
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS public.user_role AS $$
    SELECT role FROM public.profiles WHERE id = user_uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_status(user_uuid UUID)
RETURNS public.account_status AS $$
    SELECT status FROM public.profiles WHERE id = user_uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin_or_super(user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT role IN ('ADMIN', 'SUPER_ADMIN') FROM public.profiles WHERE id = user_uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT role = 'SUPER_ADMIN' FROM public.profiles WHERE id = user_uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_teacher(user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT role = 'TEACHER' FROM public.profiles WHERE id = user_uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_student(user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT role = 'STUDENT' FROM public.profiles WHERE id = user_uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 15. AUTH TRIGGER TO CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role public.user_role := 'STUDENT'::public.user_role;
BEGIN
    -- Security hardening: All new user registrations default strictly to STUDENT.
    -- Client-supplied roles (e.g. from user_metadata or request payloads) are completely
    -- ignored to prevent registration-time privilege escalation to ADMIN or SUPER_ADMIN.

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone,
        avatar_url,
        role,
        status
    ) VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, ''), '@', 1)),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'avatar_url',
        assigned_role,
        'ACTIVE'::public.account_status
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = timezone('utc'::text, now());

    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_values
    ) VALUES (
        NEW.id,
        'USER_CREATED',
        'profile',
        NEW.id,
        jsonb_build_object('email', NEW.email, 'role', assigned_role, 'status', 'ACTIVE')
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$ BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION
    WHEN undefined_table THEN null;
    WHEN insufficient_privilege THEN null;
END $$;

-- 16. PRIVILEGE ESCALATION PREVENTION TRIGGER
CREATE OR REPLACE FUNCTION public.prevent_profile_escalation()
RETURNS TRIGGER AS $$
DECLARE
    executor_role public.user_role;
    current_caller_id UUID;
BEGIN
    current_caller_id := auth.uid();

    -- If there is an authenticated caller executing this update
    IF current_caller_id IS NOT NULL THEN
        executor_role := public.get_user_role(current_caller_id);

        -- If role is changing
        IF NEW.role <> OLD.role THEN
            -- 1. Non-admins (STUDENT, TEACHER, etc.) cannot modify any role
            IF executor_role NOT IN ('ADMIN', 'SUPER_ADMIN') THEN
                RAISE EXCEPTION 'Unauthorized: You do not have permission to modify roles';
            END IF;

            -- 2. No user may change their own role (even ADMINs cannot self-promote/alter own role)
            IF current_caller_id = OLD.id AND executor_role <> 'SUPER_ADMIN' THEN
                RAISE EXCEPTION 'Unauthorized: You cannot modify your own assigned role';
            END IF;

            -- 3. Only an authenticated SUPER_ADMIN can assign the SUPER_ADMIN role to anyone
            IF NEW.role = 'SUPER_ADMIN' AND executor_role <> 'SUPER_ADMIN' THEN
                RAISE EXCEPTION 'Unauthorized: Only SUPER_ADMIN can grant the SUPER_ADMIN role';
            END IF;

            -- 4. Only SUPER_ADMIN can modify/demote an existing SUPER_ADMIN account
            IF OLD.role = 'SUPER_ADMIN' AND executor_role <> 'SUPER_ADMIN' THEN
                RAISE EXCEPTION 'Unauthorized: Only SUPER_ADMIN can modify a SUPER_ADMIN account';
            END IF;
        END IF;

        -- If account status is changing
        IF NEW.status <> OLD.status THEN
            -- Non-admins cannot change any account status
            IF executor_role NOT IN ('ADMIN', 'SUPER_ADMIN') THEN
                RAISE EXCEPTION 'Unauthorized: You do not have permission to modify account status';
            END IF;

            -- Users cannot alter their own account status unless SUPER_ADMIN
            IF current_caller_id = OLD.id AND executor_role <> 'SUPER_ADMIN' THEN
                RAISE EXCEPTION 'Unauthorized: You cannot modify your own account status';
            END IF;
        END IF;
    END IF;

    IF NEW.role <> OLD.role OR NEW.status <> OLD.status THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            old_values,
            new_values
        ) VALUES (
            current_caller_id,
            CASE 
                WHEN NEW.role <> OLD.role THEN 'ROLE_CHANGED'
                ELSE 'ACCOUNT_STATUS_CHANGED'
            END,
            'profile',
            NEW.id,
            jsonb_build_object('role', OLD.role, 'status', OLD.status),
            jsonb_build_object('role', NEW.role, 'status', NEW.status)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_profile_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_escalation BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_escalation();

-- 17. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin_or_super(auth.uid()));
DROP POLICY IF EXISTS "profiles_select_teachers" ON public.profiles;
CREATE POLICY "profiles_select_teachers" ON public.profiles FOR SELECT TO authenticated USING (public.is_teacher(auth.uid()) AND (role = 'STUDENT' OR id = auth.uid()));
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students_select_own" ON public.students;
CREATE POLICY "students_select_own" ON public.students FOR SELECT TO authenticated USING (profile_id = auth.uid());
DROP POLICY IF EXISTS "students_select_admin" ON public.students;
CREATE POLICY "students_select_admin" ON public.students FOR SELECT TO authenticated USING (public.is_admin_or_super(auth.uid()));
DROP POLICY IF EXISTS "students_select_teacher" ON public.students;
CREATE POLICY "students_select_teacher" ON public.students FOR SELECT TO authenticated USING (
    public.is_teacher(auth.uid()) AND EXISTS (
        SELECT 1 FROM public.student_enrollments se
        JOIN public.teacher_assignments ta ON ta.class_id = se.class_id
        JOIN public.teachers t ON t.id = ta.teacher_id
        WHERE se.student_id = public.students.id AND t.profile_id = auth.uid()
    )
);
DROP POLICY IF EXISTS "students_admin_mutate" ON public.students;
CREATE POLICY "students_admin_mutate" ON public.students FOR ALL TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teachers_select_own" ON public.teachers;
CREATE POLICY "teachers_select_own" ON public.teachers FOR SELECT TO authenticated USING (profile_id = auth.uid());
DROP POLICY IF EXISTS "teachers_select_all_authenticated" ON public.teachers;
CREATE POLICY "teachers_select_all_authenticated" ON public.teachers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "teachers_admin_mutate" ON public.teachers;
CREATE POLICY "teachers_admin_mutate" ON public.teachers FOR ALL TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "academic_sessions_select_all" ON public.academic_sessions;
CREATE POLICY "academic_sessions_select_all" ON public.academic_sessions FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "academic_sessions_admin_mutate" ON public.academic_sessions;
CREATE POLICY "academic_sessions_admin_mutate" ON public.academic_sessions FOR ALL TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "terms_select_all" ON public.terms;
CREATE POLICY "terms_select_all" ON public.terms FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "terms_admin_mutate" ON public.terms;
CREATE POLICY "terms_admin_mutate" ON public.terms FOR ALL TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "classes_select_all" ON public.classes;
CREATE POLICY "classes_select_all" ON public.classes FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "classes_admin_mutate" ON public.classes;
CREATE POLICY "classes_admin_mutate" ON public.classes FOR ALL TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subjects_select_all" ON public.subjects;
CREATE POLICY "subjects_select_all" ON public.subjects FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "subjects_admin_mutate" ON public.subjects;
CREATE POLICY "subjects_admin_mutate" ON public.subjects FOR ALL TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enrollments_select_own" ON public.student_enrollments;
CREATE POLICY "enrollments_select_own" ON public.student_enrollments FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = public.student_enrollments.student_id AND s.profile_id = auth.uid())
);
DROP POLICY IF EXISTS "enrollments_select_teacher" ON public.student_enrollments;
CREATE POLICY "enrollments_select_teacher" ON public.student_enrollments FOR SELECT TO authenticated USING (
    public.is_teacher(auth.uid()) AND EXISTS (
        SELECT 1 FROM public.teacher_assignments ta
        JOIN public.teachers t ON t.id = ta.teacher_id
        WHERE ta.class_id = public.student_enrollments.class_id AND t.profile_id = auth.uid()
    )
);
DROP POLICY IF EXISTS "enrollments_admin_all" ON public.student_enrollments;
CREATE POLICY "enrollments_admin_all" ON public.student_enrollments FOR ALL TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assignments_select_teacher_own" ON public.teacher_assignments;
CREATE POLICY "assignments_select_teacher_own" ON public.teacher_assignments FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = public.teacher_assignments.teacher_id AND t.profile_id = auth.uid())
);
DROP POLICY IF EXISTS "assignments_select_student_class" ON public.teacher_assignments;
CREATE POLICY "assignments_select_student_class" ON public.teacher_assignments FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.student_enrollments se
        JOIN public.students s ON s.id = se.student_id
        WHERE se.class_id = public.teacher_assignments.class_id AND s.profile_id = auth.uid()
    )
);
DROP POLICY IF EXISTS "assignments_admin_all" ON public.teacher_assignments;
CREATE POLICY "assignments_admin_all" ON public.teacher_assignments FOR ALL TO authenticated USING (public.is_admin_or_super(auth.uid())) WITH CHECK (public.is_admin_or_super(auth.uid()));

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin_or_super(auth.uid()));
DROP POLICY IF EXISTS "audit_logs_insert_authenticated" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_authenticated" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 18. STORAGE BUCKETS CONFIGURATION
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('school-gallery', 'school-gallery', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('student-documents', 'student-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('admission-documents', 'admission-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('learning-materials', 'learning-materials', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png']),
    ('examination-resources', 'examination-resources', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/json'])
ON CONFLICT (id) DO NOTHING;

-- 19. SEED DATA
INSERT INTO public.academic_sessions (id, name, start_date, end_date, is_current)
VALUES ('a0000000-0000-0000-0000-000000000001', '2024/2025', '2024-09-09', '2025-07-18', true)
ON CONFLICT (name) DO UPDATE SET is_current = EXCLUDED.is_current;

INSERT INTO public.terms (id, academic_session_id, name, start_date, end_date, is_current)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'First Term', '2024-09-09', '2024-12-13', false),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Second Term', '2025-01-06', '2025-04-04', true),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Third Term', '2025-04-28', '2025-07-18', false)
ON CONFLICT (academic_session_id, name) DO NOTHING;

INSERT INTO public.classes (id, name, grade_level, arm)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'JSS 1 Gold', 7, 'Gold'),
    ('c0000000-0000-0000-0000-000000000002', 'JSS 1 Silver', 7, 'Silver'),
    ('c0000000-0000-0000-0000-000000000003', 'JSS 2 Gold', 8, 'Gold'),
    ('c0000000-0000-0000-0000-000000000004', 'JSS 3 Gold', 9, 'Gold'),
    ('c0000000-0000-0000-0000-000000000005', 'SSS 1 Science', 10, 'Science'),
    ('c0000000-0000-0000-0000-000000000006', 'SSS 1 Arts & Commercial', 10, 'Arts'),
    ('c0000000-0000-0000-0000-000000000007', 'SSS 2 Science', 11, 'Science'),
    ('c0000000-0000-0000-0000-000000000008', 'SSS 3 Science', 12, 'Science')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.subjects (id, code, name, department, description)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'MTH-JSS', 'Mathematics (Junior)', 'Mathematics', 'Foundational mathematics covering algebra, geometry and arithmetic.'),
    ('d0000000-0000-0000-0000-000000000002', 'ENG-JSS', 'English Language (Junior)', 'Languages', 'Grammar, vocabulary, essay writing and comprehension.'),
    ('d0000000-0000-0000-0000-000000000003', 'BST-JSS', 'Basic Science & Technology', 'Sciences', 'Integrated physics, chemistry, biology and ICT foundations.'),
    ('d0000000-0000-0000-0000-000000000004', 'MTH-SSS', 'General Mathematics', 'Mathematics', 'Advanced algebraic principles, trigonometry, statistics and calculus.'),
    ('d0000000-0000-0000-0000-000000000005', 'ENG-SSS', 'English Language (Senior)', 'Languages', 'Advanced oral and written communication, literature appreciation.'),
    ('d0000000-0000-0000-0000-000000000006', 'PHY-SSS', 'Physics', 'Sciences', 'Mechanics, optics, electromagnetism and atomic physics.'),
    ('d0000000-0000-0000-0000-000000000007', 'CHM-SSS', 'Chemistry', 'Sciences', 'Physical, inorganic, and organic chemistry principles.'),
    ('d0000000-0000-0000-0000-000000000008', 'BIO-SSS', 'Biology', 'Sciences', 'Living organisms, ecology, genetics and physiology.'),
    ('d0000000-0000-0000-0000-000000000009', 'ICT-SSS', 'Computer Studies & ICT', 'Technology', 'Algorithms, computer hardware, coding and digital literacy.')
ON CONFLICT (code) DO NOTHING;
