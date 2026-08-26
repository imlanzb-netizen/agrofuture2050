"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Role =
  | "farmer"
  | "livestock"
  | "agriculture-officer"
  | "livestock-officer"
  | "buyer"
  | "seller";

type PurchasePlan = {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  budget: number;
  target_date: string | null;
  notes: string | null;
  created_at: string;
};

type FarmPlan = {
  id: string;
  name: string;
  activity_type: string;
  crop_or_livestock: string | null;
  season: string | null;
  start_date: string | null;
  end_date: string | null;
  expected_revenue: number;
  total_cost: number;
  expected_profit: number;
  notes: string | null;
  created_at: string;
};

export default function PlansPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role | "">("");
  const [plans, setPlans] = useState<FarmPlan[]>([]);
  const [purchasePlans, setPurchasePlans] = useState<PurchasePlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [budget, setBudget] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    setError("");

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setError("Hujaingia. Tafadhali ingia kwanza.");
        setLoading(false);
        return;
      }

      const userRole =
        (userData.user.app_metadata?.role ??
          userData.user.user_metadata?.role) as Role | undefined;

      const currentRole = userRole ?? "farmer";
      setRole(currentRole);

      if (currentRole === "buyer") {
        const { data, error: purchaseError } = await supabase
          .from("purchase_plans")
          .select(
            "id,product_name,quantity,unit,budget,target_date,notes,created_at"
          )
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false });

        if (purchaseError) throw purchaseError;

        setPurchasePlans((data ?? []) as PurchasePlan[]);
        return;
      }

      const { data, error: plansError } = await supabase
        .from("farm_plans")
        .select(
          "id,name,activity_type,crop_or_livestock,season,start_date,end_date,expected_revenue,total_cost,expected_profit,notes,created_at"
        )
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (plansError) {
        console.error("PLANS LOAD ERROR:", plansError);
        throw plansError;
      }

      setPlans((data ?? []) as FarmPlan[]);
    } catch (err) {
      console.error("PLANS ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Imeshindikana kupakia plans."
      );
    } finally {
      setLoading(false);
    }
  }

  if (role === "buyer") {
    return (
      <main className="min-h-screen bg-[#F8FAF5] text-[#173B2A]">
        <header className="border-b border-[#DCE9DF] bg-white px-5 py-5">
          <div className="mx-auto flex max-w-md items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#2F9E5B]">
                AGROFUTURE 2050
              </p>
              <h1 className="mt-1 text-xl font-black">
                Mipango ya Manunuzi 🛒
              </h1>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF7ED] text-xl">
              🛒
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-md px-5 py-6">
          <div className="rounded-3xl bg-[#173B2A] p-6 text-white shadow-lg">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9BE7B2]">
              AGROFUTURE 2050
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Panga ununuzi wako 🛒
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#D7E8DC]">
              Weka bidhaa, kiasi na bajeti yako kisha tafuta bidhaa AgroMarket.
            </p>

            <button
              type="button"
              onClick={() => router.push("/dashboard/marketplace")}
              className="mt-5 w-full rounded-2xl bg-[#2F9E5B] px-4 py-4 text-sm font-black text-white"
            >
              🛒 Tafuta bidhaa AgroMarket →
            </button>
          </div>

          <div className="mt-5 rounded-3xl border border-[#DCE9DF] bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-[#2F9E5B]">
              ➕ Mpango mpya wa ununuzi
            </p>

            <div className="mt-4 space-y-3">
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Mfano: Mbegu za mahindi"
                className="w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-4 text-sm font-bold outline-none"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  type="number"
                  min="0"
                  placeholder="Kiasi"
                  className="w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-4 text-sm font-bold outline-none"
                />

                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-4 text-sm font-bold outline-none"
                >
                  <option value="kg">Kg</option>
                  <option value="bags">Mifuko</option>
                  <option value="pieces">Vipande</option>
                  <option value="litres">Lita</option>
                  <option value="units">Units</option>
                </select>
              </div>

              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                type="number"
                min="0"
                placeholder="Bajeti yako (TZS)"
                className="w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-4 text-sm font-bold outline-none"
              />

              <input
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                type="date"
                className="w-full rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-4 text-sm font-bold outline-none"
              />

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Maelezo ya ziada..."
                rows={3}
                className="w-full resize-none rounded-2xl border border-[#DCE9DF] bg-[#F8FAF5] px-4 py-4 text-sm font-bold outline-none"
              />

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={createPurchasePlan}
                disabled={saving}
                className="w-full rounded-2xl bg-[#2F9E5B] px-4 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                {saving ? "Inahifadhi..." : "💾 Hifadhi Mpango"}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-lg font-black">
              Ununuzi uliopanga ({purchasePlans.length})
            </h3>

            {purchasePlans.length === 0 ? (
              <div className="rounded-3xl border border-[#DCE9DF] bg-white p-6 text-center">
                <div className="text-4xl">🛒</div>
                <p className="mt-3 font-black">
                  Bado hujaweka mpango wa ununuzi
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {purchasePlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-3xl border border-[#DCE9DF] bg-white p-5 shadow-sm"
                  >
                    <p className="text-lg font-black">
                      {plan.product_name}
                    </p>

                    <p className="mt-1 text-xs font-bold text-[#2F9E5B]">
                      {plan.quantity} {plan.unit}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#F8FAF5] p-3">
                        <p className="text-[10px] text-[#819188]">
                          Bajeti
                        </p>
                        <p className="mt-1 text-sm font-black">
                          TZS {money(plan.budget)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#EAF7ED] p-3">
                        <p className="text-[10px] text-[#2F9E5B]">
                          Tarehe
                        </p>
                        <p className="mt-1 text-sm font-black text-[#2F9E5B]">
                          {plan.target_date || "Haijawekwa"}
                        </p>
                      </div>
                    </div>

                    {plan.notes && (
                      <p className="mt-3 rounded-xl bg-[#F8FAF5] p-3 text-xs text-[#687B70]">
                        📝 {plan.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-6 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 text-sm font-bold"
          >
            ← Rudi Dashboard
          </button>
        </section>
      </main>
    );
  }

  const isLivestock = role === "livestock";

  const title = isLivestock
    ? "Mipango ya Ufugaji 🐄"
    : "Mipango ya Kilimo 🌾";

  const subtitle = isLivestock
    ? "Panga shughuli za mifugo, gharama na mapato yako."
    : "Panga msimu wako wa kilimo, gharama na mapato yako.";

  function money(value: number) {
    return new Intl.NumberFormat("sw-TZ").format(Number(value || 0));
  }

  async function createPurchasePlan() {
    if (!productName.trim() || !quantity || !budget) {
      setError("Jaza bidhaa, kiasi na bajeti kwanza.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setError("Hujaingia. Tafadhali ingia kwanza.");
        return;
      }

      const { error: insertError } = await supabase
        .from("purchase_plans")
        .insert({
          user_id: userData.user.id,
          product_name: productName.trim(),
          quantity: Number(quantity),
          unit,
          budget: Number(budget),
          target_date: targetDate || null,
          notes: notes.trim() || null,
        });

      if (insertError) throw insertError;

      setProductName("");
      setQuantity("");
      setUnit("kg");
      setBudget("");
      setTargetDate("");
      setNotes("");

      await loadPlans();
    } catch (err) {
      console.error("PURCHASE PLAN ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Imeshindikana kuhifadhi mpango."
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
          <p className="mt-3 font-bold">Inapakia mipango...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAF5] text-[#173B2A]">
      <header className="border-b border-[#DCE9DF] bg-white px-5 py-5">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#2F9E5B]">
              AGROFUTURE 2050
            </p>
            <h1 className="mt-1 text-xl font-black">{title}</h1>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF7ED] text-xl">
            {isLivestock ? "🐄" : "🌾"}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md px-5 py-6">
        <div className="rounded-3xl bg-[#EAF7ED] p-5">
          <p className="text-sm font-bold text-[#2F9E5B]">
            Mpango wako
          </p>

          <h2 className="mt-2 text-2xl font-black">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#687B70]">
            {subtitle}
          </p>

          <button
            type="button"
            onClick={() => router.push("/dashboard/plans/new")}
            className="mt-5 w-full rounded-2xl bg-[#2F9E5B] px-4 py-4 text-sm font-black text-white"
          >
            ➕ Tengeneza Mpango Mpya
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-black">
              Mipango yako
            </h3>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold">
              {plans.length}
            </span>
          </div>

          {plans.length === 0 ? (
            <div className="rounded-3xl border border-[#DCE9DF] bg-white p-6 text-center">
              <div className="text-4xl">
                {isLivestock ? "🐄" : "🌾"}
              </div>

              <p className="mt-3 font-black">
                Bado huna mpango
              </p>

              <p className="mt-2 text-sm leading-6 text-[#819188]">
                Tengeneza mpango wako wa kwanza ili kuanza kupanga shughuli,
                gharama na mapato.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() =>
                    router.push(`/dashboard/plans/${plan.id}`)
                  }
                  className="w-full rounded-3xl border border-[#DCE9DF] bg-white p-5 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black">
                        {plan.name}
                      </p>

                      <p className="mt-1 text-xs font-bold text-[#2F9E5B]">
                        {plan.crop_or_livestock ||
                          (isLivestock ? "Ufugaji" : "Kilimo")}
                      </p>
                    </div>

                    <span className="text-2xl">
                      {isLivestock ? "🐄" : "🌾"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-[#F8FAF5] p-3">
                      <p className="text-[10px] text-[#819188]">
                        Mapato
                      </p>
                      <p className="mt-1 text-xs font-black">
                        {money(plan.expected_revenue)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#F8FAF5] p-3">
                      <p className="text-[10px] text-[#819188]">
                        Gharama
                      </p>
                      <p className="mt-1 text-xs font-black">
                        {money(plan.total_cost)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#EAF7ED] p-3">
                      <p className="text-[10px] text-[#2F9E5B]">
                        Faida
                      </p>
                      <p className="mt-1 text-xs font-black text-[#2F9E5B]">
                        {money(plan.expected_profit)}
                      </p>
                    </div>
                  </div>

                  {plan.season && (
                    <p className="mt-3 text-xs text-[#819188]">
                      🌱 Msimu: {plan.season}
                    </p>
                  )}

                  {plan.start_date && (
                    <p className="mt-1 text-xs text-[#819188]">
                      📅 {plan.start_date}
                      {plan.end_date ? ` → ${plan.end_date}` : ""}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-6 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 text-sm font-bold"
        >
          ← Rudi Dashboard
        </button>
      </section>
    </main>
  );
}
