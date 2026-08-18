import { supabase } from "./supabase";

export type AuditAction =
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "USER_CREATED"
  | "ROLE_CHANGED"
  | "ACCOUNT_STATUS_CHANGED"
  | "STUDENT_UPDATED"
  | "TEACHER_UPDATED"
  | "ADMISSION_DECISION"
  | "EXAM_CREATED"
  | "RESULT_MODIFIED"
  | "DOCUMENT_UPLOADED"
  | "ACCOUNT_SUSPENDED";

export interface LogAuditOptions {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}

/**
 * Record an audit entry in public.audit_logs
 */
export async function logAuditEvent(options: LogAuditOptions): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("audit_logs").insert({
      user_id: user?.id ?? null,
      action: options.action,
      entity_type: options.entityType,
      entity_id: options.entityId ?? null,
      old_values: options.oldValues ?? null,
      new_values: options.newValues ?? null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

    if (error) {
      console.warn("[Audit Log] Failed to insert audit record:", error.message);
    }
  } catch (err) {
    console.warn("[Audit Log] Error writing audit log:", err);
  }
}
