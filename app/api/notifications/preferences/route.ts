import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const defaultPreferences = {
  farmer_alerts: true,
  livestock_alerts: true,
  weather_alerts: true,
  market_alerts: true,
  calendar_reminders: true,
  regional_alerts: true,
  ai_recommendations: true,
  urgent_alerts: true,
};

const selectColumns =
  "farmer_alerts, livestock_alerts, weather_alerts, market_alerts, calendar_reminders, regional_alerts, ai_recommendations, urgent_alerts";

async function getAuthenticatedUser(request: Request) {
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

  return { user, token };
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);

    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "Hujaingia kwenye mfumo." },
        { status: 401 }
      );
    }

    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        },
      }
    );

    const { data, error } = await userSupabase
      .from("notification_preferences")
      .select(selectColumns)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error) {
      console.error("NOTIFICATION PREFERENCES GET ERROR:", error);

      return NextResponse.json(
        {
          ok: false,
          error: "Imeshindikana kupakia preferences.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      preferences: data || defaultPreferences,
    });
  } catch (error) {
    console.error("NOTIFICATION PREFERENCES ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Imeshindikana kupata notification preferences.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);

    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "Hujaingia kwenye mfumo." },
        { status: 401 }
      );
    }

    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        },
      }
    );

    const body = await request.json();

    const allowedKeys = [
      "farmer_alerts",
      "livestock_alerts",
      "weather_alerts",
      "market_alerts",
      "calendar_reminders",
      "regional_alerts",
      "ai_recommendations",
      "urgent_alerts",
    ] as const;

    const preferences: Record<string, boolean> = {};

    for (const key of allowedKeys) {
      if (typeof body[key] === "boolean") {
        preferences[key] = body[key];
      }
    }

    if (Object.keys(preferences).length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Hakuna notification preference halali.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await userSupabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: auth.user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select(selectColumns)
      .single();

    if (error) {
      console.error("NOTIFICATION PREFERENCES SAVE ERROR:", error);

      return NextResponse.json(
        {
          ok: false,
          error: "Imeshindikana kuhifadhi preferences.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      preferences: data,
    });
  } catch (error) {
    console.error("NOTIFICATION PREFERENCES POST ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Imeshindikana kuhifadhi notification preferences.",
      },
      { status: 500 }
    );
  }
}
