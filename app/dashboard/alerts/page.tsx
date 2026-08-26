"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Alert = {
  id: string;
  title: string;
  message: string;
  alert_type: string;
  is_read: boolean;
  created_at: string;
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Hujaingia kwenye mfumo.");
        return;
      }

      await fetch("/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const { data, error: alertsError } = await supabase
        .from("user_alerts")
        .select(
          "id, title, message, alert_type, is_read, created_at"
        )
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false });

      if (alertsError) {
        console.error("ALERTS ERROR:", alertsError);
        setError("Imeshindikana kupakia taarifa.");
        return;
      }

      setAlerts(data ?? []);
    } catch (err) {
      console.error("ALERTS LOAD ERROR:", err);
      setError("Imeshindikana kupakia taarifa.");
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("user_alerts")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error("MARK ALERT ERROR:", error);
      return;
    }

    setAlerts((current) =>
      current.map((alert) =>
        alert.id === id ? { ...alert, is_read: true } : alert
      )
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAF5] text-[#173B2A]">
      <header className="border-b border-[#DCE9DF] bg-white px-5 py-5">
        <div className="mx-auto max-w-md">
          <p className="text-xs font-black tracking-[0.2em] text-[#2F9E5B]">
            AGROFUTURE 2050
          </p>

          <h1 className="mt-1 text-2xl font-black">
            Taarifa 🔔
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Tahadhari na taarifa muhimu kwa shughuli zako.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-md space-y-4 px-5 py-6">
        {loading && (
          <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
            <div className="text-3xl">🔔</div>
            <p className="mt-2 font-bold">Inapakia taarifa...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl bg-red-50 p-5 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && alerts.length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-[#DCE9DF]">
            <div className="text-4xl">🔕</div>
            <h2 className="mt-3 font-black">
              Hakuna taarifa kwa sasa
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Taarifa mpya zitaonekana hapa.
            </p>
          </div>
        )}

        {!loading &&
          alerts.map((alert) => (
            <article
              key={alert.id}
              className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ${
                alert.is_read
                  ? "ring-[#DCE9DF]"
                  : "ring-[#BFE3C9]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#2F9E5B]">
                    {alert.alert_type}
                  </p>

                  <h2 className="mt-1 font-black">
                    {alert.title}
                  </h2>
                </div>

                {!alert.is_read && (
                  <span className="rounded-full bg-[#EAF7ED] px-2 py-1 text-xs font-black text-[#2F9E5B]">
                    MPYA
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                {alert.message}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {new Date(alert.created_at).toLocaleString()}
                </p>

                {!alert.is_read && (
                  <button
                    type="button"
                    onClick={() => markAsRead(alert.id)}
                    className="rounded-xl bg-[#173B2A] px-3 py-2 text-xs font-bold text-white"
                  >
                    Weka kama imesomwa
                  </button>
                )}
              </div>
            </article>
          ))}
      </section>
    </main>
  );
}
