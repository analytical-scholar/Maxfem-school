-- ==============================================================================
-- MAXFEM INTERNATIONAL SCHOOL — PHASE 2 SEED DATA
-- Seeds initial academic sessions, terms, classes, and subjects
-- ==============================================================================

-- 1. Academic Session
INSERT INTO public.academic_sessions (id, name, start_date, end_date, is_current)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', '2024/2025', '2024-09-09', '2025-07-18', true)
ON CONFLICT (name) DO UPDATE SET is_current = EXCLUDED.is_current;

-- 2. Terms for 2024/2025
INSERT INTO public.terms (id, academic_session_id, name, start_date, end_date, is_current)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'First Term', '2024-09-09', '2024-12-13', false),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Second Term', '2025-01-06', '2025-04-04', true),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Third Term', '2025-04-28', '2025-07-18', false)
ON CONFLICT (academic_session_id, name) DO NOTHING;

-- 3. Initial Classes (Junior Secondary & Senior Secondary)
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

-- 4. Initial Core Subjects
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
