-- ==============================================================================
-- MAXFEM INTERNATIONAL SCHOOL — PHASE 2 ROW LEVEL SECURITY & POLICIES
-- Enforces least privilege, privilege escalation prevention, and audit tracking
-- ==============================================================================

-- 1. Helper Security Definer Functions (avoid recursive RLS evaluation)
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

-- 2. New User Creation Trigger
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

    -- Record in audit log
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

-- Attach trigger to auth.users if available
DO $$ BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION
    WHEN undefined_table THEN null;
    WHEN insufficient_privilege THEN null;
END $$;

-- 3. Privilege Escalation Prevention Trigger on Profiles
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

    -- Audit log on role or status change
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

CREATE OR REPLACE TRIGGER trg_prevent_profile_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_escalation();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON public.profiles
FOR SELECT TO authenticated
USING (public.is_admin_or_super(auth.uid()));

CREATE POLICY "profiles_select_teachers" ON public.profiles
FOR SELECT TO authenticated
USING (
    public.is_teacher(auth.uid()) AND (
        role = 'STUDENT' OR id = auth.uid()
    )
);

CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_all" ON public.profiles
FOR ALL TO authenticated
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

-- 2. Students Table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_select_own" ON public.students
FOR SELECT TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "students_select_admin" ON public.students
FOR SELECT TO authenticated
USING (public.is_admin_or_super(auth.uid()));

CREATE POLICY "students_select_teacher" ON public.students
FOR SELECT TO authenticated
USING (
    public.is_teacher(auth.uid()) AND EXISTS (
        SELECT 1 FROM public.student_enrollments se
        JOIN public.teacher_assignments ta ON ta.class_id = se.class_id
        JOIN public.teachers t ON t.id = ta.teacher_id
        WHERE se.student_id = public.students.id
        AND t.profile_id = auth.uid()
    )
);

CREATE POLICY "students_admin_mutate" ON public.students
FOR ALL TO authenticated
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

-- 3. Teachers Table
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers_select_own" ON public.teachers
FOR SELECT TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "teachers_select_all_authenticated" ON public.teachers
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "teachers_admin_mutate" ON public.teachers
FOR ALL TO authenticated
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

-- 4. Academic Sessions Table
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academic_sessions_select_all" ON public.academic_sessions
FOR SELECT TO authenticated, anon
USING (true);

CREATE POLICY "academic_sessions_admin_mutate" ON public.academic_sessions
FOR ALL TO authenticated
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

-- 5. Terms Table
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "terms_select_all" ON public.terms
FOR SELECT TO authenticated, anon
USING (true);

CREATE POLICY "terms_admin_mutate" ON public.terms
FOR ALL TO authenticated
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

-- 6. Classes Table
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classes_select_all" ON public.classes
FOR SELECT TO authenticated, anon
USING (true);

CREATE POLICY "classes_admin_mutate" ON public.classes
FOR ALL TO authenticated
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

-- 7. Subjects Table
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subjects_select_all" ON public.subjects
FOR SELECT TO authenticated, anon
USING (true);

CREATE POLICY "subjects_admin_mutate" ON public.subjects
FOR ALL TO authenticated
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

-- 8. Student Enrollments Table
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_select_own" ON public.student_enrollments
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = public.student_enrollments.student_id
        AND s.profile_id = auth.uid()
    )
);

CREATE POLICY "enrollments_select_teacher" ON public.student_enrollments
FOR SELECT TO authenticated
USING (
    public.is_teacher(auth.uid()) AND EXISTS (
        SELECT 1 FROM public.teacher_assignments ta
        JOIN public.teachers t ON t.id = ta.teacher_id
        WHERE ta.class_id = public.student_enrollments.class_id
        AND t.profile_id = auth.uid()
    )
);

CREATE POLICY "enrollments_admin_all" ON public.student_enrollments
FOR ALL TO authenticated
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

-- 9. Teacher Assignments Table
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignments_select_teacher_own" ON public.teacher_assignments
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.teachers t
        WHERE t.id = public.teacher_assignments.teacher_id
        AND t.profile_id = auth.uid()
    )
);

CREATE POLICY "assignments_select_student_class" ON public.teacher_assignments
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.student_enrollments se
        JOIN public.students s ON s.id = se.student_id
        WHERE se.class_id = public.teacher_assignments.class_id
        AND s.profile_id = auth.uid()
    )
);

CREATE POLICY "assignments_admin_all" ON public.teacher_assignments
FOR ALL TO authenticated
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

-- 10. Audit Logs Table (Immutable)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
FOR SELECT TO authenticated
USING (public.is_admin_or_super(auth.uid()));

CREATE POLICY "audit_logs_insert_authenticated" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- No UPDATE or DELETE policy on audit_logs (Strict Immutability)
