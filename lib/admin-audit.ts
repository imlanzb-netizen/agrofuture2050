import { supabaseAdmin } from "@/lib/supabase-admin";

type AuditDetails = Record<string, unknown>;

export async function writeAdminAuditLog({
  adminUserId,
  action,
  targetUserId,
  details,
}: {
  adminUserId: string;
  action: string;
  targetUserId?: string | null;
  details?: AuditDetails;
}) {
  const { error } = await supabaseAdmin
    .from("admin_audit_logs")
    .insert({
      admin_user_id: adminUserId,
      action,
      target_user_id: targetUserId ?? null,
      details: details ?? {},
    });

  if (error) {
    console.error("ADMIN AUDIT LOG ERROR:", error);
    return false;
  }

  return true;
}
