-- ==============================================================================
-- MAXFEM INTERNATIONAL SCHOOL — PHASE 4 ADMISSIONS MANAGEMENT SCHEMA
-- Normalized PostgreSQL schema, functions, triggers & RLS for admissions lifecycle
-- ==============================================================================

-- 1. Custom Enum Types for Admissions
DO $$ BEGIN
    CREATE TYPE application_status AS ENUM (
        'DRAFT',
        'SUBMITTED',
        'UNDER_REVIEW',
        'VERIFICATION_REQUIRED',
        'APPROVED',
        'REJECTED',
        'WAITLISTED',
        'WITHDRAWN'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE admission_doc_type AS ENUM (
        'BIRTH_CERTIFICATE',
        'PREVIOUS_REPORT_CARD',
        'PASSPORT_PHOTO',
        'MEDICAL_REPORT',
        'NATIONAL_ID_GUARDIAN',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Number Generation Sequences
CREATE SEQUENCE IF NOT EXISTS public.application_number_seq START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS public.admission_number_seq START WITH 1001;

-- 3. Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number TEXT NOT NULL UNIQUE DEFAULT ('APP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.application_number_seq')::text, 5, '0')),
    applicant_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    other_name TEXT,
    date_of_birth DATE NOT NULL,
    gender gender_type NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    guardian_name TEXT NOT NULL,
    guardian_relationship TEXT NOT NULL,
    guardian_phone TEXT NOT NULL,
    guardian_email TEXT,
    previous_school TEXT,
    previous_class TEXT,
    previous_grade_average TEXT,
    desired_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    desired_academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    status application_status NOT NULL DEFAULT 'DRAFT',
    submission_date TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    decision_reason TEXT,
    converted_student_id UUID UNIQUE REFERENCES public.students(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_app_number ON public.applications(application_number);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_profile ON public.applications(applicant_profile_id);
CREATE INDEX IF NOT EXISTS idx_applications_desired_class ON public.applications(desired_class_id);
CREATE INDEX IF NOT EXISTS idx_applications_desired_session ON public.applications(desired_academic_session_id);
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at);

-- 4. Application Reviews & Notes Table
CREATE TABLE IF NOT EXISTS public.application_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_app_reviews_app_id ON public.application_reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_app_reviews_reviewer ON public.application_reviews(reviewer_id);

-- 5. Application Documents Table
CREATE TABLE IF NOT EXISTS public.application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    document_type admission_doc_type NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_app_docs_app_id ON public.application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_app_docs_verified ON public.application_documents(is_verified);

