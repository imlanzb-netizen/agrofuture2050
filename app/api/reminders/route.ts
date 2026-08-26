import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID inahitajika." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const future = new Date(today);
    future.setDate(future.getDate() + 1);

    const todayString = today.toISOString().split("T")[0];
    const tomorrowString = future.toISOString().split("T")[0];

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
      .eq("farm_plans.user_id", userId)
      .eq("is_completed", false)
      .gte("planned_date", todayString)
      .lte("planned_date", tomorrowString);

    if (itemsError) {
      console.error("REMINDER ITEMS ERROR:", itemsError);

      return NextResponse.json(
        { error: "Imeshindikana kupata reminders." },
        { status: 500 }
      );
    }

    let created = 0;

    for (const item of items ?? []) {
      const plan = Array.isArray(item.farm_plans)
        ? item.farm_plans[0]
        : item.farm_plans;

      if (!plan) continue;

      const reminderDate =
        item.planned_date === todayString ? "Leo" : "Kesho";

      const title = `⏰ Reminder: ${item.title}`;

      const message =
        `${item.title} imepangwa ${reminderDate}. ` +
        `Mpango: ${plan.name}.`;

      const { data: existing, error: existingError } =
        await supabase
          .from("user_alerts")
          .select("id")
          .eq("recipient_user_id", userId)
          .eq("alert_type", "reminder")
          .eq("title", title)
          .eq("message", message)
          .limit(1);

      if (existingError) {
        console.error("REMINDER CHECK ERROR:", existingError);
        continue;
      }

      if (existing && existing.length > 0) {
        continue;
      }

      const { error: insertError } = await supabase
        .from("user_alerts")
        .insert({
          recipient_user_id: userId,
          sender_user_id: null,
          sender_role: "system",
          title,
          message,
          alert_type: "reminder",
          is_read: false,
        });

      if (insertError) {
        console.error("REMINDER INSERT ERROR:", insertError);
        continue;
      }

      created++;
    }

    return NextResponse.json({
      success: true,
      created,
    });
  } catch (error) {
    console.error("REMINDER API ERROR:", error);

    return NextResponse.json(
      { error: "Imeshindikana kutengeneza reminders." },
      { status: 500 }
    );
  }
}
