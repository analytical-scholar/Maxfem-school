-- ==============================================================================
-- MAXFEM INTERNATIONAL SCHOOL — PHASE 5 CBT EXAMINATION SYSTEM SCHEMA
-- Normalized PostgreSQL schema, functions, triggers & RLS for secure CBT engine
-- ==============================================================================

-- 1. Custom Enum Types for CBT
DO $$ BEGIN
    CREATE TYPE exam_status AS ENUM (
        'DRAFT',
        'SCHEDULED',
        'PUBLISHED',
        'ACTIVE',
        'CLOSED',
        'ARCHIVED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM (
        'MULTIPLE_CHOICE',
        'TRUE_FALSE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attempt_status AS ENUM (
        'IN_PROGRESS',
        'SUBMITTED',
        'EXPIRED',
        'ABANDONED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Examinations Table
CREATE TABLE IF NOT EXISTS public.examinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    academic_session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE RESTRICT,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    total_questions INTEGER NOT NULL DEFAULT 0 CHECK (total_questions >= 0),
    total_marks NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (total_marks >= 0),
    pass_mark NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (pass_mark >= 0),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status exam_status NOT NULL DEFAULT 'DRAFT',
    is_randomized BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_exam_schedule CHECK (end_time IS NULL OR start_time IS NULL OR end_time >= start_time)
);

CREATE INDEX IF NOT EXISTS idx_examinations_status ON public.examinations(status);
CREATE INDEX IF NOT EXISTS idx_examinations_subject ON public.examinations(subject_id);
CREATE INDEX IF NOT EXISTS idx_examinations_class ON public.examinations(class_id);
CREATE INDEX IF NOT EXISTS idx_examinations_session ON public.examinations(academic_session_id);
CREATE INDEX IF NOT EXISTS idx_examinations_term ON public.examinations(term_id);
CREATE INDEX IF NOT EXISTS idx_examinations_created_by ON public.examinations(created_by);

