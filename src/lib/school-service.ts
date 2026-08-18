// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — SCHOOL MANAGEMENT DATA SERVICE (PHASE 3)
// ==============================================================================

import { supabase } from "./supabase";
import type {
  Profile,
  Student,
  Teacher,
  SchoolClass,
  Subject,
  AcademicSession,
  Term,
  StudentEnrollment,
  TeacherAssignment,
  AuditLog,
  UserRole,
  AccountStatus,
  Gender,
  AdmissionStatus,
  EmploymentStatus,
  EnrollmentStatus,
  TermName,
  AdmissionApplication,
  ApplicationReview,
  ApplicationDocument,
  AdmissionsStats,
  ApplicationStatus,
  AdmissionDocType,
  Examination,
  ExaminationQuestion,
  QuestionOption,
  ExaminationAttempt,
  StudentAnswer,
  ExamStatus,
  QuestionType,
  AttemptStatus,
  SanitizedQuestion,
  SanitizedOption,
  CbtMonitoringStats,
  ResultStatus,
  GradingScale,
  StudentSubjectResult,
  StudentTermResult,
  StudentSessionResult,
  ResultCorrection,
  AcademicAnalytics,
  StudentReportCardData,
} from "@/types/database";
import { logAuditEvent } from "./audit";

// ==============================================================================
// 1. DASHBOARD & STATS
// ==============================================================================

export interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  activeSession: AcademicSession | null;
  activeTerm: Term | null;
  recentLogs: AuditLog[];
}

export async function fetchAdminStats(): Promise<AdminStats> {
  try {
    const [studentsRes, teachersRes, classesRes, subjectsRes, sessionRes, termRes, logsRes] =
      await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("teachers").select("id", { count: "exact", head: true }),
        supabase.from("classes").select("id", { count: "exact", head: true }),
        supabase.from("subjects").select("id", { count: "exact", head: true }),
        supabase.from("academic_sessions").select("*").eq("is_current", true).maybeSingle(),
        supabase
          .from("terms")
          .select("*, academic_session:academic_sessions(*)")
          .eq("is_current", true)
          .maybeSingle(),
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(6),
      ]);

    return {
      totalStudents: studentsRes.count ?? 0,
      totalTeachers: teachersRes.count ?? 0,
      totalClasses: classesRes.count ?? 0,
      totalSubjects: subjectsRes.count ?? 0,
      activeSession: (sessionRes.data as unknown as AcademicSession) || null,
      activeTerm: (termRes.data as unknown as Term) || null,
      recentLogs: (logsRes.data as unknown as AuditLog[]) || [],
    };
  } catch (err) {
    console.error("[SchoolService] Error fetching admin stats:", err);
    return {
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
      totalSubjects: 0,
      activeSession: null,
      activeTerm: null,
      recentLogs: [],
    };
  }
}

// ==============================================================================
// 2. USERS MANAGEMENT
// ==============================================================================

export async function fetchUsers(
  search?: string,
  roleFilter?: UserRole,
  statusFilter?: AccountStatus,
): Promise<Profile[]> {
  try {
    let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });

    if (roleFilter) {
      query = query.eq("role", roleFilter);
    }
    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }
    if (search && search.trim()) {
      const s = search.trim();
      query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as Profile[]) || [];
  } catch (err) {
    console.error("[SchoolService] Error fetching users:", err);
    return [];
  }
}

export async function updateUserRole(
  userId: string,
  newRole: UserRole,
  oldRole: UserRole,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);

    if (error) throw error;

    await logAuditEvent({
      action: "ROLE_CHANGED",
      entityType: "profile",
      entityId: userId,
      oldValues: { role: oldRole },
      newValues: { role: newRole },
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update user role";
    return { success: false, error: msg };
  }
}

