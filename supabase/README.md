# Maxfem International School — Phase 2 Supabase Foundation

This directory contains the database schemas, Row Level Security (RLS) policies, storage bucket configurations, and seed data for Maxfem International School.

## Architecture Overview

- **Supabase Project URL**: `https://odvwyzwxlvbylpznbjkv.supabase.co`
- **Database Engine**: PostgreSQL 15+
- **Security**: Strict Row-Level Security (RLS) with Security Definer functions
- **Authentication**: Supabase Auth (`auth.users`) synchronized with `public.profiles`

---

## Migration Files Sequence

Run the migration files in the following order in your Supabase SQL Editor:

1. `supabase/migrations/20250101000000_phase2_schema.sql`
   - Custom enum types: `user_role`, `account_status`, `term_name`, `admission_status`
   - `public.profiles` linked to `auth.users(id)`
   - `public.academic_sessions` & `public.terms`
   - `public.classes` & `public.subjects`
   - `public.students` & `public.student_enrollments` (multi-session placement history)
   - `public.teachers` & `public.teacher_assignments` (multi-term class & subject mapping)
   - `public.audit_logs` (immutable security ledger)
   - Automatic triggers: `handle_new_user`, `update_timestamp`

2. `supabase/migrations/20250101000001_phase2_rls_policies.sql`
   - Security Definer helper functions: `is_super_admin()`, `is_admin_or_super()`, `is_teacher()`, `is_student()`, `get_auth_role()`, `get_auth_status()`
   - Anti-escalation trigger: `prevent_profile_escalation` (blocks users from modifying own role or status)
   - Fine-grained RLS policies on all tables:
     - Student privacy isolation
     - Teacher class-scoped roster access
     - Administrative governance
     - Immutable audit log access (no UPDATE or DELETE permissions)

3. `supabase/migrations/20250101000002_phase2_storage.sql`
   - Provisions 6 normalized storage buckets:
     - `profile-photos` (Public, 5MB, JPG/PNG/WEBP)
     - `school-gallery` (Public, 10MB, JPG/PNG/WEBP)
     - `student-documents` (Private, 20MB, PDF/JPG/PNG)
     - `admission-documents` (Private, 20MB, PDF/JPG/PNG)
     - `learning-materials` (Public, 50MB, PDF/DOCX/PPTX/MP4)
     - `examination-resources` (Private, 25MB, PDF/ZIP/JSON)
   - Storage RLS access policies

4. `supabase/seed.sql`
   - Seeds initial 2024/2025 Academic Session
   - Seeds First, Second, and Third Terms
   - Seeds default school classes (JSS 1 through SSS 3)
   - Seeds standard curriculum subjects (Mathematics, English Language, Physics, Chemistry, Biology, etc.)

---

## Roles & Access Hierarchy (RBAC)

| Role | Scope & Permissions |
| :--- | :--- |
| **SUPER_ADMIN** | Full administrative rights, elevated governance, audit ledger inspection, system configurations |
| **ADMIN** | Academic operations, user management, admissions processing, timetable & session management |
| **TEACHER** | Access restricted to assigned classes and subjects, learning material uploads, score entry |
| **STUDENT** | Isolated access to personal records, enrollment history, enrolled subjects, CBT, personal documents |

---

## Environment Configuration

Configure the following environment variables in `.env` (or project settings):

```env
VITE_SUPABASE_URL=https://odvwyzwxlvbylpznbjkv.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```
