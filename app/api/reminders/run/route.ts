import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (
      process.env.REMINDER_CRON_SECRET &&
      authHeader !== `Bearer ${process.env.REMINDER_CRON_SECRET}`
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    const now = new Date();

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayString = today.toISOString().split("T")[0];
    const tomorrowString = tomorrow.toISOString().split("T")[0];

    const { data: items, error: itemsError } = await supabase
      .from("farm_plan_items")
      .select(`
        id,
        title,
        description,
        planned_date,
        farm_plans!inner (
          id,
          name,
          user_id
        )
      `)
      .eq("is_completed", false)
      .in("planned_date", [todayString, tomorrowString]);

    if (itemsError) {
      console.error("AUTO REMINDER LOAD ERROR:", itemsError);

      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    let created = 0;

    for (const item of items ?? []) {
      const plan = Array.isArray(item.farm_plans)
        ? item.farm_plans[0]
        : item.farm_plans;

      if (!plan?.user_id || !item.planned_date) {
        continue;
      }

      const isToday = item.planned_date === todayString;

      const title = isToday
        ? `🔔 Leo: ${item.title}`
        : `⏰ Kesho: ${item.title}`;

      const message = isToday
        ? `${item.title} imepangwa kufanyika leo. Mpango: ${plan.name}.`
        : `${item.title} imepangwa kesho. Mpango: ${plan.name}.`;

      const { data: existing } = await supabase
        .from("user_alerts")
        .select("id")
        .eq("recipient_user_id", plan.user_id)
        .eq("alert_type", "reminder")
        .eq("title", title)
        .eq("message", message)
        .limit(1);

      if (existing && existing.length > 0) {
        continue;
      }

      const { error: insertError } = await supabase
        .from("user_alerts")
        .insert({
          recipient_user_id: plan.user_id,
          sender_user_id: null,
          sender_role: "system",
          title,
          message,
          alert_type: "reminder",
          is_read: false,
        });

      if (insertError) {
        console.error("AUTO REMINDER INSERT ERROR:", insertError);
        continue;
      }

      created++;
    }

    return NextResponse.json({
      success: true,
      date: todayString,
      checked: items?.length ?? 0,
      created,
    });
  } catch (error) {
    console.error("AUTO REMINDER ERROR:", error);

    return NextResponse.json(
      { error: "Imeshindikana kuendesha automatic reminders." },
      { status: 500 }
    );
  }
}
