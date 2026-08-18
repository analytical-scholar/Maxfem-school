-- ==============================================================================
-- MAXFEM INTERNATIONAL SCHOOL — PHASE 6 RESULTS & ACADEMIC ANALYTICS SCHEMA
-- Normalized PostgreSQL schema, grading rules, workflows, RLS & audit corrections
-- ==============================================================================

-- 1. Custom Enum Types for Results
DO $$ BEGIN
    CREATE TYPE result_status AS ENUM (
        'DRAFT',
        'SUBMITTED',
        'REVIEWED',
        'APPROVED',
        'PUBLISHED',
        'LOCKED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Grading Scales Table (Configurable standard grading systems)
CREATE TABLE IF NOT EXISTS public.grading_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade TEXT NOT NULL,
    min_score NUMERIC(5,2) NOT NULL CHECK (min_score >= 0 AND min_score <= 100),
    max_score NUMERIC(5,2) NOT NULL CHECK (max_score >= 0 AND max_score <= 100),
    gpa_point NUMERIC(3,2) NOT NULL DEFAULT 0.0 CHECK (gpa_point >= 0.0 AND gpa_point <= 5.0),
    remark TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_grade_score_range CHECK (max_score >= min_score)
);

CREATE INDEX IF NOT EXISTS idx_grading_scales_range ON public.grading_scales(min_score, max_score);

-- Seed Default Maxfem Grading System if not exists
INSERT INTO public.grading_scales (grade, min_score, max_score, gpa_point, remark, order_index)
VALUES
    ('A+', 90.00, 100.00, 4.00, 'Distinction / Outstanding', 1),
    ('A',  80.00, 89.99,  4.00, 'Excellent', 2),
    ('B',  70.00, 79.99,  3.00, 'Very Good', 3),
    ('C',  60.00, 69.99,  2.00, 'Credit / Good', 4),
    ('D',  50.00, 59.99,  1.00, 'Pass / Satisfactory', 5),
    ('E',  40.00, 49.99,  0.50, 'Fair / Weak Pass', 6),
    ('F',  0.00,  39.99,  0.00, 'Fail', 7)
ON CONFLICT DO NOTHING;

-- 3. Student Subject Results Table (Normalized Subject Marks per Term)
CREATE TABLE IF NOT EXISTS public.student_subject_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    ca_score NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (ca_score >= 0 AND ca_score <= 40),
    exam_score NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (exam_score >= 0 AND exam_score <= 70),
    cbt_exam_id UUID REFERENCES public.examinations(id) ON DELETE SET NULL,
    cbt_attempt_id UUID REFERENCES public.examination_attempts(id) ON DELETE SET NULL,
    total_score NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (total_score >= 0 AND total_score <= 100),
    max_score NUMERIC(5,2) NOT NULL DEFAULT 100.00 CHECK (max_score > 0),
    percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (percentage >= 0 AND percentage <= 100),
    grade TEXT NOT NULL DEFAULT 'F',
    gpa_point NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    teacher_remark TEXT,
    status result_status NOT NULL DEFAULT 'DRAFT',
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    locked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_subject_term UNIQUE (student_id, subject_id, class_id, academic_session_id, term_id)
);

CREATE INDEX IF NOT EXISTS idx_subj_results_student ON public.student_subject_results(student_id);
CREATE INDEX IF NOT EXISTS idx_subj_results_class ON public.student_subject_results(class_id);
CREATE INDEX IF NOT EXISTS idx_subj_results_subject ON public.student_subject_results(subject_id);
CREATE INDEX IF NOT EXISTS idx_subj_results_session ON public.student_subject_results(academic_session_id);
CREATE INDEX IF NOT EXISTS idx_subj_results_term ON public.student_subject_results(term_id);
CREATE INDEX IF NOT EXISTS idx_subj_results_status ON public.student_subject_results(status);

-- 4. Student Term Results Table (Term Aggregate & Terminal Rankings)
CREATE TABLE IF NOT EXISTS public.student_term_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    total_subjects INTEGER NOT NULL DEFAULT 0 CHECK (total_subjects >= 0),
    total_score_obtained NUMERIC(7,2) NOT NULL DEFAULT 0.00 CHECK (total_score_obtained >= 0),
    total_possible_score NUMERIC(7,2) NOT NULL DEFAULT 0.00 CHECK (total_possible_score >= 0),
    average_score NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (average_score >= 0 AND average_score <= 100),
    gpa NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (gpa >= 0.0 AND gpa <= 5.0),
    class_rank INTEGER CHECK (class_rank IS NULL OR class_rank > 0),
    class_size INTEGER NOT NULL DEFAULT 0 CHECK (class_size >= 0),
    class_highest_average NUMERIC(5,2),
    class_lowest_average NUMERIC(5,2),
    teacher_remark TEXT,
    principal_remark TEXT,
    status result_status NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_term_result UNIQUE (student_id, class_id, academic_session_id, term_id)
);

