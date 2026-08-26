import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-security";
import { writeAdminAuditLog } from "@/lib/admin-audit";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);

    if (auth.error) {
      return auth.error;
    }

    const { data, error } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 100,
      });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const users = data.users.map((user) => ({
      id: user.id,
      email: user.email ?? "",
      full_name: user.user_metadata?.full_name ?? "",
      phone: user.user_metadata?.phone ?? "",
      region: user.user_metadata?.region ?? "",
      role: user.app_metadata?.role ?? user.user_metadata?.role ?? "",
    }));

    return NextResponse.json({
      ok: true,
      users,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin(request);

    if (auth.error) {
      return auth.error;
    }

    const currentUser = auth.user;
    const body = await request.json();
    const userId = body?.userId;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { ok: false, error: "User ID haijatumwa." },
        { status: 400 }
      );
    }

    if (userId === currentUser.id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Huwezi kujifuta mwenyewe kama Admin.",
        },
        { status: 400 }
      );
    }

    // 1. Futa farm plan items za user's farm plans kwanza.
    const { data: plans, error: plansError } = await supabaseAdmin
      .from("farm_plans")
      .select("id")
      .eq("user_id", userId);

    if (plansError) {
      console.error("ADMIN DELETE FARM PLANS LOOKUP ERROR:", plansError);
      return NextResponse.json(
        { ok: false, error: "Imeshindikana kupata farm plans za user." },
        { status: 500 }
      );
    }

    const planIds = (plans || []).map((plan) => plan.id);

    if (planIds.length > 0) {
      const { error: itemsError } = await supabaseAdmin
        .from("farm_plan_items")
        .delete()
        .in("farm_plan_id", planIds);

      if (itemsError) {
        console.error("ADMIN DELETE FARM PLAN ITEMS ERROR:", itemsError);
        return NextResponse.json(
          {
            ok: false,
            error: "Imeshindikana kufuta farm plan items za user.",
          },
          { status: 500 }
        );
      }

      const { error: plansDeleteError } = await supabaseAdmin
        .from("farm_plans")
        .delete()
        .eq("user_id", userId);

      if (plansDeleteError) {
        console.error("ADMIN DELETE FARM PLANS ERROR:", plansDeleteError);
        return NextResponse.json(
          {
            ok: false,
            error: "Imeshindikana kufuta farm plans za user.",
          },
          { status: 500 }
        );
      }
    }

    // 2. Futa alerts ambazo user ni recipient au sender.
    const { error: alertsError } = await supabaseAdmin
      .from("user_alerts")
      .delete()
      .or(
        `recipient_user_id.eq.${userId},sender_user_id.eq.${userId}`
      );

    if (alertsError) {
      console.error("ADMIN DELETE USER ALERTS ERROR:", alertsError);
      return NextResponse.json(
        {
          ok: false,
          error: "Imeshindikana kufuta alerts za user.",
        },
        { status: 500 }
      );
    }

    // 3. Articles na questions zina NO ACTION,
    //    hivyo lazima zifutwe kabla ya Supabase Auth user.
    const { error: articlesError } = await supabaseAdmin
      .from("articles")
      .delete()
      .eq("author_id", userId);

    if (articlesError) {
      console.error("ADMIN DELETE USER ARTICLES ERROR:", articlesError);
      return NextResponse.json(
        {
          ok: false,
          error: "Imeshindikana kufuta articles za user.",
        },
        { status: 500 }
      );
    }

    const { error: questionsError } = await supabaseAdmin
      .from("questions")
      .delete()
      .eq("user_id", userId);

    if (questionsError) {
      console.error("ADMIN DELETE USER QUESTIONS ERROR:", questionsError);
      return NextResponse.json(
        {
          ok: false,
          error: "Imeshindikana kufuta questions za user.",
        },
        { status: 500 }
      );
    }

    // 4. Listings na notification preferences zina ON DELETE CASCADE.
    //    Hazihitaji kufutwa manually hapa.

    // 5. Mwisho kabisa futa user kwenye Supabase Auth.
    const { error: authDeleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error(
        "ADMIN DELETE AUTH USER ERROR:",
        authDeleteError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Data ya user ime-cleanup, lakini Supabase Auth user hakufutika. " +
            authDeleteError.message,
        },
        { status: 500 }
      );
    }

    const auditSaved = await writeAdminAuditLog({
      adminUserId: currentUser.id,
      action: "delete_user",
      targetUserId: userId,
      details: {
        message: "Admin deleted user and related data.",
      },
    });

    if (!auditSaved) {
      console.warn(
        "ADMIN DELETE AUDIT WARNING: User deletion succeeded but audit log haiku-save."
      );
    }

    return NextResponse.json({
      ok: true,
      message: "User na data zake zinazohusiana zimefutwa kikamilifu.",
      audit_logged: auditSaved,
    });
  } catch (error) {
    console.error("ADMIN DELETE USER ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Imeshindikana kufuta user.",
      },
      { status: 500 }
    );
  }
}
