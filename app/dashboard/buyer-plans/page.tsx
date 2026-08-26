"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type BuyerPlan = {
  id: string;
  user_id: string;
  product_name: string;
  quantity: number | null;
  unit: string | null;
  budget: number | null;
  target_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type FormState = {
  product_name: string;
  quantity: string;
  unit: string;
  budget: string;
  target_date: string;
  notes: string;
};

const emptyForm: FormState = {
  product_name: "",
  quantity: "",
  unit: "",
  budget: "",
  target_date: "",
  notes: "",
};

export default function BuyerPlansPage() {
  const router = useRouter();

  const [plans, setPlans] = useState<BuyerPlan[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const { data, error: loadError } = await supabase
        .from("buyer_plans")
        .select(
          "id,user_id,product_name,quantity,unit,budget,target_date,notes,created_at,updated_at"
        )
        .eq("user_id", user.id)
        .order("target_date", {
          ascending: true,
          nullsFirst: false,
        });

      if (loadError) {
        console.error("BUYER PLANS LOAD ERROR:", loadError);
        throw loadError;
      }

      setPlans((data ?? []) as BuyerPlan[]);
    } catch (err) {
      console.error("BUYER PLANS ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Imeshindikana kupakia mipango ya manunuzi."
      );
    } finally {
      setLoading(false);
    }
  }

  function money(value: number | null) {
    return new Intl.NumberFormat("sw-TZ").format(Number(value || 0));
  }

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(plan: BuyerPlan) {
    setForm({
      product_name: plan.product_name || "",
      quantity:
        plan.quantity !== null && plan.quantity !== undefined
          ? String(plan.quantity)
          : "",
      unit: plan.unit || "",
      budget:
        plan.budget !== null && plan.budget !== undefined
          ? String(plan.budget)
          : "",
      target_date: plan.target_date || "",
      notes: plan.notes || "",
    });

    setEditingId(plan.id);
    setShowForm(true);
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function savePlan() {
    if (!form.product_name.trim() || saving) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const payload = {
        product_name: form.product_name.trim(),
        quantity: form.quantity ? Number(form.quantity) : null,
        unit: form.unit.trim() || null,
        budget: form.budget ? Number(form.budget) : null,
        target_date: form.target_date || null,
        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("buyer_plans")
          .update(payload)
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("BUYER PLAN UPDATE ERROR:", updateError);
          throw updateError;
        }

        setMessage("Mpango umehaririwa vizuri. ✅");
      } else {
        const { error: insertError } = await supabase
          .from("buyer_plans")
          .insert({
            ...payload,
            user_id: user.id,
          });

        if (insertError) {
          console.error("BUYER PLAN INSERT ERROR:", insertError);
          throw insertError;
        }

        setMessage("Mpango wa manunuzi umeongezwa. ✅");
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);

      await loadPlans();
    } catch (err) {
      console.error("SAVE BUYER PLAN ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Imeshindikana kuhifadhi mpango."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan(id: string) {
    const confirmed = window.confirm(
      "Una uhakika unataka kufuta mpango huu wa manunuzi?"
    );

    if (!confirmed || deletingId) return;

    setDeletingId(id);
    setMessage("");
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const { error: deleteError } = await supabase
        .from("buyer_plans")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("BUYER PLAN DELETE ERROR:", deleteError);
        throw deleteError;
      }

      setPlans((current) => current.filter((plan) => plan.id !== id));
      setMessage("Mpango umefutwa. 🗑️");
    } catch (err) {
      console.error("DELETE BUYER PLAN ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Imeshindikana kufuta mpango."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const totalBudget = useMemo(
    () =>
      plans.reduce(
        (total, plan) => total + Number(plan.budget || 0),
        0
      ),
    [plans]
  );

  const upcomingPlans = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    return plans.filter(
      (plan) => plan.target_date && plan.target_date >= today
    ).length;
  }, [plans]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAF5] text-[#173B2A]">
        <div className="text-center">
          <div className="text-5xl">🛒</div>
          <p className="mt-3 font-black">
            Inapakia mipango yako ya manunuzi...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAF5] text-[#173B2A]">
      <header className="border-b border-[#DCE9DF] bg-white px-5 py-5">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <p className="text-xs font-black tracking-wide text-[#2F9E5B]">
              AGROFUTURE 2050
            </p>
            <h1 className="mt-1 text-xl font-black">
              Mipango ya Manunuzi 🛒
            </h1>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF7ED] text-xl">
            🛒
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-md px-5 py-6">
        <div className="overflow-hidden rounded-[2rem] bg-[#173B2A] p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9BE7B2]">
                SMART BUYING
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Panga manunuzi yako
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#D7E8DC]">
                Weka bidhaa unazopanga kununua, bajeti na tarehe ili
                usisahau mahitaji yako.
              </p>
            </div>

            <div className="text-4xl">🧺</div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setMessage("");
              setError("");
            }}
            className="mt-5 w-full rounded-2xl bg-[#2F9E5B] px-4 py-4 text-sm font-black text-white"
          >
            ➕ Ongeza Mpango wa Manunuzi
          </button>
        </div>

        {message && (
          <div className="mt-4 rounded-2xl border border-[#BFE1C8] bg-[#EAF7ED] p-4 text-sm font-bold text-[#236B3B]">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#DCE9DF] bg-white p-4">
            <p className="text-xs font-bold text-[#819188]">
              Mipango
            </p>
            <p className="mt-2 text-2xl font-black">
              {plans.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#DCE9DF] bg-white p-4">
            <p className="text-xs font-bold text-[#819188]">
              Zinazokaribia
            </p>
            <p className="mt-2 text-2xl font-black">
              {upcomingPlans}
            </p>
          </div>

          <div className="col-span-2 rounded-2xl border border-[#DCE9DF] bg-white p-4">
            <p className="text-xs font-bold text-[#819188]">
              Budget iliyopangwa
            </p>
            <p className="mt-2 text-xl font-black text-[#2F9E5B]">
              TSh {money(totalBudget)}
            </p>
          </div>
        </div>

        {showForm && (
          <section className="mt-6 rounded-[2rem] border border-[#DCE9DF] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-[#2F9E5B]">
                  {editingId ? "HARIRI MPANGO" : "MPANGO MPYA"}
                </p>

                <h3 className="mt-1 text-xl font-black">
                  {editingId
                    ? "Badilisha maelezo"
                    : "Unataka kununua nini?"}
                </h3>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl bg-[#F1F5F2] px-3 py-2 text-xs font-black"
              >
                Funga
              </button>
            </div>

            <label className="mt-5 block text-sm font-black">
              Bidhaa
            </label>

            <input
              value={form.product_name}
              onChange={(e) =>
                updateField("product_name", e.target.value)
              }
              placeholder="Mfano: Mahindi, mbegu, mbolea..."
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#FAFDFC] px-4 py-3 text-sm outline-none focus:border-[#2F9E5B]"
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-black">
                  Kiasi
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) =>
                    updateField("quantity", e.target.value)
                  }
                  placeholder="Mfano 10"
                  className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#FAFDFC] px-4 py-3 text-sm outline-none focus:border-[#2F9E5B]"
                />
              </div>

              <div>
                <label className="text-sm font-black">
                  Unit
                </label>

                <input
                  value={form.unit}
                  onChange={(e) =>
                    updateField("unit", e.target.value)
                  }
                  placeholder="kg, debe, gunia..."
                  className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#FAFDFC] px-4 py-3 text-sm outline-none focus:border-[#2F9E5B]"
                />
              </div>
            </div>

            <label className="mt-4 block text-sm font-black">
              Budget
            </label>

            <input
              type="number"
              min="0"
              value={form.budget}
              onChange={(e) =>
                updateField("budget", e.target.value)
              }
              placeholder="Mfano 150000"
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#FAFDFC] px-4 py-3 text-sm outline-none focus:border-[#2F9E5B]"
            />

            <label className="mt-4 block text-sm font-black">
              Tarehe ya kulenga kununua
            </label>

            <input
              type="date"
              value={form.target_date}
              onChange={(e) =>
                updateField("target_date", e.target.value)
              }
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#FAFDFC] px-4 py-3 text-sm outline-none focus:border-[#2F9E5B]"
            />

            <label className="mt-4 block text-sm font-black">
              Maelezo
            </label>

            <textarea
              value={form.notes}
              onChange={(e) =>
                updateField("notes", e.target.value)
              }
              rows={3}
              placeholder="Mfano: Nataka bidhaa bora kwa msimu ujao..."
              className="mt-2 w-full rounded-2xl border border-[#DCE9DF] bg-[#FAFDFC] p-4 text-sm outline-none focus:border-[#2F9E5B]"
            />

            <button
              type="button"
              disabled={!form.product_name.trim() || saving}
              onClick={savePlan}
              className="mt-5 w-full rounded-2xl bg-[#2F9E5B] px-4 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              {saving
                ? "Inahifadhi..."
                : editingId
                  ? "💾 Hifadhi Mabadiliko"
                  : "🛒 Hifadhi Mpango"}
            </button>
          </section>
        )}

        <div className="mt-7 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black">
              Mipango yako
            </h3>

            <p className="mt-1 text-xs text-[#819188]">
              Bidhaa unazopanga kununua
            </p>
          </div>

          <button
            type="button"
            onClick={loadPlans}
            className="rounded-xl border border-[#DCE9DF] bg-white px-3 py-2 text-xs font-black"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {plans.length === 0 ? (
            <div className="rounded-[2rem] border border-[#DCE9DF] bg-white p-7 text-center">
              <div className="text-5xl">🛒</div>

              <h3 className="mt-4 text-lg font-black">
                Bado huna mpango
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#819188]">
                Ongeza bidhaa unayopanga kununua ili iwe rahisi
                kuifuatilia kupitia AgroMarket.
              </p>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-5 rounded-2xl bg-[#173B2A] px-5 py-3 text-sm font-black text-white"
              >
                ➕ Anza kupanga
              </button>
            </div>
          ) : (
            plans.map((plan) => (
              <article
                key={plan.id}
                className="rounded-[2rem] border border-[#DCE9DF] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-lg font-black">
                      {plan.product_name}
                    </p>

                    {plan.quantity !== null && (
                      <p className="mt-1 text-sm font-bold text-[#2F9E5B]">
                        📦 {plan.quantity} {plan.unit || ""}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl bg-[#EAF7ED] px-3 py-2 text-xl">
                    🛒
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {plan.budget !== null && (
                    <div className="rounded-2xl bg-[#F8FAF5] p-3">
                      <p className="text-[10px] font-bold text-[#819188]">
                        Budget
                      </p>
                      <p className="mt-1 text-sm font-black">
                        TSh {money(plan.budget)}
                      </p>
                    </div>
                  )}

                  {plan.target_date && (
                    <div className="rounded-2xl bg-[#F8FAF5] p-3">
                      <p className="text-[10px] font-bold text-[#819188]">
                        Tarehe
                      </p>
                      <p className="mt-1 text-sm font-black">
                        📅 {plan.target_date}
                      </p>
                    </div>
                  )}
                </div>

                {plan.notes && (
                  <div className="mt-3 rounded-2xl bg-[#FAFDFC] p-3">
                    <p className="text-xs leading-5 text-[#687B70]">
                      {plan.notes}
                    </p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/dashboard/marketplace?search=${encodeURIComponent(
                          plan.product_name
                        )}`
                      )
                    }
                    className="rounded-xl bg-[#173B2A] px-3 py-3 text-xs font-black text-white"
                  >
                    🔎 Tafuta Sokoni
                  </button>

                  <button
                    type="button"
                    onClick={() => startEdit(plan)}
                    className="rounded-xl border border-[#DCE9DF] bg-white px-3 py-3 text-xs font-black"
                  >
                    ✏️ Hariri
                  </button>
                </div>

                <button
                  type="button"
                  disabled={deletingId === plan.id}
                  onClick={() => deletePlan(plan.id)}
                  className="mt-2 w-full rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-black text-red-700 disabled:opacity-50"
                >
                  {deletingId === plan.id
                    ? "Inafuta..."
                    : "🗑️ Futa Mpango"}
                </button>
              </article>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/marketplace")}
          className="mt-6 w-full rounded-2xl bg-[#2F9E5B] px-4 py-4 text-sm font-black text-white"
        >
          🛒 Fungua AgroMarket
        </button>

        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-3 w-full rounded-2xl border border-[#DCE9DF] bg-white px-4 py-4 text-sm font-black"
        >
          ← Rudi Dashboard
        </button>
      </section>
    </main>
  );
}
