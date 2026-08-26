import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-security";
import { writeAdminAuditLog } from "@/lib/admin-audit";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);

    if (auth.error) {
      return auth.error;
    }

    const { userId, role } = await request.json();

    const allowedRoles = [
      "agriculture-officer",
      "livestock-officer",
    ];

    if (!userId || !allowedRoles.includes(role)) {
      return NextResponse.json(
        { ok: false, error: "userId au role si sahihi." },
        { status: 400 }
      );
    }

    const { data: targetData, error: targetError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (targetError || !targetData.user) {
      return NextResponse.json(
        { ok: false, error: targetError?.message || "User hajapatikana." },
        { status: 404 }
      );
    }

    const { data, error } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: {
          ...targetData.user.app_metadata,
          role,
        },
      });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const auditSaved = await writeAdminAuditLog({
      adminUserId: auth.user.id,
      action: "change_user_role",
      targetUserId: userId,
      details: {
        previous_role: targetData.user.app_metadata?.role ?? null,
        new_role: role,
        target_email: data.user?.email ?? null,
      },
    });

    if (!auditSaved) {
      console.warn(
        "ADMIN ROLE AUDIT WARNING: Role change succeeded but audit log haiku-save."
      );
    }

    return NextResponse.json({
      ok: true,
      email: data.user?.email ?? null,
      role: data.user?.app_metadata?.role ?? null,
      audit_logged: auditSaved,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}
