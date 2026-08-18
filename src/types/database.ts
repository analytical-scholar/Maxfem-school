// ==============================================================================
// MAXFEM INTERNATIONAL SCHOOL — DATABASE & APPLICATION TYPES
// ==============================================================================

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type AdmissionStatus =
  "APPLIED" | "ADMITTED" | "REJECTED" | "PROMOTED" | "GRADUATED" | "WITHDRAWN";
export type EmploymentStatus = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "ON_LEAVE" | "TERMINATED";
export type TermName = "First Term" | "Second Term" | "Third Term";
export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "WITHDRAWN" | "REPEATED";

// Phase 4 Admissions Types
export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFICATION_REQUIRED"
  | "APPROVED"
  | "REJECTED"
  | "WAITLISTED"
  | "WITHDRAWN";

export type AdmissionDocType =
  | "BIRTH_CERTIFICATE"
  | "PREVIOUS_REPORT_CARD"
  | "PASSPORT_PHOTO"
  | "MEDICAL_REPORT"
  | "NATIONAL_ID_GUARDIAN"
  | "OTHER";

// Phase 5 CBT Types
export type ExamStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ACTIVE" | "CLOSED" | "ARCHIVED";

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE";

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED" | "ABANDONED";

// Phase 6 Results & Analytics Types
export type ResultStatus = "DRAFT" | "SUBMITTED" | "REVIEWED" | "APPROVED" | "PUBLISHED" | "LOCKED";

export interface GradingScale {
  id: string;
  grade: string;
  min_score: number;
  max_score: number;
  gpa_point: number;
  remark: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentSubjectResult {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  academic_session_id: string;
  term_id: string;
  ca_score: number;
  exam_score: number;
  cbt_exam_id: string | null;
  cbt_attempt_id: string | null;
  total_score: number;
  max_score: number;
  percentage: number;
  grade: string;
  gpa_point: number;
  teacher_remark: string | null;
  status: ResultStatus;
  submitted_by: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  published_by: string | null;
  published_at: string | null;
  locked_by: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  student?: Student;
  subject?: Subject;
  school_class?: SchoolClass;
  academic_session?: AcademicSession;
  term?: Term;
  cbt_exam?: Examination;
  cbt_attempt?: ExaminationAttempt;
  submitter?: Profile;
  reviewer?: Profile;
  approver?: Profile;
  publisher?: Profile;
  locker?: Profile;
}

export interface StudentTermResult {
  id: string;
  student_id: string;
  class_id: string;
  academic_session_id: string;
  term_id: string;
  total_subjects: number;
  total_score_obtained: number;
  total_possible_score: number;
  average_score: number;
  gpa: number;
  class_rank: number | null;
  class_size: number;
  class_highest_average: number | null;
  class_lowest_average: number | null;
  teacher_remark: string | null;
  principal_remark: string | null;
  status: ResultStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  student?: Student;
  school_class?: SchoolClass;
  academic_session?: AcademicSession;
  term?: Term;
  subject_results?: StudentSubjectResult[];
}

export interface StudentSessionResult {
  id: string;
  student_id: string;
  class_id: string;
  academic_session_id: string;
  cumulative_average: number;
  cumulative_gpa: number;
  session_rank: number | null;
  promoted: boolean;
  promotion_remark: string | null;
  status: ResultStatus;
  created_at: string;
  updated_at: string;
  student?: Student;
  school_class?: SchoolClass;
  academic_session?: AcademicSession;
}

export interface ResultCorrection {
  id: string;
  subject_result_id: string | null;
  student_id: string;
  field_name: string;
  old_value: string;
  new_value: string;
  reason: string;
  actor_id: string;
  actor_role: string;
  created_at: string;
  actor?: Profile;
  student?: Student;
  subject_result?: StudentSubjectResult;
}

export interface AcademicAnalytics {
  totalStudents: number;
  evaluatedStudents: number;
  classAverage: number;
  highestAverage: number;
  lowestAverage: number;
  passRate: number; // percentage scoring >= 50%
  gradeDistribution: Array<{
    grade: string;
    count: number;
    percentage: number;
    remark: string;
  }>;
  subjectAverages: Array<{
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
    studentCount: number;
  }>;
}

export interface StudentReportCardData {
  school: {
    name: string;
    motto: string;
    address: string;
    phone: string;
    email: string;
    logoUrl: string;
  };
  student: Student;
  currentClass: SchoolClass;
  academicSession: AcademicSession;
  term: Term;
  subjectResults: Array<
    StudentSubjectResult & {
      subjectClassAverage?: number;
      subjectClassHighest?: number;
      subjectClassLowest?: number;
    }
  >;
  termSummary: StudentTermResult | null;
  gradingScales: GradingScale[];
}

export interface Examination {
  id: string;
  title: string;
  description: string | null;
  subject_id: string;
  class_id: string;
  academic_session_id: string;
  term_id: string;
  created_by: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  pass_mark: number;
  start_time: string | null;
  end_time: string | null;
  status: ExamStatus;
  is_randomized: boolean;
  created_at: string;
  updated_at: string;
  // Joined relations
  subject?: Subject;
  school_class?: SchoolClass;
  academic_session?: AcademicSession;
  term?: Term;
  creator?: Profile;
  questions?: ExaminationQuestion[];
  attempts_count?: number;
  questions_count?: number;
}

export interface ExaminationQuestion {
  id: string;
  examination_id: string;
  question_text: string;
  question_type: QuestionType;
  marks: number;
  explanation: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
}

export interface ExaminationAttempt {
  id: string;
  examination_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  status: AttemptStatus;
  total_score: number | null;
  max_possible_score: number;
  is_auto_marked: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  examination?: Examination;
  student?: Student;
  answers?: StudentAnswer[];
}

export interface StudentAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  text_response: string | null;
  is_correct: boolean | null;
  marks_awarded: number;
  answered_at: string;
  updated_at: string;
  question?: ExaminationQuestion;
  selected_option?: QuestionOption;
}

