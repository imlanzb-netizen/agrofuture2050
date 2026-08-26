"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Role = "farmer" | "livestock";

export default function NewPlanPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("farmer");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [cropOrLivestock, setCropOrLivestock] = useState("");
  const [season, setSeason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expectedRevenue, setExpectedRevenue] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [notes, setNotes] = useState("");

  const isLivestock = role === "livestock";

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      router.push("/auth");
      return;
    }

    const userRole =
      data.user.app_metadata?.role ??
      data.user.user_metadata?.role;

    setRole(userRole === "livestock" ? "livestock" : "farmer");
    setLoading(false);
  }

  async function createPlan() {
    setError("");

    if (!name.trim()) {
      setError("Weka jina la mpango.");
      return;
    }

    const revenue = Number(expectedRevenue || 0);
    const cost = Number(totalCost || 0);

    if (revenue < 0 || cost < 0) {
      setError("Mapato na gharama haviwezi kuwa chini ya sifuri.");
      return;
    }

    setSaving(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        router.push("/auth");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("farm_plans")
        .insert({
          user_id: userData.user.id,
          name: name.trim(),
          activity_type: isLivestock ? "livestock" : "crop",
          crop_or_livestock: cropOrLivestock.trim() || null,
          season: season.trim() || null,
          start_date: startDate || null,
          end_date: endDate || null,
          expected_revenue: revenue,
          total_cost: cost,
          notes: notes.trim() || null,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("PLAN CREATE ERROR:", insertError);
        throw insertError;
      }

      router.push(`/dashboard/plans/${data.id}`);
    } catch (err) {
      console.error("PLAN ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Imeshindikana kutengeneza mpango."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAF5] text-[#173B2A]">
        <div className="text-center">
          <div className="text-4xl">📋</div>
          <p className="mt-3 font-bold">Inapakia...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAF5] text-[#173B2A]">
      <header className="border-b border-[#DCE9DF] bg-white px-5 py-5">
        <div className="mx-auto max-w-md">
          <p className="text-xs font-bold text-[#2F9E5B]">
            AGROFUTURE 2050
          </p>

          <h1 className="mt-1 text-xl font-black">
            {isLivestock
              ? "Tengeneza Mpango wa Ufugaji 🐄"
              : "Tengeneza Mpango wa Kilimo 🌾"}
          </h1>
        </div>
      </header>

      <section className="mx-auto max-w-md px-5 py-6">
        <div className="space-y-4 rounded-3xl border border-[#DCE9DF] bg-white p-5">

          <div>
            <label className="text-sm font-bold">
              Jina la mpango *
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                isLivestock
                  ? "Mfano: Mpango wa kuku 2026"
                  : "Mfano: Mpango wa mahindi 2026"
              }
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              {isLivestock ? "Mnyama / mifugo" : "Zao"}
            </label>

            <input
              value={cropOrLivestock}
              onChange={(e) => setCropOrLivestock(e.target.value)}
              placeholder={
                isLivestock
                  ? "Mfano: Kuku, ng'ombe, mbuzi"
                  : "Mfano: Mahindi, mpunga, nyanya"
              }
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Msimu
            </label>

            <input
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="Mfano: Msimu wa Vuli"
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold">
                Tarehe ya kuanza
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-3 py-3 text-sm outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-bold">
                Tarehe ya mwisho
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-3 py-3 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold">
              Mapato yanayotarajiwa (TZS)
            </label>

            <input
              type="number"
              min="0"
              value={expectedRevenue}
              onChange={(e) => setExpectedRevenue(e.target.value)}
              placeholder="0"
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Gharama za kuanzia (TZS)
            </label>

            <input
              type="number"
              min="0"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
              placeholder="0"
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Maelezo
            </label>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Andika maelezo ya mpango..."
              rows={4}
              className="mt-2 w-full resize-none rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-3 text-sm outline-none"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={createPlan}
            disabled={saving}
            className="w-full rounded-2xl bg-[#2F9E5B] px-4 py-4 text-sm font-black text-white disabled:opacity-50"
          >
            {saving ? "Inahifadhi..." : "💾 Hifadhi Mpango"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard/plans")}
            className="w-full rounded-2xl border border-[#DCE9DF] px-4 py-4 text-sm font-bold"
          >
            ← Rudi kwenye Plans
          </button>
        </div>
      </section>
    </main>
  );
}