-- 3. Examination Questions Table
CREATE TABLE IF NOT EXISTS public.examination_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    marks NUMERIC(5,2) NOT NULL DEFAULT 1.0 CHECK (marks > 0),
    explanation TEXT, -- Teacher explanation (never sent to student during exam)
    order_index INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON public.examination_questions(examination_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_order ON public.examination_questions(examination_id, order_index);

-- 4. Question Options Table
CREATE TABLE IF NOT EXISTS public.question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.examination_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false, -- PROTECTED: Answer key
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_question_options_question ON public.question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_question_options_order ON public.question_options(question_id, order_index);

-- 5. Examination Attempts Table
CREATE TABLE IF NOT EXISTS public.examination_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    submitted_at TIMESTAMPTZ,
    status attempt_status NOT NULL DEFAULT 'IN_PROGRESS',
    total_score NUMERIC(6,2) DEFAULT NULL,
    max_possible_score NUMERIC(6,2) NOT NULL DEFAULT 0,
    is_auto_marked BOOLEAN NOT NULL DEFAULT true,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_exam_attempt UNIQUE (examination_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON public.examination_attempts(examination_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON public.examination_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_status ON public.examination_attempts(status);

-- 6. Student Answers Table
CREATE TABLE IF NOT EXISTS public.student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.examination_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.examination_questions(id) ON DELETE RESTRICT,
    selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
    text_response TEXT,
    is_correct BOOLEAN DEFAULT NULL,
    marks_awarded NUMERIC(5,2) DEFAULT 0,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_attempt_question_answer UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_student_answers_attempt ON public.student_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_question ON public.student_answers(question_id);

-- ==============================================================================
-- 7. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Trigger to recalculate exam totals when questions change
CREATE OR REPLACE FUNCTION public.sync_examination_totals()
RETURNS TRIGGER AS $$
DECLARE
    target_exam_id UUID;
    calc_total_q INTEGER;
    calc_total_m NUMERIC(6,2);
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_exam_id := OLD.examination_id;
    ELSE
        target_exam_id := NEW.examination_id;
    END IF;

    SELECT
        COUNT(*),
        COALESCE(SUM(marks), 0)
    INTO
        calc_total_q,
        calc_total_m
    FROM public.examination_questions
    WHERE examination_id = target_exam_id AND is_active = true;

    UPDATE public.examinations
    SET
        total_questions = calc_total_q,
        total_marks = calc_total_m,
        updated_at = timezone('utc'::text, now())
    WHERE id = target_exam_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_exam_totals ON public.examination_questions;
CREATE TRIGGER trg_sync_exam_totals
AFTER INSERT OR UPDATE OR DELETE ON public.examination_questions
FOR EACH ROW EXECUTE FUNCTION public.sync_examination_totals();

-- ==============================================================================
-- 8. SECURE PROCEDURES / RPC
-- ==============================================================================

-- A. Start Exam Attempt
CREATE OR REPLACE FUNCTION public.start_exam_attempt(
    p_exam_id UUID,
    p_student_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_exam RECORD;
    v_student RECORD;
    v_attempt RECORD;
    v_is_enrolled BOOLEAN;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    -- 1. Fetch exam
    SELECT * INTO v_exam FROM public.examinations WHERE id = p_exam_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Examination not found');
    END IF;

    -- 2. Check exam status & schedule
    IF v_exam.status NOT IN ('PUBLISHED', 'ACTIVE') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Examination is not currently open for taking');
    END IF;

    IF v_exam.start_time IS NOT NULL AND v_now < v_exam.start_time THEN
        RETURN jsonb_build_object('success', false, 'error', 'Examination has not started yet');
    END IF;

    IF v_exam.end_time IS NOT NULL AND v_now > v_exam.end_time THEN
        RETURN jsonb_build_object('success', false, 'error', 'Examination schedule has closed');
    END IF;

    -- 3. Verify student enrollment
    SELECT * INTO v_student FROM public.students WHERE id = p_student_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Student record not found');
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.student_enrollments
        WHERE student_id = p_student_id
          AND class_id = v_exam.class_id
          AND academic_session_id = v_exam.academic_session_id
          AND term_id = v_exam.term_id
          AND status = 'ACTIVE'
    ) INTO v_is_enrolled;

    IF NOT v_is_enrolled THEN
        RETURN jsonb_build_object('success', false, 'error', 'Student is not enrolled in the class for this examination');
    END IF;

    -- 4. Check existing attempt
    SELECT * INTO v_attempt FROM public.examination_attempts
    WHERE examination_id = p_exam_id AND student_id = p_student_id;

    IF FOUND THEN
        IF v_attempt.status = 'SUBMITTED' THEN
            RETURN jsonb_build_object('success', false, 'error', 'You have already completed and submitted this examination', 'attempt_id', v_attempt.id, 'status', v_attempt.status);
        END IF;

        -- Check if time has expired on active attempt
        IF v_attempt.status = 'IN_PROGRESS' AND (v_attempt.started_at + (v_exam.duration_minutes || ' minutes')::INTERVAL) < v_now THEN
            -- Mark expired
            UPDATE public.examination_attempts
            SET status = 'EXPIRED', updated_at = v_now
            WHERE id = v_attempt.id;

            RETURN jsonb_build_object('success', false, 'error', 'Examination attempt time has expired', 'attempt_id', v_attempt.id, 'status', 'EXPIRED');
        END IF;

        -- Return existing active attempt
        RETURN jsonb_build_object(
            'success', true,
            'attempt', row_to_json(v_attempt),
            'exam', row_to_json(v_exam),
            'resumed', true
        );
    END IF;

    -- 5. Create new attempt
    INSERT INTO public.examination_attempts (
        examination_id,
        student_id,
        started_at,
        status,
        max_possible_score,
        is_auto_marked
    ) VALUES (
        p_exam_id,
        p_student_id,
        v_now,
        'IN_PROGRESS',
        v_exam.total_marks,
        true
    )
    RETURNING * INTO v_attempt;

    RETURN jsonb_build_object(
        'success', true,
        'attempt', row_to_json(v_attempt),
        'exam', row_to_json(v_exam),
        'resumed', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Get Sanitized Questions for Student (NO answer keys exposed!)
CREATE OR REPLACE FUNCTION public.get_student_exam_questions(
    p_exam_id UUID,
    p_attempt_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_attempt RECORD;
    v_questions JSONB;
BEGIN
    -- Verify attempt exists and belongs to this exam
    SELECT * INTO v_attempt FROM public.examination_attempts
    WHERE id = p_attempt_id AND examination_id = p_exam_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid attempt reference');
    END IF;

    -- Gather questions and options WITHOUT is_correct and WITHOUT explanation
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', q.id,
            'question_text', q.question_text,
            'question_type', q.question_type,
            'marks', q.marks,
            'order_index', q.order_index,
            'options', (
                SELECT COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'id', o.id,
                            'option_text', o.option_text,
                            'order_index', o.order_index
                        ) ORDER BY o.order_index ASC
                    ),
                    '[]'::jsonb
                )
                FROM public.question_options o
                WHERE o.question_id = q.id
            )
        ) ORDER BY q.order_index ASC
    ) INTO v_questions
    FROM public.examination_questions q
    WHERE q.examination_id = p_exam_id AND q.is_active = true;

    RETURN jsonb_build_object(
        'success', true,
        'questions', COALESCE(v_questions, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Submit Exam Attempt & Auto-Mark Objective Questions
CREATE OR REPLACE FUNCTION public.submit_exam_attempt(
    p_attempt_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_attempt RECORD;
    v_exam RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_total_score NUMERIC(6,2) := 0;
    v_calculated_max NUMERIC(6,2) := 0;
    v_total_questions_count INTEGER := 0;
    v_answered_count INTEGER := 0;
    v_correct_count INTEGER := 0;
    v_rec RECORD;
    v_is_correct BOOLEAN;
    v_marks_awarded NUMERIC(5,2);
BEGIN
    -- 1. Lock and fetch attempt
    SELECT * INTO v_attempt FROM public.examination_attempts
    WHERE id = p_attempt_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Attempt not found');
    END IF;

    IF v_attempt.status = 'SUBMITTED' THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Exam was already submitted',
            'submitted_at', v_attempt.submitted_at,
            'total_score', v_attempt.total_score,
            'max_score', v_attempt.max_possible_score
        );
    END IF;

    -- 2. Fetch exam info
    SELECT * INTO v_exam FROM public.examinations WHERE id = v_attempt.examination_id;

    -- 3. Auto-mark each student answer against question_options.is_correct
    FOR v_rec IN (
        SELECT
            sa.id AS answer_id,
            sa.question_id,
            sa.selected_option_id,
            eq.marks AS question_marks,
            eq.question_type,
            qo.is_correct AS option_is_correct
        FROM public.student_answers sa
        JOIN public.examination_questions eq ON eq.id = sa.question_id
        LEFT JOIN public.question_options qo ON qo.id = sa.selected_option_id
        WHERE sa.attempt_id = p_attempt_id
    ) LOOP
        v_answered_count := v_answered_count + 1;

        IF v_rec.option_is_correct = true THEN
            v_is_correct := true;
            v_marks_awarded := v_rec.question_marks;
            v_total_score := v_total_score + v_marks_awarded;
            v_correct_count := v_correct_count + 1;
        ELSE
            v_is_correct := false;
            v_marks_awarded := 0.0;
        END IF;

        UPDATE public.student_answers
        SET
            is_correct = v_is_correct,
            marks_awarded = v_marks_awarded,
            updated_at = v_now
        WHERE id = v_rec.answer_id;
    END LOOP;

    -- Calculate total possible score and question count
    SELECT
        COUNT(*),
        COALESCE(SUM(marks), 0)
    INTO
        v_total_questions_count,
        v_calculated_max
    FROM public.examination_questions
    WHERE examination_id = v_attempt.examination_id AND is_active = true;

    -- 4. Mark attempt as SUBMITTED
    UPDATE public.examination_attempts
    SET
        status = 'SUBMITTED',
        submitted_at = v_now,
        total_score = v_total_score,
        max_possible_score = v_calculated_max,
        updated_at = v_now
    WHERE id = p_attempt_id;

    -- 5. Log audit event
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_values
    ) VALUES (
        (SELECT profile_id FROM public.students WHERE id = v_attempt.student_id),
        'EXAM_SUBMITTED',
        'examination_attempt',
        p_attempt_id::text,
        jsonb_build_object(
            'examination_id', v_attempt.examination_id,
            'total_score', v_total_score,
            'max_score', v_calculated_max,
            'answered_count', v_answered_count,
            'submitted_at', v_now
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Examination successfully submitted and auto-marked',
        'attempt_id', p_attempt_id,
        'submitted_at', v_now,
        'total_score', v_total_score,
        'max_possible_score', v_calculated_max,
        'total_questions', v_total_questions_count,
        'answered_count', v_answered_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examination_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examination_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- EXAMINATIONS POLICIES
-- Admins: Full access
DROP POLICY IF EXISTS admin_all_examinations ON public.examinations;
CREATE POLICY admin_all_examinations ON public.examinations
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_super(auth.uid()))
    WITH CHECK (public.is_admin_or_super(auth.uid()));

-- Teachers: View/manage assigned examinations
DROP POLICY IF EXISTS teacher_select_examinations ON public.examinations;
CREATE POLICY teacher_select_examinations ON public.examinations
    FOR SELECT
    TO authenticated
    USING (
        public.is_teacher(auth.uid()) AND (
            created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.teacher_assignments ta
                JOIN public.teachers t ON t.id = ta.teacher_id
                WHERE t.profile_id = auth.uid()
                  AND ta.subject_id = examinations.subject_id
                  AND ta.class_id = examinations.class_id
            )
        )
    );

DROP POLICY IF EXISTS teacher_insert_examinations ON public.examinations;
CREATE POLICY teacher_insert_examinations ON public.examinations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_teacher(auth.uid()) AND
        created_by = auth.uid()
    );

