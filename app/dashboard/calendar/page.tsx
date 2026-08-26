"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CalendarEvent = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  reminder_date: string | null;
  is_completed: boolean;
  created_at: string;
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("activity");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reminderDate, setReminderDate] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Hujaingia kwenye mfumo.");
      setLoading(false);
      return;
    }

    const { data, error: eventsError } = await supabase
      .from("agro_calendar_events")
      .select(
        "id, user_id, title, description, event_type, start_date, end_date, reminder_date, is_completed, created_at"
      )
      .eq("user_id", user.id)
      .order("start_date", { ascending: true });

    if (eventsError) {
      console.error("CALENDAR LOAD ERROR:", eventsError);
      setError("Imeshindikana kupakia kalenda.");
    } else {
      setEvents(data ?? []);
    }

    setLoading(false);
  }

  async function addEvent() {
    setMessage("");
    setError("");

    if (!title.trim() || !startDate) {
      setError("Weka jina la shughuli na tarehe ya kuanza.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Hujaingia kwenye mfumo.");
      setSaving(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("agro_calendar_events")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        event_type: eventType,
        start_date: startDate,
        end_date: endDate || null,
        reminder_date: reminderDate || null,
        is_completed: false,
      })
      .select(
        "id, user_id, title, description, event_type, start_date, end_date, reminder_date, is_completed, created_at"
      )
      .single();

    if (insertError) {
      console.error("CALENDAR INSERT ERROR:", insertError);
      setError("Imeshindikana kuhifadhi shughuli.");
      setSaving(false);
      return;
    }

    setEvents((current) =>
      [...current, data].sort((a, b) =>
        a.start_date.localeCompare(b.start_date)
      )
    );

    setTitle("");
    setDescription("");
    setEventType("activity");
    setStartDate("");
    setEndDate("");
    setReminderDate("");
    setMessage("Shughuli imeongezwa kwenye kalenda.");
    setSaving(false);
  }

  async function toggleCompleted(event: CalendarEvent) {
    setError("");
    setMessage("");

    const { data, error: updateError } = await supabase
      .from("agro_calendar_events")
      .update({
        is_completed: !event.is_completed,
      })
      .eq("id", event.id)
      .eq("user_id", event.user_id)
      .select(
        "id, user_id, title, description, event_type, start_date, end_date, reminder_date, is_completed, created_at"
      )
      .single();

    if (updateError) {
      console.error("CALENDAR UPDATE ERROR:", updateError);
      setError("Imeshindikana kubadilisha hali ya shughuli.");
      return;
    }

    setEvents((current) =>
      current.map((item) => (item.id === event.id ? data : item))
    );
  }

  async function deleteEvent(event: CalendarEvent) {
    const confirmed = window.confirm(
      `Una uhakika unataka kufuta "${event.title}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    const { error: deleteError } = await supabase
      .from("agro_calendar_events")
      .delete()
      .eq("id", event.id)
      .eq("user_id", event.user_id);

    if (deleteError) {
      console.error("CALENDAR DELETE ERROR:", deleteError);
      setError("Imeshindikana kufuta shughuli.");
      return;
    }

    setEvents((current) => current.filter((item) => item.id !== event.id));
    setMessage("Shughuli imefutwa.");
  }

  function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString("sw-TZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function eventIcon(type: string) {
    if (type === "crop") return "🌱";
    if (type === "livestock") return "🐄";
    if (type === "weather") return "🌧️";
    if (type === "market") return "🏪";
    if (type === "reminder") return "🔔";
    return "📌";
  }

  return (
    <main className="min-h-screen bg-[#F8FAF5] text-[#173B2A]">
      <header className="border-b border-[#DCE9DF] bg-white px-5 py-5">
        <div className="mx-auto max-w-md">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
            AGROFUTURE 2050
          </p>
          <h1 className="mt-1 text-2xl font-black">
            Kalenda ya Kilimo 📅
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Panga shughuli za kilimo, ufugaji, misimu na vikumbusho.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-md space-y-5 px-5 py-6">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
            SHUGHULI MPYA
          </p>

          <h2 className="mt-2 text-xl font-black">
            Ongeza kwenye kalenda
          </h2>

          <div className="mt-4 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mfano: Panda mahindi"
              className="w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none focus:border-[#2F9E5B]"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Maelezo ya shughuli..."
              rows={3}
              className="w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none focus:border-[#2F9E5B]"
            />

            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm"
            >
              <option value="activity">Shughuli</option>
              <option value="crop">Mazao 🌱</option>
              <option value="livestock">Mifugo 🐄</option>
              <option value="weather">Msimu / Hali ya hewa 🌧️</option>
              <option value="market">Soko 🏪</option>
              <option value="reminder">Kikumbusho 🔔</option>
            </select>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-500">
                  Tarehe ya kuanza
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-gray-500">
                  Tarehe ya mwisho
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500">
                Tarehe ya reminder
              </label>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={addEvent}
              disabled={saving}
              className="w-full rounded-2xl bg-[#2F9E5B] px-4 py-3 font-black text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Inahifadhi..." : "➕ Ongeza shughuli"}
            </button>
          </div>
        </div>

        {message && (
          <div className="rounded-2xl bg-[#EAF7ED] px-4 py-3 text-sm font-bold text-[#2F9E5B]">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {error}
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2F9E5B]">
                RATIBA YAKO
              </p>
              <h2 className="mt-1 text-xl font-black">
                Shughuli za Kilimo
              </h2>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-black ring-1 ring-[#DCE9DF]">
              {events.length}
            </span>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-[#DCE9DF]">
              <div className="text-3xl">📅</div>
              <p className="mt-2 text-sm font-bold">
                Inapakia kalenda...
              </p>
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-[#DCE9DF]">
              <div className="text-4xl">🌱</div>
              <h3 className="mt-3 font-black">
                Hakuna shughuli bado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Ongeza shughuli yako ya kwanza hapo juu.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#DCE9DF] ${
                    event.is_completed ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="text-3xl">
                        {eventIcon(event.event_type)}
                      </div>

                      <div className="min-w-0">
                        <h3
                          className={`font-black ${
                            event.is_completed
                              ? "line-through"
                              : ""
                          }`}
                        >
                          {event.title}
                        </h3>

                        <p className="mt-1 text-xs font-bold text-[#2F9E5B]">
                          {formatDate(event.start_date)}
                          {event.end_date
                            ? ` → ${formatDate(event.end_date)}`
                            : ""}
                        </p>

                        {event.description && (
                          <p className="mt-2 text-sm leading-5 text-gray-500">
                            {event.description}
                          </p>
                        )}

                        {event.reminder_date && (
                          <p className="mt-2 text-xs font-bold text-gray-500">
                            🔔 Reminder: {formatDate(event.reminder_date)}
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${
                        event.is_completed
                          ? "bg-gray-100 text-gray-500"
                          : "bg-[#EAF7ED] text-[#2F9E5B]"
                      }`}
                    >
                      {event.is_completed ? "IMEKAMILIKA" : "INASUBIRI"}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCompleted(event)}
                      className="flex-1 rounded-xl border border-[#DCE9DF] px-3 py-2 text-xs font-black"
                    >
                      {event.is_completed
                        ? "↩️ Rudisha"
                        : "✅ Kamilisha"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteEvent(event)}
                      className="rounded-xl border border-red-100 px-3 py-2 text-xs font-black text-red-600"
                    >
                      🗑️ Futa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-[#173B2A] p-6 text-white shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#BFE3C9]">
            SMART AGRO CALENDAR
          </p>
          <h3 className="mt-2 text-xl font-black">
            Panga mapema, lima kwa mpango 🌱
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/80">
            Tumia kalenda kupanga shughuli za mashamba, mifugo,
            misimu, masoko na vikumbusho muhimu.
          </p>
        </div>
      </section>
    </main>
  );
}