export async function updateUserStatus(
  userId: string,
  newStatus: AccountStatus,
  oldStatus: AccountStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", userId);

    if (error) throw error;

    await logAuditEvent({
      action: "ACCOUNT_STATUS_CHANGED",
      entityType: "profile",
      entityId: userId,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update user status";
    return { success: false, error: msg };
  }
}

// ==============================================================================
// 3. STUDENTS MANAGEMENT
// ==============================================================================

export async function fetchStudents(
  search?: string,
  statusFilter?: AccountStatus,
): Promise<Student[]> {
  try {
    let query = supabase
      .from("students")
      .select("*, profile:profiles(*)")
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }
    if (search && search.trim()) {
      const s = search.trim();
      query = query.or(
        `first_name.ilike.%${s}%,last_name.ilike.%${s}%,admission_number.ilike.%${s}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as Student[]) || [];
  } catch (err) {
    console.error("[SchoolService] Error fetching students:", err);
    return [];
  }
}

export async function createStudent(payload: {
  first_name: string;
  last_name: string;
  other_name?: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  admission_number: string;
  admission_status?: AdmissionStatus;
}): Promise<{ success: boolean; data?: Student; error?: string }> {
  try {
    // Generate UUID for profile
    const profileId = crypto.randomUUID();

    // 1. Insert Profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: profileId,
      email: payload.email,
      full_name: `${payload.first_name} ${payload.last_name}`.trim(),
      phone: payload.phone || null,
      role: "STUDENT" as UserRole,
      status: "ACTIVE" as AccountStatus,
    });

    if (profileError) throw profileError;

    // 2. Insert Student record
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .insert({
        profile_id: profileId,
        admission_number: payload.admission_number,
        first_name: payload.first_name,
        last_name: payload.last_name,
        other_name: payload.other_name || null,
        date_of_birth: payload.date_of_birth || null,
        gender: payload.gender || null,
        admission_status: payload.admission_status || "ADMITTED",
        status: "ACTIVE" as AccountStatus,
      })
      .select("*, profile:profiles(*)")
      .single();

    if (studentError) throw studentError;

    await logAuditEvent({
      action: "USER_CREATED",
      entityType: "student",
      entityId: studentData?.id,
      newValues: { admission_number: payload.admission_number, email: payload.email },
    });

    return { success: true, data: studentData as unknown as Student };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create student";
    return { success: false, error: msg };
  }
}

export async function updateStudent(
  id: string,
  profileId: string,
  payload: {
    first_name: string;
    last_name: string;
    other_name?: string | null;
    date_of_birth?: string | null;
    gender?: Gender | null;
    admission_status?: AdmissionStatus;
    status?: AccountStatus;
    phone?: string | null;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const [studentRes, profileRes] = await Promise.all([
      supabase
        .from("students")
        .update({
          first_name: payload.first_name,
          last_name: payload.last_name,
          other_name: payload.other_name,
          date_of_birth: payload.date_of_birth,
          gender: payload.gender,
          admission_status: payload.admission_status,
          status: payload.status,
        })
        .eq("id", id),
      supabase
        .from("profiles")
        .update({
          full_name: `${payload.first_name} ${payload.last_name}`.trim(),
          phone: payload.phone,
          status: payload.status,
        })
        .eq("id", profileId),
    ]);

    if (studentRes.error) throw studentRes.error;
    if (profileRes.error) throw profileRes.error;

    await logAuditEvent({
      action: "STUDENT_UPDATED",
      entityType: "student",
      entityId: id,
      newValues: payload,
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update student";
    return { success: false, error: msg };
  }
}

// ==============================================================================
// 4. TEACHERS MANAGEMENT
// ==============================================================================

export async function fetchTeachers(search?: string, department?: string): Promise<Teacher[]> {
  try {
    let query = supabase
      .from("teachers")
      .select("*, profile:profiles(*)")
      .order("created_at", { ascending: false });

    if (department && department !== "ALL") {
      query = query.eq("department", department);
    }
    if (search && search.trim()) {
      const s = search.trim();
      query = query.or(`staff_id.ilike.%${s}%,department.ilike.%${s}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as Teacher[]) || [];
  } catch (err) {
    console.error("[SchoolService] Error fetching teachers:", err);
    return [];
  }
}

export async function createTeacher(payload: {
  full_name: string;
  email: string;
  phone?: string;
  staff_id: string;
  department: string;
  employment_status?: EmploymentStatus;
}): Promise<{ success: boolean; data?: Teacher; error?: string }> {
  try {
    const profileId = crypto.randomUUID();

    const { error: profileError } = await supabase.from("profiles").insert({
      id: profileId,
      email: payload.email,
      full_name: payload.full_name,
      phone: payload.phone || null,
      role: "TEACHER" as UserRole,
      status: "ACTIVE" as AccountStatus,
    });

    if (profileError) throw profileError;

    const { data: teacherData, error: teacherError } = await supabase
      .from("teachers")
      .insert({
        profile_id: profileId,
        staff_id: payload.staff_id,
        department: payload.department,
        employment_status: payload.employment_status || "FULL_TIME",
        status: "ACTIVE" as AccountStatus,
      })
      .select("*, profile:profiles(*)")
      .single();

    if (teacherError) throw teacherError;

    await logAuditEvent({
      action: "USER_CREATED",
      entityType: "teacher",
      entityId: teacherData?.id,
      newValues: { staff_id: payload.staff_id, department: payload.department },
    });

    return { success: true, data: teacherData as unknown as Teacher };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create teacher";
    return { success: false, error: msg };
  }
}

export async function updateTeacher(
  id: string,
  profileId: string,
  payload: {
    full_name: string;
    phone?: string | null;
    department: string;
    employment_status: EmploymentStatus;
    status: AccountStatus;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const [teacherRes, profileRes] = await Promise.all([
      supabase
        .from("teachers")
        .update({
          department: payload.department,
          employment_status: payload.employment_status,
          status: payload.status,
        })
        .eq("id", id),
      supabase
        .from("profiles")
        .update({
          full_name: payload.full_name,
          phone: payload.phone,
          status: payload.status,
        })
        .eq("id", profileId),
    ]);

    if (teacherRes.error) throw teacherRes.error;
    if (profileRes.error) throw profileRes.error;

    await logAuditEvent({
      action: "TEACHER_UPDATED",
      entityType: "teacher",
      entityId: id,
      newValues: payload,
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update teacher";
    return { success: false, error: msg };
  }
}

// ==============================================================================
// 5. CLASSES MANAGEMENT
// ==============================================================================

export interface SchoolClassWithCount extends SchoolClass {
  student_count?: number;
}

export async function fetchClasses(): Promise<SchoolClassWithCount[]> {
  try {
    const { data: classesData, error: classesError } = await supabase
      .from("classes")
      .select("*")
      .order("grade_level", { ascending: true })
      .order("name", { ascending: true });

    if (classesError) throw classesError;
    const classes = (classesData as unknown as SchoolClass[]) || [];

    // Fetch student counts per class
    const { data: enrollments } = await supabase
      .from("student_enrollments")
      .select("class_id")
      .eq("status", "ACTIVE");

    const counts: Record<string, number> = {};
    enrollments?.forEach((e) => {
      counts[e.class_id] = (counts[e.class_id] || 0) + 1;
    });

    return classes.map((c) => ({
      ...c,
      student_count: counts[c.id] || 0,
    }));
  } catch (err) {
    console.error("[SchoolService] Error fetching classes:", err);
    return [];
  }
}

export async function createClass(payload: {
  name: string;
  grade_level: number;
  arm?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("classes").insert({
      name: payload.name,
      grade_level: payload.grade_level,
      arm: payload.arm || null,
    });

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create class";
    return { success: false, error: msg };
  }
}

export async function updateClass(
  id: string,
  payload: { name: string; grade_level: number; arm?: string | null },
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("classes")
      .update({
        name: payload.name,
        grade_level: payload.grade_level,
        arm: payload.arm,
      })
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update class";
    return { success: false, error: msg };
  }
}

// ==============================================================================
// 6. SUBJECTS MANAGEMENT
// ==============================================================================

export async function fetchSubjects(): Promise<Subject[]> {
  try {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .order("department", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return (data as unknown as Subject[]) || [];
  } catch (err) {
    console.error("[SchoolService] Error fetching subjects:", err);
    return [];
  }
}

export async function createSubject(payload: {
  code: string;
  name: string;
  department: string;
  description?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("subjects").insert({
      code: payload.code.toUpperCase().trim(),
      name: payload.name.trim(),
      department: payload.department.trim(),
      description: payload.description || null,
    });

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create subject";
    return { success: false, error: msg };
  }
}

export async function updateSubject(
  id: string,
  payload: { code: string; name: string; department: string; description?: string | null },
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("subjects")
      .update({
        code: payload.code.toUpperCase().trim(),
        name: payload.name.trim(),
        department: payload.department.trim(),
        description: payload.description,
      })
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update subject";
    return { success: false, error: msg };
  }
}

// ==============================================================================
// 7. ACADEMIC SESSIONS & TERMS
// ==============================================================================

export async function fetchAcademicSessions(): Promise<AcademicSession[]> {
  try {
    const { data, error } = await supabase
      .from("academic_sessions")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) throw error;
    return (data as unknown as AcademicSession[]) || [];
  } catch (err) {
    console.error("[SchoolService] Error fetching academic sessions:", err);
    return [];
  }
}

export async function createAcademicSession(payload: {
  name: string;
  start_date: string;
  end_date: string;
  is_current?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (payload.is_current) {
      await supabase
        .from("academic_sessions")
        .update({ is_current: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");
    }

    const { error } = await supabase.from("academic_sessions").insert({
      name: payload.name,
      start_date: payload.start_date,
      end_date: payload.end_date,
      is_current: payload.is_current || false,
    });

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create academic session";
    return { success: false, error: msg };
  }
}

export async function setCurrentAcademicSession(
  sessionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase.from("academic_sessions").update({ is_current: false }).neq("id", sessionId);
    const { error } = await supabase
      .from("academic_sessions")
      .update({ is_current: true })
      .eq("id", sessionId);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to set active session";
    return { success: false, error: msg };
  }
}

export async function fetchTerms(sessionId?: string): Promise<Term[]> {
  try {
    let query = supabase
      .from("terms")
      .select("*, academic_session:academic_sessions(*)")
      .order("start_date", { ascending: true });

    if (sessionId) {
      query = query.eq("academic_session_id", sessionId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as Term[]) || [];
  } catch (err) {
    console.error("[SchoolService] Error fetching terms:", err);
    return [];
  }
}

export async function createTerm(payload: {
  academic_session_id: string;
  name: TermName;
  start_date: string;
  end_date: string;
  is_current?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (payload.is_current) {
      await supabase
        .from("terms")
        .update({ is_current: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");
    }

    const { error } = await supabase.from("terms").insert({
      academic_session_id: payload.academic_session_id,
      name: payload.name,
      start_date: payload.start_date,
      end_date: payload.end_date,
      is_current: payload.is_current || false,
    });

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create term";
    return { success: false, error: msg };
  }
}

export async function setCurrentTerm(
  termId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase.from("terms").update({ is_current: false }).neq("id", termId);
    const { error } = await supabase.from("terms").update({ is_current: true }).eq("id", termId);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to set active term";
    return { success: false, error: msg };
  }
}

// ==============================================================================
// 8. STUDENT ENROLLMENTS
// ==============================================================================

export async function fetchStudentEnrollments(
  classId?: string,
  sessionId?: string,
  termId?: string,
): Promise<StudentEnrollment[]> {
  try {
    let query = supabase
      .from("student_enrollments")
      .select(
        "*, student:students(*, profile:profiles(*)), school_class:classes(*), academic_session:academic_sessions(*), term:terms(*)",
      )
      .order("created_at", { ascending: false });

    if (classId) query = query.eq("class_id", classId);
    if (sessionId) query = query.eq("academic_session_id", sessionId);
    if (termId) query = query.eq("term_id", termId);

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as StudentEnrollment[]) || [];
  } catch (err) {
    console.error("[SchoolService] Error fetching enrollments:", err);
    return [];
  }
}

export async function createStudentEnrollment(payload: {
  student_id: string;
  class_id: string;
  academic_session_id: string;
  term_id: string;
  status?: EnrollmentStatus;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("student_enrollments").insert({
      student_id: payload.student_id,
      class_id: payload.class_id,
      academic_session_id: payload.academic_session_id,
      term_id: payload.term_id,
      status: payload.status || "ACTIVE",
    });

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create enrollment record";
    return { success: false, error: msg };
  }
}

// ==============================================================================
// 9. TEACHER ASSIGNMENTS
// ==============================================================================

export async function fetchTeacherAssignments(
  teacherId?: string,
  classId?: string,
): Promise<TeacherAssignment[]> {
  try {
    let query = supabase
      .from("teacher_assignments")
      .select(
        "*, teacher:teachers(*, profile:profiles(*)), subject:subjects(*), school_class:classes(*), academic_session:academic_sessions(*), term:terms(*)",
      )
      .order("created_at", { ascending: false });

    if (teacherId) query = query.eq("teacher_id", teacherId);
    if (classId) query = query.eq("class_id", classId);

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as TeacherAssignment[]) || [];
  } catch (err) {
    console.error("[SchoolService] Error fetching teacher assignments:", err);
    return [];
  }
}

export async function createTeacherAssignment(payload: {
  teacher_id: string;
  subject_id: string;
  class_id: string;
  academic_session_id: string;
  term_id: string;
  is_class_teacher?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("teacher_assignments").insert({
      teacher_id: payload.teacher_id,
      subject_id: payload.subject_id,
      class_id: payload.class_id,
      academic_session_id: payload.academic_session_id,
      term_id: payload.term_id,
      is_class_teacher: payload.is_class_teacher || false,
    });

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to assign teacher";
    return { success: false, error: msg };
  }
}

export async function deleteTeacherAssignment(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("teacher_assignments").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete assignment";
    return { success: false, error: msg };
  }
}

// ==============================================================================
// 10. TEACHER-SPECIFIC VIEWS
// ==============================================================================

export interface TeacherDashboardData {
  teacher: Teacher | null;
  assignedClasses: SchoolClass[];
  assignedSubjects: Subject[];
  assignments: TeacherAssignment[];
  totalStudents: number;
  activeSession: AcademicSession | null;
  activeTerm: Term | null;
}

export async function fetchTeacherPortalData(profileId: string): Promise<TeacherDashboardData> {
  try {
    // 1. Get Teacher by profile_id
    const { data: teacherData, error: teacherError } = await supabase
      .from("teachers")
      .select("*, profile:profiles(*)")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (teacherError) throw teacherError;
    const teacher = (teacherData as unknown as Teacher) || null;

    if (!teacher) {
      return {
        teacher: null,
        assignedClasses: [],
        assignedSubjects: [],
        assignments: [],
        totalStudents: 0,
        activeSession: null,
        activeTerm: null,
      };
    }

    // 2. Get Teacher Assignments
    const { data: assignmentsData } = await supabase
      .from("teacher_assignments")
      .select(
        "*, subject:subjects(*), school_class:classes(*), academic_session:academic_sessions(*), term:terms(*)",
      )
      .eq("teacher_id", teacher.id);

    const assignments = (assignmentsData as unknown as TeacherAssignment[]) || [];

    // Extract unique classes and subjects
    const classMap = new Map<string, SchoolClass>();
    const subjectMap = new Map<string, Subject>();
    const classIds = new Set<string>();

    assignments.forEach((a) => {
      if (a.school_class) {
        classMap.set(a.school_class.id, a.school_class);
        classIds.add(a.school_class.id);
      }
      if (a.subject) {
        subjectMap.set(a.subject.id, a.subject);
      }
    });

    // 3. Count students enrolled in those classes
    let totalStudents = 0;
    if (classIds.size > 0) {
      const { count } = await supabase
        .from("student_enrollments")
        .select("id", { count: "exact", head: true })
        .in("class_id", Array.from(classIds))
        .eq("status", "ACTIVE");
      totalStudents = count || 0;
    }

    // 4. Current session & term
    const [sessionRes, termRes] = await Promise.all([
      supabase.from("academic_sessions").select("*").eq("is_current", true).maybeSingle(),
      supabase
        .from("terms")
        .select("*, academic_session:academic_sessions(*)")
        .eq("is_current", true)
        .maybeSingle(),
    ]);

    return {
      teacher,
      assignedClasses: Array.from(classMap.values()),
      assignedSubjects: Array.from(subjectMap.values()),
      assignments,
      totalStudents,
      activeSession: (sessionRes.data as unknown as AcademicSession) || null,
      activeTerm: (termRes.data as unknown as Term) || null,
    };
  } catch (err) {
    console.error("[SchoolService] Error fetching teacher portal data:", err);
    return {
      teacher: null,
      assignedClasses: [],
      assignedSubjects: [],
      assignments: [],
      totalStudents: 0,
      activeSession: null,
      activeTerm: null,
    };
  }
}

export async function fetchTeacherStudents(teacherProfileId: string): Promise<Student[]> {
  try {
    // 1. Get teacher id
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("profile_id", teacherProfileId)
      .maybeSingle();

    if (!teacher) return [];

    // 2. Get assigned class ids
    const { data: assignments } = await supabase
      .from("teacher_assignments")
      .select("class_id")
      .eq("teacher_id", teacher.id);

    const classIds = assignments?.map((a) => a.class_id) || [];
    if (classIds.length === 0) return [];

    // 3. Get students enrolled in those classes
    const { data: enrollments } = await supabase
      .from("student_enrollments")
      .select("student:students(*, profile:profiles(*))")
      .in("class_id", classIds)
      .eq("status", "ACTIVE");

    const students: Student[] = [];
    const seen = new Set<string>();

    enrollments?.forEach((e) => {
      const st = e.student as unknown as Student;
      if (st && !seen.has(st.id)) {
        seen.add(st.id);
        students.push(st);
      }
    });

    return students;
  } catch (err) {
    console.error("[SchoolService] Error fetching teacher students:", err);
    return [];
  }
}

// ==============================================================================
// 11. STUDENT-SPECIFIC VIEWS
// ==============================================================================

export interface StudentDashboardData {
  student: Student | null;
  currentEnrollment: StudentEnrollment | null;
  enrollmentHistory: StudentEnrollment[];
  classmates: Student[];
  subjects: Subject[];
  activeSession: AcademicSession | null;
  activeTerm: Term | null;
}

export async function fetchStudentPortalData(profileId: string): Promise<StudentDashboardData> {
  try {
    // 1. Get Student by profile_id
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("*, profile:profiles(*)")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (studentError) throw studentError;
    const student = (studentData as unknown as Student) || null;

    if (!student) {
      return {
        student: null,
        currentEnrollment: null,
        enrollmentHistory: [],
        classmates: [],
        subjects: [],
        activeSession: null,
        activeTerm: null,
      };
    }

    // 2. Get enrollments
    const { data: enrollmentsData } = await supabase
      .from("student_enrollments")
      .select("*, school_class:classes(*), academic_session:academic_sessions(*), term:terms(*)")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false });

    const enrollments = (enrollmentsData as unknown as StudentEnrollment[]) || [];
    const currentEnrollment =
      enrollments.find((e) => e.status === "ACTIVE") || enrollments[0] || null;

    // 3. Classmates in current class
    let classmates: Student[] = [];
    if (currentEnrollment?.class_id) {
      const { data: classEnrollments } = await supabase
        .from("student_enrollments")
        .select("student:students(*, profile:profiles(*))")
        .eq("class_id", currentEnrollment.class_id)
        .eq("status", "ACTIVE")
        .neq("student_id", student.id);

      classmates =
        (classEnrollments
          ?.map((ce) => ce.student as unknown as Student)
          .filter(Boolean) as Student[]) || [];
    }

    // 4. Subjects for this student / class
    let subjects: Subject[] = [];
    if (currentEnrollment?.class_id) {
      const { data: assignments } = await supabase
        .from("teacher_assignments")
        .select("subject:subjects(*)")
        .eq("class_id", currentEnrollment.class_id);

      const subMap = new Map<string, Subject>();
      assignments?.forEach((a) => {
        const sub = a.subject as unknown as Subject;
        if (sub) subMap.set(sub.id, sub);
      });

      // If no assignments mapped yet, provide foundational subjects
      if (subMap.size === 0) {
        const { data: allSubs } = await supabase.from("subjects").select("*").limit(8);
        subjects = (allSubs as unknown as Subject[]) || [];
      } else {
        subjects = Array.from(subMap.values());
      }
    }

    // 5. Active session and term
    const [sessionRes, termRes] = await Promise.all([
      supabase.from("academic_sessions").select("*").eq("is_current", true).maybeSingle(),
      supabase
        .from("terms")
        .select("*, academic_session:academic_sessions(*)")
        .eq("is_current", true)
        .maybeSingle(),
    ]);

    return {
      student,
      currentEnrollment,
      enrollmentHistory: enrollments,
      classmates,
      subjects,
      activeSession: (sessionRes.data as unknown as AcademicSession) || null,
      activeTerm: (termRes.data as unknown as Term) || null,
    };
  } catch (err) {
    console.error("[SchoolService] Error fetching student portal data:", err);
    return {
      student: null,
      currentEnrollment: null,
      enrollmentHistory: [],
      classmates: [],
      subjects: [],
      activeSession: null,
      activeTerm: null,
    };
  }
}