DROP POLICY IF EXISTS teacher_update_examinations ON public.examinations;
CREATE POLICY teacher_update_examinations ON public.examinations
    FOR UPDATE
    TO authenticated
    USING (
        public.is_teacher(auth.uid()) AND (
            created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.teacher_assignments ta
                JOIN public.teachers t ON t.id = ta.teacher_id
                WHERE t.profile_id = auth.uid()
                  AND ta.subject_id = examinations.subject_id
                  AND ta.class_id = examinations.class_id
            )
        )
    );

-- Students: View published exams for enrolled classes
DROP POLICY IF EXISTS student_select_examinations ON public.examinations;
CREATE POLICY student_select_examinations ON public.examinations
    FOR SELECT
    TO authenticated
    USING (
        public.is_student(auth.uid()) AND
        status IN ('PUBLISHED', 'ACTIVE', 'CLOSED') AND
        EXISTS (
            SELECT 1 FROM public.student_enrollments se
            JOIN public.students s ON s.id = se.student_id
            WHERE s.profile_id = auth.uid()
              AND se.class_id = examinations.class_id
              AND se.academic_session_id = examinations.academic_session_id
              AND se.term_id = examinations.term_id
              AND se.status = 'ACTIVE'
        )
    );

-- QUESTIONS POLICIES
DROP POLICY IF EXISTS admin_all_questions ON public.examination_questions;
CREATE POLICY admin_all_questions ON public.examination_questions
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_super(auth.uid()))
    WITH CHECK (public.is_admin_or_super(auth.uid()));