// Student-safe interfaces (strips answers and private metadata)
export interface SanitizedOption {
  id: string;
  option_text: string;
  order_index: number;
}

export interface SanitizedQuestion {
  id: string;
  question_text: string;
  question_type: QuestionType;
  marks: number;
  order_index: number;
  options: SanitizedOption[];
}

export interface CbtMonitoringStats {
  exam: Examination;
  totalEnrolled: number;
  totalStarted: number;
  totalSubmitted: number;
  totalInProgress: number;
  totalExpired: number;
  attempts: ExaminationAttempt[];
}

export interface Profile {
  id: string; // auth.users UUID
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  profile_id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  other_name: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  admission_status: AdmissionStatus;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Teacher {
  id: string;
  profile_id: string;
  staff_id: string;
  department: string;
  employment_status: EmploymentStatus;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface AcademicSession {
  id: string;
  name: string; // e.g. '2024/2025'
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface Term {
  id: string;
  academic_session_id: string;
  name: TermName;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  academic_session?: AcademicSession;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade_level: number;
  arm: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  department: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentEnrollment {
  id: string;
  student_id: string;
  class_id: string;
  academic_session_id: string;
  term_id: string;
  enrollment_date: string;
  status: EnrollmentStatus;
  created_at: string;
  updated_at: string;
  student?: Student;
  school_class?: SchoolClass;
  academic_session?: AcademicSession;
  term?: Term;
}

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  academic_session_id: string;
  term_id: string;
  is_class_teacher: boolean;
  created_at: string;
  updated_at: string;
  teacher?: Teacher;
  subject?: Subject;
  school_class?: SchoolClass;
  academic_session?: AcademicSession;
  term?: Term;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Phase 4 Admissions Interfaces
export interface AdmissionApplication {
  id: string;
  application_number: string;
  applicant_profile_id: string | null;
  first_name: string;
  last_name: string;
  other_name: string | null;
  date_of_birth: string;
  gender: Gender;
  email: string;
  phone: string;
  address: string | null;
  guardian_name: string;
  guardian_relationship: string;
  guardian_phone: string;
  guardian_email: string | null;
  previous_school: string | null;
  previous_class: string | null;
  previous_grade_average: string | null;
  desired_class_id: string;
  desired_academic_session_id: string;
  status: ApplicationStatus;
  submission_date: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  decision_reason: string | null;
  converted_student_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  applicant_profile?: Profile;
  desired_class?: SchoolClass;
  desired_academic_session?: AcademicSession;
  reviewer?: Profile;
  converted_student?: Student;
  reviews?: ApplicationReview[];
  documents?: ApplicationDocument[];
}

export interface ApplicationReview {
  id: string;
  application_id: string;
  reviewer_id: string;
  note: string;
  is_internal: boolean;
  created_at: string;
  reviewer?: Profile;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  document_type: AdmissionDocType;
  file_name: string;
  file_url: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  verifier?: Profile;
}

export interface AdmissionsStats {
  totalApplications: number;
  draftCount: number;
  submittedCount: number;
  underReviewCount: number;
  verificationRequiredCount: number;
  approvedCount: number;
  rejectedCount: number;
  waitlistedCount: number;
  withdrawnCount: number;
  convertedCount: number;
  classBreakdown: Array<{ className: string; count: number }>;
  recentApplications: AdmissionApplication[];
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string; full_name: string };
        Update: Partial<Profile>;
      };
      students: {
        Row: Student;
        Insert: Partial<Student> & {
          profile_id: string;
          admission_number: string;
          first_name: string;
          last_name: string;
        };
        Update: Partial<Student>;
      };
      teachers: {
        Row: Teacher;
        Insert: Partial<Teacher> & { profile_id: string; staff_id: string; department: string };
        Update: Partial<Teacher>;
      };
      academic_sessions: {
        Row: AcademicSession;
        Insert: Partial<AcademicSession> & { name: string; start_date: string; end_date: string };
        Update: Partial<AcademicSession>;
      };
      terms: {
        Row: Term;
        Insert: Partial<Term> & {
          academic_session_id: string;
          name: TermName;
          start_date: string;
          end_date: string;
        };
        Update: Partial<Term>;
      };
      classes: {
        Row: SchoolClass;
        Insert: Partial<SchoolClass> & { name: string; grade_level: number };
        Update: Partial<SchoolClass>;
      };
      subjects: {
        Row: Subject;
        Insert: Partial<Subject> & { code: string; name: string; department: string };
        Update: Partial<Subject>;
      };
      student_enrollments: {
        Row: StudentEnrollment;
        Insert: Partial<StudentEnrollment> & {
          student_id: string;
          class_id: string;
          academic_session_id: string;
          term_id: string;
        };
        Update: Partial<StudentEnrollment>;
      };
      teacher_assignments: {
        Row: TeacherAssignment;
        Insert: Partial<TeacherAssignment> & {
          teacher_id: string;
          subject_id: string;
          class_id: string;
          academic_session_id: string;
          term_id: string;
        };
        Update: Partial<TeacherAssignment>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog> & { action: string; entity_type: string };
        Update: Partial<AuditLog>;
      };
      applications: {
        Row: AdmissionApplication;
        Insert: Partial<AdmissionApplication> & {
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: Gender;
          email: string;
          phone: string;
          guardian_name: string;
          guardian_relationship: string;
          guardian_phone: string;
          desired_class_id: string;
          desired_academic_session_id: string;
        };
        Update: Partial<AdmissionApplication>;
      };
      application_reviews: {
        Row: ApplicationReview;
        Insert: Partial<ApplicationReview> & {
          application_id: string;
          reviewer_id: string;
          note: string;
        };
        Update: Partial<ApplicationReview>;
      };
      application_documents: {
        Row: ApplicationDocument;
        Insert: Partial<ApplicationDocument> & {
          application_id: string;
          document_type: AdmissionDocType;
          file_name: string;
          file_url: string;
        };
        Update: Partial<ApplicationDocument>;
      };
      examinations: {
        Row: Examination;
        Insert: Partial<Examination> & {
          title: string;
          subject_id: string;
          class_id: string;
          academic_session_id: string;
          term_id: string;
          created_by: string;
          duration_minutes: number;
        };
        Update: Partial<Examination>;
      };
      examination_questions: {
        Row: ExaminationQuestion;
        Insert: Partial<ExaminationQuestion> & {
          examination_id: string;
          question_text: string;
        };
        Update: Partial<ExaminationQuestion>;
      };
      question_options: {
        Row: QuestionOption;
        Insert: Partial<QuestionOption> & {
          question_id: string;
          option_text: string;
        };
        Update: Partial<QuestionOption>;
      };
      examination_attempts: {
        Row: ExaminationAttempt;
        Insert: Partial<ExaminationAttempt> & {
          examination_id: string;
          student_id: string;
        };
        Update: Partial<ExaminationAttempt>;
      };
      student_answers: {
        Row: StudentAnswer;
        Insert: Partial<StudentAnswer> & {
          attempt_id: string;
          question_id: string;
        };
        Update: Partial<StudentAnswer>;
      };
      grading_scales: {
        Row: GradingScale;
        Insert: Partial<GradingScale> & {
          grade: string;
          min_score: number;
          max_score: number;
          remark: string;
        };
        Update: Partial<GradingScale>;
      };
      student_subject_results: {
        Row: StudentSubjectResult;
        Insert: Partial<StudentSubjectResult> & {
          student_id: string;
          subject_id: string;
          class_id: string;
          academic_session_id: string;
          term_id: string;
        };
        Update: Partial<StudentSubjectResult>;
      };
      student_term_results: {
        Row: StudentTermResult;
        Insert: Partial<StudentTermResult> & {
          student_id: string;
          class_id: string;
          academic_session_id: string;
          term_id: string;
        };
        Update: Partial<StudentTermResult>;
      };
      student_session_results: {
        Row: StudentSessionResult;
        Insert: Partial<StudentSessionResult> & {
          student_id: string;
          class_id: string;
          academic_session_id: string;
        };
        Update: Partial<StudentSessionResult>;
      };
      result_corrections: {
        Row: ResultCorrection;
        Insert: Partial<ResultCorrection> & {
          student_id: string;
          field_name: string;
          old_value: string;
          new_value: string;
          reason: string;
          actor_id: string;
          actor_role: string;
        };
        Update: Partial<ResultCorrection>;
      };
    };
  };
}