CREATE INDEX IF NOT EXISTS idx_term_results_student ON public.student_term_results(student_id);
CREATE INDEX IF NOT EXISTS idx_term_results_class ON public.student_term_results(class_id);
CREATE INDEX IF NOT EXISTS idx_term_results_term ON public.student_term_results(term_id);
CREATE INDEX IF NOT EXISTS idx_term_results_status ON public.student_term_results(status);

-- 5. Student Session Results Table (Cumulative Annual Promotion Record)
CREATE TABLE IF NOT EXISTS public.student_session_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    cumulative_average NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (cumulative_average >= 0 AND cumulative_average <= 100),
    cumulative_gpa NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (cumulative_gpa >= 0.0 AND cumulative_gpa <= 5.0),
    session_rank INTEGER CHECK (session_rank IS NULL OR session_rank > 0),
    promoted BOOLEAN NOT NULL DEFAULT true,
    promotion_remark TEXT,
    status result_status NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_session_result UNIQUE (student_id, class_id, academic_session_id)
);

CREATE INDEX IF NOT EXISTS idx_session_results_student ON public.student_session_results(student_id);
CREATE INDEX IF NOT EXISTS idx_session_results_session ON public.student_session_results(academic_session_id);

-- 6. Result Corrections Table (Controlled Modification Audit Log)
CREATE TABLE IF NOT EXISTS public.result_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_result_id UUID REFERENCES public.student_subject_results(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    old_value TEXT NOT NULL,
    new_value TEXT NOT NULL,
    reason TEXT NOT NULL,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    actor_role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_corrections_subject_result ON public.result_corrections(subject_result_id);
CREATE INDEX IF NOT EXISTS idx_corrections_student ON public.result_corrections(student_id);
CREATE INDEX IF NOT EXISTS idx_corrections_actor ON public.result_corrections(actor_id);

-- 7. Enable Row Level Security
ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subject_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_term_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_session_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.result_corrections ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies

-- Grading Scales: Readable by authenticated users; Writable by Admin/Super Admin
CREATE POLICY "Grading scales readable by all authenticated users"
    ON public.grading_scales FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Grading scales manageable by admins"
    ON public.grading_scales FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- Student Subject Results:
-- Students: Only see their own PUBLISHED results
CREATE POLICY "Students can only read their own PUBLISHED subject results"
    ON public.student_subject_results FOR SELECT
    TO authenticated
    USING (
        status = 'PUBLISHED'
        AND student_id IN (
            SELECT id FROM public.students WHERE profile_id = auth.uid()
        )
    );

-- Teachers: Can read results for classes and subjects they teach
CREATE POLICY "Teachers can view subject results for assigned subjects and classes"
    ON public.student_subject_results FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.teachers t
            JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
            WHERE t.profile_id = auth.uid()
              AND ta.class_id = student_subject_results.class_id
              AND (ta.subject_id = student_subject_results.subject_id OR ta.is_class_teacher = true)
        )
    );

-- Teachers: Can insert and update subject results if assigned and result is not LOCKED or PUBLISHED
CREATE POLICY "Teachers can create and edit unlocked subject results for assigned classes"
    ON public.student_subject_results FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teachers t
            JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
            WHERE t.profile_id = auth.uid()
              AND ta.class_id = student_subject_results.class_id
              AND ta.subject_id = student_subject_results.subject_id
        )
        AND status IN ('DRAFT', 'SUBMITTED')
    );

CREATE POLICY "Teachers can update draft or submitted subject results"
    ON public.student_subject_results FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.teachers t
            JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
            WHERE t.profile_id = auth.uid()
              AND ta.class_id = student_subject_results.class_id
              AND ta.subject_id = student_subject_results.subject_id
        )
        AND status IN ('DRAFT', 'SUBMITTED')
    )
    WITH CHECK (
        status IN ('DRAFT', 'SUBMITTED')
    );

-- Admins / Super Admin: Full management
CREATE POLICY "Admins have full access to student subject results"
    ON public.student_subject_results FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- Student Term Results Policies
CREATE POLICY "Students can only read their own PUBLISHED term results"
    ON public.student_term_results FOR SELECT
    TO authenticated
    USING (
        status = 'PUBLISHED'
        AND student_id IN (
            SELECT id FROM public.students WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can view term results for assigned classes"
    ON public.student_term_results FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.teachers t
            JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
            WHERE t.profile_id = auth.uid()
              AND ta.class_id = student_term_results.class_id
        )
    );

CREATE POLICY "Admins have full access to student term results"
    ON public.student_term_results FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- Student Session Results Policies
CREATE POLICY "Students can only read their own PUBLISHED session results"
    ON public.student_session_results FOR SELECT
    TO authenticated
    USING (
        status = 'PUBLISHED'
        AND student_id IN (
            SELECT id FROM public.students WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can view session results for assigned classes"
    ON public.student_session_results FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.teachers t
            JOIN public.teacher_assignments ta ON ta.teacher_id = t.id
            WHERE t.profile_id = auth.uid()
              AND ta.class_id = student_session_results.class_id
        )
    );

CREATE POLICY "Admins have full access to student session results"
    ON public.student_session_results FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- Result Corrections Policies
