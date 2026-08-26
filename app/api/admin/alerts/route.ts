import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { writeAdminAuditLog } from "@/lib/admin-audit";

async function getAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  const role = user.app_metadata?.role;

  if (role !== "admin") {
    return null;
  }

  return { user, token };
}

export async function POST(request: Request) {
  try {
    const auth = await getAdmin(request);

    if (!auth) {
      return NextResponse.json(
        {
          ok: false,
          error: "Huna ruhusa ya kutuma alert.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const recipientUserId =
      typeof body.recipient_user_id === "string"
        ? body.recipient_user_id.trim()
        : "";

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const alertType =
      typeof body.alert_type === "string" &&
      body.alert_type.trim()
        ? body.alert_type.trim()
        : "general";

    if (!recipientUserId || !title || !message) {
      return NextResponse.json(
        {
          ok: false,
          error: "Recipient, title na message vinahitajika.",
        },
        { status: 400 }
      );
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    const { data: recipient, error: recipientError } =
      await adminClient.auth.admin.getUserById(
        recipientUserId
      );

    if (recipientError || !recipient.user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Mtumiaji wa alert hakupatikana.",
        },
        { status: 404 }
      );
    }

    const { data, error } = await adminClient
      .from("user_alerts")
      .insert({
        recipient_user_id: recipientUserId,
        sender_user_id: auth.user.id,
        sender_role: "admin",
        title,
        message,
        alert_type: alertType,
        is_read: false,
      })
      .select(
        "id, recipient_user_id, sender_user_id, sender_role, title, message, alert_type, is_read, created_at"
      )
      .single();

    if (error) {
      console.error("ADMIN ALERT INSERT ERROR:", error);

      return NextResponse.json(
        {
          ok: false,
          error: "Imeshindikana kutuma alert.",
        },
        { status: 500 }
      );
    }

    const auditSaved = await writeAdminAuditLog({
      adminUserId: auth.user.id,
      action: "send_alert",
      targetUserId: recipientUserId,
      details: {
        title,
        alert_type: alertType,
      },
    });

    if (!auditSaved) {
      console.warn(
        "ADMIN ALERT AUDIT WARNING: Alert ilitumwa lakini audit log haiku-save."
      );
    }

    return NextResponse.json({
      ok: true,
      alert: data,
      audit_logged: auditSaved,
    });
  } catch (error) {
    console.error("ADMIN ALERT API ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Imeshindikana kutuma alert.",
      },
      { status: 500 }
    );
  }
}
