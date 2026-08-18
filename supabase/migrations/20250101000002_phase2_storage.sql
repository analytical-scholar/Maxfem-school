-- ==============================================================================
-- MAXFEM INTERNATIONAL SCHOOL — PHASE 2 SUPABASE STORAGE CONFIGURATION
-- Buckets and Storage RLS Policies
-- ==============================================================================

-- 1. Create Buckets if not already created
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('school-gallery', 'school-gallery', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('student-documents', 'student-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('admission-documents', 'admission-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('learning-materials', 'learning-materials', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png']),
    ('examination-resources', 'examination-resources', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/json'])
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies

-- Profile Photos: Public read, user-scoped write
CREATE POLICY "profile_photos_public_select" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-photos');

CREATE POLICY "profile_photos_user_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'profile-photos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "profile_photos_user_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id = 'profile-photos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "profile_photos_user_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'profile-photos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- School Gallery: Public read, Admin write
CREATE POLICY "gallery_public_select" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'school-gallery');

CREATE POLICY "gallery_admin_all" ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'school-gallery' AND 
    public.is_admin_or_super(auth.uid())
)
WITH CHECK (
    bucket_id = 'school-gallery' AND 
    public.is_admin_or_super(auth.uid())
);

-- Student Documents: Student read/write own folder, Admin full access
CREATE POLICY "student_docs_select_own" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'student-documents' AND (
        (storage.foldername(name))[1] = auth.uid()::text OR
        public.is_admin_or_super(auth.uid())
    )
);

CREATE POLICY "student_docs_insert_own" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'student-documents' AND (
        (storage.foldername(name))[1] = auth.uid()::text OR
        public.is_admin_or_super(auth.uid())
    )
);

-- Admission Documents: Applicant read/write own folder, Admin full access
CREATE POLICY "admission_docs_select" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'admission-documents' AND (
        (storage.foldername(name))[1] = auth.uid()::text OR
        public.is_admin_or_super(auth.uid())
    )
);

CREATE POLICY "admission_docs_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'admission-documents' AND (
        (storage.foldername(name))[1] = auth.uid()::text OR
        public.is_admin_or_super(auth.uid())
    )
);

-- Learning Materials: Authenticated select, Teacher/Admin write
CREATE POLICY "learning_materials_select" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'learning-materials');

CREATE POLICY "learning_materials_write" ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'learning-materials' AND (
        public.is_teacher(auth.uid()) OR
        public.is_admin_or_super(auth.uid())
    )
)
WITH CHECK (
    bucket_id = 'learning-materials' AND (
        public.is_teacher(auth.uid()) OR
        public.is_admin_or_super(auth.uid())
    )
);

-- Examination Resources: Teacher/Admin write & read, Student restricted read
CREATE POLICY "exam_resources_admin_teacher" ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'examination-resources' AND (
        public.is_teacher(auth.uid()) OR
        public.is_admin_or_super(auth.uid())
    )
)
WITH CHECK (
    bucket_id = 'examination-resources' AND (
        public.is_teacher(auth.uid()) OR
        public.is_admin_or_super(auth.uid())
    )
);