DROP POLICY IF EXISTS teacher_all_questions ON public.examination_questions;
CREATE POLICY teacher_all_questions ON public.examination_questions
    FOR ALL
    TO authenticated
    USING (
        public.is_teacher(auth.uid()) AND
        EXISTS (
            SELECT 1 FROM public.examinations e
            WHERE e.id = examination_questions.examination_id
              AND (
                  e.created_by = auth.uid() OR
                  EXISTS (
                      SELECT 1 FROM public.teacher_assignments ta
                      JOIN public.teachers t ON t.id = ta.teacher_id
                      WHERE t.profile_id = auth.uid()
                        AND ta.subject_id = e.subject_id
                        AND ta.class_id = e.class_id
                  )
              )
        )
    );

-- QUESTION OPTIONS POLICIES
DROP POLICY IF EXISTS admin_all_options ON public.question_options;
CREATE POLICY admin_all_options ON public.question_options
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_super(auth.uid()))
    WITH CHECK (public.is_admin_or_super(auth.uid()));

DROP POLICY IF EXISTS teacher_all_options ON public.question_options;
CREATE POLICY teacher_all_options ON public.question_options
    FOR ALL
    TO authenticated
    USING (
        public.is_teacher(auth.uid()) AND
        EXISTS (
            SELECT 1 FROM public.examination_questions eq
            JOIN public.examinations e ON e.id = eq.examination_id
            WHERE eq.id = question_options.question_id
              AND (
                  e.created_by = auth.uid() OR
                  EXISTS (
                      SELECT 1 FROM public.teacher_assignments ta
                      JOIN public.teachers t ON t.id = ta.teacher_id
                      WHERE t.profile_id = auth.uid()
                        AND ta.subject_id = e.subject_id
                        AND ta.class_id = e.class_id
                  )
              )
        )
    );