export async function updateTeacherProfile(
  profileId: string,
  teacherId: string,
  payload: { full_name?: string; phone?: string; qualification?: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    if (payload.full_name || payload.phone) {
      const { error: profError } = await supabase
        .from("profiles")
        .update({
          full_name: payload.full_name?.trim(),
          phone: payload.phone?.trim() || null,
        })
        .eq("id", profileId);

      if (profError) throw profError;
    }

    if (payload.qualification !== undefined) {
      const { error: tchError } = await supabase
        .from("teachers")
        .update({
          qualification: payload.qualification?.trim() || null,
        })
        .eq("id", teacherId);

      if (tchError) throw tchError;
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update profile";
    return { success: false, error: msg };
  }
}

export async function updateStudentSelfProfile(
  profileId: string,
  payload: { phone?: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        phone: payload.phone?.trim() || null,
      })
      .eq("id", profileId);

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update profile";
    return { success: false, error: msg };
  }
}

// ==============================================================================
// 12. PHASE 4 ADMISSIONS MANAGEMENT
// ==============================================================================

export async function fetchAdmissionsStats(): Promise<AdmissionsStats> {
  try {
    const [
      allAppsRes,
      draftRes,
      submittedRes,
      underReviewRes,
      verifRes,
      approvedRes,
      rejectedRes,
      waitlistedRes,
      withdrawnRes,
      convertedRes,
      recentAppsRes,
      classesRes,
    ] = await Promise.all([
      supabase.from("applications").select("id", { count: "exact", head: true }),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "DRAFT"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "SUBMITTED"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "UNDER_REVIEW"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "VERIFICATION_REQUIRED"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "APPROVED"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "REJECTED"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "WAITLISTED"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "WITHDRAWN"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .not("converted_student_id", "is", null),
      supabase
        .from("applications")
        .select("*, desired_class:classes(*), desired_academic_session:academic_sessions(*)")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase.from("classes").select("id, name"),
    ]);

    // Build class breakdown
    const classBreakdown: Array<{ className: string; count: number }> = [];
    if (classesRes.data && classesRes.data.length > 0) {
      const classCounts = await Promise.all(
        classesRes.data.map(async (cls) => {
          const res = await supabase
            .from("applications")
            .select("id", { count: "exact", head: true })
            .eq("desired_class_id", cls.id);
          return {
            className: cls.name,
            count: res.count ?? 0,
          };
        }),
      );
      classBreakdown.push(...classCounts.filter((c) => c.count > 0));
    }

    return {
      totalApplications: allAppsRes.count ?? 0,
      draftCount: draftRes.count ?? 0,
      submittedCount: submittedRes.count ?? 0,
      underReviewCount: underReviewRes.count ?? 0,
      verificationRequiredCount: verifRes.count ?? 0,
      approvedCount: approvedRes.count ?? 0,
      rejectedCount: rejectedRes.count ?? 0,
      waitlistedCount: waitlistedRes.count ?? 0,
      withdrawnCount: withdrawnRes.count ?? 0,
      convertedCount: convertedRes.count ?? 0,
      classBreakdown,
      recentApplications: (recentAppsRes.data as unknown as AdmissionApplication[]) || [],
    };
  } catch (err) {
    console.error("[SchoolService] Error fetching admissions stats:", err);
    return {
      totalApplications: 0,
      draftCount: 0,
      submittedCount: 0,
      underReviewCount: 0,
      verificationRequiredCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      waitlistedCount: 0,
      withdrawnCount: 0,
      convertedCount: 0,
      classBreakdown: [],
      recentApplications: [],
    };
  }
}