CREATE POLICY "Admins and teachers can view result corrections"
    ON public.result_corrections FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN', 'TEACHER')
        )
    );

CREATE POLICY "Admins can insert result corrections"
    ON public.result_corrections FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- 9. Automatic Server-Side Calculation Function
CREATE OR REPLACE FUNCTION public.fn_auto_calculate_subject_grade()
RETURNS TRIGGER AS $$
DECLARE
    v_total NUMERIC(5,2);
    v_pct NUMERIC(5,2);
    v_grade TEXT;
    v_gpa NUMERIC(3,2);
BEGIN
    -- Authoritative total calculation
    v_total := COALESCE(NEW.ca_score, 0) + COALESCE(NEW.exam_score, 0);
    IF v_total > 100.00 THEN
        v_total := 100.00;
    END IF;
    
    NEW.total_score := v_total;
    NEW.max_score := 100.00;
    
    v_pct := ROUND((v_total / 100.00) * 100.00, 2);
    NEW.percentage := v_pct;

    -- Lookup authoritative grade from grading_scales
    SELECT grade, gpa_point INTO v_grade, v_gpa
    FROM public.grading_scales
    WHERE v_pct >= min_score AND v_pct <= max_score
      AND is_active = true
    ORDER BY min_score DESC
    LIMIT 1;

    IF v_grade IS NOT NULL THEN
        NEW.grade := v_grade;
        NEW.gpa_point := v_gpa;
    ELSE
        NEW.grade := 'F';
        NEW.gpa_point := 0.00;
    END IF;

    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_calc_subject_grade ON public.student_subject_results;
CREATE TRIGGER trg_auto_calc_subject_grade
    BEFORE INSERT OR UPDATE ON public.student_subject_results
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_auto_calculate_subject_grade();

-- 10. Database RPC: Recalculate Class Rankings and Term Averages
CREATE OR REPLACE FUNCTION public.recalculate_class_term_results(
    p_class_id UUID,
    p_session_id UUID,
    p_term_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_student_rec RECORD;
    v_avg NUMERIC(5,2);
    v_total_obtained NUMERIC(7,2);
    v_total_possible NUMERIC(7,2);
    v_subj_count INTEGER;
    v_gpa NUMERIC(3,2);
    v_class_size INTEGER;
    v_highest NUMERIC(5,2) := 0;
    v_lowest NUMERIC(5,2) := 100;
    v_rank INTEGER := 1;
BEGIN
    -- 1. Get class size of enrolled students
    SELECT COUNT(*) INTO v_class_size
    FROM public.student_enrollments
    WHERE class_id = p_class_id
      AND academic_session_id = p_session_id
      AND term_id = p_term_id
      AND status = 'ACTIVE';

    -- 2. Aggregate each student's subject results
    FOR v_student_rec IN
        SELECT 
            student_id,
            COUNT(*) as subjs,
            SUM(total_score) as total_scored,
            SUM(max_score) as max_scored,
            ROUND(AVG(total_score), 2) as avg_score,
            ROUND(AVG(gpa_point), 2) as avg_gpa
        FROM public.student_subject_results
        WHERE class_id = p_class_id
          AND academic_session_id = p_session_id
          AND term_id = p_term_id
        GROUP BY student_id
        ORDER BY avg_score DESC
    LOOP
        IF v_student_rec.avg_score > v_highest THEN
            v_highest := v_student_rec.avg_score;
        END IF;
        IF v_student_rec.avg_score < v_lowest THEN
            v_lowest := v_student_rec.avg_score;
        END IF;

        INSERT INTO public.student_term_results (
            student_id,
            class_id,
            academic_session_id,
            term_id,
            total_subjects,
            total_score_obtained,
            total_possible_score,
            average_score,
            gpa,
            class_rank,
            class_size,
            status,
            updated_at
        )
        VALUES (
            v_student_rec.student_id,
            p_class_id,
            p_session_id,
            p_term_id,
            v_student_rec.subjs,
            v_student_rec.total_scored,
            v_student_rec.max_scored,
            v_student_rec.avg_score,
            v_student_rec.avg_gpa,
            v_rank,
            v_class_size,
            'DRAFT',
            timezone('utc'::text, now())
        )
        ON CONFLICT (student_id, class_id, academic_session_id, term_id)
        DO UPDATE SET
            total_subjects = EXCLUDED.total_subjects,
            total_score_obtained = EXCLUDED.total_score_obtained,
            total_possible_score = EXCLUDED.total_possible_score,
            average_score = EXCLUDED.average_score,
            gpa = EXCLUDED.gpa,
            class_rank = v_rank,
            class_size = v_class_size,
            updated_at = timezone('utc'::text, now());

        v_rank := v_rank + 1;
    END LOOP;

    -- Update highest and lowest in class
    UPDATE public.student_term_results
    SET class_highest_average = v_highest,
        class_lowest_average = v_lowest
    WHERE class_id = p_class_id
      AND academic_session_id = p_session_id
      AND term_id = p_term_id;

    RETURN jsonb_build_object(
        'success', true,
        'class_size', v_class_size,
        'highest_average', v_highest,
        'lowest_average', v_lowest
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