-- ATTEMPTS POLICIES
DROP POLICY IF EXISTS admin_all_attempts ON public.examination_attempts;
CREATE POLICY admin_all_attempts ON public.examination_attempts
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_super(auth.uid()))
    WITH CHECK (public.is_admin_or_super(auth.uid()));

DROP POLICY IF EXISTS teacher_select_attempts ON public.examination_attempts;
CREATE POLICY teacher_select_attempts ON public.examination_attempts
    FOR SELECT
    TO authenticated
    USING (
        public.is_teacher(auth.uid()) AND
        EXISTS (
            SELECT 1 FROM public.examinations e
            WHERE e.id = examination_attempts.examination_id
              AND (
                  e.created_by = auth.uid() OR
                  EXISTS (
                      SELECT 1 FROM public.teacher_assignments ta
                      JOIN public.teachers t ON t.id = ta.teacher_id
                      WHERE t.profile_id = auth.uid()
                        AND ta.subject_id = e.subject_id
                        AND ta.class_id = e.class_id
                  )
              )
        )
    );

DROP POLICY IF EXISTS student_select_own_attempts ON public.examination_attempts;
CREATE POLICY student_select_own_attempts ON public.examination_attempts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = examination_attempts.student_id
              AND s.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS student_insert_own_attempts ON public.examination_attempts;
CREATE POLICY student_insert_own_attempts ON public.examination_attempts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = examination_attempts.student_id
              AND s.profile_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS student_update_own_attempts ON public.examination_attempts;
CREATE POLICY student_update_own_attempts ON public.examination_attempts
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = examination_attempts.student_id
              AND s.profile_id = auth.uid()
        )
    );

-- STUDENT ANSWERS POLICIES
DROP POLICY IF EXISTS admin_all_answers ON public.student_answers;
CREATE POLICY admin_all_answers ON public.student_answers
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_super(auth.uid()))
    WITH CHECK (public.is_admin_or_super(auth.uid()));

DROP POLICY IF EXISTS teacher_select_answers ON public.student_answers;
CREATE POLICY teacher_select_answers ON public.student_answers
    FOR SELECT
    TO authenticated
    USING (
        public.is_teacher(auth.uid()) AND
        EXISTS (
            SELECT 1 FROM public.examination_attempts ea
            JOIN public.examinations e ON e.id = ea.examination_id
            WHERE ea.id = student_answers.attempt_id
              AND (
                  e.created_by = auth.uid() OR
                  EXISTS (
                      SELECT 1 FROM public.teacher_assignments ta
                      JOIN public.teachers t ON t.id = ta.teacher_id
                      WHERE t.profile_id = auth.uid()
                        AND ta.subject_id = e.subject_id
                        AND ta.class_id = e.class_id
                  )
              )
        )
    );

DROP POLICY IF EXISTS student_manage_own_answers ON public.student_answers;
CREATE POLICY student_manage_own_answers ON public.student_answers
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.examination_attempts ea
            JOIN public.students s ON s.id = ea.student_id
            WHERE ea.id = student_answers.attempt_id
              AND s.profile_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.examination_attempts ea
            JOIN public.students s ON s.id = ea.student_id
            WHERE ea.id = student_answers.attempt_id
              AND s.profile_id = auth.uid()
              AND ea.status = 'IN_PROGRESS'
        )
    );
