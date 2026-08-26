"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Reminder = {
  id: string;
  title: string;
  description: string | null;
  planned_date: string | null;
  is_completed: boolean;
  plan_name: string;
};

export default function UpcomingReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReminders();
  }, []);

  async function loadReminders() {
    setLoading(true);
    setError("");

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setError("Ingia kwanza ili kuona reminders.");
        return;
      }

      const { data, error: reminderError } = await supabase
        .from("farm_plan_items")
        .select(`
          id,
          title,
          description,
          planned_date,
          is_completed,
          farm_plans!inner (
            name,
            user_id
          )
        `)
        .eq("farm_plans.user_id", userData.user.id)
        .eq("is_completed", false)
        .not("planned_date", "is", null)
        .order("planned_date", {
          ascending: true,
        })
        .limit(10);

      if (reminderError) {
        console.error("REMINDER LOAD ERROR:", reminderError);
        throw reminderError;
      }

      const mapped = (data ?? []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        planned_date: item.planned_date,
        is_completed: item.is_completed,
        plan_name: item.farm_plans?.name ?? "Mpango",
      }));

      setReminders(mapped);
    } catch (err) {
      console.error("REMINDERS ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Imeshindikana kupakia reminders."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(value: string | null) {
    if (!value) return "Bila tarehe";

    return new Intl.DateTimeFormat("sw-TZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  }

  function isToday(value: string | null) {
    if (!value) return false;

    const today = new Date();
    const date = new Date(`${value}T00:00:00`);

    return (
      today.getFullYear() === date.getFullYear() &&
      today.getMonth() === date.getMonth() &&
      today.getDate() === date.getDate()
    );
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-[#DCE9DF] bg-white p-5">
        <p className="text-sm font-bold">
          ⏰ Inapakia reminders...
        </p>
      </div>
    );
  }

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#173B2A]">
            ⏰ Reminders
          </h2>

          <p className="mt-1 text-xs text-[#819188]">
            Shughuli zako zinazokaribia
          </p>
        </div>

        <button
          type="button"
          onClick={loadReminders}
          className="rounded-xl border border-[#DCE9DF] bg-white px-3 py-2 text-xs font-bold"
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && reminders.length === 0 && (
        <div className="mt-3 rounded-3xl border border-[#DCE9DF] bg-white p-6 text-center">
          <div className="text-3xl">📭</div>

          <p className="mt-2 text-sm font-bold text-[#173B2A]">
            Hakuna reminder kwa sasa
          </p>

          <p className="mt-1 text-xs text-[#819188]">
            Ongeza shughuli kwenye mipango yako ili zipate reminder.
          </p>
        </div>
      )}

      <div className="mt-3 space-y-3">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="rounded-3xl border border-[#DCE9DF] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF7ED] text-xl">
                ⏰
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-black text-[#173B2A]">
                  {reminder.title}
                </p>

                {reminder.description && (
                  <p className="mt-1 text-sm leading-5 text-[#687B70]">
                    {reminder.description}
                  </p>
                )}

                <p className="mt-2 text-xs font-bold text-[#819188]">
                  📋 {reminder.plan_name}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      isToday(reminder.planned_date)
                        ? "bg-red-50 text-red-700"
                        : "bg-[#F8FAF5] text-[#173B2A]"
                    }`}
                  >
                    📅{" "}
                    {isToday(reminder.planned_date)
                      ? "Leo"
                      : formatDate(reminder.planned_date)}
                  </span>

                  <span className="rounded-full bg-[#FFF7E6] px-3 py-1 text-xs font-bold text-[#9A6700]">
                    ⏳ Haijakamilika
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