-- 6. Helper Functions for Admissions
CREATE OR REPLACE FUNCTION public.generate_admission_number(session_year TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    curr_year TEXT;
    seq_val BIGINT;
BEGIN
    curr_year := COALESCE(session_year, to_char(now(), 'YYYY'));
    -- Extract first 4-digit year if session is formatted like '2024/2025'
    IF curr_year ~ '^[0-9]{4}/' THEN
        curr_year := split_part(curr_year, '/', 1);
    END IF;
    seq_val := nextval('public.admission_number_seq');
    RETURN 'MIS/' || curr_year || '/' || lpad(seq_val::text, 4, '0');
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;

-- 7. Transactional Student Conversion Stored Procedure
CREATE OR REPLACE FUNCTION public.convert_application_to_student(
    p_application_id UUID,
    p_term_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    app_rec RECORD;
    new_student_id UUID;
    new_admission_no TEXT;
    session_rec RECORD;
    target_term_id UUID;
    target_profile_id UUID;
    caller_role public.user_role;
    result_json JSONB;
BEGIN
    -- 1. Caller Authorization Check
    caller_role := public.get_user_role(auth.uid());
    IF caller_role NOT IN ('ADMIN', 'SUPER_ADMIN') THEN
        RAISE EXCEPTION 'Unauthorized: Only ADMIN and SUPER_ADMIN can convert applications to students';
    END IF;

    -- 2. Lock & Retrieve Application
    SELECT * INTO app_rec FROM public.applications 
    WHERE id = p_application_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found with ID: %', p_application_id;
    END IF;

    -- 3. Verify Status is APPROVED
    IF app_rec.status <> 'APPROVED' THEN
        RAISE EXCEPTION 'Cannot convert application. Status must be APPROVED (Current status: %)', app_rec.status;
    END IF;

    -- 4. Prevent Duplicate Conversion
    IF app_rec.converted_student_id IS NOT NULL THEN
        RAISE EXCEPTION 'Application has already been converted to student ID: %', app_rec.converted_student_id;
    END IF;

    -- 5. Fetch Academic Session for admission number generation
    SELECT * INTO session_rec FROM public.academic_sessions WHERE id = app_rec.desired_academic_session_id;

    -- Generate Unique Admission Number
    new_admission_no := public.generate_admission_number(COALESCE(session_rec.name, to_char(now(), 'YYYY')));

    -- 6. Reuse or establish profile
    IF app_rec.applicant_profile_id IS NOT NULL THEN
        target_profile_id := app_rec.applicant_profile_id;
    ELSE
        -- Check if profile exists by email
        SELECT id INTO target_profile_id FROM public.profiles WHERE email = app_rec.email;
        IF target_profile_id IS NULL THEN
            target_profile_id := gen_random_uuid();
            INSERT INTO public.profiles (
                id,
                email,
                full_name,
                phone,
                role,
                status
            ) VALUES (
                target_profile_id,
                app_rec.email,
                trim(app_rec.first_name || ' ' || app_rec.last_name),
                app_rec.phone,
                'STUDENT'::public.user_role,
                'ACTIVE'::public.account_status
            );
        END IF;
    END IF;

    -- 7. Insert Student Record
    INSERT INTO public.students (
        profile_id,
        admission_number,
        first_name,
        last_name,
        other_name,
        date_of_birth,
        gender,
        admission_status,
        status
    ) VALUES (
        target_profile_id,
        new_admission_no,
        app_rec.first_name,
        app_rec.last_name,
        app_rec.other_name,
        app_rec.date_of_birth,
        app_rec.gender,
        'ADMITTED'::public.admission_status,
        'ACTIVE'::public.account_status
    ) RETURNING id INTO new_student_id;

    -- 8. Identify Term for Enrollment
    IF p_term_id IS NOT NULL THEN
        target_term_id := p_term_id;
    ELSE
        -- Find First Term of the desired session, or current term
        SELECT id INTO target_term_id FROM public.terms 
        WHERE academic_session_id = app_rec.desired_academic_session_id 
        ORDER BY start_date ASC LIMIT 1;
    END IF;

    -- 9. Create Student Enrollment
    IF target_term_id IS NOT NULL THEN
        INSERT INTO public.student_enrollments (
            student_id,
            class_id,
            academic_session_id,
            term_id,
            enrollment_date,
            status
        ) VALUES (
            new_student_id,
            app_rec.desired_class_id,
            app_rec.desired_academic_session_id,
            target_term_id,
            CURRENT_DATE,
            'ACTIVE'::public.enrollment_status
        );
    END IF;

    -- 10. Update Application with Converted Student ID
    UPDATE public.applications 
    SET converted_student_id = new_student_id,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_application_id;

    -- 11. Record Audit Log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        'STUDENT_CONVERTED_FROM_APPLICATION',
        'application',
        p_application_id,
        jsonb_build_object('application_number', app_rec.application_number, 'status', app_rec.status),
        jsonb_build_object(
            'student_id', new_student_id,
            'admission_number', new_admission_no,
            'class_id', app_rec.desired_class_id,
            'session_id', app_rec.desired_academic_session_id
        )
    );

    result_json := jsonb_build_object(
        'success', true,
        'student_id', new_student_id,
        'admission_number', new_admission_no,
        'application_number', app_rec.application_number
    );

    RETURN result_json;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;

-- 8. Trigger to Prevent Tampering on Applications
CREATE OR REPLACE FUNCTION public.prevent_application_tampering()
RETURNS TRIGGER AS $$
DECLARE
    caller_role public.user_role;
    current_caller UUID;
BEGIN
    current_caller := auth.uid();
    
    IF current_caller IS NOT NULL THEN
        caller_role := public.get_user_role(current_caller);

        -- If non-admin user
        IF caller_role NOT IN ('ADMIN', 'SUPER_ADMIN') THEN
            -- Applicant can only transition from DRAFT to SUBMITTED or WITHDRAWN
            IF OLD.status NOT IN ('DRAFT') AND NEW.status NOT IN ('WITHDRAWN') THEN
                RAISE EXCEPTION 'Unauthorized: Applicants cannot alter application once submitted';
            END IF;

            -- Applicant cannot self-approve, reject, or waitlist
            IF NEW.status IN ('APPROVED', 'REJECTED', 'WAITLISTED', 'UNDER_REVIEW', 'VERIFICATION_REQUIRED') THEN
                RAISE EXCEPTION 'Unauthorized: You do not have permission to set decision status';
            END IF;

            -- Applicant cannot alter review fields or conversion links
            IF NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by OR 
               NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at OR
               NEW.decision_reason IS DISTINCT FROM OLD.decision_reason OR
               NEW.converted_student_id IS DISTINCT FROM OLD.converted_student_id THEN
                RAISE EXCEPTION 'Unauthorized: Protected administrative fields cannot be modified by applicant';
            END IF;
        END IF;
    END IF;

    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_application_tampering ON public.applications;
CREATE TRIGGER trg_prevent_application_tampering
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.prevent_application_tampering();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR PHASE 4
-- ==============================================================================

-- 1. Applications Table
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applications_select_admin" ON public.applications
FOR SELECT TO authenticated
USING (public.is_admin_or_super(auth.uid()));

CREATE POLICY "applications_select_applicant_own" ON public.applications
FOR SELECT TO authenticated
USING (applicant_profile_id = auth.uid());

CREATE POLICY "applications_insert_anyone" ON public.applications
FOR INSERT TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "applications_update_applicant_draft" ON public.applications
FOR UPDATE TO authenticated
USING (applicant_profile_id = auth.uid() AND status = 'DRAFT')
WITH CHECK (applicant_profile_id = auth.uid());

CREATE POLICY "applications_admin_all" ON public.applications
FOR ALL TO authenticated
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

-- 2. Application Reviews Table
ALTER TABLE public.application_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_reviews_admin_all" ON public.application_reviews
FOR ALL TO authenticated
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

CREATE POLICY "app_reviews_applicant_select" ON public.application_reviews
FOR SELECT TO authenticated
USING (
    is_internal = false AND EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.id = public.application_reviews.application_id
        AND a.applicant_profile_id = auth.uid()
    )
);

-- 3. Application Documents Table
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_docs_admin_all" ON public.application_documents
FOR ALL TO authenticated
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

CREATE POLICY "app_docs_applicant_select" ON public.application_documents
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.id = public.application_documents.application_id
        AND a.applicant_profile_id = auth.uid()
    )
);

CREATE POLICY "app_docs_applicant_insert" ON public.application_documents
FOR INSERT TO authenticated, anon
WITH CHECK (true);