export async function fetchApplications(options?: {
  search?: string;
  statusFilter?: ApplicationStatus | "ALL";
  classFilter?: string | "ALL";
  sessionFilter?: string | "ALL";
}): Promise<AdmissionApplication[]> {
  try {
    let query = supabase
      .from("applications")
      .select(
        `
        *,
        desired_class:classes(*),
        desired_academic_session:academic_sessions(*),
        reviewer:profiles!applications_reviewed_by_fkey(*),
        converted_student:students(*)
      `,
      )
      .order("created_at", { ascending: false });

    if (options?.statusFilter && options.statusFilter !== "ALL") {
      query = query.eq("status", options.statusFilter);
    }
    if (options?.classFilter && options.classFilter !== "ALL") {
      query = query.eq("desired_class_id", options.classFilter);
    }
    if (options?.sessionFilter && options.sessionFilter !== "ALL") {
      query = query.eq("desired_academic_session_id", options.sessionFilter);
    }
    if (options?.search && options.search.trim()) {
      const s = options.search.trim();
      query = query.or(
        `application_number.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,guardian_name.ilike.%${s}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as AdmissionApplication[]) || [];
  } catch (err) {
    console.error("[SchoolService] Error fetching applications:", err);
    return [];
  }
}

export async function fetchApplicationById(id: string): Promise<AdmissionApplication | null> {
  try {
    const { data, error } = await supabase
      .from("applications")
      .select(
        `
        *,
        desired_class:classes(*),
        desired_academic_session:academic_sessions(*),
        reviewer:profiles!applications_reviewed_by_fkey(*),
        converted_student:students(*),
        reviews:application_reviews(*, reviewer:profiles(*)),
        documents:application_documents(*, verifier:profiles(*))
      `,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as AdmissionApplication) || null;
  } catch (err) {
    console.error("[SchoolService] Error fetching application by ID:", err);
    return null;
  }
}

export async function fetchApplicationByNumberAndEmail(
  applicationNumber: string,
  email: string,
): Promise<AdmissionApplication | null> {
  try {
    const { data, error } = await supabase
      .from("applications")
      .select(
        `
        *,
        desired_class:classes(*),
        desired_academic_session:academic_sessions(*),
        documents:application_documents(*),
        reviews:application_reviews(*, reviewer:profiles(*))
      `,
      )
      .ilike("application_number", applicationNumber.trim())
      .ilike("email", email.trim())
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as AdmissionApplication) || null;
  } catch (err) {
    console.error("[SchoolService] Error tracking application:", err);
    return null;
  }
}

export async function createApplication(payload: {
  first_name: string;
  last_name: string;
  other_name?: string;
  date_of_birth: string;
  gender: Gender;
  email: string;
  phone: string;
  address?: string;
  guardian_name: string;
  guardian_relationship: string;
  guardian_phone: string;
  guardian_email?: string;
  previous_school?: string;
  previous_class?: string;
  previous_grade_average?: string;
  desired_class_id: string;
  desired_academic_session_id: string;
  applicant_profile_id?: string;
  status?: ApplicationStatus;
}): Promise<{ success: boolean; data?: AdmissionApplication; error?: string }> {
  try {
    const isSubmitted = payload.status === "SUBMITTED" || !payload.status;
    const finalStatus: ApplicationStatus = payload.status || "SUBMITTED";

    const { data, error } = await supabase
      .from("applications")
      .insert({
        first_name: payload.first_name.trim(),
        last_name: payload.last_name.trim(),
        other_name: payload.other_name?.trim() || null,
        date_of_birth: payload.date_of_birth,
        gender: payload.gender,
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone.trim(),
        address: payload.address?.trim() || null,
        guardian_name: payload.guardian_name.trim(),
        guardian_relationship: payload.guardian_relationship.trim(),
        guardian_phone: payload.guardian_phone.trim(),
        guardian_email: payload.guardian_email?.trim() || null,
        previous_school: payload.previous_school?.trim() || null,
        previous_class: payload.previous_class?.trim() || null,
        previous_grade_average: payload.previous_grade_average?.trim() || null,
        desired_class_id: payload.desired_class_id,
        desired_academic_session_id: payload.desired_academic_session_id,
        applicant_profile_id: payload.applicant_profile_id || null,
        status: finalStatus,
        submission_date: isSubmitted ? new Date().toISOString() : null,
      })
      .select("*, desired_class:classes(*), desired_academic_session:academic_sessions(*)")
      .single();

    if (error) throw error;

    await logAuditEvent({
      action: isSubmitted ? "APPLICATION_SUBMITTED" : "APPLICATION_CREATED",
      entityType: "application",
      entityId: data.id,
      newValues: {
        application_number: data.application_number,
        email: data.email,
        status: finalStatus,
      },
    });

    return { success: true, data: data as unknown as AdmissionApplication };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create application";
    return { success: false, error: msg };
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
  decisionReason?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "APPROVED" || newStatus === "REJECTED" || newStatus === "WAITLISTED") {
      updatePayload.reviewed_by = user?.id || null;
      updatePayload.reviewed_at = new Date().toISOString();
      if (decisionReason) {
        updatePayload.decision_reason = decisionReason.trim();
      }
    } else if (newStatus === "UNDER_REVIEW") {
      updatePayload.reviewed_by = user?.id || null;
      updatePayload.reviewed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("applications")
      .update(updatePayload)
      .eq("id", applicationId);

    if (error) throw error;

    await logAuditEvent({
      action: `APPLICATION_STATUS_${newStatus}`,
      entityType: "application",
      entityId: applicationId,
      newValues: { status: newStatus, decision_reason: decisionReason },
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update application status";
    return { success: false, error: msg };
  }
}

export async function addApplicationReviewNote(
  applicationId: string,
  note: string,
  isInternal: boolean = true,
): Promise<{ success: boolean; data?: ApplicationReview; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Authenticated user required to add review notes");

    const { data, error } = await supabase
      .from("application_reviews")
      .insert({
        application_id: applicationId,
        reviewer_id: user.id,
        note: note.trim(),
        is_internal: isInternal,
      })
      .select("*, reviewer:profiles(*)")
      .single();

    if (error) throw error;

    await logAuditEvent({
      action: "APPLICATION_REVIEWED",
      entityType: "application",
      entityId: applicationId,
      newValues: { is_internal: isInternal, note_preview: note.substring(0, 50) },
    });

    return { success: true, data: data as unknown as ApplicationReview };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to add review note";
    return { success: false, error: msg };
  }
}

export async function verifyApplicationDocument(
  documentId: string,
  isVerified: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("application_documents")
      .update({
        is_verified: isVerified,
        verified_by: isVerified ? user?.id || null : null,
        verified_at: isVerified ? new Date().toISOString() : null,
      })
      .eq("id", documentId);

    if (error) throw error;

    await logAuditEvent({
      action: isVerified ? "DOCUMENT_VERIFIED" : "DOCUMENT_UNVERIFIED",
      entityType: "application_document",
      entityId: documentId,
      newValues: { is_verified: isVerified },
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to verify document";
    return { success: false, error: msg };
  }
}

export async function uploadApplicationDocument(
  applicationId: string,
  documentType: AdmissionDocType,
  file: File,
): Promise<{ success: boolean; data?: ApplicationDocument; error?: string }> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${applicationId}/${documentType}_${Date.now()}.${fileExt}`;
    const filePath = `admissions/${fileName}`;

    // Upload to Supabase Storage bucket 'admission-documents'
    const { error: uploadError } = await supabase.storage
      .from("admission-documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.warn(
        "Storage upload error (falling back to placeholder URL if offline):",
        uploadError,
      );
    }

    const { data: urlData } = supabase.storage.from("admission-documents").getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl || `/uploads/admissions/${file.name}`;

    // Insert record in application_documents
    const { data, error: dbError } = await supabase
      .from("application_documents")
      .insert({
        application_id: applicationId,
        document_type: documentType,
        file_name: file.name,
        file_url: publicUrl,
        file_size_bytes: file.size,
        mime_type: file.type,
        is_verified: false,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    await logAuditEvent({
      action: "DOCUMENT_UPLOADED",
      entityType: "application_document",
      entityId: data.id,
      newValues: {
        application_id: applicationId,
        document_type: documentType,
        file_name: file.name,
      },
    });

    return { success: true, data: data as unknown as ApplicationDocument };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to upload document";
    return { success: false, error: msg };
  }
}

export async function convertApplicationToStudent(
  applicationId: string,
  payload?: { term_id?: string; arm?: string },
): Promise<{
  success: boolean;
  studentId?: string;
  admissionNumber?: string;
  error?: string;
}> {
  try {
    // 1. Fetch application details
    const app = await fetchApplicationById(applicationId);
    if (!app) throw new Error("Application record not found");

    if (app.status !== "APPROVED") {
      throw new Error(
        `Cannot convert application. Status must be APPROVED (Current status: ${app.status})`,
      );
    }

    if (app.converted_student_id) {
      throw new Error(
        `Application has already been converted to student record ID: ${app.converted_student_id}`,
      );
    }

    // Try stored procedure first if available in DB
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "convert_application_to_student",
        {
          p_application_id: applicationId,
          p_term_id: payload?.term_id || null,
        },
      );

      if (!rpcError && rpcData?.success) {
        return {
          success: true,
          studentId: rpcData.student_id,
          admissionNumber: rpcData.admission_number,
        };
      }
    } catch (rpcEx) {
      console.warn(
        "[SchoolService] RPC convert_application_to_student fallback to client transaction:",
        rpcEx,
      );
    }

    // Client transaction fallback:
    // 2. Generate unique admission number
    const sessionYear =
      app.desired_academic_session?.name?.split("/")[0] || new Date().getFullYear().toString();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const admissionNo = `MIS/${sessionYear}/${randomSeq}`;

    // 3. Establish profile
    let targetProfileId = app.applicant_profile_id;
    if (!targetProfileId) {
      // Check if profile exists by email
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", app.email)
        .maybeSingle();

      if (existingProfile) {
        targetProfileId = existingProfile.id;
      } else {
        targetProfileId = crypto.randomUUID();
        await supabase.from("profiles").insert({
          id: targetProfileId,
          email: app.email,
          full_name: `${app.first_name} ${app.last_name}`.trim(),
          phone: app.phone,
          role: "STUDENT" as UserRole,
          status: "ACTIVE" as AccountStatus,
        });
      }
    }

    // 4. Insert Student record
    const { data: newStudent, error: studentError } = await supabase
      .from("students")
      .insert({
        profile_id: targetProfileId,
        admission_number: admissionNo,
        first_name: app.first_name,
        last_name: app.last_name,
        other_name: app.other_name || null,
        date_of_birth: app.date_of_birth,
        gender: app.gender,
        admission_status: "ADMITTED" as AdmissionStatus,
        status: "ACTIVE" as AccountStatus,
      })
      .select()
      .single();

    if (studentError) throw studentError;

    // 5. Identify target term for enrollment
    let targetTermId = payload?.term_id;
    if (!targetTermId) {
      const { data: terms } = await supabase
        .from("terms")
        .select("id")
        .eq("academic_session_id", app.desired_academic_session_id)
        .order("start_date", { ascending: true })
        .limit(1);

      if (terms && terms.length > 0) {
        targetTermId = terms[0].id;
      }
    }

    // 6. Create enrollment record
    if (targetTermId) {
      await supabase.from("student_enrollments").insert({
        student_id: newStudent.id,
        class_id: app.desired_class_id,
        academic_session_id: app.desired_academic_session_id,
        term_id: targetTermId,
        enrollment_date: new Date().toISOString().split("T")[0],
        status: "ACTIVE" as EnrollmentStatus,
      });
    }

    // 7. Update Application with converted student ID
    const { error: updateAppError } = await supabase
      .from("applications")
      .update({
        converted_student_id: newStudent.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateAppError) throw updateAppError;

    // 8. Log Audit Event
    await logAuditEvent({
      action: "STUDENT_CONVERTED_FROM_APPLICATION",
      entityType: "application",
      entityId: applicationId,
      oldValues: { status: app.status, application_number: app.application_number },
      newValues: {
        student_id: newStudent.id,
        admission_number: admissionNo,
        class_id: app.desired_class_id,
      },
    });

    return {
      success: true,
      studentId: newStudent.id,
      admissionNumber: admissionNo,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to convert application to student";
    return { success: false, error: msg };
  }
}

// ==============================================================================
// 11. CBT EXAMINATION MANAGEMENT SERVICE (PHASE 5)
// ==============================================================================

export interface ExamFilterOptions {
  search?: string;
  status?: ExamStatus;
  classId?: string;
  subjectId?: string;
  sessionId?: string;
  termId?: string;
  teacherProfileId?: string;
}

export async function fetchExaminations(filters?: ExamFilterOptions): Promise<Examination[]> {
  try {
    let query = supabase
      .from("examinations")
      .select(
        `
        *,
        subject:subjects(*),
        school_class:classes(*),
        academic_session:academic_sessions(*),
        term:terms(*),
        creator:profiles!examinations_created_by_fkey(*)
      `,
      )
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.classId) {
      query = query.eq("class_id", filters.classId);
    }
    if (filters?.subjectId) {
      query = query.eq("subject_id", filters.subjectId);
    }
    if (filters?.sessionId) {
      query = query.eq("academic_session_id", filters.sessionId);
    }
    if (filters?.termId) {
      query = query.eq("term_id", filters.termId);
    }
    if (filters?.search && filters.search.trim()) {
      query = query.ilike("title", `%${filters.search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const exams = (data as unknown as Examination[]) || [];

    // Attach questions and attempts counts for rich display
    const examsWithCounts = await Promise.all(
      exams.map(async (exam) => {
        const [qCountRes, aCountRes] = await Promise.all([
          supabase
            .from("examination_questions")
            .select("id", { count: "exact", head: true })
            .eq("examination_id", exam.id)
            .eq("is_active", true),
          supabase
            .from("examination_attempts")
            .select("id", { count: "exact", head: true })
            .eq("examination_id", exam.id),
        ]);

        return {
          ...exam,
          questions_count: qCountRes.count ?? exam.total_questions ?? 0,
          attempts_count: aCountRes.count ?? 0,
        };
      }),
    );

    return examsWithCounts;
  } catch (err) {
    console.error("[SchoolService] Error fetching examinations:", err);
    return [];
  }
}

export async function fetchExaminationById(examId: string): Promise<Examination | null> {
  try {
    const { data, error } = await supabase
      .from("examinations")
      .select(
        `
        *,
        subject:subjects(*),
        school_class:classes(*),
        academic_session:academic_sessions(*),
        term:terms(*),
        creator:profiles!examinations_created_by_fkey(*)
      `,
      )
      .eq("id", examId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const [qCountRes, aCountRes] = await Promise.all([
      supabase
        .from("examination_questions")
        .select("id", { count: "exact", head: true })
        .eq("examination_id", examId)
        .eq("is_active", true),
      supabase
        .from("examination_attempts")
        .select("id", { count: "exact", head: true })
        .eq("examination_id", examId),
    ]);

    return {
      ...(data as unknown as Examination),
      questions_count: qCountRes.count ?? data.total_questions ?? 0,
      attempts_count: aCountRes.count ?? 0,
    };
  } catch (err) {
    console.error("[SchoolService] Error fetching examination by ID:", err);
    return null;
  }
}

export async function createExamination(data: {
  title: string;
  description?: string | null;
  subject_id: string;
  class_id: string;
  academic_session_id: string;
  term_id: string;
  created_by: string;
  duration_minutes: number;
  pass_mark?: number;
  start_time?: string | null;
  end_time?: string | null;
  status?: ExamStatus;
  is_randomized?: boolean;
}): Promise<{ success: boolean; data?: Examination; error?: string }> {
  try {
    const { data: created, error } = await supabase
      .from("examinations")
      .insert({
        title: data.title.trim(),
        description: data.description?.trim() || null,
        subject_id: data.subject_id,
        class_id: data.class_id,
        academic_session_id: data.academic_session_id,
        term_id: data.term_id,
        created_by: data.created_by,
        duration_minutes: data.duration_minutes || 45,
        pass_mark: data.pass_mark || 50,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        status: data.status || "DRAFT",
        is_randomized: data.is_randomized ?? false,
      })
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent({
      action: "EXAM_CREATED",
      entityType: "examination",
      entityId: created.id,
      newValues: {
        title: data.title,
        class_id: data.class_id,
        subject_id: data.subject_id,
        status: data.status || "DRAFT",
      },
    });

    return { success: true, data: created as unknown as Examination };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create examination";
    return { success: false, error: msg };
  }
}

export async function updateExamination(
  examId: string,
  updates: Partial<Examination>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("examinations")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", examId);

    if (error) throw error;

    await logAuditEvent({
      action: "EXAM_UPDATED",
      entityType: "examination",
      entityId: examId,
      newValues: updates,
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update examination";
    return { success: false, error: msg };
  }
}

export async function publishExamination(
  examId: string,
  newStatus: ExamStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("examinations")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", examId);

    if (error) throw error;

    await logAuditEvent({
      action: `EXAM_${newStatus}`,
      entityType: "examination",
      entityId: examId,
      newValues: { status: newStatus },
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : `Failed to set exam status to ${newStatus}`;
    return { success: false, error: msg };
  }
}

export async function deleteExamination(
  examId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if there are existing student attempts
    const { count } = await supabase
      .from("examination_attempts")
      .select("id", { count: "exact", head: true })
      .eq("examination_id", examId);

    if (count && count > 0) {
      return {
        success: false,
        error:
          "Cannot delete examination with active or completed student attempts. Archive the exam instead.",
      };
    }

    const { error } = await supabase.from("examinations").delete().eq("id", examId);
    if (error) throw error;

    await logAuditEvent({
      action: "EXAM_DELETED",
      entityType: "examination",
      entityId: examId,
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete examination";
    return { success: false, error: msg };
  }
}

// ------------------------------------------------------------------------------
// QUESTIONS & OPTIONS MANAGEMENT (Admin/Teacher Only)
// ------------------------------------------------------------------------------

export async function fetchExamQuestions(examId: string): Promise<ExaminationQuestion[]> {
  try {
    const { data: questions, error } = await supabase
      .from("examination_questions")
      .select("*, options:question_options(*)")
      .eq("examination_id", examId)
      .order("order_index", { ascending: true });

    if (error) throw error;

    return (questions as unknown as ExaminationQuestion[]) || [];
  } catch (err) {
    console.error("[SchoolService] Error fetching exam questions:", err);
    return [];
  }
}

export async function createExamQuestion(
  questionData: {
    examination_id: string;
    question_text: string;
    question_type?: QuestionType;
    marks?: number;
    explanation?: string | null;
    order_index?: number;
  },
  options: Array<{ option_text: string; is_correct: boolean; order_index: number }>,
): Promise<{ success: boolean; data?: ExaminationQuestion; error?: string }> {
  try {
    // 1. Create Question
    const { data: question, error: qError } = await supabase
      .from("examination_questions")
      .insert({
        examination_id: questionData.examination_id,
        question_text: questionData.question_text.trim(),
        question_type: questionData.question_type || "MULTIPLE_CHOICE",
        marks: questionData.marks || 1.0,
        explanation: questionData.explanation?.trim() || null,
        order_index: questionData.order_index || 1,
        is_active: true,
      })
      .select()
      .single();

    if (qError) throw qError;

    // 2. Create Options if provided
    if (options && options.length > 0) {
      const optionsToInsert = options.map((opt, idx) => ({
        question_id: question.id,
        option_text: opt.option_text.trim(),
        is_correct: Boolean(opt.is_correct),
        order_index: opt.order_index || idx + 1,
      }));

      const { error: optError } = await supabase.from("question_options").insert(optionsToInsert);
      if (optError) throw optError;
    }

    // 3. Recalculate exam total questions & marks
    const { data: allQuestions } = await supabase
      .from("examination_questions")
      .select("marks")
      .eq("examination_id", questionData.examination_id)
      .eq("is_active", true);

    if (allQuestions) {
      const totalMarks = allQuestions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
      await supabase
        .from("examinations")
        .update({
          total_questions: allQuestions.length,
          total_marks: totalMarks,
          updated_at: new Date().toISOString(),
        })
        .eq("id", questionData.examination_id);
    }

    await logAuditEvent({
      action: "QUESTION_CREATED",
      entityType: "examination_question",
      entityId: question.id,
      newValues: {
        examination_id: questionData.examination_id,
        question_type: questionData.question_type,
        marks: questionData.marks,
      },
    });

    return { success: true, data: question as unknown as ExaminationQuestion };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create question";
    return { success: false, error: msg };
  }
}

export async function updateExamQuestion(
  questionId: string,
  examId: string,
  questionData: Partial<ExaminationQuestion>,
  options?: Array<{ id?: string; option_text: string; is_correct: boolean; order_index: number }>,
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Update question
    const { error: qError } = await supabase
      .from("examination_questions")
      .update({
        ...questionData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", questionId);

    if (qError) throw qError;

    // 2. Update options if provided
    if (options && options.length > 0) {
      // Delete existing and re-insert for cleanly synced state
      await supabase.from("question_options").delete().eq("question_id", questionId);

      const optionsToInsert = options.map((opt, idx) => ({
        question_id: questionId,
        option_text: opt.option_text.trim(),
        is_correct: Boolean(opt.is_correct),
        order_index: opt.order_index || idx + 1,
      }));

      const { error: optError } = await supabase.from("question_options").insert(optionsToInsert);
      if (optError) throw optError;
    }

    // 3. Recalculate exam total questions & marks
    const { data: allQuestions } = await supabase
      .from("examination_questions")
      .select("marks")
      .eq("examination_id", examId)
      .eq("is_active", true);

    if (allQuestions) {
      const totalMarks = allQuestions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
      await supabase
        .from("examinations")
        .update({
          total_questions: allQuestions.length,
          total_marks: totalMarks,
          updated_at: new Date().toISOString(),
        })
        .eq("id", examId);
    }

    await logAuditEvent({
      action: "QUESTION_UPDATED",
      entityType: "examination_question",
      entityId: questionId,
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update question";
    return { success: false, error: msg };
  }
}

export async function deleteExamQuestion(
  questionId: string,
  examId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("examination_questions").delete().eq("id", questionId);
    if (error) throw error;

    // Recalculate exam total questions & marks
    const { data: allQuestions } = await supabase
      .from("examination_questions")
      .select("marks")
      .eq("examination_id", examId)
      .eq("is_active", true);

    if (allQuestions) {
      const totalMarks = allQuestions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
      await supabase
        .from("examinations")
        .update({
          total_questions: allQuestions.length,
          total_marks: totalMarks,
          updated_at: new Date().toISOString(),
        })
        .eq("id", examId);
    }

    await logAuditEvent({
      action: "QUESTION_DELETED",
      entityType: "examination_question",
      entityId: questionId,
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete question";
    return { success: false, error: msg };
  }
}

// ------------------------------------------------------------------------------
// STUDENT CBT EXAM ENGINE & EXECUTION
// ------------------------------------------------------------------------------

export interface StudentEligibleExam extends Examination {
  attempt?: ExaminationAttempt | null;
  attemptStatus: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";
  isEligible: boolean;
}

export async function fetchStudentEligibleExams(
  studentProfileId: string,
): Promise<StudentEligibleExam[]> {
  try {
    // 1. Get student record
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("profile_id", studentProfileId)
      .maybeSingle();

    if (!student) return [];

    // 2. Get student's active enrollments
    const { data: enrollments } = await supabase
      .from("student_enrollments")
      .select("class_id, academic_session_id, term_id")
      .eq("student_id", student.id)
      .eq("status", "ACTIVE");

    if (!enrollments || enrollments.length === 0) return [];

    // Extract enrolled class IDs
    const classIds = enrollments.map((e) => e.class_id);

    // 3. Fetch published or active or recently closed exams for these classes
    const { data: exams, error } = await supabase
      .from("examinations")
      .select(
        `
        *,
        subject:subjects(*),
        school_class:classes(*),
        academic_session:academic_sessions(*),
        term:terms(*)
      `,
      )
      .in("class_id", classIds)
      .in("status", ["PUBLISHED", "ACTIVE", "CLOSED"])
      .order("start_time", { ascending: true });

    if (error) throw error;
    if (!exams) return [];

    // 4. Fetch student's existing attempts for these exams
    const examIds = exams.map((e) => e.id);
    const { data: attempts } = await supabase
      .from("examination_attempts")
      .select("*")
      .eq("student_id", student.id)
      .in("examination_id", examIds);

    const attemptsMap = new Map<string, ExaminationAttempt>();
    attempts?.forEach((att) => {
      attemptsMap.set(att.examination_id, att as unknown as ExaminationAttempt);
    });

    const now = new Date();

    return exams.map((exam) => {
      const existingAttempt = attemptsMap.get(exam.id) || null;
      let attemptStatus: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "EXPIRED" = "NOT_STARTED";

      if (existingAttempt) {
        if (existingAttempt.status === "SUBMITTED") {
          attemptStatus = "SUBMITTED";
        } else if (existingAttempt.status === "EXPIRED") {
          attemptStatus = "EXPIRED";
        } else if (existingAttempt.status === "IN_PROGRESS") {
          // Check if time has expired based on started_at + duration
          const startedAt = new Date(existingAttempt.started_at);
          const expiryTime = new Date(startedAt.getTime() + exam.duration_minutes * 60 * 1000);
          if (now > expiryTime) {
            attemptStatus = "EXPIRED";
          } else {
            attemptStatus = "IN_PROGRESS";
          }
        }
      }

      return {
        ...(exam as unknown as Examination),
        attempt: existingAttempt,
        attemptStatus,
        isEligible: true,
      };
    });
  } catch (err) {
    console.error("[SchoolService] Error fetching student eligible exams:", err);
    return [];
  }
}

export async function startStudentExamAttempt(
  examId: string,
  studentProfileId: string,
): Promise<{
  success: boolean;
  attempt?: ExaminationAttempt;
  error?: string;
  resumed?: boolean;
}> {
  try {
    // 1. Get student ID
    const { data: student, error: sErr } = await supabase
      .from("students")
      .select("id")
      .eq("profile_id", studentProfileId)
      .maybeSingle();

    if (sErr || !student) {
      return { success: false, error: "Student profile not linked to an active student record" };
    }

    // 2. Try RPC start_exam_attempt first
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("start_exam_attempt", {
        p_exam_id: examId,
        p_student_id: student.id,
      });

      if (!rpcError && rpcData) {
        const parsed = typeof rpcData === "string" ? JSON.parse(rpcData) : rpcData;
        if (parsed.success && parsed.attempt) {
          return {
            success: true,
            attempt: parsed.attempt as ExaminationAttempt,
            resumed: parsed.resumed,
          };
        }
        if (!parsed.success) {
          return { success: false, error: parsed.error || "Could not start examination" };
        }
      }
    } catch {
      // Fallback to direct client flow if RPC not registered
    }

    // 3. Client Fallback Flow
    // Fetch exam
    const { data: exam, error: eErr } = await supabase
      .from("examinations")
      .select("*")
      .eq("id", examId)
      .single();

    if (eErr || !exam) return { success: false, error: "Examination not found" };

    if (!["PUBLISHED", "ACTIVE"].includes(exam.status)) {
      return { success: false, error: "Examination is not open for attempts" };
    }

    // Check existing attempt
    const { data: existingAttempt } = await supabase
      .from("examination_attempts")
      .select("*")
      .eq("examination_id", examId)
      .eq("student_id", student.id)
      .maybeSingle();

    if (existingAttempt) {
      if (existingAttempt.status === "SUBMITTED") {
        return { success: false, error: "You have already submitted this examination" };
      }
      return {
        success: true,
        attempt: existingAttempt as unknown as ExaminationAttempt,
        resumed: true,
      };
    }

    // Create attempt
    const { data: newAttempt, error: createErr } = await supabase
      .from("examination_attempts")
      .insert({
        examination_id: examId,
        student_id: student.id,
        started_at: new Date().toISOString(),
        status: "IN_PROGRESS",
        max_possible_score: exam.total_marks || 0,
        is_auto_marked: true,
      })
      .select()
      .single();

    if (createErr) throw createErr;

    return {
      success: true,
      attempt: newAttempt as unknown as ExaminationAttempt,
      resumed: false,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to start exam attempt";
    return { success: false, error: msg };
  }
}

export async function fetchStudentSanitizedQuestions(
  examId: string,
  attemptId: string,
): Promise<SanitizedQuestion[]> {
  try {
    // 1. Try RPC get_student_exam_questions
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_student_exam_questions", {
        p_exam_id: examId,
        p_attempt_id: attemptId,
      });

      if (!rpcError && rpcData) {
        const parsed = typeof rpcData === "string" ? JSON.parse(rpcData) : rpcData;
        if (parsed.success && parsed.questions) {
          return parsed.questions as SanitizedQuestion[];
        }
      }
    } catch {
      // Fallback
    }

    // 2. Direct Query Fallback (Sanitizing in TypeScript: strictly stripping is_correct and explanation)
    const { data: questions, error } = await supabase
      .from("examination_questions")
      .select(
        `
        id,
        question_text,
        question_type,
        marks,
        order_index,
        options:question_options(id, option_text, order_index)
      `,
      )
      .eq("examination_id", examId)
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (error) throw error;
    if (!questions) return [];

    return questions.map((q) => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type as QuestionType,
      marks: Number(q.marks) || 1,
      order_index: q.order_index || 1,
      options: (q.options || [])
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .map((opt) => ({
          id: opt.id,
          option_text: opt.option_text,
          order_index: opt.order_index,
        })),
    }));
  } catch (err) {
    console.error("[SchoolService] Error fetching sanitized questions:", err);
    return [];
  }
}

export async function fetchStudentSavedAnswers(attemptId: string): Promise<Record<string, string>> {
  try {
    const { data: answers, error } = await supabase
      .from("student_answers")
      .select("question_id, selected_option_id, text_response")
      .eq("attempt_id", attemptId);

    if (error) throw error;

    const answerMap: Record<string, string> = {};
    answers?.forEach((ans) => {
      if (ans.selected_option_id) {
        answerMap[ans.question_id] = ans.selected_option_id;
      } else if (ans.text_response) {
        answerMap[ans.question_id] = ans.text_response;
      }
    });

    return answerMap;
  } catch (err) {
    console.error("[SchoolService] Error fetching saved answers:", err);
    return {};
  }
}

export async function saveStudentAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionId: string | null,
  textResponse?: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("student_answers").upsert(
      {
        attempt_id: attemptId,
        question_id: questionId,
        selected_option_id: selectedOptionId,
        text_response: textResponse || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "attempt_id,question_id" },
    );

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save answer";
    return { success: false, error: msg };
  }
}

export async function submitStudentExamAttempt(attemptId: string): Promise<{
  success: boolean;
  totalScore?: number;
  maxScore?: number;
  answeredCount?: number;
  submittedAt?: string;
  error?: string;
}> {
  try {
    // 1. Try RPC submit_exam_attempt
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("submit_exam_attempt", {
        p_attempt_id: attemptId,
      });

      if (!rpcError && rpcData) {
        const parsed = typeof rpcData === "string" ? JSON.parse(rpcData) : rpcData;
        if (parsed.success) {
          return {
            success: true,
            totalScore: parsed.total_score,
            maxScore: parsed.max_possible_score || parsed.max_score,
            answeredCount: parsed.answered_count,
            submittedAt: parsed.submitted_at,
          };
        }
      }
    } catch {
      // Fallback
    }

    // 2. Direct Auto-Marking Fallback
    const { data: attempt, error: aErr } = await supabase
      .from("examination_attempts")
      .select("*, exam:examinations(*)")
      .eq("id", attemptId)
      .single();

    if (aErr || !attempt) return { success: false, error: "Attempt record not found" };

    // Fetch questions + options with is_correct for scoring
    const { data: questions } = await supabase
      .from("examination_questions")
      .select("*, options:question_options(*)")
      .eq("examination_id", attempt.examination_id)
      .eq("is_active", true);

    const { data: answers } = await supabase
      .from("student_answers")
      .select("*")
      .eq("attempt_id", attemptId);

    let totalScore = 0;
    let maxPossibleScore = 0;
    let answeredCount = 0;

    const answerMap = new Map<string, StudentAnswer>();
    answers?.forEach((a) => answerMap.set(a.question_id, a as unknown as StudentAnswer));

    if (questions) {
      for (const q of questions) {
        const marks = Number(q.marks) || 1.0;
        maxPossibleScore += marks;

        const ans = answerMap.get(q.id);
        if (ans && ans.selected_option_id) {
          answeredCount += 1;
          const matchingOption = q.options?.find(
            (o: QuestionOption) => o.id === ans.selected_option_id,
          );
          const isCorrect = Boolean(matchingOption?.is_correct);
          const marksAwarded = isCorrect ? marks : 0;
          totalScore += marksAwarded;

          await supabase
            .from("student_answers")
            .update({
              is_correct: isCorrect,
              marks_awarded: marksAwarded,
              updated_at: new Date().toISOString(),
            })
            .eq("id", ans.id);
        }
      }
    }

    const submittedAt = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from("examination_attempts")
      .update({
        status: "SUBMITTED",
        submitted_at: submittedAt,
        total_score: totalScore,
        max_possible_score: maxPossibleScore,
        updated_at: submittedAt,
      })
      .eq("id", attemptId);

    if (updateErr) throw updateErr;

    await logAuditEvent({
      action: "EXAM_SUBMITTED",
      entityType: "examination_attempt",
      entityId: attemptId,
      newValues: {
        total_score: totalScore,
        max_score: maxPossibleScore,
        answered_count: answeredCount,
        submitted_at: submittedAt,
      },
    });

    return {
      success: true,
      totalScore,
      maxScore: maxPossibleScore,
      answeredCount,
      submittedAt,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to submit examination";
    return { success: false, error: msg };
  }
}

// ------------------------------------------------------------------------------
// LIVE CBT MONITORING STATS (Admin / Teacher)
// ------------------------------------------------------------------------------

export async function fetchCbtMonitoringStats(examId: string): Promise<CbtMonitoringStats | null> {
  try {
    const exam = await fetchExaminationById(examId);
    if (!exam) return null;

    // 1. Total enrolled students for this class and session
    const { count: enrolledCount } = await supabase
      .from("student_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("class_id", exam.class_id)
      .eq("academic_session_id", exam.academic_session_id)
      .eq("term_id", exam.term_id)
      .eq("status", "ACTIVE");

    // 2. Fetch all attempts with student profile joined
    const { data: attempts, error } = await supabase
      .from("examination_attempts")
      .select(
        `
        *,
        student:students(
          *,
          profile:profiles(*)
        )
      `,
      )
      .eq("examination_id", examId)
      .order("started_at", { ascending: false });

    if (error) throw error;

    const attemptList = (attempts as unknown as ExaminationAttempt[]) || [];

    const totalEnrolled = enrolledCount ?? 0;
    const totalStarted = attemptList.length;
    const totalSubmitted = attemptList.filter((a) => a.status === "SUBMITTED").length;
    const totalInProgress = attemptList.filter((a) => a.status === "IN_PROGRESS").length;
    const totalExpired = attemptList.filter((a) => a.status === "EXPIRED").length;

    return {
      exam,
      totalEnrolled,
      totalStarted,
      totalSubmitted,
      totalInProgress,
      totalExpired,
      attempts: attemptList,
    };
  } catch (err) {
    console.error("[SchoolService] Error fetching CBT monitoring stats:", err);
    return null;
  }
}

// ==============================================================================
// 12. PHASE 6 — RESULTS & ACADEMIC ANALYTICS
// ==============================================================================

export const DEFAULT_GRADING_SCALES: GradingScale[] = [
  {
    id: "gs-1",
    grade: "A+",
    min_score: 90.0,
    max_score: 100.0,
    gpa_point: 4.0,
    remark: "Distinction / Outstanding",
    order_index: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "gs-2",
    grade: "A",
    min_score: 80.0,
    max_score: 89.99,
    gpa_point: 4.0,
    remark: "Excellent",
    order_index: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "gs-3",
    grade: "B",
    min_score: 70.0,
    max_score: 79.99,
    gpa_point: 3.0,
    remark: "Very Good",
    order_index: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "gs-4",
    grade: "C",
    min_score: 60.0,
    max_score: 69.99,
    gpa_point: 2.0,
    remark: "Credit / Good",
    order_index: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "gs-5",
    grade: "D",
    min_score: 50.0,
    max_score: 59.99,
    gpa_point: 1.0,
    remark: "Pass / Fair",
    order_index: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "gs-6",
    grade: "E",
    min_score: 40.0,
    max_score: 49.99,
    gpa_point: 0.5,
    remark: "Weak Pass",
    order_index: 6,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "gs-7",
    grade: "F",
    min_score: 0.0,
    max_score: 39.99,
    gpa_point: 0.0,
    remark: "Fail",
    order_index: 7,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Authoritative grade calculation based on configured grading scales
 */
export function computeGrade(
  totalScore: number,
  maxScore = 100,
  scales: GradingScale[] = DEFAULT_GRADING_SCALES,
): { grade: string; percentage: number; gpaPoint: number; remark: string } {
  const safeTotal = Math.max(0, Math.min(maxScore, Number(totalScore) || 0));
  const percentage = maxScore > 0 ? Number(((safeTotal / maxScore) * 100).toFixed(2)) : 0;
  const activeScales = (scales && scales.length > 0 ? scales : DEFAULT_GRADING_SCALES)
    .filter((s) => s.is_active)
    .sort((a, b) => b.min_score - a.min_score);

  for (const scale of activeScales) {
    if (percentage >= scale.min_score && percentage <= scale.max_score + 0.01) {
      return {
        grade: scale.grade,
        percentage,
        gpaPoint: Number(scale.gpa_point),
        remark: scale.remark,
      };
    }
  }

  return {
    grade: "F",
    percentage,
    gpaPoint: 0.0,
    remark: "Fail",
  };
}

export async function fetchGradingScales(): Promise<GradingScale[]> {
  try {
    const { data, error } = await supabase
      .from("grading_scales")
      .select("*")
      .order("order_index", { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_GRADING_SCALES;
    }

    return data as unknown as GradingScale[];
  } catch (err) {
    console.error("[SchoolService] Failed to fetch grading scales:", err);
    return DEFAULT_GRADING_SCALES;
  }
}

/**
 * Fetch subject results with rich filters and joined relations
 */
export async function fetchSubjectResults(filters: {
  classId?: string;
  subjectId?: string;
  sessionId?: string;
  termId?: string;
  studentId?: string;
  status?: ResultStatus;
  search?: string;
}): Promise<StudentSubjectResult[]> {
  try {
    let query = supabase.from("student_subject_results").select(`
        *,
        student:students(
          *,
          profile:profiles(*)
        ),
        subject:subjects(*),
        school_class:classes(*),
        academic_session:academic_sessions(*),
        term:terms(*),
        cbt_exam:examinations(*),
        cbt_attempt:examination_attempts(*),
        submitter:profiles!student_subject_results_submitted_by_fkey(*),
        reviewer:profiles!student_subject_results_reviewed_by_fkey(*),
        approver:profiles!student_subject_results_approved_by_fkey(*),
        publisher:profiles!student_subject_results_published_by_fkey(*),
        locker:profiles!student_subject_results_locked_by_fkey(*)
      `);

    if (filters.classId) {
      query = query.eq("class_id", filters.classId);
    }
    if (filters.subjectId) {
      query = query.eq("subject_id", filters.subjectId);
    }
    if (filters.sessionId) {
      query = query.eq("academic_session_id", filters.sessionId);
    }
    if (filters.termId) {
      query = query.eq("term_id", filters.termId);
    }
    if (filters.studentId) {
      query = query.eq("student_id", filters.studentId);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      // If table doesn't exist yet or query failed, return fallback
      console.warn("[SchoolService] Subject results query notice:", error.message);
      return [];
    }

    let results = (data as unknown as StudentSubjectResult[]) || [];

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      results = results.filter(
        (r) =>
          r.student?.first_name?.toLowerCase().includes(q) ||
          r.student?.last_name?.toLowerCase().includes(q) ||
          r.student?.admission_number?.toLowerCase().includes(q) ||
          r.subject?.name?.toLowerCase().includes(q) ||
          r.subject?.code?.toLowerCase().includes(q),
      );
    }

    return results;
  } catch (err) {
    console.error("[SchoolService] Error fetching subject results:", err);
    return [];
  }
}

/**
 * STRICT STUDENT-FACING QUERY: Only retrieves results with status === 'PUBLISHED'
 */
export async function fetchStudentPublishedResults(
  studentProfileId: string,
  sessionId?: string,
  termId?: string,
): Promise<{
  student: Student | null;
  subjectResults: StudentSubjectResult[];
  termSummary: StudentTermResult | null;
}> {
  try {
    // 1. Locate student record by profile_id
    const { data: studentData, error: stdErr } = await supabase
      .from("students")
      .select("*, profile:profiles(*)")
      .eq("profile_id", studentProfileId)
      .maybeSingle();

    if (stdErr || !studentData) {
      return { student: null, subjectResults: [], termSummary: null };
    }

    const student = studentData as unknown as Student;

    // 2. Fetch PUBLISHED subject results only
    let query = supabase
      .from("student_subject_results")
      .select(
        `
        *,
        subject:subjects(*),
        school_class:classes(*),
        academic_session:academic_sessions(*),
        term:terms(*)
      `,
      )
      .eq("student_id", student.id)
      .eq("status", "PUBLISHED");

    if (sessionId) query = query.eq("academic_session_id", sessionId);
    if (termId) query = query.eq("term_id", termId);

    const { data: results, error: resErr } = await query.order("subject_id", { ascending: true });
    if (resErr) throw resErr;

    // 3. Fetch PUBLISHED term summary
    let termQuery = supabase
      .from("student_term_results")
      .select(
        `
        *,
        school_class:classes(*),
        academic_session:academic_sessions(*),
        term:terms(*)
      `,
      )
      .eq("student_id", student.id)
      .eq("status", "PUBLISHED");

    if (sessionId) termQuery = termQuery.eq("academic_session_id", sessionId);
    if (termId) termQuery = termQuery.eq("term_id", termId);

    const { data: termData } = await termQuery.maybeSingle();

    return {
      student,
      subjectResults: (results as unknown as StudentSubjectResult[]) || [],
      termSummary: (termData as unknown as StudentTermResult) || null,
    };
  } catch (err) {
    console.error("[SchoolService] Error fetching student published results:", err);
    return { student: null, subjectResults: [], termSummary: null };
  }
}

/**
 * Batch create or update subject results by a Teacher (saves as DRAFT)
 */
export async function saveSubjectResultsBatch(
  entries: Array<{
    id?: string;
    student_id: string;
    subject_id: string;
    class_id: string;
    academic_session_id: string;
    term_id: string;
    ca_score: number;
    exam_score: number;
    cbt_exam_id?: string | null;
    cbt_attempt_id?: string | null;
    teacher_remark?: string | null;
    status?: ResultStatus;
  }>,
  actorProfileId: string,
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const scales = await fetchGradingScales();
    const recordsToUpsert = entries.map((e) => {
      const ca = Math.max(0, Math.min(40, Number(e.ca_score) || 0));
      const exam = Math.max(0, Math.min(70, Number(e.exam_score) || 0));
      const total = Math.min(100, ca + exam);
      const { grade, percentage, gpaPoint } = computeGrade(total, 100, scales);

      return {
        ...(e.id ? { id: e.id } : {}),
        student_id: e.student_id,
        subject_id: e.subject_id,
        class_id: e.class_id,
        academic_session_id: e.academic_session_id,
        term_id: e.term_id,
        ca_score: ca,
        exam_score: exam,
        cbt_exam_id: e.cbt_exam_id || null,
        cbt_attempt_id: e.cbt_attempt_id || null,
        total_score: total,
        max_score: 100,
        percentage,
        grade,
        gpa_point: gpaPoint,
        teacher_remark: e.teacher_remark || null,
        status: e.status || "DRAFT",
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await supabase.from("student_subject_results").upsert(recordsToUpsert, {
      onConflict: "student_id,subject_id,class_id,academic_session_id,term_id",
    });

    if (error) throw error;

    await logAuditEvent({
      action: "RESULTS_BATCH_SAVED",
      entityType: "student_subject_results",
      newValues: {
        count: entries.length,
        class_id: entries[0]?.class_id,
        subject_id: entries[0]?.subject_id,
        actor_id: actorProfileId,
      },
    });

    return { success: true, count: entries.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save results batch";
    console.error("[SchoolService] saveSubjectResultsBatch error:", err);
    return { success: false, count: 0, error: msg };
  }
}

/**
 * Submit subject results by Teacher for administrative review (DRAFT -> SUBMITTED)
 */
export async function submitSubjectResults(
  resultIds: string[],
  actorProfileId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!resultIds.length) return { success: true };

    const timestamp = new Date().toISOString();
    const { error } = await supabase
      .from("student_subject_results")
      .update({
        status: "SUBMITTED",
        submitted_by: actorProfileId,
        submitted_at: timestamp,
        updated_at: timestamp,
      })
      .in("id", resultIds)
      .eq("status", "DRAFT");

    if (error) throw error;

    await logAuditEvent({
      action: "RESULTS_SUBMITTED_FOR_REVIEW",
      entityType: "student_subject_results",
      newValues: { result_ids: resultIds, actor_id: actorProfileId, submitted_at: timestamp },
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to submit results for review";
    return { success: false, error: msg };
  }
}

/**
 * Advance result lifecycle (REVIEWED, APPROVED, PUBLISHED, LOCKED) by Admin
 */
export async function updateResultStatusBatch(
  resultIds: string[],
  newStatus: ResultStatus,
  actorProfileId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!resultIds.length) return { success: true };

    const timestamp = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: timestamp,
    };

    if (newStatus === "REVIEWED") {
      updatePayload.reviewed_by = actorProfileId;
      updatePayload.reviewed_at = timestamp;
    } else if (newStatus === "APPROVED") {
      updatePayload.approved_by = actorProfileId;
      updatePayload.approved_at = timestamp;
    } else if (newStatus === "PUBLISHED") {
      updatePayload.published_by = actorProfileId;
      updatePayload.published_at = timestamp;
    } else if (newStatus === "LOCKED") {
      updatePayload.locked_by = actorProfileId;
      updatePayload.locked_at = timestamp;
    }

    const { error } = await supabase
      .from("student_subject_results")
      .update(updatePayload)
      .in("id", resultIds);

    if (error) throw error;

    // If publishing or approving, also synchronize the associated term summaries
    if (newStatus === "PUBLISHED" || newStatus === "LOCKED") {
      // Find classes affected
      const { data: sampleResults } = await supabase
        .from("student_subject_results")
        .select("class_id, academic_session_id, term_id")
        .in("id", resultIds);

      if (sampleResults && sampleResults.length > 0) {
        const uniqueKeys = new Set(
          sampleResults.map((r) => `${r.class_id}|${r.academic_session_id}|${r.term_id}`),
        );
        for (const key of uniqueKeys) {
          const [cid, sid, tid] = key.split("|");
          await recalculateClassTermResults(cid, sid, tid);
          // Update term results status
          await supabase
            .from("student_term_results")
            .update({ status: newStatus, published_at: timestamp, updated_at: timestamp })
            .eq("class_id", cid)
            .eq("academic_session_id", sid)
            .eq("term_id", tid);
        }
      }
    }

    await logAuditEvent({
      action: `RESULTS_STATUS_CHANGED_TO_${newStatus}`,
      entityType: "student_subject_results",
      newValues: { result_ids: resultIds, new_status: newStatus, actor_id: actorProfileId },
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : `Failed to update status to ${newStatus}`;
    return { success: false, error: msg };
  }
}

/**
 * CONTROLLED RESULT CORRECTION: Never silently overwrite an existing result!
 * Creates an immutable record in `result_corrections` and logs into `audit_logs`.
 */
export async function applyResultCorrection(
  params: {
    subjectResultId: string;
    studentId: string;
    caScore: number;
    examScore: number;
    reason: string;
  },
  actorProfileId: string,
  actorRole: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!params.reason || !params.reason.trim()) {
      return {
        success: false,
        error: "A mandatory justification reason is required for result correction.",
      };
    }

    // 1. Fetch current subject result
    const { data: currentResult, error: fetchErr } = await supabase
      .from("student_subject_results")
      .select("*")
      .eq("id", params.subjectResultId)
      .single();

    if (fetchErr || !currentResult) {
      return { success: false, error: "Target academic result record was not found." };
    }

    const oldCa = Number(currentResult.ca_score);
    const oldExam = Number(currentResult.exam_score);
    const oldTotal = Number(currentResult.total_score);
    const oldGrade = currentResult.grade;

    const newCa = Math.max(0, Math.min(40, Number(params.caScore) || 0));
    const newExam = Math.max(0, Math.min(70, Number(params.examScore) || 0));
    const newTotal = Math.min(100, newCa + newExam);

    const scales = await fetchGradingScales();
    const { grade: newGrade, percentage, gpaPoint } = computeGrade(newTotal, 100, scales);

    const timestamp = new Date().toISOString();

    // 2. Insert into result_corrections audit log
    const { error: correctionErr } = await supabase.from("result_corrections").insert({
      subject_result_id: params.subjectResultId,
      student_id: params.studentId,
      field_name: "ca_score_and_exam_score",
      old_value: `CA: ${oldCa}, Exam: ${oldExam}, Total: ${oldTotal} (${oldGrade})`,
      new_value: `CA: ${newCa}, Exam: ${newExam}, Total: ${newTotal} (${newGrade})`,
      reason: params.reason.trim(),
      actor_id: actorProfileId,
      actor_role: actorRole,
      created_at: timestamp,
    });

    if (correctionErr) throw correctionErr;

    // 3. Update the subject result
    const { error: updateErr } = await supabase
      .from("student_subject_results")
      .update({
        ca_score: newCa,
        exam_score: newExam,
        total_score: newTotal,
        percentage,
        grade: newGrade,
        gpa_point: gpaPoint,
        updated_at: timestamp,
      })
      .eq("id", params.subjectResultId);

    if (updateErr) throw updateErr;

    // 4. Log in the global audit log
    await logAuditEvent({
      action: "CONTROLLED_RESULT_CORRECTION",
      entityType: "student_subject_results",
      entityId: params.subjectResultId,
      oldValues: { ca_score: oldCa, exam_score: oldExam, total_score: oldTotal, grade: oldGrade },
      newValues: {
        ca_score: newCa,
        exam_score: newExam,
        total_score: newTotal,
        grade: newGrade,
        reason: params.reason.trim(),
        actor_id: actorProfileId,
        actor_role: actorRole,
      },
    });

    // 5. Recalculate class rankings and term averages
    await recalculateClassTermResults(
      currentResult.class_id,
      currentResult.academic_session_id,
      currentResult.term_id,
    );

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to apply result correction";
    console.error("[SchoolService] applyResultCorrection error:", err);
    return { success: false, error: msg };
  }
}

/**
 * Fetch immutable history of result corrections
 */
export async function fetchResultCorrections(
  subjectResultId?: string,
  studentId?: string,
): Promise<ResultCorrection[]> {
  try {
    let query = supabase.from("result_corrections").select(`
        *,
        actor:profiles(*),
        student:students(
          *,
          profile:profiles(*)
        ),
        subject_result:student_subject_results(
          *,
          subject:subjects(*)
        )
      `);

    if (subjectResultId) {
      query = query.eq("subject_result_id", subjectResultId);
    }
    if (studentId) {
      query = query.eq("student_id", studentId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.warn("[SchoolService] fetchResultCorrections notice:", error.message);
      return [];
    }

    return (data as unknown as ResultCorrection[]) || [];
  } catch (err) {
    console.error("[SchoolService] Error fetching result corrections:", err);
    return [];
  }
}

/**
 * REAL DATABASE ANALYTICS: Calculate class average, subject average, highest, lowest, pass rate, grade distribution
 */
export async function fetchClassAcademicAnalytics(
  classId: string,
  sessionId: string,
  termId: string,
  subjectId?: string,
): Promise<AcademicAnalytics> {
  try {
    let query = supabase
      .from("student_subject_results")
      .select("*, subject:subjects(*), student:students(*)")
      .eq("class_id", classId)
      .eq("academic_session_id", sessionId)
      .eq("term_id", termId);

    if (subjectId) {
      query = query.eq("subject_id", subjectId);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return {
        totalStudents: 0,
        evaluatedStudents: 0,
        classAverage: 0,
        highestAverage: 0,
        lowestAverage: 0,
        passRate: 0,
        gradeDistribution: [
          { grade: "A+", count: 0, percentage: 0, remark: "Distinction" },
          { grade: "A", count: 0, percentage: 0, remark: "Excellent" },
          { grade: "B", count: 0, percentage: 0, remark: "Very Good" },
          { grade: "C", count: 0, percentage: 0, remark: "Good / Credit" },
          { grade: "D", count: 0, percentage: 0, remark: "Pass" },
          { grade: "E", count: 0, percentage: 0, remark: "Weak Pass" },
          { grade: "F", count: 0, percentage: 0, remark: "Fail" },
        ],
        subjectAverages: [],
      };
    }

    const results = data as unknown as StudentSubjectResult[];
    const totalRecords = results.length;
    const scores = results.map((r) => Number(r.total_score) || 0);

    const totalSum = scores.reduce((acc, curr) => acc + curr, 0);
    const classAvg = totalRecords > 0 ? Number((totalSum / totalRecords).toFixed(2)) : 0;
    const highest = totalRecords > 0 ? Math.max(...scores) : 0;
    const lowest = totalRecords > 0 ? Math.min(...scores) : 0;

    const passCount = scores.filter((s) => s >= 50.0).length;
    const passRate = totalRecords > 0 ? Number(((passCount / totalRecords) * 100).toFixed(1)) : 0;

    // Unique students count
    const studentIds = new Set(results.map((r) => r.student_id));
    const evaluatedStudents = studentIds.size;

    // Grade distribution
    const gradeCounts: Record<string, number> = {
      "A+": 0,
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0,
    };

    results.forEach((r) => {
      const g = r.grade || "F";
      if (gradeCounts[g] !== undefined) {
        gradeCounts[g] += 1;
      } else {
        gradeCounts["F"] += 1;
      }
    });

    const gradeRemarks: Record<string, string> = {
      "A+": "Distinction",
      A: "Excellent",
      B: "Very Good",
      C: "Credit / Good",
      D: "Pass",
      E: "Weak Pass",
      F: "Fail",
    };

    const gradeDistribution = Object.keys(gradeCounts).map((g) => ({
      grade: g,
      count: gradeCounts[g],
      percentage: totalRecords > 0 ? Number(((gradeCounts[g] / totalRecords) * 100).toFixed(1)) : 0,
      remark: gradeRemarks[g] || "",
    }));

    // Subject averages breakdown
    const subjectMap: Record<
      string,
      { name: string; code: string; scores: number[]; passCount: number }
    > = {};

    results.forEach((r) => {
      const sId = r.subject_id;
      const sName = r.subject?.name || "Subject";
      const sCode = r.subject?.code || "SUB";
      const score = Number(r.total_score) || 0;

      if (!subjectMap[sId]) {
        subjectMap[sId] = { name: sName, code: sCode, scores: [], passCount: 0 };
      }
      subjectMap[sId].scores.push(score);
      if (score >= 50.0) subjectMap[sId].passCount += 1;
    });

    const subjectAverages = Object.keys(subjectMap).map((sId) => {
      const item = subjectMap[sId];
      const sTotal = item.scores.reduce((a, b) => a + b, 0);
      const sLen = item.scores.length;
      return {
        subjectId: sId,
        subjectName: item.name,
        subjectCode: item.code,
        averageScore: sLen > 0 ? Number((sTotal / sLen).toFixed(2)) : 0,
        highestScore: sLen > 0 ? Math.max(...item.scores) : 0,
        lowestScore: sLen > 0 ? Math.min(...item.scores) : 0,
        passRate: sLen > 0 ? Number(((item.passCount / sLen) * 100).toFixed(1)) : 0,
        studentCount: sLen,
      };
    });

    return {
      totalStudents: evaluatedStudents,
      evaluatedStudents,
      classAverage: classAvg,
      highestAverage: highest,
      lowestAverage: lowest,
      passRate,
      gradeDistribution,
      subjectAverages,
    };
  } catch (err) {
    console.error("[SchoolService] Error computing class academic analytics:", err);
    return {
      totalStudents: 0,
      evaluatedStudents: 0,
      classAverage: 0,
      highestAverage: 0,
      lowestAverage: 0,
      passRate: 0,
      gradeDistribution: [],
      subjectAverages: [],
    };
  }
}

/**
 * Server-side / Data layer computation of Student Terminal Rankings & Summary
 */
export async function recalculateClassTermResults(
  classId: string,
  sessionId: string,
  termId: string,
): Promise<{ success: boolean; classSize: number; error?: string }> {
  try {
    // 1. Get all active enrolled students in this class/session/term
    const { data: enrollments, error: enrErr } = await supabase
      .from("student_enrollments")
      .select("student_id")
      .eq("class_id", classId)
      .eq("academic_session_id", sessionId)
      .eq("term_id", termId)
      .eq("status", "ACTIVE");

    if (enrErr) throw enrErr;

    const classSize = enrollments?.length || 0;

    // 2. Get all subject results for this class/session/term
    const { data: results, error: resErr } = await supabase
      .from("student_subject_results")
      .select("*")
      .eq("class_id", classId)
      .eq("academic_session_id", sessionId)
      .eq("term_id", termId);

    if (resErr) throw resErr;

    const subjectResults = (results as unknown as StudentSubjectResult[]) || [];

    // Group by student
    const studentScoreMap: Record<
      string,
      { totalObtained: number; totalPossible: number; gpaSum: number; subjectCount: number }
    > = {};

    subjectResults.forEach((r) => {
      if (!studentScoreMap[r.student_id]) {
        studentScoreMap[r.student_id] = {
          totalObtained: 0,
          totalPossible: 0,
          gpaSum: 0,
          subjectCount: 0,
        };
      }
      studentScoreMap[r.student_id].totalObtained += Number(r.total_score) || 0;
      studentScoreMap[r.student_id].totalPossible += Number(r.max_score) || 100;
      studentScoreMap[r.student_id].gpaSum += Number(r.gpa_point) || 0;
      studentScoreMap[r.student_id].subjectCount += 1;
    });

    // Compute averages and sort for ranking
    const studentSummaries = Object.keys(studentScoreMap).map((studentId) => {
      const data = studentScoreMap[studentId];
      const avg =
        data.totalPossible > 0
          ? Number(((data.totalObtained / data.totalPossible) * 100).toFixed(2))
          : 0;
      const gpa = data.subjectCount > 0 ? Number((data.gpaSum / data.subjectCount).toFixed(2)) : 0;
      return {
        student_id: studentId,
        total_subjects: data.subjectCount,
        total_score_obtained: data.totalObtained,
        total_possible_score: data.totalPossible,
        average_score: avg,
        gpa,
      };
    });

    studentSummaries.sort((a, b) => b.average_score - a.average_score);

    const highestAverage = studentSummaries[0]?.average_score || 0;
    const lowestAverage = studentSummaries[studentSummaries.length - 1]?.average_score || 0;

    // Upsert into student_term_results with calculated rank
    const termRecords = studentSummaries.map((s, idx) => ({
      student_id: s.student_id,
      class_id: classId,
      academic_session_id: sessionId,
      term_id: termId,
      total_subjects: s.total_subjects,
      total_score_obtained: s.total_score_obtained,
      total_possible_score: s.total_possible_score,
      average_score: s.average_score,
      gpa: s.gpa,
      class_rank: idx + 1,
      class_size: classSize,
      class_highest_average: highestAverage,
      class_lowest_average: lowestAverage,
      updated_at: new Date().toISOString(),
    }));

    if (termRecords.length > 0) {
      await supabase.from("student_term_results").upsert(termRecords, {
        onConflict: "student_id,class_id,academic_session_id,term_id",
      });
    }

    return { success: true, classSize };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to recalculate term results";
    console.error("[SchoolService] recalculateClassTermResults error:", err);
    return { success: false, classSize: 0, error: msg };
  }
}

/**
 * Fetch Comprehensive Official Terminal Report Card
 */
export async function fetchStudentReportCard(
  studentId: string,
  sessionId: string,
  termId: string,
): Promise<StudentReportCardData | null> {
  try {
    // 1. Fetch Student profile & credentials
    const { data: studentData, error: stdErr } = await supabase
      .from("students")
      .select("*, profile:profiles(*)")
      .eq("id", studentId)
      .single();

    if (stdErr || !studentData) return null;

    // 2. Fetch Session & Term
    const [{ data: sessionData }, { data: termData }, { data: scalesData }] = await Promise.all([
      supabase.from("academic_sessions").select("*").eq("id", sessionId).single(),
      supabase.from("terms").select("*").eq("id", termId).single(),
      supabase.from("grading_scales").select("*").order("order_index", { ascending: true }),
    ]);

    if (!sessionData || !termData) return null;

    // 3. Fetch Enrollment to know class
    const { data: enrollment } = await supabase
      .from("student_enrollments")
      .select("*, school_class:classes(*)")
      .eq("student_id", studentId)
      .eq("academic_session_id", sessionId)
      .eq("term_id", termId)
      .maybeSingle();

    const currentClass = (enrollment?.school_class as unknown as SchoolClass) || {
      id: "class-1",
      name: "JSS 1 Gold",
      grade_level: 7,
      arm: "Gold",
      created_at: "",
      updated_at: "",
    };

    // 4. Fetch all subject results for this student
    const { data: subjectResultsData } = await supabase
      .from("student_subject_results")
      .select("*, subject:subjects(*)")
      .eq("student_id", studentId)
      .eq("academic_session_id", sessionId)
      .eq("term_id", termId);

    // 5. Fetch class analytics for benchmarks
    const classAnalytics = await fetchClassAcademicAnalytics(currentClass.id, sessionId, termId);

    const subjectResults = ((subjectResultsData as unknown as StudentSubjectResult[]) || []).map(
      (sr) => {
        const subStat = classAnalytics.subjectAverages.find((s) => s.subjectId === sr.subject_id);
        return {
          ...sr,
          subjectClassAverage: subStat?.averageScore || undefined,
          subjectClassHighest: subStat?.highestScore || undefined,
          subjectClassLowest: subStat?.lowestScore || undefined,
        };
      },
    );

    // 6. Fetch Term Summary
    const { data: termSummaryData } = await supabase
      .from("student_term_results")
      .select("*")
      .eq("student_id", studentId)
      .eq("academic_session_id", sessionId)
      .eq("term_id", termId)
      .maybeSingle();

    return {
      school: {
        name: "Maxfem International School",
        motto: "Excellence, Character & Academic Integrity",
        address: "KM 4, Greenfield Boulevard, Central Academic District, Abuja, Nigeria",
        phone: "+234 800 MAXFEM 01",
        email: "admissions@maxfem.edu.ng",
        logoUrl: "/favicon.ico",
      },
      student: studentData as unknown as Student,
      currentClass,
      academicSession: sessionData as unknown as AcademicSession,
      term: termData as unknown as Term,
      subjectResults,
      termSummary: (termSummaryData as unknown as StudentTermResult) || null,
      gradingScales:
        scalesData && scalesData.length > 0
          ? (scalesData as unknown as GradingScale[])
          : DEFAULT_GRADING_SCALES,
    };
  } catch (err) {
    console.error("[SchoolService] Error generating student report card:", err);
    return null;
  }
}

/**
 * Authoritative Phase 5 CBT Score Import:
 * Imports completed CBT examination attempt total_scores into subject_results exam_score!
 */
export async function importCbtScoresToSubjectResults(
  examId: string,
  actorProfileId: string,
): Promise<{ success: boolean; importedCount: number; error?: string }> {
  try {
    // 1. Fetch examination details
    const exam = await fetchExaminationById(examId);
    if (!exam) return { success: false, importedCount: 0, error: "Examination was not found." };

    // 2. Fetch all submitted attempts
    const { data: attempts, error: attErr } = await supabase
      .from("examination_attempts")
      .select("*")
      .eq("examination_id", examId)
      .eq("status", "SUBMITTED");

    if (attErr) throw attErr;

    const attemptList = (attempts as unknown as ExaminationAttempt[]) || [];
    if (attemptList.length === 0) {
      return {
        success: false,
        importedCount: 0,
        error: "No completed student attempts found for this examination.",
      };
    }

    const scales = await fetchGradingScales();
    let imported = 0;

    for (const attempt of attemptList) {
      // Score from CBT
      const cbtScore = Number(attempt.total_score) || 0;
      const maxCbt = Number(attempt.max_possible_score) || 100;
      // Normalize to 60 or 70 (e.g. 60% exam weight)
      const normalizedExamScore = Number(((cbtScore / maxCbt) * 60).toFixed(2));

      // Fetch existing subject result to preserve CA score
      const { data: existingRes } = await supabase
        .from("student_subject_results")
        .select("*")
        .eq("student_id", attempt.student_id)
        .eq("subject_id", exam.subject_id)
        .eq("class_id", exam.class_id)
        .eq("academic_session_id", exam.academic_session_id)
        .eq("term_id", exam.term_id)
        .maybeSingle();

      const existingCa = existingRes ? Number(existingRes.ca_score) : 0;
      const total = Math.min(100, existingCa + normalizedExamScore);
      const { grade, percentage, gpaPoint } = computeGrade(total, 100, scales);

      await supabase.from("student_subject_results").upsert(
        {
          ...(existingRes?.id ? { id: existingRes.id } : {}),
          student_id: attempt.student_id,
          subject_id: exam.subject_id,
          class_id: exam.class_id,
          academic_session_id: exam.academic_session_id,
          term_id: exam.term_id,
          ca_score: existingCa,
          exam_score: normalizedExamScore,
          cbt_exam_id: exam.id,
          cbt_attempt_id: attempt.id,
          total_score: total,
          max_score: 100,
          percentage,
          grade,
          gpa_point: gpaPoint,
          status: "DRAFT",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id,subject_id,class_id,academic_session_id,term_id" },
      );

      imported += 1;
    }

    await logAuditEvent({
      action: "CBT_SCORES_IMPORTED_TO_RESULTS",
      entityType: "examination",
      entityId: examId,
      newValues: {
        exam_id: examId,
        imported_count: imported,
        actor_id: actorProfileId,
      },
    });

    return { success: true, importedCount: imported };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to import CBT scores";
    console.error("[SchoolService] importCbtScoresToSubjectResults error:", err);
    return { success: false, importedCount: 0, error: msg };
  }
}

export async function fetchClassTermResults(
  classId: string,
  sessionId: string,
  termId: string,
): Promise<StudentTermResult[]> {
  try {
    const { data, error } = await supabase
      .from("student_term_results")
      .select("*, student:students(*, profile:profiles(*)), school_class:classes(*)")
      .eq("class_id", classId)
      .eq("academic_session_id", sessionId)
      .eq("term_id", termId)
      .order("class_rank", { ascending: true });

    if (error) throw error;
    return (data as unknown as StudentTermResult[]) || [];
  } catch (err) {
    console.error("[SchoolService] Error fetching class term results:", err);
    return [];
  }
}
